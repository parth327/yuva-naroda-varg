import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from '../../i18n/I18nContext';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import DeleteConfirmModal from '../../components/admin/DeleteConfirmModal';
import AnimatedCounter from '../../components/AnimatedCounter';
import MagneticButton from '../../components/MagneticButton';

export default function DashboardPage() {
  const { t } = useTranslation();
  const { minAge, maxAge } = useSettings();
  const { showToast } = useToast();
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [filteredTotal, setFilteredTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback((p = 1, q = search) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p) });
    if (q) params.set('search', q);
    fetch(`/api/admin/records?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setRecords(data.records || []);
        setTotal(data.total || 0);
        setFilteredTotal(data.filteredTotal || 0);
        setPage(data.page || 1);
        setTotalPages(data.totalPages || 1);
      })
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { load(1, ''); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSearchSubmit(e) {
    e.preventDefault();
    load(1, search);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch(`/api/admin/records/${deleteTarget.id}`, { method: 'DELETE' });
      showToast(`${deleteTarget.name} deleted.`, 'success');
      setDeleteTarget(null);
      load(page, search);
    } catch {
      showToast('Failed to delete record.', 'error');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <h1 className="admin-page-title">{t('admin-dashboard-title')}</h1>

      <div className="admin-stat-row">
        <motion.div className="admin-stat-card" whileHover={{ y: -4, boxShadow: '0 14px 30px rgba(179,54,0,0.16)' }}>
          <div className="num"><AnimatedCounter value={total} /></div>
          <div className="label">{t('admin-total-registered')}</div>
        </motion.div>
        <motion.div className="admin-stat-card" whileHover={{ y: -4, boxShadow: '0 14px 30px rgba(179,54,0,0.16)' }}>
          <div className="num"><AnimatedCounter value={filteredTotal} /></div>
          <div className="label">{t('admin-filtered-shown')}</div>
        </motion.div>
        <motion.div className="admin-stat-card" whileHover={{ y: -4, boxShadow: '0 14px 30px rgba(179,54,0,0.16)' }}>
          <div className="num">{minAge}–{maxAge}</div>
          <div className="label">Age range</div>
        </motion.div>
      </div>

      <form className="admin-toolbar" onSubmit={handleSearchSubmit}>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('admin-search-placeholder')}
        />
        <MagneticButton type="submit" className="btn btn-sm" strength={0.5}>🔍</MagneticButton>
        <a className="btn btn-sm btn-secondary" href="/api/admin/export">{t('admin-btn-export')} (Excel)</a>
        <a className="btn btn-sm btn-secondary" href="/api/admin/export?format=csv">{t('admin-btn-export')} (CSV)</a>
      </form>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t('lbl-name')}</th>
              <th>{t('lbl-age')}</th>
              <th>{t('lbl-phone')}</th>
              <th>{t('lbl-location')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading && Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                <td colSpan={5} style={{ padding: '14px' }}><div className="admin-skeleton-row" /></td>
              </tr>
            ))}
            {!loading && records.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--text-light)' }}>—</td></tr>
            )}
            {!loading && records.map((r, i) => (
              <motion.tr
                key={r.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 15) * 0.02 }}
              >
                <td>{r.name}</td>
                <td>{r.age}</td>
                <td>{r.phone}</td>
                <td>{r.location === 'અન્ય' ? r.locationOther || r.location : r.location}</td>
                <td>
                  <div className="admin-row-actions">
                    <Link className="btn btn-sm btn-outline" to={`/admin/records/${r.id}`}>{t('admin-btn-view')}</Link>
                    <Link className="btn btn-sm btn-outline" to={`/admin/records/${r.id}/edit`}>{t('admin-btn-edit')}</Link>
                    <button className="btn btn-sm btn-danger" onClick={() => setDeleteTarget(r)}>{t('admin-btn-delete')}</button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="admin-pagination">
          <button className="btn btn-sm btn-outline" disabled={page <= 1} onClick={() => load(page - 1)}>←</button>
          <span>{page} / {totalPages}</span>
          <button className="btn btn-sm btn-outline" disabled={page >= totalPages} onClick={() => load(page + 1)}>→</button>
        </div>
      )}

      <DeleteConfirmModal
        open={!!deleteTarget}
        name={deleteTarget?.name}
        busy={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
