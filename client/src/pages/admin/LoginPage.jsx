import { useState, useRef } from 'react';
import { useNavigate, Navigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../i18n/I18nContext';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import ParticleBackground from '../../components/ParticleBackground';
import Tilt3D from '../../components/Tilt3D';
import MagneticButton from '../../components/MagneticButton';
import '../../components/admin/admin.css';

export default function LoginPage() {
  const { isAdmin, login, checking } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const fireworksRef = useRef(null);

  if (!checking && isAdmin) {
    const dest = location.state?.from?.pathname || '/admin/dashboard';
    return <Navigate to={dest} replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login({ username, password });
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-login-wrap">
      <ParticleBackground fireworksRef={fireworksRef} />
      <div className="hero-mesh" aria-hidden="true" />
      <motion.div
        className="card admin-login-card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0, x: shake ? [0, -10, 10, -10, 10, 0] : 0 }}
        transition={{ duration: shake ? 0.5 : 0.4 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Link to="/register" className="admin-back-link">← {t('admin-back-to-site')}</Link>
          <LanguageSwitcher />
        </div>
        <Tilt3D className="admin-portrait-tilt" maxTilt={12}>
          <img src="/css/shivaji-maharaj-bg.jpg" alt="" style={{ width: '100%', display: 'block' }} />
        </Tilt3D>
        <h1 className="text-center" style={{ fontSize: 22 }}>{t('admin-login-title')}</h1>

        {error && (
          <motion.div className="alert alert-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="field" style={{ marginBottom: 16 }}>
            <label>{t('admin-lbl-username')}</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              autoFocus
              required
            />
          </div>
          <div className="field" style={{ marginBottom: 16 }}>
            <label>{t('admin-lbl-password')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <MagneticButton type="submit" className="btn btn-block" disabled={loading}>
            {loading ? <span className="spinner" /> : t('admin-btn-login')}
          </MagneticButton>
        </form>
      </motion.div>
    </div>
  );
}
