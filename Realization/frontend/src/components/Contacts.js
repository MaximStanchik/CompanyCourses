import React, { useState, useEffect } from 'react';
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

const Contacts = () => {
  const t = i18n.t.bind(i18n);
  const [lang, setLang] = useState(localStorage.getItem('language') || i18n.language || 'en');
  const [theme, setTheme] = useState(null); // null=auto, 'dark', 'light'
  const prefersDark = usePrefersDark();
  const dark = theme ? theme === 'dark' : prefersDark;

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

  const linkStyle = (color) => ({
    color: color,
    textDecoration: 'none',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    transition: 'transform 0.2s',
    width: '120px',
    fontSize: '14px',
  });

  return (
    <div style={{ background: pageBg, minHeight: '100vh', padding: '40px 0' }}>
      <div className="container" style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 24, gap: 10 }}>
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
            {langOptions.map(l => (
              <option key={l.code} value={l.code}>{l.label}</option>
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
            onClick={() => window.history.back()}
          >
            {t('contacts.back')}
          </button>
        </div>
        <div style={{ background: formBg, borderRadius: 16, boxShadow: dark ? '0 2px 8px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.04)', padding: 32 }}>
          <h1 style={{ fontSize: '2rem', margin: 0, color: dark ? '#eaf4fd' : '#3976a8' }}>{t('contacts.title')}</h1>
          <h2 style={{ fontSize: '21px', fontWeight: 'bold', color: dark ? '#eaf4fd' : '#3976a8', borderBottom: `2px solid ${borderColor}`, paddingBottom: '10px', marginBottom: '20px' }}>
            {t('contacts.get_in_touch')}
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '30px' }}>
            <div style={{ flex: 1, minWidth: '300px', backgroundColor: fieldBg, padding: '20px', borderRadius: '8px', boxShadow: dark ? '0 2px 5px rgba(0,0,0,0.18)' : '0 2px 5px rgba(0,0,0,0.08)' }}>
              <h3 style={{ fontSize: '21px', fontWeight: 'bold', color: dark ? '#eaf4fd' : '#3976a8', marginBottom: '15px' }}>{t('contacts.contact_information')}</h3>
              <div style={{ margin: '10px 0 0 0', color: fieldColor }}>
                <div style={{ fontWeight: 'bold' }}>{t('contacts.email')}:</div>
                <a href="mailto:maximpetrov420@gmail.com" style={linkStyle('#3976a8')}>{t('contacts.email_address')}</a>
              </div>
              <div style={{ margin: '10px 0 0 0', color: fieldColor }}>
                <div style={{ fontWeight: 'bold' }}>{t('contacts.phone')}:</div>
                <a href="tel:+375298367670" style={linkStyle('#3976a8')}>{t('contacts.phone_number')}</a>
              </div>
              <div style={{ margin: '10px 0 0 0', color: fieldColor }}>
                <div style={{ fontWeight: 'bold' }}>{t('contacts.address')}:</div>
                {t('contacts.address_details')}
              </div>
            </div>
            <div style={{ flex: 1, minWidth: '300px', backgroundColor: fieldBg, padding: '20px', borderRadius: '8px', boxShadow: dark ? '0 2px 5px rgba(0,0,0,0.18)' : '0 2px 5px rgba(0,0,0,0.08)' }}>
              <h3 style={{ fontSize: '21px', fontWeight: 'bold', color: dark ? '#eaf4fd' : '#3976a8', marginBottom: '15px' }}>{t('contacts.social_media')}</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'center' }}>
                <a href="https://t.me/MindForgeTg" style={linkStyle('#0088cc')}>📩 Telegram</a>
                <a href="https://www.instagram.com/mindforgeinst?igsh=cTA3ZGJvYXViczI0&utm_source=qr" style={linkStyle('#E4405F')}>📷 Instagram</a>
                <a href="https://www.youtube.com/@MindForgeCourses" style={linkStyle('#FF0000')}>▶️ YouTube</a>
                <a href="https://www.facebook.com/people/Maxim-Stanchik/pfbid02Y1WG5UGoTxtVfNevB32LeUTdtPD7mxVQoZ4dGKYGeZ4es5n9aRm9j4qaXY4yxvVBl/" style={linkStyle('#1877F2')}>📘 Facebook</a>
                <a href="https://www.linkedin.com/company/mindforgeln/?viewAsMember=true" style={linkStyle('#0A66C2')}>💼 LinkedIn</a>
                <a href="https://x.com/MaximStanchik" style={linkStyle('#1DA1F2')}>🐦 X (Twitter)</a>
              </div>
            </div>
          </div>
          <div style={{ marginBottom: '30px', backgroundColor: fieldBg, padding: '20px', borderRadius: '8px', boxShadow: dark ? '0 2px 5px rgba(0,0,0,0.18)' : '0 2px 5px rgba(0,0,0,0.08)' }}>
            <h2 style={{ fontSize: '21px', fontWeight: 'bold', color: dark ? '#eaf4fd' : '#3976a8', marginBottom: '15px' }}>{t('contacts.our_location')}</h2>
            <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '8px', height: '300px' }}>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3068.857282982839!2d-75.5491806846236!3d39.74671297944709!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c70f2e2e2e2e2e%3A0x2e2e2e2e2e2e2e2e!2s1201%20N%20Orange%20St%2C%20Wilmington%2C%20DE%2019801%2C%20USA!5e0!3m2!1sen!2sus!4v1680000000000!5m2!1sen!2sus"
                width="100%"
                height="300"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contacts;
