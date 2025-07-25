import React, { useState, useEffect } from 'react';
import i18n from '../i18n';

const langOptions = [
  { value: 'en', label: 'EN' },
  { value: 'ru', label: 'RU' },
  { value: 'de', label: 'DE' },
  { value: 'es', label: 'ES' },
  { value: 'pt', label: 'PT' },
  { value: 'uk', label: 'UK' },
  { value: 'zh', label: 'ZH' },
  { value: 'be', label: 'BE' },
];

function usePrefersDark() {
  const [dark, setDark] = useState(() => window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = e => setDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return dark;
}

const About = () => {
  const t = i18n.t.bind(i18n);
  const [lang, setLang] = useState(localStorage.getItem('language') || 'en');
  const [theme, setTheme] = useState(null); // null=auto, 'dark', 'light'
  const prefersDark = usePrefersDark();
  const dark = theme ? theme === 'dark' : prefersDark;

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) setTheme(savedTheme);
  }, []);
  useEffect(() => {
    if (theme) localStorage.setItem('theme', theme);
    // Set data-theme on body for dark mode CSS
    document.body.setAttribute('data-theme', dark ? 'dark' : 'light');
  }, [theme, dark]);

  const formBg = dark ? '#26272b' : '#fff';
  const pageBg = dark ? '#18191c' : '#f6f7fa';
  const fieldBg = dark ? '#213747' : '#f9fafd';
  const fieldColor = dark ? '#eaf4fd' : '#23272f';
  const borderColor = dark ? '#36607e' : '#e0e0e0';
  const titleColor = dark ? '#f3f6fa' : '#3976a8';

  return (
    <div style={{ background: pageBg, minHeight: '100vh', padding: '40px 0' }}>
      <div className="container" style={{ maxWidth: 800, margin: '0 auto' }}>
        <style>{`
          body[data-theme='dark'] .about-content h1,
          body[data-theme='dark'] .about-content h2,
          body[data-theme='dark'] .about-content h3,
          body[data-theme='dark'] .about-content h4,
          body[data-theme='dark'] .about-content h5,
          body[data-theme='dark'] .about-content h6 {
            color: #fff !important;
          }
          body[data-theme='dark'] .about-content {
            color: #eaf4fd !important;
          }
        `}</style>
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 24, gap: 10 }}>
          <select
            aria-label="Select language"
            style={{ padding: '0.4rem 1rem', borderRadius: 20, border: `1px solid ${borderColor}`, background: fieldBg, color: dark ? '#eaf4fd' : '#3976a8', fontWeight: 'bold', cursor: 'pointer', marginRight: 0, fontSize: '1rem' }}
            value={lang}
            onChange={e => { setLang(e.target.value); localStorage.setItem('language', e.target.value); window.location.reload(); }}
          >
            {langOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: dark ? '#ffe082' : '#222', marginLeft: 0, transition: 'all 0.1s ease', fontFamily: 'Nunito' }}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {dark ? '☀️' : '🌙'}
          </button>
          <button
            style={{ padding: '0.5rem 1.5rem', backgroundColor: '#3976a8', color: '#fff', border: 'none', borderRadius: 20, cursor: 'pointer', fontSize: '1rem', transition: '0.3s', transform: 'translateY(0px)', boxShadow: 'none' }}
            onClick={() => window.history.back()}
          >
            {t('about_us.back')}
          </button>
        </div>
        <div style={{ background: formBg, borderRadius: 16, boxShadow: dark ? '0 2px 8px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.04)', padding: 32 }}>
          <h1 style={{ fontSize: '2rem', margin: 0, color: titleColor }}>{t('about_us.title')}</h1>
          <div className="about-content" style={{ marginTop: '1.5rem', fontSize: '1.1rem', lineHeight: '1.6', color: fieldColor }}
            dangerouslySetInnerHTML={{ __html: t('about_us.content') }} />
        </div>
      </div>
    </div>
  );
};

export default About; 