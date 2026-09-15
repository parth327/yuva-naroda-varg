const express = require('express');
const multer = require('multer');

const config = require('../../config');
const db = require('../../db');
const { verifyPassword } = require('../../utils/auth');
const { sendExcelFile, sendCsvFile, safeFilename } = require('../../utils/excel');
const { formatDateTime } = require('../../utils/datetime');
const notify = require('../../utils/notify');
const { loginKey, isLockedOut, minutesLeft, recordFailedAttempt, clearAttempts } = require('../lib/loginRateLimit');
const { FILTER_OPTIONS, extractRecordFilters } = require('../lib/recordFilters');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter(req, file, cb) {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Only image files (jpg, png, webp, gif) are allowed for the photo.'));
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// This new admin API is for the single main-admin login only — an
// event-admin session (still reachable only via the legacy, now-unlinked
// /admin/login page) must not be able to use it.
function requireMainAdminApi(req, res, next) {
  if (!(req.session && req.session.isAdmin)) return res.status(401).json({ error: 'Not authenticated.' });
  if (req.session.adminRole !== 'main') return res.status(403).json({ error: 'Forbidden.' });
  next();
}

// ==================== AUTH ====================

router.post('/login', express.json(), async (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    const key = loginKey(req, username);

    if (isLockedOut(key)) {
      return res.status(429).json({
        error: `Too many failed attempts. Please try again in ${minutesLeft(key)} minute(s).`,
      });
    }

    if (!config.adminPasswordHash) {
      return res.status(500).json({ error: 'Admin password is not configured on the server.' });
    }

    const validUsername = username === config.adminUsername;
    const validPassword = validUsername && verifyPassword(password, config.adminPasswordHash);

    if (!(validUsername && validPassword)) {
      recordFailedAttempt(key);
      return res.status(401).json({ error: 'Incorrect username or password.' });
    }

    clearAttempts(key);
    req.session.isAdmin = true;
    req.session.adminRole = 'main';
    req.session.adminUsername = username;
    res.json({ username });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

router.get('/me', (req, res) => {
  if (req.session && req.session.isAdmin && req.session.adminRole === 'main') {
    return res.json({ isAdmin: true, username: req.session.adminUsername });
  }
  res.status(401).json({ isAdmin: false });
});

// ==================== SETTINGS ====================

router.get('/settings', requireMainAdminApi, async (req, res, next) => {
  try {
    res.json(await db.getSettings());
  } catch (err) {
    next(err);
  }
});

router.put('/settings', requireMainAdminApi, express.json(), async (req, res, next) => {
  try {
    const eventYear = parseInt(req.body.eventYear, 10);
    const minAge = parseInt(req.body.minAge, 10);
    const maxAge = parseInt(req.body.maxAge, 10);

    if (Number.isNaN(eventYear) || eventYear < 2000 || eventYear > 2100) {
      return res.status(400).json({ error: 'Enter a valid 4-digit year.' });
    }
    if (Number.isNaN(minAge) || Number.isNaN(maxAge) || minAge < 1 || maxAge > 120 || minAge > maxAge) {
      return res.status(400).json({ error: 'Enter a valid age range.' });
    }

    const settings = await db.updateSettings({ eventYear, minAge, maxAge });
    await db.logAudit({
      adminUsername: req.session.adminUsername,
      adminRole: req.session.adminRole,
      action: 'edit',
      entityType: 'settings',
      entityId: null,
      details: `Updated settings: year=${eventYear}, age=${minAge}-${maxAge}`,
    });
    res.json(settings);
  } catch (err) {
    next(err);
  }
});

// ==================== RECORDS ====================

router.get('/filter-options', requireMainAdminApi, (req, res) => {
  res.json(FILTER_OPTIONS);
});

router.get('/records', requireMainAdminApi, async (req, res, next) => {
  try {
    const filters = extractRecordFilters(req.query);
    const PAGE_SIZE = 25;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const filteredTotal = await db.countFilteredRecords(filters);
    const totalPages = Math.max(1, Math.ceil(filteredTotal / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const offset = (safePage - 1) * PAGE_SIZE;

    const records = await db.queryRecords(filters, { limit: PAGE_SIZE, offset });
    const total = await db.countRecords();

    res.json({
      records: records.map((r) => ({ ...r, photoUrl: r.hasPhoto ? `/photo/${r.id}` : null })),
      total,
      filteredTotal,
      page: safePage,
      totalPages,
      pageSize: PAGE_SIZE,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/records/:id', requireMainAdminApi, async (req, res, next) => {
  try {
    const record = await db.getRecordById(req.params.id);
    if (!record) return res.status(404).json({ error: 'Record not found.' });
    res.json({ ...record, photoUrl: record.hasPhoto ? `/photo/${record.id}` : null });
  } catch (err) {
    next(err);
  }
});

router.put('/records/:id', requireMainAdminApi, (req, res, next) => {
  upload.single('photo')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });

    try {
      const existing = await db.getRecordById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Record not found.' });

      const {
        name, dob, gender, phone, whatsapp, email, location, locationOther, address,
        houseNumber, society, landmark, education, occupation, notes, pincode,
        interest, interestOther, joinMedium, joinMediumOther, age,
      } = req.body;

      const settings = await db.getSettings();
      const missing = [];
      if (!name || !name.trim()) missing.push('name');
      if (!phone || !phone.trim()) missing.push('phone');
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (email && email.trim() && !emailRegex.test(email.trim())) missing.push('email');
      if (!location || !location.trim()) missing.push('location');
      if (location === 'અન્ય' && (!locationOther || !locationOther.trim())) missing.push('locationOther');

      const ageNum = age ? parseInt(age, 10) : null;
      if (age && (Number.isNaN(ageNum) || ageNum < settings.minAge || ageNum > settings.maxAge)) missing.push('age');
      if (pincode && pincode.trim() && !/^\d{6}$/.test(pincode.trim())) missing.push('pincode');

      if (missing.length) {
        return res.status(400).json({ error: 'Please check the highlighted fields.', fields: missing });
      }

      const updated = {
        name: name.trim(),
        dob: dob || '',
        gender: gender || '',
        phone: phone.trim(),
        whatsapp: (whatsapp || '').trim(),
        email: (email || '').trim(),
        location: location.trim(),
        locationOther: location === 'અન્ય' ? (locationOther || '').trim() : '',
        houseNumber: (houseNumber || '').trim(),
        society: (society || '').trim(),
        landmark: (landmark || '').trim(),
        address: (address || '').trim(),
        education: (education || '').trim(),
        occupation: (occupation || '').trim(),
        interest: (interest || '').trim(),
        interestOther: interest === 'અન્ય' ? (interestOther || '').trim() : '',
        joinMedium: (joinMedium || '').trim(),
        joinMediumOther: joinMedium === 'અન્ય' ? (joinMediumOther || '').trim() : '',
        age: ageNum,
        notes: (notes || '').trim(),
        pincode: (pincode || '').trim() || null,
        photoData: req.file ? req.file.buffer.toString('base64') : null,
        photoMime: req.file ? req.file.mimetype : null,
      };

      const saved = await db.updateRecord(req.params.id, updated);

      await db.logAudit({
        adminUsername: req.session.adminUsername,
        adminRole: req.session.adminRole,
        action: 'edit',
        entityType: 'record',
        entityId: req.params.id,
        details: `સંપાદિત: ${updated.name} (${updated.phone})`,
      });

      res.json({ ...saved, photoUrl: saved.hasPhoto ? `/photo/${saved.id}` : null });
    } catch (dbErr) {
      next(dbErr);
    }
  });
});

router.delete('/records/:id', requireMainAdminApi, async (req, res, next) => {
  try {
    const record = await db.getRecordById(req.params.id);
    await db.deleteRecord(req.params.id);
    await db.logAudit({
      adminUsername: req.session.adminUsername,
      adminRole: req.session.adminRole,
      action: 'delete',
      entityType: 'record',
      entityId: req.params.id,
      details: record ? `ડિલીટ: ${record.name} (${record.phone})` : null,
    });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/export -> export the (filtered) users list, as Excel by
// default or CSV with ?format=csv. Same shape as the legacy /admin/dashboard/export.
router.get('/export', requireMainAdminApi, async (req, res, next) => {
  try {
    const filters = extractRecordFilters(req.query);
    const search = filters.search.trim();
    const records = await db.queryRecords(filters);

    const rows = records.map((r) => ({
      name: r.name,
      age: r.age,
      phone: r.phone,
      whatsapp: r.whatsapp,
      email: r.email,
      gender: r.gender,
      dob: r.dob,
      location: r.location === 'અન્ય' ? (r.locationOther || r.location) : r.location,
      pincode: r.pincode,
      houseNumber: r.houseNumber,
      society: r.society,
      landmark: r.landmark,
      address: r.address,
      education: r.education,
      interest: r.interest === 'અન્ય' ? (r.interestOther || r.interest) : r.interest,
      joinMedium: r.joinMedium === 'અન્ય' ? (r.joinMediumOther || r.joinMedium) : r.joinMedium,
      occupation: r.occupation,
      notes: r.notes,
      hasPhoto: r.hasPhoto ? 'Yes' : 'No',
      createdAt: formatDateTime(r.createdAt),
      profileLink: `${config.baseUrl}/admin/record/${r.id}`,
      id: r.id,
    }));

    const columns = [
      { header: 'Name', key: 'name', width: 22 },
      { header: 'Age', key: 'age', width: 8 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'WhatsApp', key: 'whatsapp', width: 15 },
      { header: 'Email', key: 'email', width: 26 },
      { header: 'Gender', key: 'gender', width: 12 },
      { header: 'DOB', key: 'dob', width: 14 },
      { header: 'Nagar', key: 'location', width: 18 },
      { header: 'Pincode', key: 'pincode', width: 12 },
      { header: 'House No.', key: 'houseNumber', width: 14 },
      { header: 'Society', key: 'society', width: 20 },
      { header: 'Landmark', key: 'landmark', width: 20 },
      { header: 'Address', key: 'address', width: 30 },
      { header: 'Education', key: 'education', width: 20 },
      { header: 'Interest', key: 'interest', width: 16 },
      { header: 'Joined Via', key: 'joinMedium', width: 18 },
      { header: 'Occupation', key: 'occupation', width: 20 },
      { header: 'Notes', key: 'notes', width: 28 },
      { header: 'Has Photo', key: 'hasPhoto', width: 12 },
      { header: 'Registered On', key: 'createdAt', width: 22 },
      { header: 'Profile Link', key: 'profileLink', width: 36, hyperlink: true },
      { header: 'Record ID', key: 'id', width: 30 },
    ];
    const baseName = `users${search ? '-search-' + safeFilename(search) : ''}-${new Date().toISOString().slice(0, 10)}`;

    if (req.query.format === 'csv') {
      return sendCsvFile(res, { filename: `${baseName}.csv`, columns, rows });
    }

    await sendExcelFile(res, {
      filename: `${baseName}.xlsx`,
      sheetName: 'Users',
      title: 'Registered Users',
      subtitle: `${records.length} user${records.length === 1 ? '' : 's'}${search ? ` matching "${search}"` : ''} • Generated ${formatDateTime(new Date())}`,
      columns,
      rows,
    });
  } catch (err) {
    next(err);
  }
});

// ==================== AUDIT LOG ====================

router.get('/audit-log', requireMainAdminApi, async (req, res, next) => {
  try {
    res.json(await db.getAuditLog({ limit: 150 }));
  } catch (err) {
    next(err);
  }
});

// ==================== CUSTOM EMAIL ====================

function buildEmailBodyHtml(message) {
  return message
    .trim()
    .split(/\n{2,}/)
    .map((para) => `<p style="margin:0 0 12px;">${para.replace(/\n/g, '<br>')}</p>`)
    .join('');
}

router.post('/custom-email', requireMainAdminApi, express.json(), async (req, res, next) => {
  try {
    const { to, name, subject, message } = req.body || {};
    if (!to || !to.trim() || !subject || !subject.trim() || !message || !message.trim()) {
      return res.status(400).json({ error: 'Recipient, subject, and message are all required.' });
    }

    const bodyHtml = buildEmailBodyHtml(message);
    const outcome = await notify.sendEventEmail({
      to: to.trim(),
      name: name ? name.trim() : null,
      subject: subject.trim(),
      bodyHtml,
    });

    res.json({
      sent: outcome.success ? 1 : 0,
      failed: outcome.success || outcome.skipped ? 0 : 1,
      skipped: outcome.skipped ? 1 : 0,
      skipReason: outcome.skipped ? outcome.reason : null,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
