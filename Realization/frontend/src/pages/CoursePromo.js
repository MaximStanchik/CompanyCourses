import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from '../utils/axios';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';

const CoursePromo = () => {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await axios.get(`/courses/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('jwtToken')}`,
          },
        });
        setCourse(res.data);
      } catch (e) {
        setError(e);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [id]);

  if (loading) return <div>Загрузка...</div>;
  if (error || !course) return <div>Не удалось загрузить курс</div>;

  const logoUrl = course.logoUrl || null;
  const title = course.name || course.title || 'Курс';
  const shortDescr = course.shortDescription || course.description || '';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <NavBar />
      <header style={{ background: '#4485ed', color: '#fff', padding: '48px 0' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap', padding: '0 24px' }}>
          {logoUrl && (
            <img src={logoUrl} style={{ width: 160, height: 160, borderRadius: 12, objectFit: 'cover' }} alt={title} />
          )}
          <div style={{ flex: 1, minWidth: 260 }}>
            <h1 style={{ fontSize: 36, marginBottom: 12 }}>{title}</h1>
            <p style={{ fontSize: 18, lineHeight: 1.4, marginBottom: 24 }}>{shortDescr}</p>
            <a href="#" style={{ background: '#54ad54', padding: '12px 28px', borderRadius: 8, fontSize: 18, fontWeight: 600, color: '#fff', textDecoration: 'none' }}>Начать обучение</a>
          </div>
        </div>
      </header>
      <main style={{ flex: 1, padding: '48px 0' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px' }}>
          <section style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 28, marginBottom: 12 }}>О курсе</h2>
            <p style={{ fontSize: 16, lineHeight: 1.6 }}>{course.description}</p>
          </section>
          {course.learningOutcomes && (
            <section style={{ marginBottom: 48 }}>
              <h2 style={{ fontSize: 28, marginBottom: 12 }}>Чему вы научитесь</h2>
              <ul style={{ fontSize: 16, lineHeight: 1.6 }}>
                {course.learningOutcomes.split('\n').map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </section>
          )}
          {course.courseSections && course.courseSections.length > 0 && (
            <section style={{ marginBottom: 48 }}>
              <h2 style={{ fontSize: 28, marginBottom: 12 }}>Содержание курса</h2>
              <ol>
                {course.courseSections.map((mod, idx) => (
                  <li key={idx} style={{ marginBottom: 8 }}>
                    <strong>{mod.title}</strong>{mod.summary ? ` — ${mod.summary}` : ''}
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CoursePromo; 