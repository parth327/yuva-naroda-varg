const express = require('express');
const crypto = require('crypto');

const db = require('../../db');
const notify = require('../../utils/notify');

const router = express.Router();

// GET /api/settings -> public read of the admin-configurable event year and
// valid registration age range, used by the registration page's brand text,
// age input bounds, and client-side validation.
router.get('/settings', async (req, res, next) => {
  try {
    const settings = await db.getSettings();
    res.json(settings);
  } catch (err) {
    next(err);
  }
});

// POST /api/register -> save a new registration. Unlike the legacy
// (multipart, QR-generating) POST /register, this is a plain JSON endpoint:
// no photo upload, no QR code generated, no QR emailed — just a record and a
// plain confirmation email. See db.js's getSettings() for the age bounds
// used below instead of a hardcoded range.
router.post('/register', express.json(), async (req, res, next) => {
  try {
    const {
      name, dob, gender, phone, whatsapp, email, location, locationOther, address,
      houseNumber, society, landmark, education, occupation, notes, pincode,
      interest, interestOther, joinMedium, joinMediumOther, age,
    } = req.body || {};

    const settings = await db.getSettings();

    const missing = [];
    if (!name || !name.trim()) missing.push('name');
    if (!phone || !phone.trim()) missing.push('phone');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !email.trim()) missing.push('email');
    else if (!emailRegex.test(email.trim())) missing.push('email');
    if (!location || !location.trim()) missing.push('location');
    if (location === 'અન્ય' && (!locationOther || !locationOther.trim())) missing.push('locationOther');
    if (!education || !education.trim()) missing.push('education');
    if (!interest || !interest.trim()) missing.push('interest');
    if (interest === 'અન્ય' && (!interestOther || !interestOther.trim())) missing.push('interestOther');
    if (!joinMedium || !joinMedium.trim()) missing.push('joinMedium');
    if (joinMedium === 'અન્ય' && (!joinMediumOther || !joinMediumOther.trim())) missing.push('joinMediumOther');

    const ageNum = age ? parseInt(age, 10) : null;
    if (!age || Number.isNaN(ageNum) || ageNum < settings.minAge || ageNum > settings.maxAge) missing.push('age');
    if (!pincode || !pincode.trim()) missing.push('pincode');
    else if (!/^\d{6}$/.test(pincode.trim())) missing.push('pincode');

    if (missing.length) {
      return res.status(400).json({ error: 'Please check the required fields.', fields: missing });
    }

    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    const record = {
      id,
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
      photoData: null,
      photoMime: null,
      qrData: null,
      createdAt,
      pincode: (pincode || '').trim() || null,
    };

    await db.addRecord(record);

    // Fire-and-forget, same pattern as the legacy registration flow — a slow
    // or failed email should never hold up or fail the registration itself.
    notify
      .sendRegistrationConfirmation({ to: record.email, name: record.name, eventYear: settings.eventYear })
      .then((result) => {
        console.log(`[notify] Registration ${id} confirmation email result:`, result);
      })
      .catch((notifyErr) => {
        console.error(`[notify] Unexpected error sending confirmation for ${id}:`, notifyErr);
      });

    res.status(201).json({ id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
