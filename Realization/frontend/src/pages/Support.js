import React, { useState, useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import i18n from '../i18n';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';

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
  const [lang, setLang] = useState(() => localStorage.getItem('language') || 'ru');
  const [theme, setTheme] = useState(null); // null=auto, 'dark', 'light'
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
      setTimeout(() => setEmojiAnim('in'), 200); // сбросить после анимации
    }
  }, [emojiPicker.visible]);

  const handleSelectEmoji = (emojiObj) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = message.slice(0, start) + emojiObj.native + message.slice(end);
    setMessage(newValue);
    // Не закрываем меню! Просто фокусируем textarea
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

  // sync language globally without reload
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
      const res = await fetch('/api/send-email', {
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
        setSuccess(t('support.messageSentSuccess') || 'Сообщение успешно отправлено!');
        setMessage('');
      } else {
        setError(t('support.messageSendFailed') || 'Ошибка отправки сообщения.');
      }
    } catch (err) {
      setError(t('support.messageSendFailed') || 'Ошибка отправки сообщения.');
    } finally {
      setLoading(false);
    }
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
            {dark ? (t('navbar.light_mode') || 'Светлая тема') : (t('navbar.dark_mode') || 'Тёмная тема')}
          </button>
          <button
            style={{ padding: '0.5rem 1.5rem', backgroundColor: '#3976a8', color: '#fff', border: 'none', borderRadius: 20, cursor: 'pointer', fontSize: '1rem', transition: '0.3s', transform: 'translateY(0px)', boxShadow: 'none' }}
            onClick={() => history.goBack()}
          >
            {t('reviews.back') || 'Назад'}
          </button>
        </div>
        <div style={{ background: formBg, borderRadius: 16, boxShadow: dark ? '0 2px 8px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.04)', padding: 32, margin: '0 auto', maxWidth: 520 }}>
          <h2 style={{ fontWeight: 700, fontSize: 24, marginBottom: 18, color: dark ? '#eaf4fd' : '#3976a8' }}>{t('support.title') || 'Поддержка'}</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 18, position: 'relative' }}>
              <textarea
                ref={textareaRef}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder={t('support.placeholder') || 'Опишите вашу проблему или вопрос...'}
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
                {loading ? (t('support.sending') || 'Отправка...') : (t('support.send') || 'Отправить')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
