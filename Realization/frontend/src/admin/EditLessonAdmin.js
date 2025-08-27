import React, { useState, useEffect } from 'react';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import TeachNavMenu from './TeachNavMenu';
import { useTranslation } from 'react-i18next';
import useTheme from '../hooks/useTheme';
import axios from '../utils/axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useParams, useHistory } from 'react-router-dom';

export default function EditLessonAdmin() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { id } = useParams();
  const history = useHistory();
  const [lesson, setLesson] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      loadLesson();
    }
  }, [id]);

  const loadLesson = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/lessons/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` }
      });
      
      const lessonData = response.data;
      setLesson(lessonData);
      setTitle(lessonData.name || '');
      setDescription(lessonData.description || '');
    } catch (error) {
      console.error('Error loading lesson:', error);
      setError('Ошибка при загрузке урока');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Название урока обязательно');
      return;
    }

    try {
      setSaving(true);
      await axios.put(`/lessons/${id}`, {
        name: title.trim(),
        description: description.trim()
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` }
      });
      
      toast.success('Урок успешно обновлен');
      setTimeout(() => {
        history.push('/teach/lessons');
      }, 1000);
    } catch (error) {
      console.error('Error updating lesson:', error);
      setError('Ошибка при обновлении урока');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Вы уверены, что хотите удалить этот урок?')) {
      return;
    }

    try {
      await axios.delete(`/lessons/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` }
      });
      
      toast.success('Урок успешно удален');
      setTimeout(() => {
        history.push('/teach/lessons');
      }, 1000);
    } catch (error) {
      console.error('Error deleting lesson:', error);
      toast.error('Ошибка при удалении урока');
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--teach-bg)', color: 'var(--teach-fg)', display: 'flex', flexDirection: 'column' }}>
        <NavBar />
        <div style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - 60px)' }}>
          <TeachNavMenu variant="teach" />
          <main style={{ flex: 1, padding: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div>Загрузка урока...</div>
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--teach-bg)', color: 'var(--teach-fg)', display: 'flex', flexDirection: 'column' }}>
        <NavBar />
        <div style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - 60px)' }}>
          <TeachNavMenu variant="teach" />
          <main style={{ flex: 1, padding: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div>Урок не найден</div>
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--teach-bg)', color: 'var(--teach-fg)', display: 'flex', flexDirection: 'column' }}>
      <NavBar />
      <div style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - 60px)' }}>
        <TeachNavMenu variant="teach" />
        <main style={{ flex: 1, padding: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h1 style={{ fontWeight: 700, fontSize: 32, color: theme === 'dark' ? '#fff' : '#23272f' }}>
              Редактирование урока
            </h1>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => history.push(`/teach/lessons/${id}/content`)}
                style={{
                  padding: '10px 22px',
                  borderRadius: 6,
                  background: 'var(--teach-link-color)',
                  color: 'white',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: 16,
                  cursor: 'pointer'
                }}
              >
                Содержание урока
              </button>
              <button
                onClick={() => history.push('/teach/lessons')}
                style={{
                  padding: '10px 22px',
                  borderRadius: 6,
                  background: 'var(--form-bg)',
                  color: 'var(--text-color)',
                  border: '1.5px solid var(--border-color)',
                  fontWeight: 600,
                  fontSize: 16,
                  cursor: 'pointer'
                }}
              >
                Назад к урокам
              </button>
            </div>
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

          <div style={{ maxWidth: 600 }}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: theme === 'dark' ? '#fff' : '#23272f' }}>
                Название урока:
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={64}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1.5px solid var(--border-color)',
                  background: 'var(--field-bg)',
                  color: 'var(--text-color)',
                  fontSize: 16
                }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: theme === 'dark' ? '#fff' : '#23272f' }}>
                Описание урока:
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                maxLength={500}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1.5px solid var(--border-color)',
                  background: 'var(--field-bg)',
                  color: 'var(--text-color)',
                  fontSize: 16
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: '12px 24px',
                  borderRadius: 6,
                  background: 'var(--teach-btn-bg)',
                  color: 'var(--teach-btn-fg)',
                  border: '1.5px solid var(--border-color)',
                  fontWeight: 600,
                  fontSize: 16,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.6 : 1
                }}
              >
                {saving ? 'Сохранение...' : 'Сохранить изменения'}
              </button>

              <button
                onClick={handleDelete}
                style={{
                  padding: '12px 24px',
                  borderRadius: 6,
                  background: '#e74c3c',
                  color: 'white',
                  border: '1.5px solid #e74c3c',
                  fontWeight: 600,
                  fontSize: 16,
                  cursor: 'pointer'
                }}
              >
                Удалить урок
              </button>
            </div>
          </div>
        </main>
      </div>
      <Footer />
      <ToastContainer position="top-center" theme={theme === 'dark' ? 'dark' : 'light'} />
    </div>
  );
} 