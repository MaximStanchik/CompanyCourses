import React from 'react';
import { useHistory } from 'react-router-dom';
import i18n from '../i18n';

const TermsOfService = () => {
  const history = useHistory();
  const t = i18n.t.bind(i18n);

  const languages = [
    { code: 'en', label: 'EN' },
    { code: 'ru', label: 'RU' },
    { code: 'de', label: 'DE' },
    { code: 'es', label: 'ES' },
    { code: 'pt', label: 'PT' },
    { code: 'uk', label: 'UK' },
    { code: 'zh', label: 'ZH' },
    { code: 'be', label: 'BE' },
  ];

  const handleBack = () => {
    history.goBack();
  };

  const changeLang = (e) => {
    const code = e.target.value;
    i18n.changeLanguage(code);
    localStorage.setItem('language', code);
    console.log('Language changed to:', code);
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  const currentLangCode = localStorage.getItem('language') || 'en';

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <style>{`
        .terms-content h1, .terms-content h2 {
          font-size: 21px !important;
          margin-top: 2rem;
          margin-bottom: 1rem;
        }
        .terms-content h3 {
          font-size: 18px !important;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
        }
        .terms-content p {
          font-size: 1.1rem;
          line-height: 1.6;
          margin-bottom: 1rem;
        }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '21px', margin: 0 }}>{t('terms.title') || 'Terms of Service'}</h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select
            aria-label="Select language"
            style={{
              padding: '0.4rem 1rem',
              borderRadius: '20px',
              border: '1px solid rgb(0, 123, 255)',
              background: 'white',
              color: 'rgb(0, 123, 255)',
              fontWeight: 'bold',
              cursor: 'pointer',
              marginRight: '10px',
              fontSize: '1rem'
            }}
            value={currentLangCode}
            onChange={changeLang}
          >
            {languages.map(lang => (
              <option key={lang.code} value={lang.code}>{lang.label}</option>
            ))}
          </select>

          <button
            onClick={handleBack}
            style={{
              padding: '0.5rem 1.5rem',
              backgroundColor: 'rgb(0, 123, 255)',
              color: 'white',
              border: 'none',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '1rem',
              transition: '0.3s',
              transform: 'translateY(0px)',
              boxShadow: 'none'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            {t('about_us.back') || 'Back to Home'}
          </button>
        </div>
      </div>

      <div className="terms-content" style={{ marginTop: '1.5rem' }}
        dangerouslySetInnerHTML={{ __html: t('terms.content') || '<p>No terms content available.</p>' }}
      />
    </div>
  );
};

export default TermsOfService;
