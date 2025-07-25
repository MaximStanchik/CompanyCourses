import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faBook, faLayerGroup, faGraduationCap, faBell, faEnvelope, faBookOpen, faPlus, faQuestion } from '@fortawesome/free-solid-svg-icons';
import { useHistory, useParams } from 'react-router-dom';
import useTheme from '../hooks/useTheme';
import axios from '../utils/axios';

const TeachNavMenu = ({ variant = 'teach', course: courseProp, onSectionChange }) => {
  const { t } = useTranslation();
  const history = useHistory();
  let theme = 'light';
  if (typeof window !== 'undefined') {
    if (document.body.classList.contains('dark-theme')) theme = 'dark';
  }
  const { id } = useParams();
  const [openDropdown, setOpenDropdown] = useState(null);
  const [course, setCourse] = useState(courseProp || null);
  const dropdownRefs = useRef([]);
  const [classesOpen, setClassesOpen] = useState(false);
  const classesRef = useRef();

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
      } else if (variant === 'teach') {
        if (classesRef.current && !classesRef.current.contains(e.target)) setClassesOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [variant]);

  if (variant === 'teach') {
    return (
      <div className={`nav-menu teach-nav teachlearn__course-nav teach-nav--${theme}`} style={{ padding: '24px 0 0 0', width: '240px', background: 'var(--teach-nav-bg)', color: 'var(--teach-nav-fg)', display: 'flex', flexDirection: 'column', height: '100vh', minHeight: 0, borderRight: '1px solid #eaeaea', boxSizing: 'border-box' }}>
        <button
          className="teach-nav__new-course-btn button has-icon success is-outlined anim-scale"
          style={{ width: '90%', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--btn-main-bg)', border: '1.5px solid var(--btn-main-border)', color: 'var(--btn-main-fg)', borderRadius: 6, fontWeight: 600, fontSize: 17, padding: '10px 0', cursor: 'pointer', transition: 'background 0.18s' }}
          onClick={() => history.push(`/addcourse/2`)}
        >
          <FontAwesomeIcon icon={faPlus} style={{ marginRight: 8, fontSize: 18 }} />
          <span style={{ fontSize: 17 }}>{t('common.create_course')}</span>
        </button>
        <ul className="nav-menu__menu menu teach-nav__menu" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          <li className="menu-item">
            <a
              href="#"
              onClick={e => { e.preventDefault(); history.push('/teach/courses'); }}
              style={{ display: 'flex', alignItems: 'center', padding: '10px 0', color: 'var(--teach-link-color)', textDecoration: 'none', borderRadius: 6, fontWeight: 700, fontSize: 17 }}
            >
              <FontAwesomeIcon icon={faBookOpen} style={{ marginRight: 12, fontSize: 20 }} />
              <span style={{ fontSize: 17 }}>{t('common.teaching')}</span>
            </a>
          </li>
          <li className="menu-item">
            <a href="/teach/courses" style={{ display: 'flex', alignItems: 'center', padding: '10px 0', color: 'var(--teach-link-color)', textDecoration: 'none', borderRadius: 6, fontWeight: 600, fontSize: 17 }}>
              <FontAwesomeIcon icon={faBook} style={{ marginRight: 12, fontSize: 20 }} />
              <span style={{ fontSize: 17 }}>{t('common.courses')}</span>
            </a>
          </li>
          <li className="menu-item">
            <a href="/teach/lessons" className="teach-nav-link" style={{ display: 'flex', alignItems: 'center', padding: '10px 0', color: 'var(--teach-link-color)', textDecoration: 'none', borderRadius: 6, fontWeight: 600, fontSize: 17 }}>
              <FontAwesomeIcon icon={faLayerGroup} style={{ marginRight: 12, fontSize: 20 }} />
              <span style={{ fontSize: 17 }}>{t('common.lessons')}</span>
            </a>
          </li>
          <li className={`menu-item menu-item--dropdown${classesOpen ? ' open' : ''}`} ref={classesRef} style={{ position: 'relative', transition: '0.18s' }}>
            <button
              type="button"
              style={{ display: 'flex', alignItems: 'center', padding: '10px 0', color: 'var(--teach-link-color)', textDecoration: 'none', background: 'none', border: 'none', width: '100%', font: 'inherit', cursor: 'pointer', borderRadius: 6, fontWeight: 600, fontSize: 17 }}
              onClick={() => setClassesOpen(v => !v)}
              aria-haspopup="menu"
              aria-expanded={classesOpen}
            >
              <FontAwesomeIcon icon={faGraduationCap} style={{ marginRight: 12, fontSize: 20 }} />
              <span style={{ fontSize: 17 }}>{t('common.classes')}</span>
              <FontAwesomeIcon icon={faChevronDown} style={{ marginLeft: 'auto', transition: 'transform 0.18s', transform: classesOpen ? 'rotate(180deg)' : 'none' }} />
            </button>
            <ul
              className="teach-nav__dropdown"
              style={{
                maxHeight: classesOpen ? 2 * 44 + 'px' : '0px',
                overflow: 'hidden',
                background: 'var(--teach-tile-bg, #fff)',
                borderRadius: 8,
                margin: 0,
                padding: 0,
                listStyle: 'none',
                boxShadow: 'none',
                border: classesOpen ? '1px solid #eaeaea' : 'none',
                transition: 'max-height 0.18s cubic-bezier(.4,0,.2,1), border 0.18s',
              }}
              role="menu"
            >
              <li className="menu-item" role="menuitem">
                <a href="/teach/classes" style={{ display: 'flex', alignItems: 'center', padding: '10px 0', color: 'var(--teach-link-color)', background: 'var(--teach-tile-bg, #fff)', textDecoration: 'none', borderRadius: 6, fontSize: 17 }}>
                  {t('common.classes')}
                </a>
              </li>
              <li className="menu-item" role="menuitem">
                <a href="/teach/students" style={{ display: 'flex', alignItems: 'center', padding: '10px 0', color: 'var(--teach-link-color)', background: 'var(--teach-tile-bg, #fff)', textDecoration: 'none', borderRadius: 6, fontSize: 17 }}>
                  {t('teach.my_students', 'Мои учащиеся')}
                </a>
              </li>
            </ul>
          </li>
          <li className="menu-item">
            <a href="/notifications" style={{ display: 'flex', alignItems: 'center', padding: '10px 0', color: 'var(--teach-link-color)', textDecoration: 'none', borderRadius: 6, fontWeight: 600, fontSize: 17 }}>
              <FontAwesomeIcon icon={faBell} style={{ marginRight: 12, fontSize: 20 }} />
              <span style={{ fontSize: 17 }}>{t('common.notifications')}</span>
            </a>
          </li>
          <li className="menu-item">
            <a href="/teach/mailing" style={{ display: 'flex', alignItems: 'center', padding: '10px 0', color: 'var(--teach-link-color)', textDecoration: 'none', borderRadius: 6, fontWeight: 600, fontSize: 17 }}>
              <FontAwesomeIcon icon={faEnvelope} style={{ marginRight: 12, fontSize: 20 }} />
              <span style={{ fontSize: 17 }}>{t('common.mailing')}</span>
            </a>
          </li>
          <li className="menu-item-divider" style={{ borderTop: '1px solid #eaeaea', margin: '18px 0 0 0' }}></li>
          <li className="menu-item">
            <a href="/teach/lessons/new" className="teach-nav-link" style={{ display: 'flex', alignItems: 'center', padding: '10px 0', color: 'var(--teach-link-color)', textDecoration: 'none', borderRadius: 6, fontWeight: 600, fontSize: 17 }}>
              <FontAwesomeIcon icon={faPlus} style={{ marginRight: 12, fontSize: 20 }} />
              <span style={{ fontSize: 17 }}>{t('common.new_lesson')}</span>
            </a>
          </li>
          <li className="menu-item-divider" style={{ borderTop: '1px solid #eaeaea', margin: '18px 0 0 0' }}></li>
          <li className="menu-item">
            <a href="https://help.stepik.org/collection/5642" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', padding: '10px 0', color: 'var(--teach-link-color)', textDecoration: 'none', borderRadius: 6, marginTop: 12, fontWeight: 600, fontSize: 17 }}>
              <FontAwesomeIcon icon={faQuestion} style={{ marginRight: 12, fontSize: 20 }} />
              <span style={{ fontSize: 17 }}>{t('common.help')}</span>
            </a>
          </li>
        </ul>
        <div style={{ height: 24 }} />
      </div>
    );
  }

  // ... editcourse variant (оставим пустым для краткости)
  return null;
};

export default TeachNavMenu; 