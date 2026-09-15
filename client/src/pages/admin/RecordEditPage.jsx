import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from '../../i18n/I18nContext';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import { OTHER_VALUE } from '../../i18n/translations';
import MagneticButton from '../../components/MagneticButton';

export default function RecordEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { minAge, maxAge } = useSettings();
  const { showToast } = useToast();
  const [form, setForm] = useState(null);
  const [filterOptions, setFilterOptions] = useState({ locations: [], interests: [], joinMediums: [], genders: [] });
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);

  useEffect(() => {
    fetch(`/api/admin/records/${id}`).then((r) => r.json()).then(setForm);
    fetch('/api/admin/filter-options').then((r) => r.json()).then(setFilterOptions);
  }, [id]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (v != null) fd.append(k, v);
    });
    if (photoFile) fd.append('photo', photoFile);

    try {
      const res = await fetch(`/api/admin/records/${id}`, { method: 'PUT', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed.');
      showToast('Record updated.', 'success');
      navigate(`/admin/records/${id}`);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  if (!form) return <p>…</p>;

  return (
    <motion.div className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: 640 }}>
      <h1 className="admin-page-title">{t('admin-btn-edit')}: {form.name}</h1>

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="field full">
            <label>{t('lbl-name')}</label>
            <input value={form.name || ''} onChange={(e) => update('name', e.target.value)} required />
          </div>
          <div className="field">
            <label>{t('lbl-age')}</label>
            <input type="number" min={minAge} max={maxAge} value={form.age || ''} onChange={(e) => update('age', e.target.value)} />
          </div>
          <div className="field">
            <label>{t('lbl-phone')}</label>
            <input value={form.phone || ''} onChange={(e) => update('phone', e.target.value)} required />
          </div>
          <div className="field">
            <label>{t('lbl-whatsapp')}</label>
            <input value={form.whatsapp || ''} onChange={(e) => update('whatsapp', e.target.value)} />
          </div>
          <div className="field">
            <label>{t('lbl-email')}</label>
            <input type="email" value={form.email || ''} onChange={(e) => update('email', e.target.value)} />
          </div>
          <div className="field">
            <label>Gender</label>
            <select value={form.gender || ''} onChange={(e) => update('gender', e.target.value)}>
              <option value="">—</option>
              {filterOptions.genders.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="field">
            <label>{t('lbl-location')}</label>
            <select value={form.location || ''} onChange={(e) => update('location', e.target.value)} required>
              {filterOptions.locations.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
            </select>
          </div>
          {form.location === OTHER_VALUE && (
            <div className="field">
              <label>{t('lbl-location-other')}</label>
              <input value={form.locationOther || ''} onChange={(e) => update('locationOther', e.target.value)} />
            </div>
          )}
          <div className="field">
            <label>{t('lbl-pincode')}</label>
            <input value={form.pincode || ''} onChange={(e) => update('pincode', e.target.value)} />
          </div>
          <div className="field">
            <label>{t('lbl-houseNumber')}</label>
            <input value={form.houseNumber || ''} onChange={(e) => update('houseNumber', e.target.value)} />
          </div>
          <div className="field">
            <label>{t('lbl-society')}</label>
            <input value={form.society || ''} onChange={(e) => update('society', e.target.value)} />
          </div>
          <div className="field full">
            <label>{t('lbl-landmark')}</label>
            <input value={form.landmark || ''} onChange={(e) => update('landmark', e.target.value)} />
          </div>
          <div className="field full">
            <label>Address</label>
            <input value={form.address || ''} onChange={(e) => update('address', e.target.value)} />
          </div>
          <div className="field">
            <label>{t('lbl-education')}</label>
            <input value={form.education || ''} onChange={(e) => update('education', e.target.value)} />
          </div>
          <div className="field">
            <label>Occupation</label>
            <input value={form.occupation || ''} onChange={(e) => update('occupation', e.target.value)} />
          </div>
          <div className="field">
            <label>{t('lbl-interest')}</label>
            <select value={form.interest || ''} onChange={(e) => update('interest', e.target.value)}>
              <option value="">—</option>
              {filterOptions.interests.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          {form.interest === OTHER_VALUE && (
            <div className="field">
              <label>{t('lbl-interest-other')}</label>
              <input value={form.interestOther || ''} onChange={(e) => update('interestOther', e.target.value)} />
            </div>
          )}
          <div className="field">
            <label>{t('lbl-joinMedium')}</label>
            <select value={form.joinMedium || ''} onChange={(e) => update('joinMedium', e.target.value)}>
              <option value="">—</option>
              {filterOptions.joinMediums.map((j) => <option key={j} value={j}>{j}</option>)}
            </select>
          </div>
          {form.joinMedium === OTHER_VALUE && (
            <div className="field">
              <label>{t('lbl-joinMedium-other')}</label>
              <input value={form.joinMediumOther || ''} onChange={(e) => update('joinMediumOther', e.target.value)} />
            </div>
          )}
          <div className="field full">
            <label>Notes</label>
            <textarea rows={3} value={form.notes || ''} onChange={(e) => update('notes', e.target.value)} />
          </div>
          <div className="field full">
            <label>Photo</label>
            {form.photoUrl && !photoFile && (
              <img src={form.photoUrl} alt="" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', marginBottom: 8 }} />
            )}
            <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files[0])} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <MagneticButton type="submit" className="btn" disabled={saving}>
            {saving ? <span className="spinner" /> : t('admin-settings-save')}
          </MagneticButton>
        </div>
      </form>
    </motion.div>
  );
}
