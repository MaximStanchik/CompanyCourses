import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faBook, faLayerGroup, faGraduationCap, faBell, faEnvelope, faBookOpen, faComments, faCog, faSearch, faPlus, faQuestion, faPen } from '@fortawesome/free-solid-svg-icons';
import { useHistory, useParams } from 'react-router-dom';
import useTheme from '../hooks/useTheme';
import axios from '../utils/axios';

const TeachNavMenu = ({ variant = 'teach', course: courseProp, onSectionChange }) => {
  const { t } = useTranslation();
  const history = useHistory();
  const { theme } = useTheme(); // используем useTheme
  // For editcourse variant
  const { id } = useParams();
  const [openDropdown, setOpenDropdown] = useState(null);
  const [course, setCourse] = useState(courseProp || null);
  const dropdownRefs = useRef([]);
  // For teach variant
  const [classesOpen, setClassesOpen] = useState(false);
  const classesRef = useRef();

  useEffect(() => {
    if (variant === 'editcourse' && !courseProp && id) {
      axios.get(`/course?id=${id}`)
        .then(res => setCourse(res.data))
        .catch(err => {
          console.warn('Course not found or request failed', err?.response?.status);
          setCourse(null);
        });
    }
  }, [id, courseProp, variant]);

  useEffect(() => {
    const handleClick = (e) => {
      if (variant === 'editcourse') {
        if (!dropdownRefs.current.some(ref => ref && ref.contains(e.target))) {
          setOpenDropdown(null);
        }
      } else if (variant === 'teach') {
        if (classesRef.current && !classesRef.current.contains(e.target)) setClassesOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [variant]);

  if (variant === 'teach') {
  return (
    <div className={`nav-menu teach-nav teachlearn__course-nav teach-nav--${theme}`} style={{ padding: '24px 12px 0px 18px', flex: '0 0 260px', minWidth: 240, maxWidth: 320, overflowY: 'auto', height: '100vh', minHeight: 0, background: 'var(--teach-nav-bg)', color: 'var(--teach-nav-fg)', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border-color)' }}>
      <button
        className="teach-nav__new-course-btn button has-icon success is-outlined anim-scale"
          style={{ width: '90%', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--btn-main-bg)', border: '1.5px solid var(--btn-main-border)', color: 'var(--btn-main-fg)', borderRadius: 6, fontWeight: 600, fontSize: 16, padding: '10px 0', cursor: 'pointer', transition: 'background 0.18s' }}
          onClick={() => history.push(`/addcourse/2`)}
      >
        <FontAwesomeIcon icon={faPlus} style={{ marginRight: 8 }} />
          <span>{t('teach.create_course')}</span>
      </button>
      <ul className="nav-menu__menu menu teach-nav__menu" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        <li className="menu-item">
          <a href="/teach/courses" style={{ display: 'flex', alignItems: 'center', padding: '10px 20px', color: 'var(--teach-link-color)', textDecoration: 'none', borderRadius: 6, fontWeight: 600 }}>
            <FontAwesomeIcon icon={faBook} style={{ marginRight: 12 }} />
            <span style={{ color: 'var(--teach-link-color)' }}>{t('teach.courses')}</span>
          </a>
        </li>
        <li className="menu-item">
          <a href="/notifications" style={{ display: 'flex', alignItems: 'center', padding: '10px 20px', color: 'var(--teach-link-color)', textDecoration: 'none', borderRadius: 6 }}>
            <FontAwesomeIcon icon={faBell} style={{ marginRight: 12 }} />
            <span style={{ color: 'var(--teach-link-color)' }}>{t('teach.notifications')}</span>
          </a>
        </li>
        <li className="menu-item">
          <a href="/teach/mailing" style={{ display: 'flex', alignItems: 'center', padding: '10px 20px', color: 'var(--teach-link-color)', textDecoration: 'none', borderRadius: 6 }}>
            <FontAwesomeIcon icon={faEnvelope} style={{ marginRight: 12 }} />
            <span>{t('teach.mailing')}</span>
          </a>
        </li>
        <li className="menu-item" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 0 0 0' }}>
          <a href="/teach/lessons/new" className="teach-nav-link" style={{ display: 'flex', alignItems: 'center', justifyContent:'center', padding: '10px 20px', color: 'var(--teach-link-color)', textDecoration: 'none', borderRadius: 6 }}>
            <FontAwesomeIcon icon={faPlus} />
            <span>{t('teach.new_lesson')}</span>
          </a>
        </li>
        <li className={`menu-item menu-item--dropdown${classesOpen ? ' open' : ''}`} ref={classesRef} style={{ position: 'relative', transition: '0.18s' }}>
          <button
            type="button"
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '10px 20px',
              color: 'var(--teach-link-color)',
              textDecoration: 'none',
              background: 'none',
              border: 'none',
              width: '100%',
              font: 'inherit',
              cursor: 'pointer',
              borderRadius: 6,
              fontWeight: 600
            }}
            onClick={() => setClassesOpen(v => !v)}
            aria-haspopup="menu"
            aria-expanded={classesOpen}
          >
            <FontAwesomeIcon icon={faGraduationCap} style={{ marginRight: 12 }} />
            <span>{t('teach.classes', 'Класи')}</span>
            <FontAwesomeIcon icon={faChevronDown} style={{ marginLeft: 'auto', transition: 'transform 0.18s', transform: classesOpen ? 'rotate(180deg)' : 'none' }} />
          </button>
          <ul
            className="teach-nav__dropdown"
            style={{
              maxHeight: classesOpen ? '88px' : '0px',
              overflow: 'hidden',
              background: 'var(--teach-tile-bg, #fff)',
              borderRadius: 8,
              margin: '4px 0 0 0',
              padding: 0,
              listStyle: 'none',
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              border: classesOpen ? '1.5px solid var(--border-color)' : 'none',
              transition: 'max-height 0.18s cubic-bezier(.4,0,.2,1), border 0.18s',
              textAlign: 'left'
            }}
            role="menu"
          >
            <li className="menu-item" role="menuitem">
              <a href="/teach/classes" style={{ display: 'flex', alignItems: 'center', padding: '10px 20px', color: 'var(--teach-link-color)', background: 'var(--teach-tile-bg, #fff)', textDecoration: 'none', borderRadius: 6, textAlign: 'left' }}>
                <span style={{textAlign: 'left'}}>{t('teach.my_classes', 'Мої класи')}</span>
              </a>
            </li>
            <li className="menu-item" role="menuitem">
              <a href="/teach/students" style={{ display: 'flex', alignItems: 'center', padding: '10px 20px', color: 'var(--teach-link-color)', background: 'var(--teach-tile-bg, #fff)', textDecoration: 'none', borderRadius: 6, textAlign: 'left' }}>
                <span style={{textAlign: 'left'}}>{t('teach.my_students', 'Мої студенти')}</span>
              </a>
            </li>
          </ul>
        </li>
      </ul>
      </div>
    );
  }

  // editcourse variant
  const DROPDOWNS = [
    {
      label: 'Курс',
      icon: faBookOpen,
      items: [
        { label: 'Описание', key: 'info' },
        { label: 'Содержание', key: 'syllabus' },
        { label: 'Чек-лист', key: 'checklist' },
      ]
    }
  ];

  // Обработчик кликов по пунктам дропдауна «Курс»
  const handleCourseItemClick = (key) => {
    if (typeof onSectionChange === 'function') {
      onSectionChange(key);
    } else {
      const base = `/editcourse/${id}`;
      if (key === 'syllabus') {
        history.push(`${base}/syllabus-editor`);
      } else if (key === 'info') {
        history.push(base);
      } else {
        history.push(`${base}?section=${key}`);
      }
    }
  };

  return (
    <div className={`nav-menu teach-nav teachlearn__course-nav teach-nav--${theme}`} style={{ padding: '24px 12px 0px 18px', flex: '0 0 260px', minWidth: 240, maxWidth: 320, overflowY: 'auto', height: '100vh', minHeight: 0, background: 'var(--teach-nav-bg)', color: 'var(--teach-nav-fg)', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border-color)' }}>
      {course && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <h1 style={{ fontWeight: 700, fontSize: 22, margin: 0, lineHeight: 1.2, flex: 1, color: theme === 'dark' ? '#fff' : '#23272f', transition:'color 0.22s' }}>{course.name}</h1>
            <button
              type="button"
              title="Изменить название"
              onClick={async () => {
                const newName = prompt('Введите новое название курса', course.name);
                if (newName && newName.trim() && newName.trim() !== course.name) {
                  try {
                    await axios.patch(`/courses/${course.id}`, { name: newName.trim() }, { headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` } });
                    setCourse({ ...course, name: newName.trim() });
                  } catch (err) {
                    console.error('Failed to rename course', err);
                    alert('Не удалось изменить название курса. Попробуйте позже.');
                  }
                }
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4485ed', padding: 4 }}
            >
              <FontAwesomeIcon icon={faPen} />
            </button>
          </div>
          <a
            className="button course-nav__publish-btn success is-outlined anim-scale"
            href={`/course/${course.id}/publication`}
            style={{ width:'90%', margin:'0 auto 16px', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--btn-main-bg)', border:'1.5px solid var(--btn-main-border)', color:'var(--btn-main-fg)', borderRadius:6, fontWeight:600, fontSize:16, padding:'10px 0', cursor:'pointer', transition:'background 0.18s' }}
          >
            Опубликовать
          </a>
        </div>
      )}
      <ul className="nav-menu__menu menu teach-nav__menu" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        <li className="menu-item">
          <a
            href="#"
            onClick={e => { e.preventDefault(); history.push('/addcourse/2'); }}
            style={{ display: 'flex', alignItems: 'center', padding: '10px 20px', color: 'var(--teach-link-color)', textDecoration: 'none', borderRadius: 6, fontWeight: 700, fontSize: 18 }}
          >
            <FontAwesomeIcon icon={faBookOpen} style={{ marginRight: 12 }} />
            <span>{t('teach.title')}</span>
          </a>
        </li>
        {DROPDOWNS.map((dropdown, idx) => (
          <li
            className={`menu-item menu-item--dropdown${openDropdown === idx ? ' open' : ''}`}
            key={dropdown.label}
            ref={el => dropdownRefs.current[idx] = el}
            style={{ position: 'relative', transition: 'all 0.18s' }}
          >
            <button
              type="button"
              style={{ display: 'flex', alignItems: 'center', padding: '10px 20px', color: 'var(--teach-link-color)', textDecoration: 'none', background: 'none', border: 'none', width: '100%', font: 'inherit', cursor: 'pointer', borderRadius: 6 }}
              onClick={() => setOpenDropdown(openDropdown === idx ? null : idx)}
              aria-haspopup="menu"
              aria-expanded={openDropdown === idx}
            >
              <FontAwesomeIcon icon={dropdown.icon} style={{ marginRight: 12 }} />
              <span>{dropdown.label}</span>
              <FontAwesomeIcon icon={faChevronDown} style={{ marginLeft: 'auto', transition: 'transform 0.18s', transform: openDropdown === idx ? 'rotate(180deg)' : 'none' }} />
            </button>
            <ul
              className="teach-nav__dropdown"
              style={{
                maxHeight: openDropdown === idx ? dropdown.items.length * 44 + 'px' : '0px',
                overflow: 'hidden',
                background: '#fff',
                borderRadius: 8,
                margin: 0,
                padding: 0,
                listStyle: 'none',
                boxShadow: 'none',
                border: openDropdown === idx ? '1px solid #eaeaea' : 'none',
                transition: 'max-height 0.18s cubic-bezier(.4,0,.2,1), border 0.18s',
              }}
              role="menu"
            >
              {dropdown.items.map(item => (
                <li className="menu-item" role="menuitem" key={item.label}>
                  <button type="button" className="teach-nav-link" style={{ display: 'flex', alignItems: 'center', padding: '10px 20px', color: 'var(--teach-link-color)', background: 'none', border: 'none', width: '100%', textAlign: 'left', borderRadius: 6, font: 'inherit', cursor: 'pointer' }}
                    onClick={() => handleCourseItemClick(item.key)}>
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </li>
        ))}
        <li className="menu-item">
          <a href={`/editcourse/${id}/search`} style={{ display: 'flex', alignItems: 'center', padding: '10px 20px', color: 'var(--teach-link-color)', textDecoration: 'none' }}>
            <FontAwesomeIcon icon={faSearch} style={{ marginRight: 12 }} />
            <span>Искать в курсе</span>
          </a>
        </li>
        <li className="menu-item">
          <a href="#" style={{ display: 'flex', alignItems: 'center', padding: '10px 20px', color: 'var(--teach-link-color)', textDecoration: 'none' }}>
            <FontAwesomeIcon icon={faPlus} style={{ marginRight: 12 }} />
            <span>Создать класс</span>
          </a>
        </li>
        {/* Общение с учащимися dropdown now under 'Создать класс' */}
        <li className="menu-item menu-item--dropdown" style={{ position:'relative', transition:'all 0.18s' }}>
          <button type="button" style={{ display:'flex', alignItems:'center', padding:'10px 20px', color:'var(--teach-link-color)', background:'none', border:'none', width:'100%', cursor:'pointer', borderRadius:6 }} onClick={()=> setOpenDropdown(openDropdown==='comm'?null:'comm')} aria-haspopup="menu" aria-expanded={openDropdown==='comm'}>
            <FontAwesomeIcon icon={faComments} style={{ marginRight:12 }} />
            <span>Общение с учащимися</span>
            <FontAwesomeIcon icon={faChevronDown} style={{ marginLeft:'auto', transition: 'transform 0.18s', transform: openDropdown==='comm' ? 'rotate(180deg)' : 'none' }} />
          </button>
          <ul className="teach-nav__dropdown" role="menu" style={{ maxHeight: openDropdown==='comm' ? '132px' : '0px', overflow:'hidden', background:'#fff', borderRadius:8, margin:0, padding:0, listStyle:'none', boxShadow:'0 4px 16px rgba(0,0,0,0.12)', border: openDropdown==='comm' ? '1px solid #eaeaea' : 'none', transition: 'max-height 0.18s cubic-bezier(.4,0,.2,1), border 0.18s' }}>
            <li className="menu-item" role="menuitem"><button type="button" className="teach-nav-link" onClick={()=>handleCourseItemClick('news')} style={{ display:'flex', alignItems:'center', padding:'10px 20px', color:'var(--teach-link-color)', background:'none', border:'none', width:'100%', textAlign:'left', borderRadius:6, font:'inherit', cursor:'pointer' }}>Новости</button></li>
            <li className="menu-item" role="menuitem"><button type="button" className="teach-nav-link" onClick={()=>handleCourseItemClick('comments')} style={{ display:'flex', alignItems:'center', padding:'10px 20px', color:'var(--teach-link-color)', background:'none', border:'none', width:'100%', textAlign:'left', borderRadius:6, font:'inherit', cursor:'pointer' }}>Комментарии</button></li>
            <li className="menu-item" role="menuitem"><button type="button" className="teach-nav-link" onClick={()=>handleCourseItemClick('reviews')} style={{ display:'flex', alignItems:'center', padding:'10px 20px', color:'var(--teach-link-color)', background:'none', border:'none', width:'100%', textAlign:'left', borderRadius:6, font:'inherit', cursor:'pointer' }}>Отзывы</button></li>
          </ul>
        </li>
      </ul>
      <div style={{ height: 24 }} />
    </div>
  );
};

export default TeachNavMenu; 