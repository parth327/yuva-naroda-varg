import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '../../i18n/I18nContext';

export default function AuditLogPage() {
  const { t } = useTranslation();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/audit-log')
      .then((r) => r.json())
      .then(setEntries)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="admin-page-title">{t('admin-audit-title')}</h1>
      <div className="card" style={{ padding: 0 }}>
        {loading && <p style={{ padding: 20 }}>…</p>}
        {!loading && entries.length === 0 && <p style={{ padding: 20, color: 'var(--text-light)' }}>—</p>}
        {entries.map((e, i) => (
          <motion.div key={e.id} className="admin-audit-item" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i, 20) * 0.02 }}>
            <div><strong>{e.admin_username}</strong> · {e.action} · {e.entity_type}{e.entity_id ? ` (${e.entity_id})` : ''}</div>
            {e.details && <div>{e.details}</div>}
            <div className="admin-audit-meta">{new Date(e.created_at).toLocaleString()}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
