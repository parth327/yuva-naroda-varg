import { useRef } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '../i18n/I18nContext';
import { useSettings } from '../context/SettingsContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import ParticleBackground from '../components/ParticleBackground';
import AmbientAudioToggle from '../components/AmbientAudioToggle';
import ScrollProgressBar from '../components/ScrollProgressBar';
import ScrollToTopButton from '../components/ScrollToTopButton';
import Tilt3D from '../components/Tilt3D';
import FaqSection from '../components/FaqSection';
import RegistrationWizard from '../components/RegistrationWizard';
import './register.css';

const reveal = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

function Reveal({ children, ...props }) {
  return (
    <motion.div
      variants={reveal}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export default function RegisterPage() {
  const { t } = useTranslation();
  const { eventYear, minAge, maxAge } = useSettings();
  const fireworksRef = useRef(null);

  return (
    <>
      <ScrollProgressBar />
      <ParticleBackground fireworksRef={fireworksRef} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <nav className="ys-navbar">
          <div className="ys-nav-container">
            <a href="#top" className="ys-nav-brand">
              <img src="/img/ys-logo.png" alt="Logo" className="ys-nav-logo-img" />
              <span>{t('nav-brand', { year: eventYear })}</span>
            </a>
            <ul className="ys-nav-links">
              <li><a href="#top" className="ys-nav-link">{t('nav-home')}</a></li>
              <li><a href="#ys-mission" className="ys-nav-link">{t('nav-about')}</a></li>
              <li><a href="#ys-features" className="ys-nav-link">{t('nav-features')}</a></li>
              <li><a href="#ys-faq" className="ys-nav-link">FAQ</a></li>
              <li><a href="#regForm" className="ys-nav-register-btn">{t('nav-register')}</a></li>
              <li><a href="/admin/login" className="ys-nav-link">{t('nav-admin')}</a></li>
              <li><LanguageSwitcher /></li>
            </ul>
          </div>
        </nav>

        <a id="top" />

        <section className="ys-main-content" id="ys-features">
          <div className="ys-content-grid">
            <Reveal>
              <Tilt3D maxTilt={5} glare={false}>
                <div className="ys-section-card">
                  <h2 className="ys-card-heading">
                    <span className="ys-heading-highlight">{t('features-heading-highlight')}</span>
                    <span>{t('features-heading-text')}</span>
                  </h2>
                  <div className="ys-features-list">
                    {[1, 2, 3, 4].map((n) => (
                      <motion.div className="ys-feature-item" key={n} whileHover={{ x: 6 }}>
                        <div className={`ys-feature-icon-wrapper ys-${['orange', 'gold', 'green', 'blue'][n - 1]}-glow`}>
                          <span style={{ fontSize: 20 }}>{['💪', '🏆', '🔥', '🌱'][n - 1]}</span>
                        </div>
                        <div className="ys-feature-text">
                          <h3>{t(`feature-${n}-title`)}</h3>
                          <p>{t(`feature-${n}-desc`)}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </Tilt3D>
            </Reveal>
            <Reveal className="ys-right-panel" transition={{ delay: 0.15 }}>
              <Tilt3D maxTilt={14}>
                <div className="ys-image-3d">
                  <div className="ys-glowing-halo" />
                  <img src="/img/ys-bharat-mata.png" alt="Bharat Mata" className="ys-bharat-mata-img" />
                </div>
              </Tilt3D>
            </Reveal>
          </div>
        </section>

        <Reveal>
          <section className="ys-mission-section" id="ys-mission">
            <h2 className="ys-mission-heading">{t('mission-title')}</h2>
            <div className="ys-mission-grid">
              {[1, 2, 3].map((n) => (
                <motion.div
                  className="ys-mission-card"
                  key={n}
                  whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(179,54,0,0.18)' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <div className="ys-mission-icon">{['ॐ', '🪷', '🚩'][n - 1]}</div>
                  <h3>{t(`mission-${n}-title`)}</h3>
                  <p>{t(`mission-${n}-desc`)}</p>
                </motion.div>
              ))}
            </div>
          </section>
        </Reveal>

        <div className="container">
          <motion.div className="card wizard-card" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} id="regForm">
            <div className="form-hero">
              <h2 className="hero-badge">{t('reg-heading-badge')}</h2>
              <h1>{t('reg-heading-title', { year: eventYear })}</h1>
              <p className="subtitle">{t('reg-heading-subtitle-age', { minAge, maxAge })}</p>
              <p className="subtitle">{t('reg-heading-subtitle')}</p>
            </div>

            <RegistrationWizard />
          </motion.div>
        </div>

        <Reveal>
          <FaqSection />
        </Reveal>

        <footer className="ys-footer">
          <div className="ys-footer-pillars">
            <span>🚩 {t('footer-pillar-seva')}</span>
            <span className="ys-divider">|</span>
            <span>🪷 {t('footer-pillar-sanskar')}</span>
            <span className="ys-divider">|</span>
            <span>☀️ {t('footer-pillar-sangathan')}</span>
          </div>
          <p className="ys-copyright">{t('footer-copyright', { year: eventYear })}</p>
        </footer>

        <AmbientAudioToggle />
        <a href="#regForm" className="ys-fab-register">✍️ {t('nav-register')}</a>
        <ScrollToTopButton />
      </div>
    </>
  );
}
