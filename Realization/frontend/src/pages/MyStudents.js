import React, { useState, useEffect } from 'react';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import axios from '../utils/axios';
import TeachNavMenu from '../admin/TeachNavMenu';
import { useTranslation } from 'react-i18next';

export default function MyStudents() {
  const { t } = useTranslation();
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    // Здесь должен быть реальный запрос к API для получения учащихся
    axios.get('/students', {
      headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` }
    }).then(res => setCourses(res.data || []));
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--teach-bg)', color: 'var(--teach-fg)', display: 'flex', flexDirection: 'column' }}>
      <NavBar />
      <div style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - 60px)' }}>
        <TeachNavMenu variant="teach" />
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: 32 }}>
          <div style={{ marginTop: 200, width: '100%', maxWidth: 700, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h1 style={{ fontWeight: 700, fontSize: 32, marginBottom: 16, color: 'var(--text-color)' }}>{t('teach.my_students')}</h1>
            {courses.length === 0 ? (
              <div style={{ fontSize: 18, color: 'var(--text-color)', marginBottom: 12 }}>
                {t('teach.no_students')}
              </div>
            ) : (
              <div style={{ width: '100%', maxWidth: 700 }}>
                {/* Отображаем список курсов и студентов */}
                {courses.map(course => (
                  <div key={course.id} style={{ marginBottom: 24 }}>
                    <h3 style={{ margin: '8px 0 6px', fontWeight: 600, color: 'var(--text-color)' }}>{course.name}</h3>
                    <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
                      {course.students.map(st => (
                        <li key={st.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border-color)', fontSize: 15 }}>
                          {st.username || st.email || st.id}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
} 