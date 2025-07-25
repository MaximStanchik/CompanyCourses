import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQuestion } from '@fortawesome/free-solid-svg-icons';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import axios from '../utils/axios';
import useTheme from '../hooks/useTheme';
import '../admin/admin.css';

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
          <div>Загрузка...</div>
        ) : (
          <div className="course-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 24
          }}>
            {courses
              .filter(course => {
                if (!search.trim()) return true;
                const s = search.trim().toLowerCase();
                return (course.name && course.name.toLowerCase().includes(s)) || (course.id && String(course.id).includes(s));
              })
              .map(course => (
                <a
                  key={course.id}
                  href={`/course/${course.id}`}
                  className="item-tile service-course-card"
                  style={{
                    display: 'grid',
                    gridTemplateAreas: `"cover title title"\n"cover desc desc"`,
                    gridTemplateRows: 'auto auto',
                    gridTemplateColumns: '80px 1fr auto',
                    padding: 20,
                    borderRadius: 12,
                    background: 'var(--teach-tile-bg, #fff)',
                    position: 'relative',
                    transition: 'box-shadow 0.25s cubic-bezier(.4,0,.2,1), transform 0.18s cubic-bezier(.4,0,.2,1)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    color: 'var(--text-color)',
                    textDecoration: 'none',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-4px) scale(1.03)';
                    e.currentTarget.style.boxShadow = dark
                      ? '0 8px 32px rgba(68,133,237,0.18)'
                      : '0 8px 32px rgba(68,133,237,0.13)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
                  }}
                >
                  {course.logoUrl ? (
                    <img src={course.logoUrl} alt={course.name} style={{ gridArea: 'cover', width: 64, height: 64, borderRadius: 4, objectFit: 'cover' }} />
                  ) : (
                    <div style={{ gridArea: 'cover', width: 64, height: 64, borderRadius: 4, background: '#eaeaea', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#777' }}>
                      <FontAwesomeIcon icon={faQuestion} />
                    </div>
                  )}
                  <h3 style={{ gridArea: 'title', margin: 0, fontSize: 18, fontWeight: 600, alignSelf: 'center', color: 'var(--text-color)' }}>{course.name}</h3>
                  <p style={{ gridArea: 'desc', margin: 0, color: '#666', fontSize: 14 }}>{course.description || '-'}</p>
                </a>
              ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Services; 