import React, { useState, useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import i18n from '../i18n';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQuestion } from '@fortawesome/free-solid-svg-icons';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';

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

export default function Support() {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [lang, setLang] = useState(() => localStorage.getItem('language') || 'ru');
  const [theme, setTheme] = useState(null);
  const prefersDark = usePrefersDark();
  const dark = theme ? theme === 'dark' : prefersDark;
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const history = useHistory();
  const t = i18n.t.bind(i18n);
  const textareaRef = useRef();
  const [emojiPicker, setEmojiPicker] = useState({ visible: false, x: 0, y: 0 });
  const emojiPickerRef = useRef(null);
  const [emojiAnim, setEmojiAnim] = useState('in');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) setTheme(savedTheme);
  }, []);
  useEffect(() => {
    if (theme) localStorage.setItem('theme', theme);
    document.body.setAttribute('data-theme', dark ? 'dark' : 'light');
  }, [theme, dark]);

  useEffect(() => {
    if (!emojiPicker.visible) return;
    const handleClick = (e) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setEmojiPicker(c => ({ ...c, visible: false }));
      }
    };
    window.addEventListener('mousedown', handleClick);
    return () => window.removeEventListener('mousedown', handleClick);
  }, [emojiPicker.visible]);

  useEffect(() => {
    if (emojiPicker.visible) {
      setEmojiAnim('in');
    } else if (emojiAnim === 'in') {
      setEmojiAnim('out');
      setTimeout(() => setEmojiAnim('in'), 200); 
    }
  }, [emojiPicker.visible]);

  const handleSelectEmoji = (emojiObj) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = message.slice(0, start) + emojiObj.native + message.slice(end);
    setMessage(newValue);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + emojiObj.native.length, start + emojiObj.native.length);
    }, 0);
  };

  const formBg = dark ? 'rgba(38,39,43,0.9)' : 'rgba(255,255,255,0.9)';
  const pageBg = dark ? 'linear-gradient(135deg,#18191c 0%,#23272f 100%)' : 'linear-gradient(135deg,#e0eafc 0%,#f3f7fc 100%)';
  const fieldBg = dark ? '#213747' : '#f9fafd';
  const fieldColor = dark ? '#ddd' : '#222';
  const borderColor = dark ? '#36607e' : '#e0e0e0';

  useEffect(() => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  }, [lang]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setSuccess(null);
    setError(null);
    try {
      const token = localStorage.getItem('jwtToken');
      const res = await fetch('https://localhost:9000/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          subject: 'Support Message from User',
          text: message,
        }),
      });
      if (res.ok) {
        setSuccess(t('support.messageSentSuccess'));
        setMessage('');
      } else {
        setError(t('support.messageSendFailed'));
      }
    } catch (err) {
      setError(t('support.messageSendFailed'));
    } finally {
      setLoading(false);
    }
  }

  // Authentication check
  if (!isAuthenticated) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: dark ? '#1a1a1a' : '#f8f9fa',
        color: dark ? '#ffffff' : '#333333'
      }}>
        <NavBar />
        
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          padding: '40px 20px',
          minHeight: 'calc(100vh - 200px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* Заголовок страницы */}
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '40px' 
          }}>
            <h1 style={{ 
              fontSize: '2.5rem', 
              fontWeight: '700', 
              marginBottom: '10px',
              color: dark ? '#ffffff' : '#333333'
            }}>
              {t('support.title')}
            </h1>
          </div>

          <div style={{ 
            textAlign: 'center', 
            padding: '60px 20px',
            background: dark ? '#2d2d2d' : '#ffffff',
            borderRadius: '12px',
            border: `1px solid ${dark ? '#404040' : '#e9ecef'}`,
            maxWidth: '500px'
          }}>
            <FontAwesomeIcon 
              icon={faQuestion} 
              style={{ 
                fontSize: '3rem', 
                color: '#6c757d', 
                marginBottom: '20px' 
              }} 
            />
            <h3 style={{ 
              fontSize: '1.3rem', 
              fontWeight: '600', 
              marginBottom: '10px',
              color: dark ? '#ffffff' : '#333333'
            }}>
              {t('auth.login_required')}
            </h3>
            <p style={{ 
              color: dark ? '#cccccc' : '#666666',
              marginBottom: '30px',
              fontSize: '1rem',
              lineHeight: '1.6',
              maxWidth: '400px'
            }}>
              {t('support.login_to_contact_description')}
            </p>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: '15px',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => history.push('/login')}
                style={{
                  padding: '12px 24px',
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.target.style.background = '#0056b3'}
                onMouseOut={(e) => e.target.style.background = '#007bff'}
              >
                {t('auth.login')}
              </button>
              <button
                onClick={() => history.push('/register')}
                style={{
                  padding: '12px 24px',
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.target.style.background = '#218838'}
                onMouseOut={(e) => e.target.style.background = '#28a745'}
              >
                {t('auth.register')}
              </button>
            </div>
          </div>
        </div>
        
        <Footer />
      </div>
    );
  }

  return (
    <div style={{ background: pageBg, minHeight: '100vh', padding: '40px 0' }}>
      <div className="container" style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 24, gap: 10 }}>
          <select
            aria-label="Select language"
            style={{ padding: '0.4rem 1rem', borderRadius: 20, border: `1px solid ${borderColor}`, background: fieldBg, color: dark ? '#eaf4fd' : '#3976a8', fontWeight: 'bold', cursor: 'pointer', marginRight: 10, fontSize: '1rem' }}
            value={lang}
            onChange={e => setLang(e.target.value)}
          >
            {langOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            style={{ padding: '0.5rem 1.5rem', backgroundColor: '#3976a8', color: '#fff', border: 'none', borderRadius: 20, cursor: 'pointer', fontSize: '1rem', transition: 'background 0.2s', fontWeight: 600 }}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {dark ? (t('navbar.light_mode') ) : (t('navbar.dark_mode'))}
          </button>
          <button
            style={{ padding: '0.5rem 1.5rem', backgroundColor: '#3976a8', color: '#fff', border: 'none', borderRadius: 20, cursor: 'pointer', fontSize: '1rem', transition: '0.3s', transform: 'translateY(0px)', boxShadow: 'none' }}
            onClick={() => history.goBack()}
          >
            {t('reviews.back') || 'Назад'}
          </button>
        </div>
        <div style={{ background: formBg, borderRadius: 16, boxShadow: dark ? '0 2px 8px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.04)', padding: 32, margin: '0 auto', maxWidth: 520 }}>
          <h2 style={{ fontWeight: 700, fontSize: 24, marginBottom: 18, color: dark ? '#eaf4fd' : '#3976a8' }}>{t('support.title')}</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 18, position: 'relative' }}>
              <textarea
                ref={textareaRef}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder={t('support.placeholder') }
                style={{ width: '100%', minHeight: 120, borderRadius: 12, border: `1.5px solid ${borderColor}`, background: fieldBg, color: fieldColor, fontSize: 17, padding: 16, resize: 'vertical', outline: 'none', boxShadow: 'none' }}
                maxLength={2000}
                disabled={loading}
              />
              <button type="button" style={{ position: 'absolute', right: 12, bottom: 12, background: 'none', border: 'none', fontSize: 26, cursor: 'pointer', color: '#fbc02d' }} onClick={e => {
                const rect = e.currentTarget.getBoundingClientRect();
                setEmojiPicker({ visible: true, x: rect.left, y: rect.bottom });
              }}>😊</button>
              {emojiPicker.visible && (
                <div ref={emojiPickerRef} className={`emoji-picker-anim emoji-picker-anim-${emojiAnim}`} style={{ position: 'fixed', top: emojiPicker.y, left: emojiPicker.x, zIndex: 10000 }}>
                  <Picker data={data} theme={dark ? 'dark' : 'light'} onEmojiSelect={handleSelectEmoji} searchPosition="top" previewPosition="none" skinTonePosition="search" />
                </div>
              )}
            </div>
            {success && <div style={{ color: '#27ae60', fontWeight: 500, marginBottom: 12 }}>{success}</div>}
            {error && <div style={{ color: '#e74c3c', fontWeight: 500, marginBottom: 12 }}>{error}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16 }}>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ minWidth: 160, height: 48, borderRadius: 24, fontSize: 17, fontWeight: 600, background: '#3976a8', color: '#fff', border: 'none', boxShadow: 'none', transition: 'background 0.18s' }}
                disabled={loading || !message.trim()}
              >
                {loading ? (t('support.sending') ) : (t('support.send'))}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
