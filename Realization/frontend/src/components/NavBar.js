import React, { useState, useEffect } from 'react';
import { Link, useHistory, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logoutUser } from "../actions/authActions";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCode,
  faUser,
  faUsers,
  faList,
  faBars,
  faFileCode,
  faComputer,
  faSignOutAlt,
  faSignIn,
  faComments,
  faPeopleGroup,
  faGraduationCap,
  faMoon,
  faSun,
  faUserCircle,
  faGlobe,
  faBook,
  faPlus,
  faBell,
  faEnvelope,
  faChalkboardTeacher,
  faQuestion,
  faLayerGroup,
} from "@fortawesome/free-solid-svg-icons";
import useTheme from "../hooks/useTheme";
import "../components/NavBarStyle.css";
import i18n from '../i18n';
import axios from "../utils/axios";

const NavBar = () => {
  const t = i18n.t.bind(i18n);
  const location = useLocation();
  const [displayProp, setDisplayProp] = React.useState("none");
  const [flexProp, setFlexProp] = React.useState("row");
  const [showModal, setShowModal] = React.useState(false);
  const [currentLangCode, setCurrentLangCode] = useState(localStorage.getItem('language') || 'en');
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [categoriesTree, setCategoriesTree] = useState([]);
  const [selectedMain, setSelectedMain] = useState(null);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  // Always get the latest language from localStorage on render
  const displayedLangCode = localStorage.getItem('language') || currentLangCode;

  const { theme, toggleTheme } = useTheme();
  const dispatch = useDispatch();
  const history = useHistory();
  const { isAuthenticated, users } = useSelector((state) => state.auth);
  const isAdmin = users?.roles?.some(r => String(r).toUpperCase().includes('ADMIN'));

  const languages = [
    { code: 'be', label: 'Беларуская' },
    { code: 'de', label: 'Deutsch' },
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
    { code: 'pt', label: 'Português' },
    { code: 'ru', label: 'Русский' },
    { code: 'uk', label: 'Українська' },
    { code: 'zh', label: '简体中文' },
  ];

  const changeLang = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('language', code);
    setCurrentLangCode(code);
    console.log('Language changed to:', code);
    setTimeout(() => {
      window.location.reload();
    }, 100); // Delay reload to ensure state updates
  };

  useEffect(() => {
    const storedLang = localStorage.getItem('language');
    if (storedLang && storedLang !== currentLangCode) {
      setCurrentLangCode(storedLang);
    }
  }); // Check localStorage on every render

  React.useEffect(() => {
    if (users?.id) {
      localStorage.setItem("userid", JSON.stringify(users.id));
    }
    if (users?.roles?.length > 0) {
      localStorage.setItem("userRole", JSON.stringify(users.roles[0]));
    }
  }, [users]);

  // Fetch categories once for catalog (no auth required)
  useEffect(() => {
    if (!catalogOpen || categoriesTree.length) return;
    axios.get('/categories').then(res => {
      const list = Array.isArray(res.data) ? res.data : [];
      // Build parent-child tree assuming each item has parentId field
      const map = {};
      list.forEach(c => { map[c.id] = { ...c, children: [] }; });
      const roots = [];
      list.forEach(c => {
        if (c.parentId && map[c.parentId]) {
          map[c.parentId].children.push(map[c.id]);
        } else {
          roots.push(map[c.id]);
        }
      });
      setCategoriesTree(roots);
    }).catch(() => setCategoriesTree([]));
  }, [catalogOpen]);

  useEffect(() => {
    if (!langMenuOpen) return;
    const handler = (e) => {
      if (!e.target.closest('.language-submenu') && !e.target.closest('.fa-globe')) {
        setLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [langMenuOpen]);

  const handleLogoutConfirm = () => {
    dispatch(logoutUser());
    history.push("/login");
    setShowModal(false);
  };

  const classToggle = () => {
    setDisplayProp((prev) => (prev === "none" ? "flex" : "none"));
    setFlexProp((prev) => (prev === "row" ? "column" : "row"));
  };

  // ThemeToggle
  const ThemeToggle = (
    <li onClick={toggleTheme} style={{ cursor: "pointer", color: "#ffffff" }}>
      <div className="menu-item">
        <FontAwesomeIcon icon={theme === "light" ? faMoon : faSun} size="2x" />
        <span>{theme === "light" ? t('navbar.light_mode') : t('navbar.dark_mode')}</span>
      </div>
    </li>
  );

  // logoutLink
  const logoutLink = (
    <li>
      <a href="#" onClick={(e) => { e.preventDefault(); setShowModal(true); }} style={{ color: '#fff' }}>
        <div className="menu-item">
          <FontAwesomeIcon icon={faSignOutAlt} size="2x" style={{ color: '#fff', marginRight: 0 }} />
          <span style={{ color: '#fff' }}>{t('navbar.logout')}</span>
        </div>
      </a>
    </li>
  );

  // guestLinks
  const guestLinks = (
    <li>
      <Link className="nav-link" to="/login">
        <div className="menu-item">
          <FontAwesomeIcon icon={faSignIn} size="2x" />
          <span>{t('navbar.login')}</span>
        </div>
      </Link>
    </li>
  );

  // LanguageSelect
  const LanguageSelect = (
    <li className="has-children" style={{ position: 'relative' }}>
      <a style={{ color: '#ffffff', cursor: 'pointer' }} onClick={e => { e.preventDefault(); setLangMenuOpen(v => !v); }}>
        <div className="menu-item">
          <FontAwesomeIcon icon={faGlobe} size="2x" />
          <span>{languages.find(l => l.code === displayedLangCode)?.label || displayedLangCode.toUpperCase()}</span>
        </div>
      </a>
      <ul className="submenu language-submenu" style={{ 
        position: 'absolute', 
        top: '100%', 
        left: '50%', 
        transform: 'translateX(-50%) translateY(-10px)', 
        background: '#fff', 
        listStyle: 'none', 
        padding: '10px 0', 
        margin: 0, 
        boxShadow: '0 6px 20px rgba(0,0,0,0.15)', 
        minWidth: 160, 
        zIndex: 999,
        opacity: langMenuOpen ? 1 : 0,
        visibility: langMenuOpen ? 'visible' : 'hidden',
        pointerEvents: langMenuOpen ? 'auto' : 'none',
        transition: 'opacity 0.3s ease, visibility 0.3s ease, transform 0.3s ease'
      }}>
        {languages.map(l => (
          <li key={l.code} onClick={e => { e.stopPropagation(); changeLang(l.code); setLangMenuOpen(false); }} style={{ cursor: 'pointer', padding: '6px 20px', whiteSpace: 'nowrap', fontSize: 14, transition: 'background 0.2s ease' }} onMouseEnter={e => e.currentTarget.style.background='#f1f5fb'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
            {l.label}
          </li>
        ))}
      </ul>
    </li>
  );

  // adminLinks
  const adminLinks = (
    <>
      <li className="has-children has-children--multilevel-submenu">
        <a>
          <div className="menu-item">
            <FontAwesomeIcon icon={faCode} size="2x" />
            <span>COURSES</span>
          </div>
        </a>
        <ul className="submenu">
          <li><a href={`/add-lecture/${users.id}`}>ADD LECTURE</a></li>
          <li><a href={`/services`}>{t('navbar.all_courses')}</a></li>
        </ul>
      </li>
      <li><a href="/ShowCourseList"><div className="menu-item"><FontAwesomeIcon icon={faList} size="2x" /><span>{t('navbar.courses')}</span></div></a></li>
      <li><a href="/ShowCategoryList"><div className="menu-item"><FontAwesomeIcon icon={faFileCode} size="2x" /><span>{t('navbar.categories')}</span></div></a></li>
      <li><a href="/EnrollmentList"><div className="menu-item"><FontAwesomeIcon icon={faComputer} size="2x" /><span>{t('navbar.enrolled_users')}</span></div></a></li>
      <li className="nav-item">
        <a className="nav-link" href={`/addcourse/${users.id}`} style={{ minWidth: 60, minHeight: 56, padding: '6px 8px', borderRadius: 8, transition: 'background 0.18s', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div className="menu-item">
            <FontAwesomeIcon icon={faChalkboardTeacher} size="2x" style={{ margin: 0, marginBottom: 2 }} />
            <span style={{ fontWeight: 500 }}>{t('navbar.teaching')}</span>
          </div>
        </a>
      </li>
      {LanguageSelect}
      {ThemeToggle}
      {logoutLink}
    </>
  );

  // userLinks
  const userLinks = (
    <>
      <li onClick={() => setCatalogOpen(true)} style={{cursor:'pointer'}}>
        <div className="menu-item">
          <FontAwesomeIcon icon={faBars} size="2x" />
          <span>{t('navbar.catalog') || 'Каталог'}</span>
        </div>
      </li>
      <li><a href="/my-training"><div className="menu-item"><FontAwesomeIcon icon={faGraduationCap} size="2x" /><span>{t('navbar.my_training')}</span></div></a></li>
      <li><a href="/Notifications"><div className="menu-item"><FontAwesomeIcon icon={faComments} size="2x" /><span>{t('navbar.notifications')}</span></div></a></li>
      <li className="has-children has-children--multilevel-submenu">
        <a>
          <div className="menu-item">
            <FontAwesomeIcon icon={faList} size="2x" />
            <span>{t('navbar.courses')}</span>
          </div>
        </a>
        <ul className="submenu">
          <li><a href={`/servicesforstudent/${users.id}`}>{t('navbar.my_courses')}</a></li>
          <li><a href="/services">{t('navbar.all_courses')}</a></li>
        </ul>
      </li>
      <li><a href="/edit-profile"><div className="menu-item"><FontAwesomeIcon icon={faUserCircle} size="2x" /><span>{t('navbar.profile')}</span></div></a></li>
      {LanguageSelect}
      {ThemeToggle}
      {logoutLink}
    </>
  );

  // Вместо renderLinks и условий по ролям, всегда рендерим полный набор пунктов:
  // Не показывать NavBar на страницах логина и регистрации
  if (location.pathname === "/login" || location.pathname === "/register") return null;

  return (
    <>
      <div className="header-area header-sticky header-sticky--default">
        <div className="header-area__desktop header-area__desktop--default">
          <div className="header-navigation-area default-bg" style={{ background: theme === 'light' ? 'rgb(52, 60, 77)' : '#18191c', transition: 'background 0.3s' }}>
            <div className="container">
              <div className="row">
                <div className="col-lg-12">
                  <div className="header-navigation header-navigation--header-default position-relative">
                    <div className="header-navigation__nav position-static" style={{ width: "100%" }}>
                      <nav className="main-nav">
                        <a href="/about">
                          <div className="logoHead">
                            <h2>MindForge</h2>
                          </div>
                        </a>
                        <ul id="main-nav-ul">
                          <li style={{marginRight: '18px'}}><a href="/ShowCourseList"><div className="menu-item"><FontAwesomeIcon icon={faList} size="2x" /><span>{t('navbar.courses')}</span></div></a></li>
                          <li style={{marginRight: '18px'}}><a href="/ShowCategoryList"><div className="menu-item"><FontAwesomeIcon icon={faFileCode} size="2x" /><span>{t('navbar.categories')}</span></div></a></li>
                          <li style={{marginRight: '18px'}}><a href="/EnrollmentList"><div className="menu-item"><FontAwesomeIcon icon={faComputer} size="2x" /><span>{t('navbar.enrolled_users')}</span></div></a></li>
                          {/* Для администратора показываем только "Преподавание" и не показываем Моє навчання и Профіль */}
                          {isAuthenticated && isAdmin && (
                            <>
                              <li style={{marginRight: '18px'}}><a href="/teach/courses"><div className="menu-item"><FontAwesomeIcon icon={faChalkboardTeacher} size="2x" /><span>{t('navbar.teaching')}</span></div></a></li>
                              <li style={{marginRight: '18px'}}>
                                <a href="/notifications">
                                  <div className="menu-item">
                                    <FontAwesomeIcon icon={faBell} size="2x" />
                                    <span>{t('navbar.notifications')}</span>
                                  </div>
                                </a>
                              </li>
                            </>
                          )}
                          {/* Для обычного пользователя показываем только "Моє навчання" и "Профіль", не показываем Преподавание */}
                          {isAuthenticated && !isAdmin && (
                            <>
                              <li style={{marginRight: '18px'}}><a href="/my-training"><div className="menu-item"><FontAwesomeIcon icon={faGraduationCap} size="2x" /><span>{t('navbar.my_training')}</span></div></a></li>
                              <li style={{marginRight: '18px'}}><a href="/edit-profile"><div className="menu-item"><FontAwesomeIcon icon={faUserCircle} size="2x" /><span>{t('navbar.profile')}</span></div></a></li>
                              <li style={{marginRight: '18px'}}><a href="/Notifications"><div className="menu-item"><FontAwesomeIcon icon={faComments} size="2x" /><span>{t('navbar.notifications')}</span></div></a></li>
                            </>
                          )}
                          <li style={{marginRight: '18px'}}>{LanguageSelect}</li>
                          <li style={{marginRight: '18px'}}>{ThemeToggle}</li>
                          <li>{logoutLink}</li>
                        </ul>
                        <div className="Navbar__Link Navbar__Link-toggle" onClick={classToggle}>
                          <i className="fas fa-bars" />
                        </div>
                      </nav>
                      <nav className="Navbar__Items" style={{ display: displayProp }}>
                        <ul style={{ display: displayProp, flexDirection: flexProp }}>
                          {/* renderLinks() */}
                        </ul>
                      </nav>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно */}
      {showModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)", display: "flex",
          alignItems: "center", justifyContent: "center", zIndex: 1000
        }}>
          <div style={{
            backgroundColor: "#fff", padding: "30px", borderRadius: "8px",
            textAlign: "center", minWidth: "300px", maxWidth: "400px", position: "relative"
          }}>
            <div style={{ fontSize: "40px", marginBottom: "10px" }}>🤔</div>
            <div style={{ fontSize: "18px", marginBottom: "20px" }}>
              {t('navbar.logout_confirm')}
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
              <button onClick={handleLogoutConfirm} style={{ backgroundColor: "#28a745", color: "white", padding: "8px 16px", border: "none", borderRadius: "4px" }}>
                {t('navbar.ok')}
              </button>
              <button onClick={() => setShowModal(false)} style={{ padding: "8px 16px", border: "1px solid gray", borderRadius: "4px", backgroundColor: "white" }}>
                {t('navbar.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {catalogOpen && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.55)',zIndex:10000,display:'flex',justifyContent:'center',alignItems:'flex-start',paddingTop:80}} onClick={()=>setCatalogOpen(false)}>
          <div onClick={e=>e.stopPropagation()} style={{background:theme==="light"?'#fff':'#23272f',color:theme==="light"?'#23272f':'#eaf4fd',borderRadius:12,width:'90%',maxWidth:900,maxHeight:'80vh',overflowY:'auto',boxShadow:'0 4px 16px rgba(0,0,0,0.25)',display:'flex'}}>
            {/* Left main categories */}
            <div style={{flex:1,borderRight:'1px solid #ccc',minWidth:200}}>
              <ul style={{listStyle:'none',margin:0,padding:20}}>
                {categoriesTree.map(cat=> (
                  <li key={cat.id} style={{padding:'6px 8px',cursor:'pointer',fontWeight:700}} onClick={()=>setSelectedMain(cat.id)}>{cat.name}</li>
                ))}
              </ul>
            </div>
            {/* Right nested panel */}
            <div style={{flex:2,padding:20}}>
              {selectedMain && renderSub(categoriesTree.find(c=>c.id===selectedMain))}
            </div>
          </div>
        </div>) }
    </>
  );
};

function renderSub(node){
  if(!node) return null;
  if(!node.children || node.children.length===0) return null;
  return (
    <ul style={{listStyle:'none',margin:0,paddingLeft:20}}>
      {node.children.map(child=> (
        <li key={child.id} style={{margin:'4px 0'}}>
          {child.name}
          {renderSub(child)}
        </li>
      ))}
    </ul>
  );
}

export default NavBar;
