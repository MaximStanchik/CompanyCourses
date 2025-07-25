import React from 'react';
import { Link } from 'react-router-dom';
import i18n from '../i18n';
import useTheme from '../hooks/useTheme';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTelegram,
  faInstagram,
  faYoutube,
  faFacebookF,
  faLinkedinIn,
  faXTwitter
} from '@fortawesome/free-brands-svg-icons';

const socialColors = {
  telegram: '#229ED9',
  instagram: '#E4405F',
  youtube: '#FF0000',
  facebook: '#1877F3',
  linkedin: '#0A66C2',
  x: '#1DA1F2'
};

const Footer = () => {
  const t = i18n.t.bind(i18n);
  const { theme } = useTheme();

  return (
    <footer style={{
      background: 'var(--footer-bg)',
      padding: '20px 0',
      width: '100%',
      marginBottom: 0,
      marginTop: 0,
      position: 'relative',
      bottom: 0
    }}>
      <div className="container" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 40,
          marginBottom: 20,
          textAlign: 'left'
        }}>
          {/* Legal Column */}
          <div style={{ minWidth: 180 }}>
            <small style={{ display: 'block', marginBottom: 8, color: 'var(--footer-fg)' }}>
              {t('footer.copyright')}
            </small>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 14 }}>
              <li><Link to="/privacy-policy" className="footer-link" style={{ color: 'var(--footer-link)', textDecoration: 'none' }}>{t('footer.privacy_policy')}</Link></li>
              <li><Link to="/license-agreement" className="footer-link" style={{ color: 'var(--footer-link)', textDecoration: 'none' }}>{t('footer.license_agreement')}</Link></li>
            </ul>
          </div>

          {/* Community Column */}
          <div style={{ minWidth: 140 }}>
            <h6 style={{ fontWeight: 600, marginBottom: 8, color: 'var(--footer-fg)' }}>{t('community.title')}</h6>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 14 }}>
              <li><Link to="/users" className="footer-link" style={{ color: 'var(--footer-link)', textDecoration: 'none' }}>{t('community.users')}</Link></li>
              <li><Link to="/articles" className="footer-link" style={{ color: 'var(--footer-link)', textDecoration: 'none' }}>{t('community.articles')}</Link></li>
              <li><Link to="/chat" className="footer-link" style={{ color: 'var(--footer-link)', textDecoration: 'none' }}>{t('community.chat')}</Link></li>
              {/* success stories and activities removed */}
            </ul>
          </div>

          {/* Company Column */}
          <div style={{ minWidth: 140 }}>
            <h6 style={{ fontWeight: 600, marginBottom: 8, color: 'var(--footer-fg)' }}>{t('company.title')}</h6>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 14 }}>
              <li><Link to="/about" className="footer-link" style={{ color: 'var(--footer-link)', textDecoration: 'none' }}>{t('company.about_us')}</Link></li>
              <li><Link to="/contacts" className="footer-link" style={{ color: 'var(--footer-link)', textDecoration: 'none' }}>{t('company.contacts')}</Link></li>
              <li><Link to="/reviews" className="footer-link" style={{ color: 'var(--footer-link)', textDecoration: 'none' }}>{t('company.reviews')}</Link></li>
              <li><Link to="/faq" className="footer-link" style={{ color: 'var(--footer-link)', textDecoration: 'none' }}>{t('company.faq')}</Link></li>
              <li><Link to="/support" className="footer-link" style={{ color: 'var(--footer-link)', textDecoration: 'none' }}>{t('company.support')}</Link></li>
            </ul>
          </div>

          {/* About Section */}
          <div style={{ flex: '1 1 300px', maxWidth: 360, textAlign: 'left' }}>
            <h5 style={{ fontWeight: 600, marginBottom: 8, color: 'var(--footer-fg)' }}>{t('footer.about_title')}</h5>
            <p style={{ fontSize: 14, color: 'var(--footer-muted)', marginBottom: 0, lineHeight: 1.5 }}>{t('footer.about_desc')}</p>

            {/* Subscribe and Social Icons */}
            <div style={{ marginTop: 20 }}>
              <p style={{ color: 'var(--footer-fg)', fontWeight: 'bold', marginBottom: 10 }}>{t('footer.subscribe')}</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 18 }}>
                <a href="https://t.me/MindForgeTg" target="_blank" rel="noopener noreferrer" style={{ color: socialColors.telegram, fontSize: '1.7em' }}><FontAwesomeIcon icon={faTelegram} /></a>
                <a href="https://www.instagram.com/mindforgeinst?igsh=cTA3ZGJvYXViczI0&utm_source=qr" target="_blank" rel="noopener noreferrer" style={{ color: socialColors.instagram, fontSize: '1.7em' }}><FontAwesomeIcon icon={faInstagram} /></a>
                <a href="https://www.youtube.com/@MindForgeCourses" target="_blank" rel="noopener noreferrer" style={{ color: socialColors.youtube, fontSize: '1.7em' }}><FontAwesomeIcon icon={faYoutube} /></a>
                <a href="https://www.facebook.com/profile.php?id=61577134992753" target="_blank" rel="noopener noreferrer" style={{ color: socialColors.facebook, fontSize: '1.7em' }}><FontAwesomeIcon icon={faFacebookF} /></a>
                <a href="https://www.linkedin.com/company/107700030/admin/page-posts/published/" target="_blank" rel="noopener noreferrer" style={{ color: socialColors.linkedin, fontSize: '1.7em' }}><FontAwesomeIcon icon={faLinkedinIn} /></a>
                <a href="https://x.com/MaximStanchik" target="_blank" rel="noopener noreferrer" style={{ color: socialColors.x, fontSize: '1.7em' }}><FontAwesomeIcon icon={faXTwitter} /></a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: 10 }}>
        <small style={{ color: 'var(--footer-fg)' }}>
          {t('footer.slogan')} 2025 MindForge
        </small>
      </div>
    </footer>
  );
};

export default Footer;
