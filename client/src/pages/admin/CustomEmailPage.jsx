import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '../../i18n/I18nContext';
import { useToast } from '../../context/ToastContext';
import MagneticButton from '../../components/MagneticButton';
import Tilt3D from '../../components/Tilt3D';

export default function CustomEmailPage() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [form, setForm] = useState({ to: '', name: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch('/api/admin/custom-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send.');
      if (data.sent) {
        showToast('Email sent successfully.', 'success');
        setForm({ to: '', name: '', subject: '', message: '' });
      } else if (data.skipped) {
        showToast(`Skipped: ${data.skipReason}`, 'error');
      } else {
        showToast('Failed to send.', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSending(false);
    }
  }

  return (
    <Tilt3D maxTilt={3} glare={false} style={{ maxWidth: 520 }}>
      <motion.div className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="admin-page-title">{t('admin-custom-email-title')}</h1>
        <form onSubmit={handleSubmit}>
          <div className="field" style={{ marginBottom: 14 }}>
            <label>{t('admin-lbl-to')}</label>
            <input type="email" value={form.to} onChange={(e) => update('to', e.target.value)} required />
          </div>
          <div className="field" style={{ marginBottom: 14 }}>
            <label>{t('lbl-name')}</label>
            <input value={form.name} onChange={(e) => update('name', e.target.value)} />
          </div>
          <div className="field" style={{ marginBottom: 14 }}>
            <label>{t('admin-lbl-subject')}</label>
            <input value={form.subject} onChange={(e) => update('subject', e.target.value)} required />
          </div>
          <div className="field" style={{ marginBottom: 14 }}>
            <label>{t('admin-lbl-message')}</label>
            <textarea rows={6} value={form.message} onChange={(e) => update('message', e.target.value)} required />
          </div>
          <MagneticButton type="submit" className="btn btn-block" disabled={sending}>
            {sending ? <span className="spinner" /> : t('admin-btn-send')}
          </MagneticButton>
        </form>
      </motion.div>
    </Tilt3D>
  );
}
