const https = require('https');
const config = require('../config');

function brevoRequest(payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const req = https.request(
      {
        hostname: 'api.brevo.com',
        path: '/v3/smtp/email',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'api-key': config.email.brevoApiKey,
          'Content-Length': Buffer.byteLength(body),
        },
        timeout: 20000,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          let parsed = {};
          try { parsed = data ? JSON.parse(data) : {}; } catch (e) { parsed = { raw: data }; }
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            const err = new Error(parsed.message || `Brevo API returned HTTP ${res.statusCode}`);
            err.statusCode = res.statusCode;
            err.code = parsed.code;
            err.details = parsed;
            reject(err);
          }
        });
      }
    );
    req.on('timeout', () => req.destroy(new Error('Brevo API request timed out')));
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Branded HTML email shell.
// - QR code box removed (was unreliable across email clients)
// - "તમારી પ્રોફાઇલ જુઓ" CTA button removed
// - QR is sent only as a PNG attachment — clean and universally supported.
function buildEmailHtml({ title, bodyHtml }) {
  return `<!DOCTYPE html>
<html lang="gu">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#fdf3e7;font-family:'Noto Sans Gujarati','Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fdf3e7;padding:32px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 12px 32px rgba(179,54,0,0.16);border:1px solid rgba(230,92,0,0.12);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#ff8a00 0%,#e65c00 55%,#b33600 100%);padding:34px 32px 30px;text-align:center;">
              <div style="font-size:13px;color:#fff1e0;font-weight:700;letter-spacing:0.04em;margin-bottom:8px;text-transform:uppercase;">🕉️ રાષ્ટ્રીય સ્વયંસેવક સંઘ - નરોડા ભાગ 🕉️</div>
              <div style="font-size:26px;color:#ffffff;font-weight:800;letter-spacing:0.01em;text-shadow:0 2px 6px rgba(0,0,0,0.15);">યુવા સંગમ ૨૦૨૬</div>
            </td>
          </tr>
          <!-- Accent divider -->
          <tr><td style="height:5px;background:linear-gradient(90deg,#ffb703 0%,#e65c00 50%,#b33600 100%);"></td></tr>
          <!-- Body -->
          <tr>
            <td style="padding:34px 32px 32px;">
              <h1 style="margin:0 0 18px;font-size:21px;line-height:1.4;color:#2c1a0e;font-weight:800;">${title}</h1>
              <div style="font-size:16px;line-height:1.8;color:#3a281a;">${bodyHtml}</div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:22px 32px;background:#fff8f0;border-top:1px solid #f3ddc4;text-align:center;">
              <div style="font-size:13px;color:#7a6552;font-weight:600;margin-bottom:4px;">યુવા સંગમ ૨૦૨૬ • રાષ્ટ્રીય સ્વયંસેવક સંઘ - નરોડા ભાગ</div>
              <div style="font-size:11px;color:#a08a72;">🚩 સેવા &nbsp;|&nbsp; 🪷 સંસ્કાર &nbsp;|&nbsp; ☀️ સંગઠન</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Sends the QR code as a PNG email attachment only.
// No inline QR image box, no profile CTA button — clean and reliable.
async function sendEmailQr({ to, name, qrBuffer }) {
  if (!to || !to.trim()) {
    console.warn('[notify] Email skipped: no email address on this record.');
    return { skipped: true, reason: 'no email address on record' };
  }

  const missing = [];
  if (!config.email.brevoApiKey) missing.push('BREVO_API_KEY');
  if (!config.email.from) missing.push('EMAIL_FROM');
  if (missing.length) {
    console.warn(`[notify] Email disabled: missing ${missing.join(', ')} in your .env file.`);
    return { skipped: true, reason: 'brevo not configured' };
  }

  try {
    const qrBase64 = qrBuffer.toString('base64');

    const bodyHtml =
      `<p style="margin:0 0 12px;">નમસ્તે ${name},</p>` +
      `<p style="margin:0 0 12px;">'યુવા સંગમ ૨૦૨૬' માટે નોંધણી કરાવવા બદલ આભાર.</p>` +
      `<p style="margin:0 0 12px;">તમારો QR કોડ આ ઈમેઇલ સાથે <strong>PNG attachment</strong> તરીકે જોડવામાં આવ્યો છે.</p>` +
      `<p style="margin:0;">ચેક-ઈન સમયે attachment ખોલો અને QR કોડ બતાવો.</p>`;

    const htmlContent = buildEmailHtml({
      title: `નમસ્તે ${name}, આ રહ્યો તમારો QR કોડ`,
      bodyHtml,
    });

    const result = await brevoRequest({
      sender: { name: config.email.fromName, email: config.email.from },
      to: [{ email: to.trim(), name: name || undefined }],
      subject: 'Your Registration QR Code - Yuva Sangam 2026',
      textContent:
        `નમસ્તે ${name},\n\n` +
        `'યુવા સંગમ ૨૦૨૬' (Yuva Sangam 2026) માટે નોંધણી કરાવવા બદલ આભાર.\n` +
        `તમારો QR કોડ attachment (qr-code.png) તરીકે જોડ્યો છે.\n` +
        `ચેક-ઈન સમયે attachment ખોલો અને QR કોડ બતાવો.\n`,
      htmlContent,
      // QR as PNG attachment — universally supported by all email clients
      attachment: [{ content: qrBase64, name: `qr-${name.replace(/\s+/g, '-')}.png` }],
    });

    console.log(`[notify] SUCCESS: email sent to ${to.trim()} via Brevo — messageId=${result.messageId}`);
    return { success: true, messageId: result.messageId };
  } catch (err) {
    console.error(`[notify] FAIL: could not send email to ${to.trim()} via Brevo.`, {
      message: err.message,
      statusCode: err.statusCode,
      code: err.code,
      details: err.details,
    });
    return { success: false, error: err.message, code: err.code };
  }
}

// Manual event-announcement email — clean branded shell, no QR or CTA
async function sendEventEmail({ to, name, subject, bodyHtml }) {
  if (!to || !to.trim()) {
    return { skipped: true, reason: 'no email address on record' };
  }

  const missing = [];
  if (!config.email.brevoApiKey) missing.push('BREVO_API_KEY');
  if (!config.email.from) missing.push('EMAIL_FROM');
  if (missing.length) {
    return { skipped: true, reason: 'brevo not configured' };
  }

  try {
    const htmlContent = buildEmailHtml({ title: subject, bodyHtml });
    const result = await brevoRequest({
      sender: { name: config.email.fromName, email: config.email.from },
      to: [{ email: to.trim(), name: name || undefined }],
      subject,
      textContent: bodyHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
      htmlContent,
    });
    return { success: true, messageId: result.messageId };
  } catch (err) {
    return { success: false, error: err.message, code: err.code };
  }
}

// Called after registration — no viewUrl needed anymore
async function notifyNewRegistration({ record, qrBuffer }) {
  const emailResult = await sendEmailQr({ to: record.email, name: record.name, qrBuffer });
  return { email: emailResult };
}

// ---- New QR-free confirmation email (Yuva Prarambhik Varg rebrand) ----
// Kept separate from buildEmailHtml above (which stays untouched, still used
// by sendEmailQr) so this one is free to use a bolder, more animated design
// without touching the existing QR-email template.
function buildConfirmationEmailHtml({ name, eventYear }) {
  return `<!DOCTYPE html>
<html lang="gu">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <title>નોંધણી સફળ - Yuva Prarambhik Varg ${eventYear}</title>
  <style>
    @keyframes ys-pop {
      0% { transform: scale(0.5); opacity: 0; }
      60% { transform: scale(1.08); opacity: 1; }
      100% { transform: scale(1); opacity: 1; }
    }
    @keyframes ys-draw {
      to { stroke-dashoffset: 0; }
    }
    @keyframes ys-fade-up {
      from { transform: translateY(8px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    .ys-check-badge { animation: ys-pop 0.6s cubic-bezier(.34,1.56,.64,1) both; }
    .ys-check-path { stroke-dasharray: 24; stroke-dashoffset: 24; animation: ys-draw 0.4s 0.5s ease-out forwards; }
    .ys-fade { animation: ys-fade-up 0.6s 0.2s ease-out both; }
  </style>
</head>
<body style="margin:0;padding:0;background:#fdf3e7;font-family:'Noto Sans Gujarati','Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fdf3e7;padding:32px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 12px 32px rgba(179,54,0,0.16);border:1px solid rgba(230,92,0,0.12);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#ff8a00 0%,#e65c00 55%,#b33600 100%);padding:38px 32px 34px;text-align:center;position:relative;">
              <div style="font-size:13px;color:#fff1e0;font-weight:700;letter-spacing:0.04em;margin-bottom:8px;text-transform:uppercase;">🕉️ રાષ્ટ્રીય સ્વયંસેવક સંઘ - નરોડા ભાગ 🕉️</div>
              <div style="font-size:26px;color:#ffffff;font-weight:800;letter-spacing:0.01em;text-shadow:0 2px 6px rgba(0,0,0,0.15);">યુવા પ્રારંભિક વર્ગ ${eventYear}</div>
            </td>
          </tr>
          <tr><td style="height:5px;background:linear-gradient(90deg,#ffb703 0%,#e65c00 50%,#b33600 100%);"></td></tr>
          <!-- Checkmark badge -->
          <tr>
            <td style="padding:32px 32px 0;text-align:center;">
              <svg class="ys-check-badge" width="72" height="72" viewBox="0 0 72 72" style="display:inline-block;">
                <circle cx="36" cy="36" r="34" fill="#fff1e0" stroke="#e65c00" stroke-width="2" />
                <path class="ys-check-path" d="M22 37 L31 46 L50 26" fill="none" stroke="#e65c00" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:20px 32px 32px;">
              <h1 class="ys-fade" style="margin:0 0 14px;font-size:22px;line-height:1.4;color:#2c1a0e;font-weight:800;text-align:center;">નમસ્તે ${name}, તમારી નોંધણી સફળ થઈ છે! 🎉</h1>
              <div class="ys-fade" style="font-size:16px;line-height:1.8;color:#3a281a;text-align:center;">
                <p style="margin:0 0 12px;">'યુવા પ્રારંભિક વર્ગ ${eventYear}' માટે નોંધણી કરાવવા બદલ આભાર.</p>
                <p style="margin:0;">અમે તમારો સંપર્ક ટૂંક સમયમાં કરીશું. તમને મળવા આતુર છીએ!</p>
              </div>
              <div class="ys-fade" style="margin-top:22px;background:#fff1e0;border-radius:16px;padding:16px 20px;text-align:center;">
                <span style="font-size:14px;color:#b33600;font-weight:700;">યુવા પ્રારંભિક વર્ગ ${eventYear} • નોંધણી પુષ્ટિ થયેલ છે ✅</span>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:22px 32px;background:#fff8f0;border-top:1px solid #f3ddc4;text-align:center;">
              <div style="font-size:13px;color:#7a6552;font-weight:600;margin-bottom:4px;">યુવા પ્રારંભિક વર્ગ ${eventYear} • રાષ્ટ્રીય સ્વયંસેવક સંઘ - નરોડા ભાગ</div>
              <div style="font-size:11px;color:#a08a72;">🚩 સેવા &nbsp;|&nbsp; 🪷 સંસ્કાર &nbsp;|&nbsp; ☀️ સંગઠન</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Plain, QR-free post-registration confirmation email. Additive: does not
// replace sendEmailQr, which stays available (unused by the new flow) for
// any already-registered record that still relies on it.
async function sendRegistrationConfirmation({ to, name, eventYear }) {
  if (!to || !to.trim()) {
    console.warn('[notify] Confirmation email skipped: no email address on this record.');
    return { skipped: true, reason: 'no email address on record' };
  }

  const missing = [];
  if (!config.email.brevoApiKey) missing.push('BREVO_API_KEY');
  if (!config.email.from) missing.push('EMAIL_FROM');
  if (missing.length) {
    console.warn(`[notify] Confirmation email disabled: missing ${missing.join(', ')} in your .env file.`);
    return { skipped: true, reason: 'brevo not configured' };
  }

  try {
    const htmlContent = buildConfirmationEmailHtml({ name, eventYear });

    const result = await brevoRequest({
      sender: { name: config.email.fromName, email: config.email.from },
      to: [{ email: to.trim(), name: name || undefined }],
      subject: `નોંધણી સફળ - Yuva Prarambhik Varg ${eventYear}`,
      textContent:
        `નમસ્તે ${name},\n\n` +
        `'યુવા પ્રારંભિક વર્ગ ${eventYear}' માટે નોંધણી કરાવવા બદલ આભાર.\n` +
        `અમે તમારો સંપર્ક ટૂંક સમયમાં કરીશું.\n`,
      htmlContent,
    });

    console.log(`[notify] SUCCESS: confirmation email sent to ${to.trim()} via Brevo — messageId=${result.messageId}`);
    return { success: true, messageId: result.messageId };
  } catch (err) {
    console.error(`[notify] FAIL: could not send confirmation email to ${to.trim()} via Brevo.`, {
      message: err.message,
      statusCode: err.statusCode,
      code: err.code,
      details: err.details,
    });
    return { success: false, error: err.message, code: err.code };
  }
}

module.exports = {
  buildEmailHtml,
  sendEmailQr,
  sendEventEmail,
  notifyNewRegistration,
  buildConfirmationEmailHtml,
  sendRegistrationConfirmation,
};
