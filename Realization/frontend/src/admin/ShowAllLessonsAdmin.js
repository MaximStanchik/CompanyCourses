import React, { useEffect, useState, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import TeachNavMenu from './TeachNavMenu';
import { useTranslation } from 'react-i18next';
import axios from '../utils/axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisV, faPen, faCopy, faTrash, faThumbtack } from '@fortawesome/free-solid-svg-icons';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import './admin.css';

const ShowAllLessonsAdmin = ({ match }) => {
  const { t } = useTranslation();
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [pinnedIds, setPinnedIds] = useState(() => {
    const stored = localStorage.getItem('pinnedLessons');
    return stored ? JSON.parse(stored) : [];
  });
  const [filterOpen, setFilterOpen] = useState(false);
  const [lessonFilter, setLessonFilter] = useState('all');
  const [search, setSearch] = useState('');
  const filterOptions = [
    { value: 'all', label: t('lessons.all') },
    { value: 'draft', label: t('lessons.draft') },
    { value: 'out', label: t('lessons.out') },
  ];
  const filterRef = useRef();
  const history = useHistory();

  const toggleMenu = (lessonId) => {
    setActiveMenuId(prev => prev === lessonId ? null : lessonId);
  };

  const togglePin = (lessonId) => {
    setPinnedIds(prev => {
      const next = prev.includes(lessonId) ? prev.filter(id => id !== lessonId) : [...prev, lessonId];
      localStorage.setItem('pinnedLessons', JSON.stringify(next));
      return next;
    });
  };

  const headers = { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` };

  const handleEdit = (id) => {
    history.push(`/editlesson/${id}`);
  };

  const handleDuplicate = async (id) => {
    try {
      await axios.post(`/lesson/${id}/duplicate`, {}, { headers });
      // reload list
      const res = await axios.get('/lessons', { headers });
      setLessons(res.data);
    } catch (e) {
      console.error('Duplicate failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить урок безвозвратно?')) return;
    try {
      await axios.delete(`/lesson/${id}`, { headers });
      setLessons(prev => prev.filter(l => l.id !== id));
    } catch (e) {
      console.error('Delete failed');
    }
  };

  useEffect(() => {
    axios.get('/lessons', { headers:{ Authorization:`Bearer ${localStorage.getItem('jwtToken')}` }})
      .then(res => {
        const all = res.data || [];
        const ordered = [...all].sort((a,b)=> (pinnedIds.includes(a.id)?-1:0) - (pinnedIds.includes(b.id)?-1:0));
        setLessons(ordered);
        setLoading(false);
      })
      .catch(()=> setLoading(false));

    const handleClickOutside = (e) => {
      if (!e.target.closest('.item-tile__tools') && !e.target.closest('.item-tile__dropdown')) setActiveMenuId(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    setLessons(prev => {
      const ordered = [...prev].sort((a,b)=> (pinnedIds.includes(a.id)?-1:0) - (pinnedIds.includes(b.id)?-1:0));
      return ordered;
    });
  }, [pinnedIds]);

  return (
    <div style={{ minHeight:'100vh', background:'var(--teach-bg)', display:'flex', flexDirection:'column' }}>
      <NavBar />
      <div style={{ display:'flex', flex:1, minHeight:'calc(100vh - 60px)' }}>
        <TeachNavMenu userId={match?.params?.id || 2} />
        <main style={{ flex:1, padding:'32px 24px', background:'var(--teach-bg)', color:'var(--teach-fg)' }}>
          {/* Header */}
          <header className="marco-layout__header" style={{ marginBottom:24 }}>
            <h1 style={{ fontWeight: 700, fontSize: 32, marginBottom: 24, color: (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches || document.body.getAttribute('data-theme') === 'dark') ? '#fff' : 'var(--text-color)', transition: 'color 0.22s' }}>{t('lessons.title')}</h1>
          </header>

          {/* Toolbar */}
          <div className="teachlearn__content-header-toolbar" style={{ display:'flex', gap:16, marginBottom:24, alignItems:'center' }}>
            <div ref={filterRef} style={{ position:'relative' }}>
              <button
                id="filterLessons"
                className="select-box__toggle-btn"
                type="button"
                style={{ padding:'8px 18px', borderRadius:6, border:'1px solid #ccc', background:'var(--teach-btn-bg)', color:'var(--teach-btn-fg)', fontWeight:500, minWidth:140, display:'flex', alignItems:'center', justifyContent:'space-between' }}
                onClick={() => setFilterOpen(v => !v)}
                aria-haspopup="listbox"
                aria-expanded={filterOpen}
              >
                <span className="select-box-option__slot-item">
                  <span className="select-box-option__content">{filterOptions.find(opt => opt.value === lessonFilter)?.label}</span>
                </span>
                <span style={{ marginLeft:8, transition:'transform 0.18s', transform: filterOpen ? 'rotate(180deg)' : 'none' }}>▼</span>
              </button>
              <div
                className="select-box__dropdown"
                style={{
                  position:'absolute',
                  top:44,
                  left:0,
                  minWidth:160,
                  background:'var(--teach-tile-bg, #23272f)',
                  border:'1px solid #eaeaea',
                  borderRadius:8,
                  boxShadow: filterOpen ? '0 8px 32px rgba(68,133,237,0.13)' : 'none',
                  zIndex:10,
                  opacity: filterOpen ? 1 : 0,
                  pointerEvents: filterOpen ? 'auto' : 'none',
                  transform: filterOpen ? 'translateY(0)' : 'translateY(10px)',
                  transition: 'opacity 0.18s cubic-bezier(.4,0,.2,1), transform 0.18s cubic-bezier(.4,0,.2,1)',
                  display: 'flex',
                  flexDirection: 'column',
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
                      width:'100%',
                      background:'none',
                      border:'none',
                      padding:'10px 18px',
                      textAlign:'left',
                      fontWeight: lessonFilter === opt.value ? 700 : 400,
                      color: lessonFilter === opt.value ? '#4485ed' : '#eaf4fd',
                      cursor:'pointer',
                      fontSize:15,
                      transition:'background 0.15s',
                      borderRadius:6,
                    }}
                    aria-selected={lessonFilter === opt.value}
                    onClick={() => { setLessonFilter(opt.value); setFilterOpen(false); }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <input
              className="search-form__input"
              placeholder={t('lessons.search_placeholder','Название или ID урока')}
              autoComplete="on"
              spellCheck={false}
              aria-label="Search"
              type="search"
              style={{ padding:'8px 12px', borderRadius:6, border:'1px solid var(--border-color)', minWidth:220, fontSize:15, background: 'var(--field-bg)', color: 'var(--text-color)' }}
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
              {t('lessons.search', 'Искать')}
            </button>
          </div>

          {loading ? (
            <div>{t('common.loading','Загрузка...')}</div>
          ) : lessons.length === 0 ? (
            <div style={{fontSize:18, color:'var(--text-color)', marginTop:32}}>{t('lessons.no_lessons','Уроки не найдены')}</div>
          ) : (
            <div className="lessons-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:24 }}>
              {lessons
                .filter(lesson => {
                  if (lessonFilter === 'all') return true;
                  if (lessonFilter === 'draft') return lesson.status === 'draft';
                  if (lessonFilter === 'out') return lesson.status === 'out';
                  return true;
                })
                .filter(lesson => {
                  if (!search.trim()) return true;
                  const s = search.trim().toLowerCase();
                  return (lesson.name && lesson.name.toLowerCase().includes(s)) || (lesson.id && String(lesson.id).includes(s));
                })
                .map(lesson => (
                <div key={lesson.id} className="item-tile" style={{
                  display:'grid',
                  gridTemplateAreas:`"cover title title tools"\n"cover desc desc tools"\n"cover link link link"\n"cover footer footer footer"`,
                  gridTemplateRows:'auto auto auto auto',
                  gridTemplateColumns:'80px 1fr auto 40px',
                  padding:20,
                  borderRadius:12,
                  background:'var(--teach-tile-bg, #fff)',
                  position:'relative',
                  transition:'box-shadow 0.25s cubic-bezier(.4,0,.2,1), transform 0.18s cubic-bezier(.4,0,.2,1)',
                  boxShadow:'0 1px 3px rgba(0,0,0,0.08)'
                }}>
                  <a className="item-tile__link-wrapper" href={`/lesson/${lesson.id}`} aria-label={`Link to the lesson ${lesson.name}`}/>

                  <div style={{ gridArea:'cover', width:64, height:64, borderRadius:4, background:'#eaeaea' }}></div>
                  <h3 style={{ gridArea:'title', margin:0, fontSize:18, fontWeight:600, alignSelf:'center', color: 'var(--text-color)' }}>{lesson.name}</h3>
                  <p style={{ gridArea:'desc', margin:0, color:'#666', fontSize:14 }}>{lesson.description || '-'}</p>

                  <div className="item-tile__tools" style={{ gridArea:'tools', position:'relative', zIndex:1, display:'flex', alignItems:'center', gap:8 }}>
                    <span
                      className={`svg-icon pin_icon svg-icon_inline${pinnedIds.includes(lesson.id) ? ' pinned' : ''}`}
                      style={{ cursor:'pointer', color: pinnedIds.includes(lesson.id)? '#54ad54':'#b6d4fe', transition: 'color 0.18s, transform 0.18s' }}
                      onClick={(e)=>{ e.preventDefault(); e.stopPropagation(); togglePin(lesson.id); }}
                    >
                      <FontAwesomeIcon icon={faThumbtack}/>
                    </span>
                    <span className="svg-icon menu-more_icon svg-icon_inline" style={{ color:'#888', cursor:'pointer' }} onClick={(e)=>{ e.preventDefault(); e.stopPropagation(); toggleMenu(lesson.id); }}>
                      <FontAwesomeIcon icon={faEllipsisV}/>
                    </span>
                  </div>

                  {activeMenuId === lesson.id && (
                    <div className="item-tile__dropdown" style={{ position:'absolute', top:24, right:0, background:'#fff', border:'1px solid #eaeaea', borderRadius:6, boxShadow:'0 4px 8px rgba(0,0,0,0.1)', zIndex:2, minWidth:140 }}>
                      <button className="dropdown-item" style={{ display:'flex', alignItems:'center', width:'100%', background:'none', border:'none', padding:'8px 12px', cursor:'pointer' }} onClick={(e)=>{e.stopPropagation(); handleEdit(lesson.id); }}>
                        <FontAwesomeIcon icon={faPen} style={{ marginRight:8 }}/> {t('common.edit','Редактировать')}
                      </button>
                      <button className="dropdown-item" style={{ display:'flex', alignItems:'center', width:'100%', background:'none', border:'none', padding:'8px 12px', cursor:'pointer' }} onClick={(e)=>{e.stopPropagation(); handleDuplicate(lesson.id); }}>
                        <FontAwesomeIcon icon={faCopy} style={{ marginRight:8 }}/> {t('lessons.duplicate','Создать копию')}
                      </button>
                      <button className="dropdown-item" style={{ display:'flex', alignItems:'center', width:'100%', background:'none', border:'none', padding:'8px 12px', cursor:'pointer', color:'#d9534f' }} onClick={(e)=>{e.stopPropagation(); handleDelete(lesson.id); }}>
                        <FontAwesomeIcon icon={faTrash} style={{ marginRight:8 }}/> {t('common.delete','Удалить')}
                      </button>
                    </div>
                  )}

                  <div className="item-tile__footer-links" style={{ gridArea:'footer', display:'none', gap:12, fontSize:14, marginTop:12 }}>
                    <a href={`/lesson/${lesson.id}#description`} style={{ color:'var(--link-color)' }}>{t('lessons.description','Описание')}</a>
                    <a href={`/lesson/${lesson.id}#contents`} style={{ color:'var(--link-color)' }}>{t('lessons.contents','Содержание')}</a>
                    <a href={`/lesson/${lesson.id}/access`} style={{ color:'var(--link-color)' }}>{t('lessons.access_rights','Права доступа')}</a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default ShowAllLessonsAdmin; 