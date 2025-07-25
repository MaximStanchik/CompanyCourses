import React, { useState, useEffect } from 'react';
import axios from '../utils/axios';
import { useTranslation } from 'react-i18next';
import { useHistory, useParams } from 'react-router-dom';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import { ToastContainer, toast } from 'react-toastify';
import TeachNavMenu from './TeachNavMenu';
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
  const [dark, setDark] = useState(() =>
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return dark;
}

const AddCourseAdmin = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const { userId } = useParams();

  const [name, setName] = useState('');
  const [loading] = useState(false);
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
    document.body.setAttribute('data-theme', dark ? 'dark' : 'light');
  }, [theme, dark]);

  // Theme colors теперь через CSS-переменные
  const formBg = 'var(--form-bg)';
  const pageBg = 'var(--page-bg)';
  const fieldBg = 'var(--field-bg)';
  const textColor = 'var(--text-color)';
  const borderColor = 'var(--border-color)';
  const titleColor = 'var(--title-color)';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || name.length > 64) {
      toast.error(t('course.name_required', 'Название курса обязательно и не более 64 символов'));
      return;
    }
    try {
      const res = await axios.post('/course/add', {
        name,
        userId: Number(userId)
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` }
      });
      toast.success(t('course.created_success', 'Курс успешно создан!'));
      setTimeout(() => {
        history.push(`/editcourse/${res.data.id}`); // редирект на страницу редактирования курса
      }, 1200);
    } catch (err) {
      toast.error(t('course.create_error', 'Ошибка при создании курса'));
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: pageBg, display: 'flex', flexDirection: 'column', color: textColor }}>
      <NavBar />
      <ToastContainer />
      <div style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - 60px)' }}>
        <TeachNavMenu userId={userId} />
        <main className="marco-layout" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', background: pageBg, color: textColor }}>
          {/* Удалён div с языковым select и кнопкой смены темы */}
          <header style={{ width: '100%', textAlign: 'center', margin: '24px 0 20px' }}>
            <h1 style={{
              fontFamily: 'Roboto, sans-serif',
              fontWeight: 700,
              color: titleColor,
              fontSize: '2.125em',
              margin: '0.2em 0 0.5em',
              lineHeight: 1.2125
            }}>{t('course.create_new', '\u0421\u043e\u0437\u0434\u0430\u043d\u0438\u0435 \u043d\u043e\u0432\u043e\u0433\u043e \u043a\u0443\u0440\u0441\u0430')}</h1>
          </header>
          <form onSubmit={handleSubmit} style={{
            width: '100%',
            maxWidth: 640,
            background: formBg,
            borderRadius: 8,
            boxShadow: dark ? '0 2px 8px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.07)',
            padding: 32,
            marginBottom: 16
          }}>
            <fieldset style={{ border: 'none', margin: 0, padding: 0 }}>
              <legend className="the-form-field__caption new-course-form__caption" style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 400, lineHeight: 1.3, color: textColor }} data-required="">
                {t('course.name', '\u041d\u0430\u0437\u0432\u0430\u043d\u0438\u0435 \u043a\u0443\u0440\u0441\u0430')}
              </legend>
              <input
                type="text"
                className="ember-text-field ember-view new-course-form__input st-input"
                required
                maxLength={64}
                minLength={3}
                value={name}
                onChange={e => setName(e.target.value)}
                style={{ width: '100%', fontSize: 16, padding: 10, marginBottom: 6, border: `1px solid ${borderColor}`, borderRadius: 4, background: fieldBg, color: textColor }}
              />
              <span className="new-course-form__note" style={{ fontSize: 13, color: dark ? '#aaa' : '#888', marginBottom: 12, display: 'block' }}>
                {t('course.max_length', '\u041c\u0430\u043a\u0441\u0438\u043c\u0443\u043c 64 \u0441\u0438\u043c\u0432\u043e\u043b\u0430')}
              </span>
            </fieldset>
            <button
              type="submit"
              className="the-form__submit the-form-submit ember-view new-course-form__btn button_with-loader anim-btn"
              style={{
                marginTop: 18,
                background: 'var(--btn-main-bg)',
                color: 'var(--btn-main-fg)',
                fontWeight: 700,
                fontSize: 18,
                border: 'none',
                borderRadius: 4,
                padding: '12px 32px',
                cursor: 'pointer',
                transition: 'background 0.2s',
                width: '100%'
              }}
              disabled={false}
            >
              {t('course.create', '\u0421\u043e\u0437\u0434\u0430\u0442\u044c \u043a\u0443\u0440\u0441')}
            </button>
            <p style={{ margin: '18px 0 0', fontSize: 15, color: dark ? '#aaa' : '#535366' }}>
              {t('course.draft_hint', '\u041d\u0430\u0447\u043d\u0438\u0442\u0435 \u0440\u0430\u0431\u043e\u0442\u0443 \u043d\u0430\u0434 \u0447\u0435\u0440\u043d\u043e\u0432\u0438\u043a\u043e\u043c \u043a\u0443\u0440\u0441\u0430, \u043f\u0435\u0440\u0435\u0434 \u043f\u0443\u0431\u043b\u0438\u043a\u0430\u0446\u0438\u0435\u0439 \u043c\u043e\u0436\u043d\u043e \u0431\u0443\u0434\u0435\u0442 ')}
              <a href="https://help.stepik.org/article/54756" target="_blank" rel="noopener noreferrer" style={{ color: '#4485ed' }}>
                {t('course.make_paid', '\u0441\u0434\u0435\u043b\u0430\u0442\u044c \u043a\u0443\u0440\u0441 \u043f\u043b\u0430\u0442\u043d\u044b\u043c')}
              </a>
              {t('course.or_leave_free', ' \u0438\u043b\u0438 \u043e\u0441\u0442\u0430\u0432\u0438\u0442\u044c \u0431\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u044b\u043c.')}
            </p>
          </form>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default AddCourseAdmin; 