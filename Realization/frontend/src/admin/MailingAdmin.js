import React from 'react';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import TeachNavMenu from './TeachNavMenu';
import { useTranslation } from 'react-i18next';

const MailingAdmin = () => {
  const { t } = useTranslation();
  return (
    <div style={{ minHeight: '100vh', background: 'var(--teach-bg)', color: 'var(--teach-fg)', display: 'flex', flexDirection: 'column' }}>
      <NavBar />
      <div style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - 60px)' }}>
        <TeachNavMenu variant="teach" />
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: 32, marginTop: 24 }}>
          <h1 style={{ fontWeight: 700, fontSize: 32, marginBottom: 16, color: 'var(--text-color)' }}>{t('teach.mailing')}</h1>
          <div style={{ color: 'var(--text-color)', fontSize: 18, marginBottom: 24, maxWidth: 600, textAlign: 'left', lineHeight: 1.6 }}>
            {t('teach.mailing_description')}<br /><br />{t('teach.mailing_hint')}
          </div>
          <a href="/teach/mailing/new" className="button success is-outlined" style={{
            padding: '10px 22px',
            borderRadius: 6,
            background: 'var(--teach-btn-bg)',
            color: 'var(--teach-btn-fg)',
            border: '1.5px solid var(--border-color)',
            fontWeight: 600,
            fontSize: 16,
            textDecoration: 'none',
            transition: 'background 0.2s, color 0.2s',
            marginBottom: 24
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', marginRight: 10 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            </span>
            <span>{t('teach.new_mailing')}</span>
          </a>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default MailingAdmin; 