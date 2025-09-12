import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBook, faLayerGroup, faPlus, faUsers, faEdit, faList } from '@fortawesome/free-solid-svg-icons';
import { useHistory, useParams } from 'react-router-dom';
import useTheme from '../hooks/useTheme';
import axios from '../utils/axios';

const TeachNavMenu = ({ variant = 'teach', course: courseProp, onSectionChange }) => {
  const { t } = useTranslation();
  const history = useHistory();
  const { theme } = useTheme();
  const { id } = useParams();
  const [openDropdown, setOpenDropdown] = useState(null);
  const [course, setCourse] = useState(courseProp || null);
  const dropdownRefs = useRef([]);

  useEffect(() => {
    if (variant === 'editcourse' && !courseProp && id) {
      axios.get(`/course?id=${id}`)
        .then(res => setCourse(res.data))
        .catch(() => setCourse(null));
    }
  }, [id, courseProp, variant]);

  useEffect(() => {
    const handleClick = (e) => {
      if (variant === 'editcourse') {
        if (!dropdownRefs.current.some(ref => ref && ref.contains(e.target))) {
          setOpenDropdown(null);
        }
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [variant]);

  if (variant === 'teach') {
    return (
      <div className={`nav-menu teach-nav teachlearn__course-nav teach-nav--${theme}`} style={{ padding: '24px 0 0 0', width: '240px', background: 'var(--teach-nav-bg)', color: 'var(--teach-nav-fg)', display: 'flex', flexDirection: 'column', height: '100vh', minHeight: 0, borderRight: `1px solid ${theme === 'dark' ? '#404040' : '#eaeaea'}`, boxSizing: 'border-box' }}>
        <button
          className="teach-nav__new-course-btn button has-icon success is-outlined anim-scale"
          style={{ 
            width: '90%', 
            margin: '0 auto 16px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            background: theme === 'dark' ? '#2d2d2d' : '#ffffff', 
            border: `1.5px solid ${theme === 'dark' ? '#404040' : '#e9ecef'}`, 
            color: theme === 'dark' ? '#eaf4fd' : '#23272f', 
            borderRadius: 6, 
            fontWeight: 600, 
            fontSize: 17, 
            padding: '10px 0', 
            cursor: 'pointer', 
            transition: 'background 0.18s' 
          }}
          onClick={() => history.push(`/addcourse/2`)}
        >
          <FontAwesomeIcon icon={faPlus} style={{ marginRight: 8, fontSize: 18 }} />
          <span style={{ fontSize: 17 }}>{t('common.create_course')}</span>
        </button>
        <ul className="nav-menu__menu menu teach-nav__menu" style={{ listStyle: 'none', padding: 0, margin: 0 }}>

          <li className="menu-item">
            <a href="/teach/courses" style={{ display: 'flex', alignItems: 'center', padding: '10px 0', paddingLeft: '20px', color: theme === 'dark' ? '#eaf4fd' : '#23272f', textDecoration: 'none', borderRadius: 6, fontWeight: 600, fontSize: 17 }}>
              <FontAwesomeIcon icon={faBook} style={{ marginRight: 12, fontSize: 20 }} />
              <span style={{ fontSize: 17 }}>{t('teach.courses')}</span>
            </a>
          </li>
          <li className="menu-item">
            <a href="/teach/lessons" style={{ display: 'flex', alignItems: 'center', padding: '10px 0', paddingLeft: '20px', color: theme === 'dark' ? '#eaf4fd' : '#23272f', textDecoration: 'none', borderRadius: 6, fontWeight: 600, fontSize: 17 }}>
              <FontAwesomeIcon icon={faUsers} style={{ marginRight: 12, fontSize: 20 }} />
              <span style={{ fontSize: 17 }}>{t('teach.lessons')}</span>
            </a>
          </li>
          <li className="menu-item">
            <a href="/teach/students" style={{ display: 'flex', alignItems: 'center', padding: '10px 0', paddingLeft: '20px', color: theme === 'dark' ? '#eaf4fd' : '#23272f', textDecoration: 'none', borderRadius: 6, fontWeight: 600, fontSize: 17 }}>
              <FontAwesomeIcon icon={faUsers} style={{ marginRight: 12, fontSize: 20 }} />
              <span style={{ fontSize: 17 }}>{t('teach.my_students')}</span>
            </a>
          </li>
          <li className="menu-item">
            <a href="/teach/lessons/new" className="teach-nav-link" style={{ display: 'flex', alignItems: 'center', padding: '10px 0', paddingLeft: '20px', color: theme === 'dark' ? '#eaf4fd' : '#23272f', textDecoration: 'none', borderRadius: 6, fontWeight: 600, fontSize: 17 }}>
              <FontAwesomeIcon icon={faPlus} style={{ marginRight: 12, fontSize: 20 }} />
              <span style={{ fontSize: 17 }}>{t('teach.new_lesson')}</span>
            </a>
          </li>
        </ul>
        <div style={{ height: 24 }} />
      </div>
    );
  }

  if (variant === 'editcourse') {
    return (
      <div className={`nav-menu teach-nav teachlearn__course-nav teach-nav--${theme}`} style={{ padding: '24px 0 0 0', width: '240px', background: 'var(--teach-nav-bg)', color: 'var(--teach-nav-fg)', display: 'flex', flexDirection: 'column', height: '100vh', minHeight: 0, borderRight: `1px solid ${theme === 'dark' ? '#404040' : '#eaeaea'}`, boxSizing: 'border-box' }}>
        <ul className="nav-menu__menu menu teach-nav__menu" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          <li className="menu-item">
            <a 
              href={`/editcourse/${id}/syllabus-editor`} 
              style={{ display: 'flex', alignItems: 'center', padding: '10px 0', paddingLeft: '20px', color: theme === 'dark' ? '#eaf4fd' : '#23272f', textDecoration: 'none', borderRadius: 6, fontWeight: 600, fontSize: 17 }}
              onClick={(e) => {
                e.preventDefault();
                history.push(`/editcourse/${id}/syllabus-editor`);
              }}
            >
              <FontAwesomeIcon icon={faList} style={{ marginRight: 12, fontSize: 20 }} />
              <span style={{ fontSize: 17 }}>{t('course.content')}</span>
            </a>
          </li>
          <li className="menu-item">
            <a 
              href={`/teach/lessons?course=${id}`} 
              style={{ display: 'flex', alignItems: 'center', padding: '10px 0', paddingLeft: '20px', color: theme === 'dark' ? '#eaf4fd' : '#23272f', textDecoration: 'none', borderRadius: 6, fontWeight: 600, fontSize: 17 }}
              onClick={(e) => {
                e.preventDefault();
                history.push(`/teach/lessons?course=${id}`);
              }}
            >
              <FontAwesomeIcon icon={faLayerGroup} style={{ marginRight: 12, fontSize: 20 }} />
              <span style={{ fontSize: 17 }}>{t('lessons.course_lessons')}</span>
            </a>
          </li>
          <li className="menu-item">
            <a href="/teach/courses" style={{ display: 'flex', alignItems: 'center', padding: '10px 0', paddingLeft: '20px', color: theme === 'dark' ? '#eaf4fd' : '#23272f', textDecoration: 'none', borderRadius: 6, fontWeight: 600, fontSize: 17 }}>
              <FontAwesomeIcon icon={faBook} style={{ marginRight: 12, fontSize: 20 }} />
              <span style={{ fontSize: 17 }}>{t('teach.courses')}</span>
            </a>
          </li>
          <li className="menu-item">
            <a href="/teach/students" style={{ display: 'flex', alignItems: 'center', padding: '10px 0', paddingLeft: '20px', color: theme === 'dark' ? '#eaf4fd' : '#23272f', textDecoration: 'none', borderRadius: 6, fontWeight: 600, fontSize: 17 }}>
              <FontAwesomeIcon icon={faUsers} style={{ marginRight: 12, fontSize: 20 }} />
              <span style={{ fontSize: 17 }}>{t('teach.my_students')}</span>
            </a>
          </li>
          <li className="menu-item">
            <a href="/teach/lessons/new" className="teach-nav-link" style={{ display: 'flex', alignItems: 'center', padding: '10px 0', paddingLeft: '20px', color: theme === 'dark' ? '#eaf4fd' : '#23272f', textDecoration: 'none', borderRadius: 6, fontWeight: 600, fontSize: 17 }}>
              <FontAwesomeIcon icon={faPlus} style={{ marginRight: 12, fontSize: 20 }} />
              <span style={{ fontSize: 17 }}>{t('teach.new_lesson')}</span>
            </a>
          </li>
        </ul>
        <div style={{ height: 24 }} />
      </div>
    );
  }

  return null;
};

export default TeachNavMenu; 