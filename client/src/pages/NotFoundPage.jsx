import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from '../i18n/I18nContext';

export default function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="container" style={{ display: 'flex', alignItems: 'center', minHeight: '90vh' }}>
      <motion.div
        className="card text-center"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ width: '100%' }}
      >
        <div style={{ fontSize: 48 }}>🧭</div>
        <h1>{t('not-found-title')}</h1>
        <p style={{ color: 'var(--text-light)' }}>{t('not-found-body')}</p>
        <Link to="/register" className="btn">{t('not-found-home')}</Link>
      </motion.div>
    </div>
  );
}
