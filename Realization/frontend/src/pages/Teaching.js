import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import TeachNavMenu from '../admin/TeachNavMenu';
import { useTranslation } from 'react-i18next';
import useTheme from '../hooks/useTheme';
import axios from '../utils/axios';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisV, faPen, faCopy, faTrash, faThumbtack, faQuestion, faPlus, faFilter, faSearch, faCheck, faEdit, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import './Teaching.css';
import { getCourseFileUrl } from '../utils/minioUtils';

const Teaching = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [pinnedIds, setPinnedIds] = useState(() => {
    const stored = localStorage.getItem('pinnedCourses');
    return stored ? JSON.parse(stored) : [];
  });
  const [filterOpen, setFilterOpen] = useState(false);
  const [courseFilter, setCourseFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [clickedMenuId, setClickedMenuId] = useState(null);
  const [showDelModal, setShowDelModal] = useState(false);
  const [delId, setDelId] = useState(null);
  const [delInput, setDelInput] = useState('');
  const filterOptions = [
    { value: 'all', label: t('courses.all') },
    { value: 'published', label: t('courses.actives') },
    { value: 'draft', label: t('courses.drafts') },
    { value: 'inactive', label: t('courses.inactives') },
  ];

  const courseStatusLabels = {
    open: t('courses.active'),
    published: t('courses.active'),
    draft: t('courses.draft'),
    inactive: t('courses.inactive')
  };
  const history = useHistory();

  const darkTheme = document.body.classList.contains('dark-theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const toggleMenu = (courseId) => {
    setActiveMenuId(prev => {
      const newValue = prev === courseId ? null : courseId;
      
      if (prev !== courseId) {
        setTimeout(() => {
          const allTiles = document.querySelectorAll('.item-tile');
          allTiles.forEach(tile => {
            tile.style.transition = 'none';
            tile.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
            
            const allElements = tile.querySelectorAll('*');
            allElements.forEach(el => {
              el.style.transition = 'none';
              if (el.style.transform && el.style.transform !== 'none') {
                el.style.transform = 'none';
              }
            });
          });
        }, 0);
      } else {
        setTimeout(() => {
          const allTiles = document.querySelectorAll('.item-tile');
          allTiles.forEach(tile => {
            tile.style.transition = 'box-shadow 0.25s cubic-bezier(.4,0,.2,1), transform 0.18s cubic-bezier(.4,0,.2,1)';
            tile.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
            
            const allElements = tile.querySelectorAll('*');
            allElements.forEach(el => {
              el.style.transition = '';
              el.style.transform = '';
            });
          });
        }, 100);
      }
      
      return newValue;
    });
    
    setClickedMenuId(courseId);
    setTimeout(() => setClickedMenuId(null), 320);
  };

  const togglePin = (courseId) => {
    setPinnedIds(prev => {
      let next;
      if (prev.includes(courseId)) {
        next = prev.filter(id => id !== courseId);
      } else {
        next = [...prev, courseId];
      }
      localStorage.setItem('pinnedCourses', JSON.stringify(next));
      return next;
    });
  };

  const headers = { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` };

  const handleEdit = (id) => {
    history.push(`/editcourse/${id}`);
  };

  const refreshCourses = async () => {
    try {
      const res = await axios.get('/courses', { headers });
      setCourses(res.data);
    } catch {}
  };

  const openDeleteModal = (id)=> { setDelId(id); setDelInput(''); setShowDelModal(true);} ;

  const confirmDelete = async ()=> {
    if(delInput!=='Delete') return;
    try{
      await axios.delete('/course', { headers, params:{ id: delId }});
      setCourses(prev=>prev.filter(c=>c.id!==delId));
    }catch(e){console.error('delete fail');}
    setShowDelModal(false);
  };

  const handleDelete = (id)=> openDeleteModal(id);

  const handleDuplicate = async (id) => {
    try {
      const course = courses.find(c=>c.id===id);
      if(!course) return;
      
      const courseData = {
        name: `${course.name} (копия)`,
        description: course.description,
        shortDescription: course.shortDescription,
        workload: course.workload,
        learningOutcomes: course.learningOutcomes,
        requirements: course.requirements,
        learningFormat: course.learningFormat,
        language: course.language,
        level: course.level,
        acquiredAssets: course.acquiredAssets,
        status: 'draft',
        category: course.category
      };

      await axios.post('/course/add', courseData, { headers });
      refreshCourses();
    }catch(e){
      console.error('Duplicate failed:', e);
      alert('Ошибка при копировании курса');
    }
  };

  const handleStatusChange = async (courseId, newStatus) => {
    try {
      await axios.patch(`/course/${courseId}/status`, { status: newStatus }, { headers });
      setCourses(prev => prev.map(course => 
        course.id === courseId ? { ...course, status: newStatus } : course
      ));
      setActiveMenuId(null);
      toast.success(`Course status updated to ${newStatus}`);
    } catch (e) {
      console.error('Status change failed:', e);
      toast.error('Error updating course status');
    }
  };

  useEffect(() => {
    axios.get('/courses', {
      headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` }
    })
      .then(res => {
        const all = res.data || [];
        const ordered = [...all].sort((a,b)=> (pinnedIds.includes(a.id)?-1:0) - (pinnedIds.includes(b.id)?-1:0));
        setCourses(ordered);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    const handleClickOutside = (e) => {
      if (!e.target.closest('.item-tile__tools') && !e.target.closest('.item-tile__dropdown')) {
        setActiveMenuId(null);
        
        setTimeout(() => {
          const allTiles = document.querySelectorAll('.item-tile');
          allTiles.forEach(tile => {
            tile.style.transition = 'box-shadow 0.25s cubic-bezier(.4,0,.2,1), transform 0.18s cubic-bezier(.4,0,.2,1)';
            tile.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
            
            const allElements = tile.querySelectorAll('*');
            allElements.forEach(el => {
              el.style.transition = '';
              el.style.transform = '';
            });
          });
        }, 100);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    setCourses(prev => {
      const ordered = [...prev].sort((a,b)=> (pinnedIds.includes(a.id)?-1:0) - (pinnedIds.includes(b.id)?-1:0));
      return ordered;
    });
  }, [pinnedIds]);
  const filteredCourses = courses
    .filter(course => {
      if (courseFilter === 'all') return true;
      if (courseFilter === 'published') return course.status === 'published';
      if (courseFilter === 'draft') return course.status === 'draft';
      if (courseFilter === 'inactive') return course.status === 'inactive';
      return true;
    })
    .filter(course => {
      if (!search.trim()) return true;
      const s = search.trim().toLowerCase();
      return (course.name && course.name.toLowerCase().includes(s)) || 
             (course.id && String(course.id).includes(s)) ||
             (course.description && course.description.toLowerCase().includes(s));
    });

  // Helper function for course count pluralization
  const getCourseCountText = (count) => {
    if (count === 1) {
      return t('courses.course_single');
    } else if (count < 5) {
      return t('courses.course_single');
    } else {
      return t('courses.title');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--teach-bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Глобальный стиль для отключения анимаций когда открыто меню */}
      {activeMenuId && (
        <style>
          {`
            .item-tile,
            .item-tile *,
            .item-tile:hover,
            .item-tile:hover * {
              transition: none !important;
              animation: none !important;
              transform: none !important;
              box-shadow: 0 1px 3px rgba(0,0,0,0.08) !important;
            }
            
            .item-tile .item-tile__tools * {
              transition: none !important;
              transform: none !important;
            }
          `}
        </style>
      )}
      <NavBar />
      <div style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - 60px)' }}>
        <TeachNavMenu variant="teach" theme={theme} />
        <main style={{ flex: 1, padding: '32px 24px', background: 'var(--teach-bg)', color: 'var(--teach-fg)' }}>
          {/* Заголовок и кнопка создания курса */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h1 style={{ fontWeight: 700, fontSize: 32, margin: 0, color: 'var(--teach-text-color)', transition: 'color 0.22s' }}>
              {t('courses.title', 'Курсы')}
            </h1>
            <button
              onClick={() => history.push('/addcourse/2')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 20px',
                background: '#54ad54',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: 16,
                transition: 'background 0.18s'
              }}
              onMouseOver={e => e.currentTarget.style.background = '#45a045'}
              onMouseOut={e => e.currentTarget.style.background = '#54ad54'}
            >
              <FontAwesomeIcon icon={faPlus} />
              {t('teach.create_course')}
            </button>
          </div>
          
          {/* Панель фильтров и поиска */}
          <div style={{ 
            display: 'flex', 
            gap: 16, 
            marginBottom: 24, 
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            {/* Выпадающий список фильтров */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 16px',
                  border: '1px solid var(--border-color)',
                  borderRadius: 6,
                  background: 'var(--field-bg)',
                  color: 'var(--text-color)',
                  cursor: 'pointer',
                  minWidth: 140,
                  fontSize: 14,
                  fontWeight: 500
                }}
              >
                <FontAwesomeIcon icon={faFilter} />
                {filterOptions.find(opt => opt.value === courseFilter)?.label || t('courses.all')}
                <span style={{ marginLeft: 'auto', fontSize: 12 }}>▼</span>
              </button>
              {filterOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  background: darkTheme ? '#2d3038' : '#fff',
                  border: `1px solid ${darkTheme ? '#444' : '#eaeaea'}`,
                  borderRadius: 6,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                  zIndex: 10,
                  minWidth: 140,
                  marginTop: 4
                }}>
                  {filterOptions.map(opt => (
                    <button
                      key={opt.value}
                      style={{
                        display: 'block',
                        width: '100%',
                        background: 'none',
                        border: 'none',
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontWeight: courseFilter === opt.value ? 600 : 400,
                        color: courseFilter === opt.value ? '#4485ed' : (darkTheme ? '#eaf4fd' : '#333'),
                        cursor: 'pointer',
                        fontSize: 14,
                        transition: 'background 0.15s',
                        borderRadius: 0,
                        borderBottom: `1px solid ${darkTheme ? '#444' : '#f0f0f0'}`
                      }}
                      onMouseOver={e => e.currentTarget.style.background = darkTheme ? '#3a3f4a' : '#f8f9fa'}
                      onMouseOut={e => e.currentTarget.style.background = 'none'}
                      onClick={() => { setCourseFilter(opt.value); setFilterOpen(false); }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Поле поиска */}
            <div style={{ position: 'relative', flex: 1, minWidth: 280 }}>
              <FontAwesomeIcon 
                icon={faSearch} 
                style={{ 
                  position: 'absolute', 
                  left: 12, 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: '#999',
                  fontSize: 14
                }} 
              />
              <input
                placeholder={t('courses.search_placeholder')}
                style={{ 
                  width: '100%',
                  padding: '10px 16px 10px 40px', 
                  borderRadius: 6, 
                  border: '1px solid var(--border-color)', 
                  fontSize: 14, 
                  background: 'var(--field-bg)', 
                  color: 'var(--text-color)',
                  transition: 'border-color 0.18s'
                }}
                value={search}
                onChange={e => setSearch(e.target.value)}
                onFocus={e => e.target.style.borderColor = '#4485ed'}
                onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
              />
            </div>

            {/* Счетчик курсов */}
            <div style={{ 
              padding: '8px 16px', 
              background: darkTheme ? '#2d3038' : '#f8f9fa', 
              borderRadius: 6, 
              fontSize: 14, 
              color: darkTheme ? '#b6d4fe' : '#666',
              border: `1px solid ${darkTheme ? '#444' : '#e9ecef'}`
            }}>
              {filteredCourses.length} {getCourseCountText(filteredCourses.length)}
            </div>
          </div>
          
          {/* Список курсов */}
          {loading ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 20px', 
              color: 'var(--text-color)', 
              fontSize: 16 
            }}>
              {t('common.loading')}
            </div>
          ) : filteredCourses.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 20px', 
              color: 'var(--text-color)', 
              opacity: 0.7 
            }}>
              {search.trim() ? 
                t('teach.no_search_results', { search: search }) : 
                courseFilter === 'all' ? 
                  t('teach.no_courses') : 
                  t('teach.no_courses_with_status', { status: filterOptions.find(opt => opt.value === courseFilter)?.label })
              }
            </div>
          ) : (
            <div className="course-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 24
            }}>
              {filteredCourses.map(course => (
                <div key={course.id} className="item-tile" style={{
                  display: 'grid',
                  gridTemplateAreas: `"cover title title tools"\n"cover desc desc tools"\n"cover status status tools"\n"cover footer footer footer"`,
                  gridTemplateRows: 'auto auto auto auto',
                  gridTemplateColumns: '80px 1fr auto 40px',
                  padding: 20,
                  borderRadius: 12,
                  background: 'var(--teach-tile-bg, #fff)',
                  position: 'relative',
                  transition: activeMenuId ? 'none' : 'box-shadow 0.25s cubic-bezier(.4,0,.2,1), transform 0.18s cubic-bezier(.4,0,.2,1)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                  border: `1px solid ${darkTheme ? '#444' : '#f0f0f0'}`,
                  cursor: 'pointer'
                }}
                onClick={(e) => {
                  if (e.target.closest('.item-tile__tools') || e.target.closest('.item-tile__dropdown')) {
                    return;
                  }
                  history.push(`/editcourse/${course.id}`);
                }}
                onMouseOver={e => {
                  if (!activeMenuId) {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                  }
                }}
                onMouseOut={e => {
                  if (!activeMenuId) {
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
                  }
                }}
                onMouseEnter={e => {
                  if (activeMenuId) {
                    e.currentTarget.style.transition = 'none';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
                    
                    const allElements = e.currentTarget.querySelectorAll('*');
                    allElements.forEach(el => {
                      el.style.transition = 'none';
                    });
                  }
                }}>
                  
                  {/* Обложка курса */}
                  {course.logoUrl ? (
                    <img src={getCourseFileUrl(course.logoUrl)} alt={course.name} style={{ gridArea: 'cover', width: 64, height: 64, borderRadius: 4, objectFit: 'cover' }} />
                  ) : (
                    <div style={{ gridArea: 'cover', width: 64, height: 64, borderRadius: 4, background: '#eaeaea', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#777' }}>
                      <FontAwesomeIcon icon={faQuestion} />
                    </div>
                  )}

                  {/* Название курса */}
                  <h3 style={{ 
                    gridArea: 'title', 
                    margin: 0, 
                    fontSize: 18, 
                    fontWeight: 600, 
                    alignSelf: 'center', 
                    color: 'var(--text-color)',
                    lineHeight: 1.3
                  }}>
                    {course.name}
                  </h3>

                  {/* Описание курса (HTML) */}
                  <div
                    className="promo-html"
                    style={{ 
                      gridArea: 'desc', 
                      margin: 0, 
                      color: '#666', 
                      fontSize: 14,
                      lineHeight: 1.4,
                      maxHeight: 40,
                      overflow: 'hidden'
                    }}
                    dangerouslySetInnerHTML={{ __html: course.description || course.shortDescription || '' }}
                  />

                  {/* Статус курса */}
                  <div style={{ 
                    gridArea: 'status', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 8,
                    marginTop: 4
                  }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 500,
                      background: course.status === 'draft' ? '#fff3cd' : 
                                  (course.status === 'published') ? '#d4edda' : 
                                  course.status === 'inactive' ? '#f8d7da' : '#e2e3e5',
                      color: course.status === 'draft' ? '#856404' : 
                             (course.status === 'published') ? '#155724' : 
                             course.status === 'inactive' ? '#721c24' : '#6c757d',
                      border: `1px solid ${course.status === 'draft' ? '#ffeaa7' : 
                                         (course.status === 'published') ? '#c3e6cb' : 
                                         course.status === 'inactive' ? '#f5c6cb' : '#dee2e6'}`
                    }}>
                      {courseStatusLabels[course.status] || course.status}
                    </span>
                  </div>

                  {/* Инструменты курса */}
                  <div className="item-tile__tools" style={{ 
                    gridArea: 'tools', 
                    position: 'relative', 
                    zIndex: 1, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 8 
                  }}>
                    <span
                      style={{ 
                        cursor: 'pointer', 
                        color: pinnedIds.includes(course.id) ? '#54ad54' : '#b6d4fe', 
                        transition: activeMenuId ? 'none' : 'color 0.18s, transform 0.18s',
                        padding: '4px'
                      }}
                      onMouseOver={e => {
                        if (!activeMenuId) {
                          e.currentTarget.style.transform = 'scale(1.1)';
                        }
                      }}
                      onMouseOut={e => {
                        if (!activeMenuId) {
                          e.currentTarget.style.transform = 'scale(1)';
                        }
                      }}
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); togglePin(course.id); }}
                      title={pinnedIds.includes(course.id) ? 'Открепить курс' : 'Закрепить курс'}
                    >
                      <FontAwesomeIcon icon={faThumbtack} />
                    </span>
                    <span
                      style={{ 
                        color: '#888', 
                        cursor: 'pointer',
                        padding: '4px',
                        transition: activeMenuId ? 'none' : 'color 0.18s'
                      }}
                      onMouseOver={e => {
                        if (!activeMenuId) {
                          e.currentTarget.style.color = '#4485ed';
                        }
                      }}
                      onMouseOut={e => {
                        if (!activeMenuId) {
                          e.currentTarget.style.color = '#888';
                        }
                      }}
                      onClick={(e) => { e.stopPropagation(); e.preventDefault(); toggleMenu(course.id); }}
                      title="Действия"
                    >
                      <FontAwesomeIcon icon={faEllipsisV} />
                    </span>
                  </div>

                  {/* Выпадающее меню действий */}
                  {activeMenuId === course.id && (
                    <div className="item-tile__dropdown" style={{
                      position: 'absolute',
                      top: 24,
                      right: 0,
                      background: darkTheme ? '#2d3038' : '#fff',
                      border: `1px solid ${darkTheme ? '#444' : '#eaeaea'}`,
                      borderRadius: 6,
                      boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                      zIndex: 99999,
                      minWidth: 160,
                      overflow: 'hidden',
                      pointerEvents: 'auto',
                      willChange: 'auto'
                    }}>
                      <button className="dropdown-item" style={{
                        display: 'flex', 
                        alignItems: 'center', 
                        width: '100%', 
                        background: 'none', 
                        border: 'none', 
                        padding: '10px 16px', 
                        cursor: 'pointer',
                        color: darkTheme ? '#eaf4fd' : '#333',
                        fontSize: 14,
                        transition: 'background 0.15s'
                      }} 
                      onMouseOver={e => e.currentTarget.style.background = darkTheme ? '#3a3f4a' : '#f8f9fa'}
                      onMouseOut={e => e.currentTarget.style.background = 'none'}
                      onClick={(e) => { e.stopPropagation(); handleEdit(course.id); }}>
                        <FontAwesomeIcon icon={faPen} style={{ marginRight: 8, fontSize: 12 }} /> 
                        {t('common.edit')}
                      </button>
                      <button className="dropdown-item" style={{
                        display: 'flex', 
                        alignItems: 'center', 
                        width: '100%', 
                        background: 'none', 
                        border: 'none', 
                        padding: '10px 16px', 
                        cursor: 'pointer',
                        color: darkTheme ? '#eaf4fd' : '#333',
                        fontSize: 14,
                        transition: 'background 0.15s'
                      }}
                      onMouseOver={e => e.currentTarget.style.background = darkTheme ? '#3a3f4a' : '#f8f9fa'}
                      onMouseOut={e => e.currentTarget.style.background = 'none'}
                      onClick={(e) => { e.stopPropagation(); handleDuplicate(course.id); }}>
                        <FontAwesomeIcon icon={faCopy} style={{ marginRight: 8, fontSize: 12 }} /> 
                        {t('courses.duplicate')}
                      </button>
                      
                      {/* Разделитель */}
                      {((course.status !== 'published') || 
                        (course.status !== 'inactive')) && (
                        <div style={{ 
                          height: '1px', 
                          background: darkTheme ? '#444' : '#eaeaea', 
                          margin: '4px 0' 
                        }} />
                      )}
                      
                      {/* Изменение статуса */}
                      {(course.status !== 'published') && (
                        <button className="dropdown-item" style={{
                          display: 'flex', 
                          alignItems: 'center', 
                          width: '100%', 
                          background: 'none', 
                          border: 'none', 
                          padding: '10px 16px', 
                          cursor: 'pointer',
                          color: darkTheme ? '#eaf4fd' : '#333',
                          fontSize: 14,
                          transition: 'background 0.15s'
                        }}
                        onMouseOver={e => e.currentTarget.style.background = darkTheme ? '#3a3f4a' : '#f8f9fa'}
                        onMouseOut={e => e.currentTarget.style.background = 'none'}
                        onClick={(e) => { e.stopPropagation(); handleStatusChange(course.id, 'published'); }}>
                          <FontAwesomeIcon icon={faCheck} style={{ marginRight: 8, fontSize: 12, color: '#28a745' }} /> 
                          {t('editor.publish')}
                        </button>
                      )}
                      
                      {course.status !== 'draft' && (
                        <button className="dropdown-item" style={{
                          display: 'flex', 
                          alignItems: 'center', 
                          width: '100%', 
                          background: 'none', 
                          border: 'none', 
                          padding: '10px 16px', 
                          cursor: 'pointer',
                          color: darkTheme ? '#eaf4fd' : '#333',
                          fontSize: 14,
                          transition: 'background 0.15s'
                        }}
                        onMouseOver={e => e.currentTarget.style.background = darkTheme ? '#3a3f4a' : '#f8f9fa'}
                        onMouseOut={e => e.currentTarget.style.background = 'none'}
                        onClick={(e) => { e.stopPropagation(); handleStatusChange(course.id, 'draft'); }}>
                          <FontAwesomeIcon icon={faEdit} style={{ marginRight: 8, fontSize: 12, color: '#ffc107' }} /> 
                          {t('courses.make_draft')}
                        </button>
                      )}
                      
                      {(course.status !== 'inactive') && (
                        <button className="dropdown-item" style={{
                          display: 'flex', 
                          alignItems: 'center', 
                          width: '100%', 
                          background: 'none', 
                          border: 'none', 
                          padding: '10px 16px', 
                          cursor: 'pointer',
                          color: darkTheme ? '#eaf4fd' : '#333',
                          fontSize: 14,
                          transition: 'background 0.15s'
                        }}
                        onMouseOver={e => e.currentTarget.style.background = darkTheme ? '#3a3f4a' : '#f8f9fa'}
                        onMouseOut={e => e.currentTarget.style.background = 'none'}
                        onClick={(e) => { e.stopPropagation(); handleStatusChange(course.id, 'inactive'); }}>
                          <FontAwesomeIcon icon={faEyeSlash} style={{ marginRight: 8, fontSize: 12, color: '#6c757d' }} /> 
                          {t('courses.deactivate')}
                        </button>
                      )}
                      
                      {/* Разделитель */}
                      <div style={{ 
                        height: '1px', 
                        background: darkTheme ? '#444' : '#eaeaea', 
                        margin: '4px 0' 
                      }} />
                      
                      <button className="dropdown-item" style={{
                        display: 'flex', 
                        alignItems: 'center', 
                        width: '100%', 
                        background: 'none', 
                        border: 'none', 
                        padding: '10px 16px', 
                        cursor: 'pointer', 
                        color: '#d9534f',
                        fontSize: 14,
                        transition: 'background 0.15s'
                      }}
                      onMouseOver={e => e.currentTarget.style.background = darkTheme ? '#3a3f4a' : '#f8f9fa'}
                      onMouseOut={e => e.currentTarget.style.background = 'none'}
                      onClick={(e) => { e.stopPropagation(); handleDelete(course.id); }}>
                        <FontAwesomeIcon icon={faTrash} style={{ marginRight: 8, fontSize: 12 }} /> 
                        {t('common.delete')}
                      </button>
                    </div>
                  )}

                  {/* Ссылки в футере */}
                  <div className="item-tile__footer-links" style={{
                    gridArea: 'footer',
                    display: 'flex',
                    gap: 12,
                    fontSize: 14,
                    marginTop: 12,
                    zIndex: 1
                  }}>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
      <Footer />
      
      {/* Модальное окно подтверждения удаления */}
      {showDelModal && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          background: 'rgba(0,0,0,0.4)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 1000 
        }} onClick={() => setShowDelModal(false)}>
          <div style={{ 
            background: darkTheme ? '#2d3038' : '#fff', 
            padding: 32, 
            borderRadius: 8, 
            width: 400,
            border: `1px solid ${darkTheme ? '#444' : '#eaeaea'}`
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ 
              marginTop: 0, 
              color: darkTheme ? '#fff' : '#333',
              marginBottom: 16
            }}>
              {t('course.confirm_delete')}
            </h3>
            <p style={{ 
              color: darkTheme ? '#b6d4fe' : '#666',
              marginBottom: 20,
              lineHeight: 1.5
            }}>
              {t('course.confirm_delete_description')}
            </p>
            <input 
              value={delInput} 
              onChange={e => setDelInput(e.target.value)} 
              style={{ 
                width: '100%', 
                padding: '10px 12px', 
                border: `1px solid ${darkTheme ? '#444' : '#ccc'}`, 
                borderRadius: 4, 
                marginBottom: 20,
                background: darkTheme ? '#23272a' : '#fff',
                color: darkTheme ? '#eaf4fd' : '#333',
                fontSize: 14
              }} 
                              placeholder={t('course.enter_delete')}
            />
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setShowDelModal(false)} 
                style={{ 
                  padding: '10px 20px', 
                  border: `1px solid ${darkTheme ? '#666' : '#888'}`, 
                  background: 'transparent', 
                  cursor: 'pointer',
                  borderRadius: 4,
                  color: darkTheme ? '#eaf4fd' : '#333',
                  transition: 'all 0.18s'
                }}
                onMouseOver={e => e.currentTarget.style.background = darkTheme ? '#3a3f4a' : '#f8f9fa'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >
                {t('common.cancel')}
              </button>
              <button 
                disabled={delInput !== 'Delete'} 
                onClick={confirmDelete} 
                style={{ 
                  padding: '10px 20px', 
                  background: delInput === 'Delete' ? '#d9534f' : '#ccc', 
                  color: '#fff', 
                  border: 'none', 
                  cursor: delInput === 'Delete' ? 'pointer' : 'not-allowed', 
                  opacity: delInput === 'Delete' ? 1 : 0.6,
                  borderRadius: 4,
                  transition: 'all 0.18s'
                }}
                onMouseOver={e => {
                  if (delInput === 'Delete') {
                    e.currentTarget.style.background = '#c9302c';
                  }
                }}
                onMouseOut={e => {
                  if (delInput === 'Delete') {
                    e.currentTarget.style.background = '#d9534f';
                  }
                }}
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teaching; 