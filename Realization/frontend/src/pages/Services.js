import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQuestion, faClock, faUser, faStar } from '@fortawesome/free-solid-svg-icons';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import axios from '../utils/axios';
import useTheme from '../hooks/useTheme';
import '../admin/admin.css';

const truncateText = (text, maxLength = 120) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

const Services = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { theme } = useTheme();
  const dark = theme === 'dark';

  useEffect(() => {
    axios.get('/courses')
      .then(res => {
        setCourses(res.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--teach-bg)', display: 'flex', flexDirection: 'column' }}>
      <NavBar />
      <main style={{ flex: 1, padding: '32px 24px', background: 'var(--teach-bg)', color: 'var(--teach-fg)', minHeight: 'calc(100vh - 60px)' }}>
        <h1 style={{ fontWeight: 700, fontSize: 32, marginBottom: 24, color: dark ? '#fff' : 'var(--text-color)', transition: 'color 0.22s' }}>Все курсы</h1>
        <div style={{ marginBottom: 24, display: 'flex', gap: 16, alignItems: 'center' }}>
          <input
            className="search-form__input"
            placeholder="Название курса или ID"
            autoComplete="on"
            spellCheck={false}
            aria-label="Search"
            type="search"
            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color)', minWidth: 220, fontSize: 15, background: 'var(--field-bg)', color: 'var(--text-color)' }}
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }}
          />
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-color)' }}>Загрузка курсов...</div>
        ) : (
          <div className="course-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 24
          }}>
            {courses
              .filter(course => {
                if (!search.trim()) return true;
                const s = search.trim().toLowerCase();
                return (course.name && course.name.toLowerCase().includes(s)) || 
                       (course.id && String(course.id).includes(s)) ||
                       (course.description && course.description.toLowerCase().includes(s));
              })
              .map(course => (
                <a
                  key={course.id}
                  href={`/course/${course.id}`}
                  className="item-tile service-course-card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: 24,
                    borderRadius: 16,
                    background: 'var(--teach-tile-bg, #fff)',
                    position: 'relative',
                    transition: 'all 0.25s cubic-bezier(.4,0,.2,1)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    color: 'var(--text-color)',
                    textDecoration: 'none',
                    cursor: 'pointer',
                    border: '1px solid var(--border-color, #eaeaea)',
                    minHeight: 280,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)';
                    e.currentTarget.style.boxShadow = dark
                      ? '0 12px 40px rgba(68,133,237,0.25)'
                      : '0 12px 40px rgba(68,133,237,0.18)';
                    e.currentTarget.style.borderColor = 'var(--accent-color, #4485ed)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                    e.currentTarget.style.borderColor = 'var(--border-color, #eaeaea)';
                  }}
                >
                  {/* Заголовок курса */}
                  <div style={{ marginBottom: 16 }}>
                    <h3 style={{ 
                      margin: 0, 
                      fontSize: 20, 
                      fontWeight: 700, 
                      color: 'var(--text-color)',
                      lineHeight: 1.3,
                      marginBottom: 8
                    }}>
                      {course.name}
                    </h3>
                    {course.Category && (
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 600,
                        background: 'var(--accent-color, #4485ed)',
                        color: '#fff',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        {course.Category.name}
                      </span>
                    )}
                  </div>

                  {/* Описание курса */}
                  <div style={{ flex: 1, marginBottom: 20 }}>
                    <p style={{ 
                      margin: 0, 
                      color: 'var(--text-secondary, #666)', 
                      fontSize: 14, 
                      lineHeight: 1.6,
                      display: '-webkit-box',
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {course.description ? truncateText(course.description, 150) : 'Описание курса пока не добавлено'}
                    </p>
                  </div>

                  {/* Статус курса */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    paddingTop: 16,
                    borderTop: '1px solid var(--border-color, #eaeaea)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 600,
                        background: course.status === 'published' ? '#e7f9e7' : '#fff3cd',
                        color: course.status === 'published' ? '#388e3c' : '#856404',
                        border: '1px solid',
                        borderColor: course.status === 'published' ? '#c8e6c9' : '#ffeaa7'
                      }}>
                        {course.status === 'published' ? t('courses.active') : course.status === 'draft' ? t('courses.draft') : t('courses.inactive')}
                      </span>
                    </div>
                    
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 12,
                      fontSize: 12,
                      color: 'var(--text-secondary, #888)'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <FontAwesomeIcon icon={faUser} size="sm" />
                        ID: {course.id}
                      </span>
                    </div>
                  </div>
                </a>
              ))}
          </div>
        )}
        
        {!loading && courses.length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 20px', 
            color: 'var(--text-secondary, #666)',
            fontSize: 18
          }}>
            Курсы не найдены
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Services; 