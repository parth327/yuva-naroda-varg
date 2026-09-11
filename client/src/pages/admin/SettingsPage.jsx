import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../../i18n/I18nContext';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import MagneticButton from '../../components/MagneticButton';
import Tilt3D from '../../components/Tilt3D';

export default function SettingsPage() {
  const { t } = useTranslation();
  const { eventYear, minAge, maxAge, refresh } = useSettings();
  const { showToast } = useToast();
  const [form, setForm] = useState({ eventYear, minAge, maxAge });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed.');
      await refresh();
      setSaved(true);
      showToast(t('admin-settings-saved'), 'success');
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Tilt3D maxTilt={4} glare={false} className="admin-settings-form">
      <motion.div className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="admin-page-title">{t('admin-settings-title')}</h1>

        <form onSubmit={handleSubmit}>
          <div className="field" style={{ marginBottom: 16 }}>
            <label>{t('admin-settings-year')}</label>
            <input
              type="number"
              value={form.eventYear}
              onChange={(e) => setForm((f) => ({ ...f, eventYear: e.target.value }))}
              required
            />
          </div>
          <div className="field" style={{ marginBottom: 16 }}>
            <label>{t('admin-settings-min-age')}</label>
            <input
              type="number"
              value={form.minAge}
              onChange={(e) => setForm((f) => ({ ...f, minAge: e.target.value }))}
              required
            />
          </div>
          <div className="field" style={{ marginBottom: 20 }}>
            <label>{t('admin-settings-max-age')}</label>
            <input
              type="number"
              value={form.maxAge}
              onChange={(e) => setForm((f) => ({ ...f, maxAge: e.target.value }))}
              required
            />
          </div>
          <MagneticButton type="submit" className="btn" disabled={saving}>
            <AnimatePresence mode="wait" initial={false}>
              {saving ? (
                <motion.span key="spin" className="spinner" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
              ) : saved ? (
                <motion.span key="saved" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>✅ {t('admin-settings-saved')}</motion.span>
              ) : (
                <motion.span key="save" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{t('admin-settings-save')}</motion.span>
              )}
            </AnimatePresence>
          </MagneticButton>
        </form>
      </motion.div>
    </Tilt3D>
  );
}
