import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from '../../i18n/I18nContext';
import Tilt3D from '../../components/Tilt3D';

function Row({ label, value, index }) {
  if (!value) return null;
  return (
    <motion.div
      style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <div style={{ fontWeight: 700, minWidth: 140, color: 'var(--text-light)' }}>{label}</div>
      <div>{value}</div>
    </motion.div>
  );
}

export default function RecordViewPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const [record, setRecord] = useState(null);

  useEffect(() => {
    fetch(`/api/admin/records/${id}`).then((r) => r.json()).then(setRecord);
  }, [id]);

  if (!record) return <p>…</p>;

  const rows = [
    [t('lbl-age'), record.age],
    [t('lbl-phone'), record.phone],
    [t('lbl-whatsapp'), record.whatsapp],
    [t('lbl-email'), record.email],
    [t('lbl-location'), record.location === 'અન્ય' ? record.locationOther : record.location],
    [t('lbl-pincode'), record.pincode],
    [t('lbl-houseNumber'), record.houseNumber],
    [t('lbl-society'), record.society],
    [t('lbl-landmark'), record.landmark],
    [t('lbl-education'), record.education],
    [t('lbl-interest'), record.interest === 'અન્ય' ? record.interestOther : record.interest],
    ['Notes', record.notes],
  ];

  return (
    <motion.div className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: 560 }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
        <Tilt3D maxTilt={20} glare={false} style={{ width: 72, height: 72, borderRadius: '50%' }}>
          {record.photoUrl ? (
            <img src={record.photoUrl} alt={record.name} style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>👤</div>
          )}
        </Tilt3D>
        <div>
          <h2 style={{ margin: 0 }}>{record.name}</h2>
          <div style={{ color: 'var(--text-light)', fontSize: 13 }}>{record.id}</div>
        </div>
      </div>

      {rows.map(([label, value], i) => <Row key={label} label={label} value={value} index={i} />)}

      <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
        <Link className="btn btn-outline" to="/admin/dashboard">← Back</Link>
        <Link className="btn" to={`/admin/records/${record.id}/edit`}>{t('admin-btn-edit')}</Link>
      </div>
    </motion.div>
  );
}
