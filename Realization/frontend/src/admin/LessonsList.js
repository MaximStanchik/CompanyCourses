import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import TeachNavMenu from './TeachNavMenu';
import { useTranslation } from 'react-i18next';
import useTheme from '../hooks/useTheme';
import axios from '../utils/axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function LessonsList() {
  console.log('[LessonsList] Component mounted');
  const { t } = useTranslation();
  const { theme } = useTheme();
  const location = useLocation();
  
  // Очищаем все toast-уведомления при монтировании компонента
  React.useEffect(() => {
    console.log('[LessonsList] Clearing all toasts on mount');
    toast.dismiss();
  }, []);

  // Read initial course filter from URL to prevent initial unfiltered load
  const initialCourseFilter = (() => {
    try {
      return new URLSearchParams(window.location.search).get('course') || '';
    } catch { return ''; }
  })();

  const [lessons, setLessons] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(''); // Убираем чтение из URL
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [createCourseId, setCreateCourseId] = useState('');
  const [createTitle, setCreateTitle] = useState('');

  useEffect(() => {
    console.log('[LessonsList] Component mounted, loading courses...');
    // Очищаем все toast-уведомления при загрузке компонента
    toast.dismiss();
    loadCourses();
  }, []);

  useEffect(() => {
    console.log('selectedCourse changed:', selectedCourse);
    // Загружаем уроки только если selectedCourse действительно изменился
    if (selectedCourse) {
      loadLessons(selectedCourse);
    } else {
      loadAllLessons();
    }
  }, [selectedCourse]);

  const loadCourses = async () => {
    try {
      console.log('Loading courses...');
      const response = await axios.get('/courses', {
        headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` }
      });
      const coursesData = response.data || [];
      console.log('Courses loaded:', coursesData);
      setCourses(coursesData);
    } catch (error) {
      console.error('Error loading courses:', error);
      setError(t('lessons.courses_load_error'));
    }
  };

  const loadLessons = async (courseId) => {
    try {
      setLoading(true);
      setError(''); // Очищаем предыдущие ошибки
      console.log('=== LOADING LESSONS FOR COURSE ===');
      console.log('Course ID:', courseId);
      console.log('Course ID type:', typeof courseId);
      
      // Проверяем, что courseId не пустой
      if (!courseId || courseId === '' || courseId === 'undefined') {
        console.log('Course ID is empty, loading all lessons instead');
        await loadAllLessons();
        return;
      }
      
      // Сначала пробуем серверную фильтрацию
      const url = `/lessons?course=${courseId}`;
      console.log('Making request to:', url);
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` }
      });
      
      const lessons = response.data || [];
      console.log('Lessons loaded from server for course', courseId, ':', lessons.length, 'lessons');
      console.log('Raw lessons data:', lessons);
      
      // Дополнительная клиентская фильтрация для гарантии
      const courseIdNum = Number(courseId);
      const filteredLessons = lessons.filter(lesson => {
        const lessonCourseId = lesson.course_id || lesson.courseId;
        const lessonCourseIdNum = Number(lessonCourseId);
        const matches = lessonCourseIdNum === courseIdNum;
        
        if (!matches) {
          console.log('Lesson', lesson.id, 'does not belong to course', courseId, '(lesson course_id:', lessonCourseId, ')');
        }
        
        return matches;
      });
      
      console.log('Final filtered lessons for course', courseId, ':', filteredLessons.length, 'lessons');
      
      // Убираем дополнительные запросы - isPinned уже есть в основном ответе
      const enriched = filteredLessons.map(l => ({
        ...l,
        isPinned: !!l.isPinned // Убеждаемся, что isPinned является boolean
      }));
      
      // Сортируем: закрепленные уроки вверху
      enriched.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
      setLessons(enriched);
      
      console.log('Final lessons set:', enriched.length, 'lessons');
      console.log('=== END LOADING LESSONS ===');
    } catch (error) {
      console.error('Error loading lessons:', error);
      setError(t('lessons.load_error'));
      setLessons([]); // Очищаем уроки при ошибке
    } finally {
      setLoading(false);
    }
  };

  const loadAllLessons = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/lessons', {
        headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` }
      });
      const base = response.data || [];
      
      // Убираем дополнительные запросы - isPinned уже есть в основном ответе
      const enriched = base.map(l => ({
        ...l,
        isPinned: !!l.isPinned // Убеждаемся, что isPinned является boolean
      }));
      
      // Сортируем: закрепленные уроки вверху
      enriched.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
      setLessons(enriched);
    } catch (error) {
      console.error('Error loading all lessons:', error);
      setError(t('lessons.load_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLesson = async () => {
    const courseId = Number(createCourseId);
    const title = (createTitle || '').trim();
    if (!courseId || !title) {
      toast.error(t('lessons.select_course_and_title'));
      return;
    }
    try {
      const courseRes = await axios.get(`/course?id=${courseId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` }
      });
      const courseName = courseRes.data?.name;
      const response = await axios.post(`/lecture/add`, { name: title, content: '', course: courseName }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` }
      });
      toast.success(t('lessons.created'));
      setCreateOpen(false);
      setCreateCourseId('');
      setCreateTitle('');
      
      // Перезагружаем уроки с правильной сортировкой
      if (selectedCourse) {
        loadLessons(selectedCourse);
      } else {
        loadAllLessons();
      }
      
      console.log('Lesson created successfully:', response.data);
    } catch (e) {
      console.error(e);
      if (e?.response?.status === 409) toast.error(t('lessons.already_exists'));
      else toast.error(t('lessons.create_error'));
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm(t('lessons.confirm_delete'))) {
      return;
    }

    try {
      await axios.delete(`/lesson/${lessonId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` }
      });
      
      toast.success(t('lessons.deleted'));

      if (selectedCourse) {
        loadLessons(selectedCourse);
      } else {
        loadAllLessons();
      }
    } catch (error) {
      console.error('Error deleting lesson:', error);
      toast.error(t('lessons.delete_error'));
    }
  };
  
  const handlePinLesson = async (lessonId, currentPinnedState) => {
    try {
      const newPinnedState = !currentPinnedState;
      
      const response = await axios.patch(`/lesson/${lessonId}`, 
        { isPinned: newPinnedState },  // Отправляем новое состояние, а не инвертированное
        { 
          headers: { 
            Authorization: `Bearer ${localStorage.getItem('jwtToken')}` 
          } 
        }
      );
  
      toast.success(newPinnedState ? t('lessons.pinned') : t('lessons.unpinned'));
      
      // Обновляем состояние уроков
      setLessons(prev => {
        const updated = prev.map(l => 
          l.id === lessonId ? { ...l, isPinned: newPinnedState } : l
        );
        // Сортируем: закрепленные уроки вверху
        return updated.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
      });
      
      console.log(`Lesson ${lessonId} pinned status updated to: ${newPinnedState}`);
    } catch (error) {
      console.error('Error pinning lesson:', error);
      toast.error(t('lessons.pin_error'));
    }
  };

  const handleCopyLesson = async (lessonId) => {
    try {
      const response = await axios.post(`/lesson/${lessonId}/duplicate`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` }
      });
      
      if (response.data && response.data.id) {
        toast.success(t('lessons.copied'));
        
        // Перезагружаем уроки с правильной сортировкой
        if (selectedCourse) {
          loadLessons(selectedCourse);
        } else {
          loadAllLessons();
        }
        
        console.log('Lesson copied successfully:', response.data.id);
      }
    } catch (error) {
      console.error('Error copying lesson:', error);
      toast.error(t('lessons.copy_error'));
    }
  };

  const getCourseName = (courseId) => {
    if (!courseId && courseId !== 0) return t('lessons.course_not_assigned');
    const course = courses.find(c => c.id === courseId);
    return course ? course.name : t('lessons.course_not_assigned');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--teach-bg)', color: 'var(--teach-fg)', display: 'flex', flexDirection: 'column' }}>
      <NavBar />
      <div style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - 60px)' }}>
        <TeachNavMenu variant="teach" />
        <main style={{ flex: 1, padding: 32, position: 'relative' }}>
          <style>{`
            body.dark-theme input.lesson-create-input::placeholder,
            [data-theme="dark"] input.lesson-create-input::placeholder {
              color: #ffffff;
              opacity: 0.8;
            }
          `}</style>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h1 style={{ 
              fontWeight: 700, 
              fontSize: 32, 
              color: theme === 'dark' ? '#eaf4fd' : '#333333'
            }}>
              {t('lessons.title')}
            </h1>
            <button type="button" onClick={() => setCreateOpen(true)} className="button" style={{ padding: '10px 22px', borderRadius: 6, background: theme === 'dark' ? '#fff' : '#54ad54', color: theme === 'dark' ? '#333' : '#fff', border: 'none', fontWeight: 600, fontSize: 16 }}>
              {t('lessons.create_title')}
            </button>
          </div>

          

          <div style={{ display: 'flex', gap: 16, marginBottom: 24, alignItems: 'center' }}>
            <label style={{ 
              display: 'block', 
              fontWeight: 600, 
              marginBottom: 8, 
              color: theme === 'dark' ? '#eaf4fd' : '#333333'
            }}>
              {t('lessons.filter_by_course')}
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => {
                const newCourseId = e.target.value;
                console.log('Course selection changed from', selectedCourse, 'to', newCourseId);
                setSelectedCourse(newCourseId);
                // useEffect автоматически вызовет loadLessons или loadAllLessons
              }}
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                border: '1.5px solid var(--border-color)',
                background: 'var(--teach-bg)',
                color: 'var(--teach-fg)',
                fontSize: 16,
                minWidth: 200
              }}
            >
              <option value="">{t('courses.all')}</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div style={{ 
              padding: '12px 16px', 
              background: '#fee', 
              color: '#c33', 
              borderRadius: 6, 
              marginBottom: 16,
              border: '1px solid #fcc'
            }}>
              {error}
            </div>
          )}

          {loading ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px', 
              color: theme === 'dark' ? '#eaf4fd' : '#333333'
            }}>
              {t('lessons.loading')}
            </div>
          ) : lessons.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 40px', 
              color: theme === 'dark' ? '#eaf4fd' : '#333333',
              background: 'var(--teach-tile-bg)',
              border: '2px dashed var(--border-color)',
              borderRadius: 12,
              margin: '20px 0'
            }}>
              <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.6 }}>📚</div>
              <h3 style={{ 
                fontSize: 24, 
                fontWeight: 600, 
                marginBottom: 12,
                color: theme === 'dark' ? '#eaf4fd' : '#333333'
              }}>
                {selectedCourse ? t('lessons.no_lessons_in_course') : t('lessons.no_lessons')}
              </h3>
              <p style={{ 
                fontSize: 16, 
                opacity: 0.7, 
                marginBottom: 24,
                maxWidth: 400,
                marginLeft: 'auto',
                marginRight: 'auto'
              }}>
                {selectedCourse 
                  ? 'Создайте первый урок для этого курса, чтобы начать обучение.'
                  : 'Создайте свой первый урок, чтобы начать создавать образовательный контент.'
                }
              </p>
              <button 
                onClick={() => setCreateOpen(true)}
                style={{ 
                  padding: '12px 24px', 
                  borderRadius: 8, 
                  background: theme === 'dark' ? '#fff' : '#54ad54', 
                  color: theme === 'dark' ? '#333' : '#fff', 
                  border: 'none', 
                  fontWeight: 600, 
                  fontSize: 16,
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.target.style.background = theme === 'dark' ? '#f0f0f0' : '#45a045'}
                onMouseOut={(e) => e.target.style.background = theme === 'dark' ? '#fff' : '#54ad54'}
              >
                {t('lessons.create_title')}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {lessons.map(lesson => (
                <div 
                  key={lesson.id} 
                  style={{
                    padding: '20px',
                    border: '1px solid var(--border-color)',
                    borderRadius: 8,
                    background: 'var(--teach-tile-bg)',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ 
                        margin: '0 0 8px 0', 
                        fontWeight: '600', 
                        fontSize: 18,
                        color: theme === 'dark' ? '#eaf4fd' : '#333333'
                      }}>
                        {lesson.name}
                      </h3>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px', 
                        marginBottom: '8px',
                        fontSize: 14, 
                        color: theme === 'dark' ? '#eaf4fd' : '#333333', 
                        opacity: 0.7 
                      }}>
                        <span style={{ 
                          background: '#4485ed', 
                          color: 'white', 
                          padding: '4px 8px', 
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {getCourseName(lesson.course_id)}
                        </span>
                        <span>ID: {lesson.id}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button
                        onClick={() => window.open(`/teach/lessons/${lesson.id}/content`, '_blank')}
                        style={{
                          padding: '8px 12px',
                          borderRadius: 6,
                          background: theme === 'dark' ? '#000' : 'var(--teach-link-color)',
                          color: theme === 'dark' ? '#fff' : 'white',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: 14
                        }}
                        title={t('lessons.contents')}
                      >
                        {t('lessons.contents')}
                      </button>

                      <button
                        onClick={() => handlePinLesson(lesson.id, lesson.isPinned)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: 6,
                          background: lesson.isPinned ? '#f39c12' : '#95a5a6',
                          color: 'white',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: 14
                        }}
                        title={lesson.isPinned ? t('lessons.pinned') : t('lessons.unpinned')}
                      >
                        {lesson.isPinned ? t('lessons.pinned') : t('lessons.unpinned')}
                      </button>

                      <button
                        onClick={() => handleCopyLesson(lesson.id)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: 6,
                          background: '#6c63ff',
                          color: 'white',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: 14
                        }}
                        title={t('lessons.copied')}
                      >
                        {t('lessons.copied')}
                      </button>

                      <button
                        onClick={() => handleDeleteLesson(lesson.id)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: 6,
                          background: '#e74c3c',
                          color: 'white',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: 14
                        }}
                        title={t('lessons.deleted')}
                                              >
                          {t('lessons.deleted')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {createOpen && (
            <div style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000,
              animation: 'fadeIn 0.18s ease'
            }}>
              <div style={{
                width: 520,
                maxWidth: '92vw',
                background: 'var(--teach-tile-bg)',
                color: 'var(--teach-fg)',
                borderRadius: 12,
                border: '1.5px solid var(--border-color)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
                transform: 'translateY(0)',
                animation: 'slideUp 0.22s ease'
              }}>
                <div style={{ padding: '18px 20px', borderBottom: `1px solid ${theme === 'dark' ? '#3a3f47' : '#eee'}` }}>
                  <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{t('lessons.create_title')}</h3>
                </div>
                <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <label style={{ fontWeight: 600, color: 'var(--teach-fg)' }}>{t('courses.title')}</label>
                  <select
                    value={createCourseId}
                    onChange={e => setCreateCourseId(e.target.value)}
                    style={{ padding: '10px 12px', borderRadius: 6, border: '1.5px solid var(--border-color)', background: 'var(--teach-bg)', color: 'var(--teach-fg)' }}
                  >
                    <option value="">{t('courses.select_course')}</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <label style={{ fontWeight: 600, marginTop: 8, color: 'var(--teach-fg)' }}>{t('lessons.lesson_name_or_id')}</label>
                  <input
                    type="text"
                    value={createTitle} 
                    onChange={e => setCreateTitle(e.target.value)}
                    placeholder={t('lessons.lesson_name_or_id')}
                    className="lesson-create-input"
                    style={{ padding: '10px 12px', borderRadius: 6, border: '1.5px solid var(--border-color)', background: 'var(--teach-bg)', color: 'var(--teach-fg)' }}
                  />
                </div>
                <div style={{ padding: 20, display: 'flex', justifyContent: 'flex-end', gap: 12, borderTop: '1px solid var(--border-color)' }}>
                  <button
                    type="button"
                    onClick={() => setCreateOpen(false)}
                    style={{ padding: '10px 18px', borderRadius: 6, border: '1.5px solid #4485ed', background: 'transparent', color: theme === 'dark' ? '#fff' : 'var(--teach-link-color)', fontWeight: 600 }}
                  >{t('common.cancel')}</button>
                  <button
                    type="button"
                    onClick={handleCreateLesson}
                    style={{ padding: '10px 18px', borderRadius: 6, border: 'none', background: theme === 'dark' ? '#3668c9' : '#4485ed', color: '#fff', fontWeight: 600 }}
                  >{t('common.create')}</button>
                </div>
              </div>
            </div>
          )}

          <ToastContainer position="top-center" theme={theme === 'dark' ? 'dark' : 'light'} />
        </main>
      </div>
      <Footer />
    </div>
  );
}