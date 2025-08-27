import React, { useState, useEffect } from 'react';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import axios from '../utils/axios';
import TeachNavMenu from '../admin/TeachNavMenu';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';

export default function MyStudents() {
  const { t } = useTranslation();
  const [courses, setCourses] = useState([]);
  const history = useHistory();

  useEffect(() => {
    // Перенаправление на общий список зачислений
    history.replace('/EnrollmentList');
  }, [history]);

  useEffect(() => {
    // Получаем курсы с зачисленными студентами
    axios.get('/courses', {
      headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` }
    }).then(res => {
      const coursesWithStudents = res.data || [];
      // Фильтруем только курсы, на которые записаны студенты
      const coursesWithEnrollments = coursesWithStudents.filter(course => 
        course.enrollments && course.enrollments.length > 0
      );
      setCourses(coursesWithEnrollments);
    }).catch(error => {
      console.error('Error fetching courses with students:', error);
      setCourses([]);
    });
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
                  <div key={course.id} style={{ marginBottom: 24, padding: 20, border: '1px solid var(--border-color)', borderRadius: 8, background: 'var(--teach-tile-bg)' }}>
                    <h3 style={{ margin: '0 0 16px 0', fontWeight: 600, color: 'var(--text-color)' }}>{course.name}</h3>
                    <div style={{ fontSize: 14, color: 'var(--text-color)', opacity: 0.7, marginBottom: 12 }}>
                      {t('teach.students_enrolled')}: {course.enrollments ? course.enrollments.length : 0}
                    </div>
                    {course.enrollments && course.enrollments.length > 0 ? (
                      <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
                        {course.enrollments.map(enrollment => (
                          <li key={enrollment.id} style={{ 
                            padding: '12px 16px', 
                            borderBottom: '1px solid var(--border-color)', 
                            fontSize: 15,
                            background: 'var(--teach-bg)',
                            borderRadius: 6,
                            marginBottom: 8,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <span style={{ color: 'var(--text-color)' }}>
                              {enrollment.user ? (enrollment.user.username || enrollment.user.email) : `${t('teach.student')} ${enrollment.user_id}`}
                            </span>
                            <span style={{ 
                              fontSize: 12, 
                              padding: '4px 8px', 
                              borderRadius: 12,
                              background: enrollment.approved ? '#54ad54' : '#f39c12',
                              color: 'white'
                            }}>
                              {enrollment.approved ? t('teach.approved') : t('teach.pending')}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div style={{ fontSize: 14, color: 'var(--text-color)', opacity: 0.6, fontStyle: 'italic' }}>
                        {t('teach.no_enrollments_for_course')}
                      </div>
                    )}
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