import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../../i18n/I18nContext';

export default function DeleteConfirmModal({ open, name, onCancel, onConfirm, busy }) {
  const { t } = useTranslation();
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="admin-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
        >
          <motion.div
            className="admin-modal"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 8px' }}>{t('admin-delete-confirm-title')}</h3>
            <p style={{ margin: 0, color: 'var(--text-light)' }}>
              {name ? `${name} — ` : ''}{t('admin-delete-confirm-body')}
            </p>
            <div className="admin-modal-actions">
              <button type="button" className="btn btn-outline" onClick={onCancel} disabled={busy}>
                {t('admin-cancel')}
              </button>
              <button type="button" className="btn btn-danger" onClick={onConfirm} disabled={busy}>
                {busy ? <span className="spinner" /> : t('admin-confirm-delete')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
