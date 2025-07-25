import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import i18n from '../i18n';

const langOptions = [
  { code: 'en', label: 'EN' },
  { code: 'ru', label: 'RU' },
  { code: 'de', label: 'DE' },
  { code: 'es', label: 'ES' },
  { code: 'pt', label: 'PT' },
  { code: 'uk', label: 'UK' },
  { code: 'zh', label: 'ZH' },
  { code: 'be', label: 'BE' },
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

const Reviews = () => {
  const history = useHistory();
  const t = i18n.t.bind(i18n);
  const [lang, setLang] = useState(localStorage.getItem('language') || i18n.language || 'en');
  const [theme, setTheme] = useState(null); // null=auto, 'dark', 'light'
  const prefersDark = usePrefersDark();
  const dark = theme ? theme === 'dark' : prefersDark;
  const [translationError, setTranslationError] = useState('');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) setTheme(savedTheme);
  }, []);
  useEffect(() => {
    if (theme) localStorage.setItem('theme', theme);
  }, [theme]);

  const formBg = dark ? '#26272b' : '#fff';
  const pageBg = dark ? '#18191c' : '#f6f7fa';
  const fieldBg = dark ? '#213747' : '#f9fafd';
  const fieldColor = dark ? '#ddd' : '#222';
  const borderColor = dark ? '#36607e' : '#e0e0e0';

  const headingStyle = {
    fontSize: '21px',
    fontWeight: 'bold',
    marginTop: '1.5rem',
    marginBottom: '0.5rem',
    color: dark ? '#eaf4fd' : '#3976a8',
  };
  const textStyle = {
    fontSize: '14px',
    marginBottom: '1rem',
    lineHeight: '1.5',
    color: fieldColor,
  };

  return (
    <div style={{ background: pageBg, minHeight: '100vh', padding: '40px 0' }}>
      <div className="container" style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24, gap: 10 }}>
          <select
            aria-label="Select language"
            value={lang}
            onChange={e => { setLang(e.target.value); localStorage.setItem('language', e.target.value); window.location.reload(); }}
            style={{
              padding: '0.4rem 1rem',
              borderRadius: '20px',
              border: `1px solid ${borderColor}`,
              background: fieldBg,
              color: dark ? '#eaf4fd' : '#3976a8',
              fontWeight: 'bold',
              cursor: 'pointer',
              marginRight: 0,
              fontSize: '1rem',
            }}
          >
            {langOptions.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
          <button
            style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: dark ? '#ffe082' : '#222', marginLeft: 0, transition: 'all 0.1s ease', fontFamily: 'Nunito' }}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {dark ? '☀️' : '🌙'}
          </button>
          <button
            style={{
              padding: '0.5rem 1.5rem',
              backgroundColor: '#3976a8',
              color: '#fff',
              border: 'none',
              borderRadius: 20,
              cursor: 'pointer',
              fontSize: '1rem',
              transition: '0.3s',
              transform: 'translateY(0px)',
              boxShadow: 'none',
            }}
            onClick={() => history.goBack()}
          >
            {t('reviews.back')}
          </button>
        </div>
        {translationError && (
          <div style={{ color: 'red', marginBottom: '10px', fontSize: '14px' }}>
            {translationError} Using English as fallback.
          </div>
        )}
        <div style={{ background: formBg, borderRadius: 16, boxShadow: dark ? '0 2px 8px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.04)', padding: 32 }}>
          <div style={headingStyle}>{t('reviews.title')}</div>
          <div style={textStyle}>{t('reviews.description')}</div>
          <div style={headingStyle}>{t('reviews.help_title')}</div>
          <div style={textStyle}>{t('reviews.help_text')}</div>
          <div style={textStyle}>{t('reviews.support_text')}</div>
          <div style={textStyle}>{t('reviews.phone')}</div>
        </div>
      </div>
    </div>
  );
};

export default Reviews;
