import React, { useEffect, useState, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import TeachNavMenu from './TeachNavMenu';
import { useTranslation } from 'react-i18next';
import axios from '../utils/axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisV, faPen, faCopy, faTrash, faThumbtack, faQuestion } from '@fortawesome/free-solid-svg-icons';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import Modal from '../components/Modal';
import './admin.css';

const ShowAllCoursesAdmin = ({ match }) => {
  const { t } = useTranslation();
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
    { value: 'draft', label: t('courses.draft') },
    { value: 'open', label: t('courses.open') },
    { value: 'inactive', label: t('courses.inactive') },
  ];
  const filterRef = useRef();
  const history = useHistory();

  const darkTheme = document.body.classList.contains('dark-theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const toggleMenu = (courseId) => {
    setActiveMenuId(prev => prev === courseId ? null : courseId);
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
      const newName = `${course.name} (копия)`;
      await axios.post('/course/add', { name:newName }, { headers });
      refreshCourses();
    }catch(e){console.error('dup fail')}
  };

  useEffect(() => {
    axios.get('/courses', {
      headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` }
    })
      .then(res => {
        const all = res.data || [];
        // reorder pinned to front
        const ordered = [...all].sort((a,b)=> (pinnedIds.includes(a.id)?-1:0) - (pinnedIds.includes(b.id)?-1:0));
        setCourses(ordered);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Close dropdowns on outside click
    const handleClickOutside = (e) => {
      if (!e.target.closest('.item-tile__tools') && !e.target.closest('.item-tile__dropdown')) {
        setActiveMenuId(null);
      }
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // update order when pinnedIds changes
  useEffect(() => {
    setCourses(prev => {
      const ordered = [...prev].sort((a,b)=> (pinnedIds.includes(a.id)?-1:0) - (pinnedIds.includes(b.id)?-1:0));
      return ordered;
    });
  }, [pinnedIds]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--teach-bg)', display: 'flex', flexDirection: 'column' }}>
      <NavBar />
      <div style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - 60px)' }}>
        <TeachNavMenu variant="teach" userId={match?.params?.id || 2} />
        <main style={{ flex: 1, padding: '32px 24px', background: 'var(--teach-bg)', color: 'var(--teach-fg)' }}>
          <h1 style={{ fontWeight: 700, fontSize: 32, marginBottom: 24, color: (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches || document.body.getAttribute('data-theme') === 'dark') ? '#fff' : 'var(--text-color)', transition: 'color 0.22s' }}>{t('courses.title')}</h1>
          <div style={{ display: 'flex', gap: 16, marginBottom: 24, alignItems: 'center' }}>
            <div ref={filterRef} style={{ position: 'relative' }}>
              <button
                id="ember1526_tb"
                className="select-box__toggle-btn"
                type="button"
                style={{ padding: '8px 18px', borderRadius: 6, border: '1px solid #ccc', background: 'var(--teach-btn-bg)', color: 'var(--teach-btn-fg)', fontWeight: 500, minWidth: 140, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                onClick={() => setFilterOpen(v => !v)}
                aria-haspopup="listbox"
                aria-expanded={filterOpen}
              >
              <span className="select-box-option__slot-item">
                  <span className="select-box-option__content">{filterOptions.find(opt => opt.value === courseFilter)?.label}</span>
              </span>
                <span style={{ marginLeft: 8, transition: 'transform 0.18s', transform: filterOpen ? 'rotate(180deg)' : 'none' }}>▼</span>
              </button>
              <div
                className="select-box__dropdown"
                style={{
                  position: 'absolute',
                  top: 44,
                  left: 0,
                  minWidth: 160,
                  background: 'var(--teach-tile-bg, #23272f)',
                  border: '1px solid #eaeaea',
                  borderRadius: 8,
                  boxShadow: filterOpen ? '0 8px 32px rgba(68,133,237,0.13)' : 'none',
                  zIndex: 10,
                  opacity: filterOpen ? 1 : 0,
                  pointerEvents: filterOpen ? 'auto' : 'none',
                  transform: filterOpen ? 'translateY(0)' : 'translateY(10px)',
                  transition: 'opacity 0.18s cubic-bezier(.4,0,.2,1), transform 0.18s cubic-bezier(.4,0,.2,1)',
                  display:'flex',
                  flexDirection:'column',
                }}
                role="listbox"
                tabIndex={-1}
              >
                {filterOptions.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    className="select-box__option menu-item"
                    style={{
                      width: '100%',
                      background: 'none',
                      border: 'none',
                      padding: '10px 18px',
                      textAlign: 'left',
                      fontWeight: courseFilter === opt.value ? 700 : 400,
                      color: courseFilter === opt.value ? '#4485ed' : (darkTheme ? '#eaf4fd' : '#222'),
                      cursor: 'pointer',
                      fontSize: 15,
                      transition: 'background 0.15s',
                      borderRadius: 6,
                    }}
                    aria-selected={courseFilter === opt.value}
                    onClick={() => { setCourseFilter(opt.value); setFilterOpen(false); }}
                  >
                    {opt.label}
            </button>
                ))}
              </div>
            </div>
            <input
              className="search-form__input"
              placeholder={t('courses.search_placeholder')}
              autoComplete="on"
              spellCheck={false}
              aria-label="Search"
              type="search"
              style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color)', minWidth: 220, fontSize: 15, background: 'var(--field-bg)', color: 'var(--text-color)' }}
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }}
            />
            <button
              className="button_with-loader search-form__submit teachlearn__search-form-submit"
              type="button"
              style={{ padding: '8px 18px', borderRadius: 6, background: '#54ad54', color: '#fff', fontWeight: 600, border: 'none', marginLeft: 4 }}
              onClick={() => { /* search is live, so just keep input value */ }}
            >
              {t('courses.search')}
            </button>
          </div>
          {loading ? (
            <div>{t('common.loading', 'Загрузка...')}</div>
          ) : (
            <div className="course-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 24
            }}>
              {courses
                .filter(course => {
                  if (courseFilter === 'all') return true;
                  if (courseFilter === 'draft') return course.status === 'draft';
                  if (courseFilter === 'open') return course.status === 'open';
                  if (courseFilter === 'inactive') return course.status === 'inactive';
                  return true;
                })
                .filter(course => {
                  if (!search.trim()) return true;
                  const s = search.trim().toLowerCase();
                  return (course.name && course.name.toLowerCase().includes(s)) || (course.id && String(course.id).includes(s));
                })
                .map(course => (
                  <div key={course.id} className="item-tile" style={{
                    display: 'grid',
                    gridTemplateAreas: `"cover title title tools"\n"cover desc desc tools"\n"cover link link link"\n"cover footer footer footer"`,
                    gridTemplateRows: 'auto auto auto auto',
                    gridTemplateColumns: '80px 1fr auto 40px',
                    padding: 20,
                    borderRadius: 12,
                    background: 'var(--teach-tile-bg, #fff)',
                    position: 'relative',
                    transition: 'box-shadow 0.25s cubic-bezier(.4,0,.2,1), transform 0.18s cubic-bezier(.4,0,.2,1)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                  }}>
                    <a className="item-tile__link-wrapper" href={`/course/${course.id}`} aria-label={`Link to the course ${course.name}`} />

                    {/* Cover image or placeholder */}
                    {course.logoUrl ? (
                      <img src={course.logoUrl} alt={course.name} style={{ gridArea: 'cover', width: 64, height: 64, borderRadius: 4, objectFit: 'cover' }} />
                    ) : (
                      <div style={{ gridArea: 'cover', width: 64, height: 64, borderRadius: 4, background: '#eaeaea', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#777' }}>
                        <FontAwesomeIcon icon={faQuestion} />
                      </div>
                    )}

                    {/* Title */}
                    <h3 style={{ gridArea: 'title', margin: 0, fontSize: 18, fontWeight: 600, alignSelf: 'center', color: 'var(--text-color)' }}>{course.name}</h3>

                    {/* Description */}
                    <p style={{ gridArea: 'desc', margin: 0, color: '#666', fontSize: 14 }}>{course.description || '-'}</p>

                    {/* Pin icon and menu */}
                    <div className="item-tile__tools" style={{ gridArea: 'tools', position: 'relative', zIndex: 1, display:'flex', alignItems:'center', gap:8 }}>
                      <span
                        className={`svg-icon pin_icon svg-icon_inline${pinnedIds.includes(course.id) ? ' pinned' : ''}`}
                        style={{ cursor:'pointer', color: pinnedIds.includes(course.id)? '#54ad54':'#b6d4fe', transition: 'color 0.18s, transform 0.18s' }}
                        onClick={(e)=>{e.preventDefault(); e.stopPropagation(); togglePin(course.id);}}
                      >
                          <FontAwesomeIcon icon={faThumbtack} />
                        </span>
                      <span
                        className={`svg-icon menu-more_icon svg-icon_inline${clickedMenuId === course.id ? ' clicked' : ''}`}
                        style={{ color: '#888', cursor: 'pointer' }}
                        onClick={(e) => { e.stopPropagation(); e.preventDefault(); toggleMenu(course.id); }}
                      >
                          <FontAwesomeIcon icon={faEllipsisV} />
                        </span>
                    </div>

                    {/* Tools menu button */}
                    {activeMenuId === course.id && (
                      <div className="item-tile__dropdown" style={{
                        position: 'absolute',
                        top: 24,
                        right: 0,
                        background: '#fff',
                        border: '1px solid #eaeaea',
                        borderRadius: 6,
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                        zIndex: 2,
                        minWidth: 140,
                        overflow: 'hidden'
                      }}>
                        <button className="dropdown-item" style={{
                          display: 'flex', alignItems: 'center', width: '100%', background: 'none', border: 'none', padding: '8px 12px', cursor: 'pointer'
                        }} onClick={(e) => { e.stopPropagation(); handleEdit(course.id); }}>
                          <FontAwesomeIcon icon={faPen} style={{ marginRight: 8 }} /> {t('common.edit', 'Редактировать')}
                        </button>
                        <button className="dropdown-item" style={{
                          display: 'flex', alignItems: 'center', width: '100%', background: 'none', border: 'none', padding: '8px 12px', cursor: 'pointer'
                        }} onClick={(e) => { e.stopPropagation(); handleDuplicate(course.id); }}>
                          <FontAwesomeIcon icon={faCopy} style={{ marginRight: 8 }} /> {t('courses.duplicate', 'Создать копию')}
                        </button>
                        <button className="dropdown-item" style={{
                          display: 'flex', alignItems: 'center', width: '100%', background: 'none', border: 'none', padding: '8px 12px', cursor: 'pointer', color: '#d9534f'
                        }} onClick={(e) => { e.stopPropagation(); handleDelete(course.id); }}>
                          <FontAwesomeIcon icon={faTrash} style={{ marginRight: 8 }} /> {t('common.delete', 'Удалить')}
                        </button>
                      </div>
                    )}

                    {/* Footer links, hidden by default, appear on hover */}
                    <div className="item-tile__footer-links" style={{
                      gridArea: 'footer',
                      display: 'none',
                      gap: 12,
                      fontSize: 14,
                      marginTop: 12,
                      zIndex: 1
                    }}>
                      <a href={`/course/${course.id}#description`} style={{ color: 'var(--link-color)' }}>{t('courses.description', 'Описание')}</a>
                      <a href={`/course/${course.id}#contents`} style={{ color: 'var(--link-color)' }}>{t('courses.contents', 'Содержание')}</a>
                      <a href={`/course/${course.id}/access`} style={{ color: 'var(--link-color)' }}>{t('courses.access_rights', 'Права доступа')}</a>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </main>
      </div>
      <Footer />
      {showDelModal && (
        <div style={{ position:'fixed', top:0,left:0,right:0,bottom:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }} onClick={()=>setShowDelModal(false)}>
          <div style={{ background:'#fff', padding:32, borderRadius:8, width:320 }} onClick={e=>e.stopPropagation()}>
            <h3 style={{marginTop:0}}>Подтвердите удаление</h3>
            <p>Введите <b>Delete</b> для подтверждения операции.</p>
            <input value={delInput} onChange={e=>setDelInput(e.target.value)} style={{ width:'100%', padding:8, border:'1px solid #ccc', borderRadius:4, marginBottom:12 }} />
            <div style={{ display:'flex', gap:12, justifyContent:'flex-end' }}>
              <button onClick={()=>setShowDelModal(false)} style={{ padding:'8px 16px', border:'1px solid #888', background:'#fff', cursor:'pointer' }}>Отмена</button>
              <button disabled={delInput!=='Delete'} onClick={confirmDelete} style={{ padding:'8px 16px', background:'#d9534f', color:'#fff', border:'none', cursor: delInput==='Delete'?'pointer':'not-allowed', opacity: delInput==='Delete'?1:0.6 }}>Удалить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShowAllCoursesAdmin; 