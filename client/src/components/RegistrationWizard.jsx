import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../i18n/I18nContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { LOCATION_OPTIONS, INTEREST_OPTIONS, JOIN_MEDIUM_OPTIONS, optionLabels, OTHER_VALUE } from '../i18n/translations';
import StepIndicator from './StepIndicator';
import MagneticButton from './MagneticButton';

const STORAGE_KEY = 'ys-register-draft-v1';

const EMPTY_FORM = {
  name: '', age: '', education: '', phone: '', whatsapp: '', email: '',
  location: '', locationOther: '', pincode: '', houseNumber: '', society: '', landmark: '',
  interest: '', interestOther: '', joinMedium: '', joinMediumOther: '',
};

const STEP_FIELDS = [
  ['name', 'age', 'education'],
  ['phone', 'whatsapp', 'email'],
  ['location', 'locationOther', 'pincode', 'houseNumber', 'society', 'landmark'],
  ['interest', 'interestOther', 'joinMedium', 'joinMediumOther'],
  [],
];

const REQUIRED = ['name', 'age', 'education', 'phone', 'email', 'location', 'pincode', 'interest', 'joinMedium'];

const FIELD_LABELS = {
  name: 'lbl-name', age: 'lbl-age', education: 'lbl-education', phone: 'lbl-phone',
  email: 'lbl-email', location: 'lbl-location', locationOther: 'lbl-location-other',
  pincode: 'lbl-pincode', interest: 'lbl-interest', interestOther: 'lbl-interest-other',
  joinMedium: 'lbl-joinMedium', joinMediumOther: 'lbl-joinMedium-other',
};

const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

function loadDraft() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function hasAnyValue(form) {
  return Object.values(form).some((v) => String(v || '').trim());
}

export default function RegistrationWizard() {
  const { t, lang } = useTranslation();
  const { minAge, maxAge } = useSettings();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [phoneNotice, setPhoneNotice] = useState(false);
  const [draftBanner, setDraftBanner] = useState(false);
  const lastCheckedPhone = useRef('');
  const wizardTopRef = useRef(null);

  const stepLabels = [t('sec-1-title'), t('sec-2-title'), t('sec-3-title'), t('sec-4-title'), t('sec-5-title')];

  useEffect(() => {
    const draft = loadDraft();
    if (draft && hasAnyValue(draft)) setDraftBanner(true);
  }, []);

  useEffect(() => {
    if (hasAnyValue(form)) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(form)); } catch { /* ignore */ }
    }
  }, [form]);

  function resumeDraft() {
    const draft = loadDraft();
    if (draft) setForm({ ...EMPTY_FORM, ...draft });
    setDraftBanner(false);
  }

  function discardDraft() {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    setDraftBanner(false);
  }

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function labelFor(opt, group) {
    return optionLabels[group]?.[lang]?.[opt] || opt;
  }

  const checkPhone = useCallback(async (phone) => {
    if (!/^[0-9]{10}$/.test(phone)) {
      setPhoneNotice(false);
      return;
    }
    if (phone === lastCheckedPhone.current) return;
    lastCheckedPhone.current = phone;
    try {
      const res = await fetch(`/api/check-phone?phone=${encodeURIComponent(phone)}`);
      const data = await res.json();
      setPhoneNotice(!!data.exists);
    } catch {
      // silently ignore, not critical
    }
  }, []);

  function fieldError(field) {
    const v = String(form[field] || '').trim();
    if (field === 'locationOther') return form.location === OTHER_VALUE && !v;
    if (field === 'interestOther') return form.interest === OTHER_VALUE && !v;
    if (field === 'joinMediumOther') return form.joinMedium === OTHER_VALUE && !v;
    if (!REQUIRED.includes(field)) return false;
    if (!v) return true;
    if (field === 'age') {
      const n = parseInt(v, 10);
      return Number.isNaN(n) || n < minAge || n > maxAge;
    }
    if (field === 'email') return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    if (field === 'pincode') return !/^\d{6}$/.test(v);
    if (field === 'phone') return !/^\d{10}$/.test(v);
    return false;
  }

  function validateStep(i) {
    const fields = STEP_FIELDS[i];
    const bad = fields.filter(fieldError);
    if (bad.length) {
      const errObj = {};
      bad.forEach((f) => { errObj[f] = true; });
      setErrors((e) => ({ ...e, ...errObj }));
      showToast(`${t('validation-banner')}: ${bad.map((f) => t(FIELD_LABELS[f] || f)).join(', ')}`, 'error');
      return false;
    }
    return true;
  }

  function goNext() {
    if (!validateStep(step)) return;
    setDirection(1);
    setStep((s) => Math.min(s + 1, stepLabels.length - 1));
    wizardTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function goBack() {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
    wizardTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function handleSubmit() {
    if (!validateStep(step)) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, age: parseInt(form.age, 10) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed.');
      try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
      navigate(`/success/${data.id}`, { state: { name: form.name } });
    } catch (err) {
      showToast(err.message, 'error');
      setSubmitting(false);
    }
  }

  const totalRequired = STEP_FIELDS.flat().filter((f) => REQUIRED.includes(f) ||
    (f === 'locationOther' && form.location === OTHER_VALUE) ||
    (f === 'interestOther' && form.interest === OTHER_VALUE) ||
    (f === 'joinMediumOther' && form.joinMedium === OTHER_VALUE)).length;
  const filledRequired = STEP_FIELDS.flat().filter((f) => {
    const isReq = REQUIRED.includes(f) ||
      (f === 'locationOther' && form.location === OTHER_VALUE) ||
      (f === 'interestOther' && form.interest === OTHER_VALUE) ||
      (f === 'joinMediumOther' && form.joinMedium === OTHER_VALUE);
    return isReq && String(form[f] || '').trim();
  }).length;
  const progress = totalRequired ? Math.round((filledRequired / totalRequired) * 100) : 0;

  return (
    <div ref={wizardTopRef}>
      <AnimatePresence>
        {draftBanner && (
          <motion.div
            className="draft-banner"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <span>💾 {lang === 'en' ? 'We found a saved draft of your registration.' : 'તમારી અધૂરી નોંધણીનો ડ્રાફ્ટ મળ્યો છે.'}</span>
            <div className="draft-banner-actions">
              <button type="button" className="btn btn-sm" onClick={resumeDraft}>{lang === 'en' ? 'Resume' : 'ચાલુ રાખો'}</button>
              <button type="button" className="btn btn-sm btn-outline" onClick={discardDraft}>{lang === 'en' ? 'Discard' : 'કાઢી નાખો'}</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <StepIndicator steps={stepLabels} current={step} />

      <div className="progress-track" aria-hidden="true">
        <motion.div className="progress-fill" animate={{ width: `${progress}%` }} />
      </div>
      <p className="progress-label">{progress}%</p>

      <div className="wizard-viewport">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.32, ease: 'easeInOut' }}
          >
            {step === 0 && (
              <div className="form-grid">
                <div className="field full">
                  <label>{t('lbl-name')} <span className="req">*</span></label>
                  <input className={errors.name ? 'field-error' : ''} value={form.name} onChange={(e) => update('name', e.target.value)} placeholder={t('ph-name')} autoFocus />
                </div>
                <div className="field">
                  <label>{t('lbl-age')} <span className="req">*</span></label>
                  <div className="stepper-input">
                    <button type="button" onClick={() => update('age', String(Math.max(minAge, (parseInt(form.age, 10) || minAge) - 1)))}>−</button>
                    <input type="number" inputMode="numeric" min={minAge} max={maxAge} className={errors.age ? 'field-error' : ''} value={form.age} onChange={(e) => update('age', e.target.value)} placeholder={t('ph-age', { minAge, maxAge })} />
                    <button type="button" onClick={() => update('age', String(Math.min(maxAge, (parseInt(form.age, 10) || minAge) + 1)))}>+</button>
                  </div>
                </div>
                <div className="field">
                  <label>{t('lbl-education')} <span className="req">*</span></label>
                  <input className={errors.education ? 'field-error' : ''} value={form.education} onChange={(e) => update('education', e.target.value)} placeholder={t('ph-education')} />
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="form-grid">
                <div className="field">
                  <label>{t('lbl-phone')} <span className="req">*</span></label>
                  <input
                    type="tel" inputMode="numeric" maxLength={10}
                    className={errors.phone ? 'field-error' : ''}
                    value={form.phone}
                    onChange={(e) => update('phone', e.target.value)}
                    onBlur={(e) => checkPhone(e.target.value.trim())}
                    placeholder={t('ph-phone')}
                  />
                  {phoneNotice && <div className="duplicate-phone-notice show">⚠️ {t('duplicate-phone-notice')}</div>}
                </div>
                <div className="field">
                  <label>{t('lbl-whatsapp')}</label>
                  <input type="tel" inputMode="numeric" maxLength={10} value={form.whatsapp} onChange={(e) => update('whatsapp', e.target.value)} placeholder={t('ph-whatsapp')} />
                </div>
                <div className="field">
                  <label>{t('lbl-email')} <span className="req">*</span></label>
                  <input type="email" className={errors.email ? 'field-error' : ''} value={form.email} onChange={(e) => update('email', e.target.value)} placeholder={t('ph-email')} />
                  <small className="field-hint">{t('hint-email')}</small>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="form-grid">
                <div className="field">
                  <label>{t('lbl-location')} <span className="req">*</span></label>
                  <select className={errors.location ? 'field-error' : ''} value={form.location} onChange={(e) => update('location', e.target.value)}>
                    <option value="" disabled>{t('opt-select')}</option>
                    {LOCATION_OPTIONS.map((opt) => <option key={opt} value={opt}>{labelFor(opt, 'location')}</option>)}
                  </select>
                </div>
                {form.location === OTHER_VALUE && (
                  <div className="field full">
                    <label>{t('lbl-location-other')} <span className="req">*</span></label>
                    <input className={errors.locationOther ? 'field-error' : ''} value={form.locationOther} onChange={(e) => update('locationOther', e.target.value)} placeholder={t('ph-location-other')} />
                  </div>
                )}
                <div className="field">
                  <label>{t('lbl-pincode')} <span className="req">*</span></label>
                  <input inputMode="numeric" maxLength={6} className={errors.pincode ? 'field-error' : ''} value={form.pincode} onChange={(e) => update('pincode', e.target.value)} placeholder={t('ph-pincode')} />
                </div>
                <div className="field">
                  <label>{t('lbl-houseNumber')}</label>
                  <input value={form.houseNumber} onChange={(e) => update('houseNumber', e.target.value)} placeholder={t('ph-houseNumber')} />
                </div>
                <div className="field">
                  <label>{t('lbl-society')}</label>
                  <input value={form.society} onChange={(e) => update('society', e.target.value)} placeholder={t('ph-society')} />
                </div>
                <div className="field full">
                  <label>{t('lbl-landmark')}</label>
                  <input value={form.landmark} onChange={(e) => update('landmark', e.target.value)} placeholder={t('ph-landmark')} />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="form-grid">
                <div className="field full">
                  <label>{t('lbl-interest')} <span className="req">*</span></label>
                  <select className={errors.interest ? 'field-error' : ''} value={form.interest} onChange={(e) => update('interest', e.target.value)}>
                    <option value="" disabled>{t('opt-select')}</option>
                    {INTEREST_OPTIONS.map((opt) => <option key={opt} value={opt}>{labelFor(opt, 'interest')}</option>)}
                  </select>
                </div>
                {form.interest === OTHER_VALUE && (
                  <div className="field full">
                    <label>{t('lbl-interest-other')} <span className="req">*</span></label>
                    <input className={errors.interestOther ? 'field-error' : ''} value={form.interestOther} onChange={(e) => update('interestOther', e.target.value)} placeholder={t('ph-interest-other')} />
                  </div>
                )}
                <div className="field full">
                  <label>{t('lbl-joinMedium')} <span className="req">*</span></label>
                  <select className={errors.joinMedium ? 'field-error' : ''} value={form.joinMedium} onChange={(e) => update('joinMedium', e.target.value)}>
                    <option value="" disabled>{t('opt-select')}</option>
                    {JOIN_MEDIUM_OPTIONS.map((opt) => <option key={opt} value={opt}>{labelFor(opt, 'joinMedium')}</option>)}
                  </select>
                </div>
                {form.joinMedium === OTHER_VALUE && (
                  <div className="field full">
                    <label>{t('lbl-joinMedium-other')} <span className="req">*</span></label>
                    <input className={errors.joinMediumOther ? 'field-error' : ''} value={form.joinMediumOther} onChange={(e) => update('joinMediumOther', e.target.value)} placeholder={t('ph-joinMedium-other')} />
                  </div>
                )}
              </div>
            )}

            {step === 4 && (
              <div className="form-grid">
                <div className="field full review-box">
                  <div className="review-title">{lang === 'en' ? 'Please review before submitting' : 'સબમિટ કરતા પહેલા ચકાસો'}</div>
                  <div className="review-grid">
                    <div><strong>{t('lbl-name')}:</strong> {form.name || '—'}</div>
                    <div><strong>{t('lbl-age')}:</strong> {form.age || '—'}</div>
                    <div><strong>{t('lbl-phone')}:</strong> {form.phone || '—'}</div>
                    <div><strong>{t('lbl-email')}:</strong> {form.email || '—'}</div>
                    <div><strong>{t('lbl-location')}:</strong> {form.location === OTHER_VALUE ? form.locationOther : labelFor(form.location, 'location') || '—'}</div>
                    <div><strong>{t('lbl-interest')}:</strong> {(form.interest === OTHER_VALUE ? form.interestOther : labelFor(form.interest, 'interest')) || '—'}</div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="wizard-nav">
        {step > 0 && (
          <button type="button" className="btn btn-outline" onClick={goBack}>← {lang === 'en' ? 'Back' : 'પાછળ'}</button>
        )}
        <div style={{ flex: 1 }} />
        {step < stepLabels.length - 1 && (
          <MagneticButton type="button" className="btn btn-glow" onClick={goNext}>
            {lang === 'en' ? 'Next' : 'આગળ'} →
          </MagneticButton>
        )}
        {step === stepLabels.length - 1 && (
          <MagneticButton type="button" className="btn btn-glow btn-block-mobile" onClick={handleSubmit} disabled={submitting}>
            {submitting ? <span className="spinner" /> : t('btn-submit')}
          </MagneticButton>
        )}
      </div>
    </div>
  );
}
