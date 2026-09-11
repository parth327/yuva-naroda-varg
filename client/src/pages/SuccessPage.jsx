import { useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from '../i18n/I18nContext';
import { useSettings } from '../context/SettingsContext';
import ParticleBackground from '../components/ParticleBackground';

export default function SuccessPage() {
  const { t } = useTranslation();
  const { eventYear } = useSettings();
  const location = useLocation();
  const name = location.state?.name || '';
  const fireworksRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => fireworksRef.current?.(), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <ParticleBackground fireworksRef={fireworksRef} />
      <div className="container" style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', minHeight: '90vh' }}>
        <motion.div
          className="card text-center"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ width: '100%' }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 12, delay: 0.2 }}
            style={{ fontSize: 56, marginBottom: 8 }}
          >
            ✅
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            {name ? t('success-title', { name }) : t('success-title-noname')}
          </motion.h1>
          <motion.p
            className="subtitle"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{ color: 'var(--text-light)' }}
          >
            {t('success-body', { year: eventYear })}
          </motion.p>
          <div style={{ marginTop: 20 }}>
            <Link to="/register" className="btn">{t('success-register-another')}</Link>
          </div>
        </motion.div>
      </div>
    </>
  );
}
