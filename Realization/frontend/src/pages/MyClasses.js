import React, { useState, useEffect } from 'react';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import axios from '../utils/axios';
import TeachNavMenu from '../admin/TeachNavMenu';
import { useTranslation } from 'react-i18next';

export default function MyClasses() {
  const { t } = useTranslation();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    axios.get('/courses', {
      headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` }
    }).then(res => setCourses(res.data || []));
  }, []);

  return (
    <>
      <style>{`
        .dropdown-anim {
          opacity: 0;
          transform: translateY(-8px) scale(0.98);
          pointer-events: none;
          transition: opacity 0.22s cubic-bezier(.4,0,.2,1), transform 0.22s cubic-bezier(.4,0,.2,1);
        }
        .dropdown-anim-open {
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: auto;
        }
      `}</style>
      <div style={{ minHeight: '100vh', background: 'var(--teach-bg)', color: 'var(--teach-fg)', display: 'flex', flexDirection: 'column' }}>
        <NavBar />
        <div style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - 60px)' }}>
          <TeachNavMenu variant="teach" />
          <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: 32, marginTop: 24 }}>
            <h1 style={{ fontWeight: 700, fontSize: 32, marginBottom: 16, color: 'var(--text-color)' }}>{t('teach.classes')}</h1>
            <div style={{ fontSize: 18, color: 'var(--text-color)', marginBottom: 12 }}>{t('teach.no_classes')}</div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
              <div style={{ position: 'relative' }}>
                <button
                  id="ember1746_tb"
                  className="select-box__toggle-btn"
                  type="button"
                  style={{
                    padding: '10px 22px',
                    borderRadius: 6,
                    background: 'var(--form-bg)',
                    color: 'var(--text-color)',
                    border: '1.5px solid var(--border-color)',
                    fontWeight: 500,
                    fontSize: 16,
                    minWidth: 180,
                    textAlign: 'left',
                    transition: 'background 0.2s, color 0.2s',
                    cursor: 'pointer'
                  }}
                  onClick={() => setDropdownOpen(v => !v)}
                  disabled={courses.length === 0}
                >
                  <span className="select-box-option__slot-item">
                    <span className="select-box-option__content">
                      {selectedCourse
                        ? courses.find(c => c.id === selectedCourse)?.name
                        : t('teach.select_course')}
                    </span>
                  </span>
                </button>
                <ul
                  className={`dropdown-anim${dropdownOpen && courses.length > 0 ? ' dropdown-anim-open' : ''}`}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    minWidth: 180,
                    background: 'var(--form-bg)',
                    border: '1.5px solid var(--border-color)',
                    borderRadius: 8,
                    margin: 0,
                    padding: '6px 0',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                    zIndex: 10,
                    listStyle: 'none',
                  }}
                >
                  {courses.map(course => (
                    <li
                      key={course.id}
                      style={{
                        padding: '8px 18px',
                        cursor: 'pointer',
                        color: 'var(--text-color)',
                        fontSize: 15,
                        transition: 'background 0.18s',
                        background: selectedCourse === course.id ? 'var(--teach-active-bg)' : 'transparent'
                      }}
                      onClick={() => { setSelectedCourse(course.id); setDropdownOpen(false); }}
                    >
                      {course.name}
                    </li>
                  ))}
                </ul>
              </div>
              <a href="/new-class" className="button" style={{
                padding: '10px 22px',
                borderRadius: 6,
                background: 'var(--teach-btn-bg)',
                color: 'var(--teach-btn-fg)',
                border: '1.5px solid var(--border-color)',
                fontWeight: 600,
                fontSize: 16,
                textDecoration: 'none',
                transition: 'background 0.2s, color 0.2s',
                opacity: courses.length === 0 ? 0.5 : 1,
                pointerEvents: courses.length === 0 ? 'none' : 'auto'
              }}>{t('teach.create_class')}</a>
              <a href="/catalog" className="button success is-outlined" style={{
                padding: '10px 22px',
                borderRadius: 6,
                background: 'var(--form-bg)',
                color: 'var(--teach-link-color)',
                border: '1.5px solid var(--teach-link-color)',
                fontWeight: 600,
                fontSize: 16,
                textDecoration: 'none',
                transition: 'background 0.2s, color 0.2s'
              }}>{t('teach.choose_course')}</a>
            </div>
            <p className="new-class-form__fieldset">{t('teach.class_description1')}</p>
            <p className="new-class-form__fieldset">{t('teach.class_description2')}</p>
          </main>
        </div>
        <Footer />
      </div>
    </>
  );
} 