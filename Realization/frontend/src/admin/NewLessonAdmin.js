import React, { useState } from 'react';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import TeachNavMenu from './TeachNavMenu';
import { useTranslation } from 'react-i18next';
import useTheme from '../hooks/useTheme';
import axios from '../utils/axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const NewLessonAdmin = () => {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const { theme } = useTheme();

  const handleCreate = async () => {
    if (!title.trim()) { setError(t('lesson.name_required','Название обязательно')); return; }
    if (title.trim().length > 64) { setError(t('lesson.max64','Максимум 64 символа')); return; }
    setError('');
    try {
      const res = await axios.post('/lessons', { title: title.trim() });
      if (res.data && res.data.id) {
        toast.success(t('lesson.create_success', 'Урок успешно создан!'), { autoClose: 1000 });
        setTimeout(() => {
          window.location.href = `/editlesson/${res.data.id}`;
        }, 1000);
      } else {
        toast.error(t('lesson.create_error', 'Ошибка при создании урока'));
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || t('lesson.create_error', 'Ошибка при создании урока'));
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--teach-bg)', color: 'var(--teach-fg)', display: 'flex', flexDirection: 'column' }}>
      <NavBar />
      <div style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - 60px)' }}>
        <TeachNavMenu variant="teach" />
        <main style={{ flex: 1, padding: 32 }}>
          <h1 style={{ fontWeight: 700, fontSize: 32, marginBottom: 24, color: theme === 'dark' ? '#fff' : '#23272f' }}>{t('lesson.create_title')}</h1>
          <div style={{ maxWidth: 540 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, color: theme === 'dark' ? '#fff' : '#23272f' }}>
              {t('lesson.name')}
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={64}
              placeholder={t('lesson.max64')}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid var(--border-color)', background: 'var(--field-bg)', color: 'var(--text-color)', fontSize: 16 }}
            />
            {error && <p style={{ color: 'red', fontSize: 14, marginTop: 5 }}>{error}</p>}
            <button
              type="button"
              onClick={handleCreate}
              style={{
                padding: '10px 22px',
                borderRadius: 6,
                background: 'var(--teach-btn-bg)',
                color: 'var(--teach-btn-fg)',
                border: '1.5px solid var(--border-color)',
                fontWeight: 600,
                fontSize: 16,
                textDecoration: 'none',
                transition: 'background 0.2s, color 0.2s',
                marginBottom: 24,
                marginTop: 20,
                width: '194.68px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                cursor: 'pointer',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', marginRight: 10 }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </span>
              <span>{t('lesson.create_btn', 'Создать урок')}</span>
            </button>
          </div>
        </main>
      </div>
      <Footer />
      <ToastContainer position="top-center" theme={theme === 'dark' ? 'dark' : 'light'} />
    </div>
  );
};

export default NewLessonAdmin; 