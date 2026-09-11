import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../i18n/I18nContext';
import { useSettings } from '../../context/SettingsContext';
import LanguageSwitcher from '../LanguageSwitcher';
import ScrollProgressBar from '../ScrollProgressBar';
import './admin.css';

function NavItem({ to, children }) {
  return (
    <NavLink to={to} end className={({ isActive }) => (isActive ? 'active' : '')}>
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              className="admin-nav-pill"
              layoutId="admin-nav-pill"
              style={{ inset: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            />
          )}
          <span style={{ position: 'relative', zIndex: 1 }}>{children}</span>
        </>
      )}
    </NavLink>
  );
}

export default function AdminLayout() {
  const { logout, username } = useAuth();
  const { t } = useTranslation();
  const { eventYear } = useSettings();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/admin/login');
  }

  return (
    <div className="admin-shell">
      <ScrollProgressBar />
      <header className="admin-topbar">
        <Link to="/register" className="admin-topbar-brand admin-topbar-brand-link" title={t('admin-back-to-site')}>
          🕉️ {t('nav-brand', { year: eventYear })} — Admin
        </Link>
        <nav className="admin-topbar-nav">
          <Link to="/register" className="admin-nav-home">🏠 {t('admin-back-to-site')}</Link>
          <NavItem to="/admin/dashboard">{t('admin-nav-dashboard')}</NavItem>
          <NavItem to="/admin/audit-log">{t('admin-nav-audit')}</NavItem>
          <NavItem to="/admin/custom-email">{t('admin-nav-email')}</NavItem>
          <NavItem to="/admin/settings">{t('admin-nav-settings')}</NavItem>
          <LanguageSwitcher />
          <motion.button type="button" onClick={handleLogout} title={username || ''} whileTap={{ scale: 0.94 }}>
            {t('admin-nav-logout')}
          </motion.button>
        </nav>
      </header>
      <motion.main
        className="admin-main"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Outlet />
      </motion.main>
    </div>
  );
}
