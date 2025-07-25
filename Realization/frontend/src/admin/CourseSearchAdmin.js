import React, { useState } from 'react';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import TeachNavMenu from './TeachNavMenu';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import useTheme from '../hooks/useTheme';

const CourseSearchAdmin = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const { id } = useParams();
  const [query, setQuery] = useState('');

  const handleSearch = () => {
    if (!query.trim()) return;
    alert('Search is not implemented yet');
  };

  return (
    <div style={{ minHeight:'100vh', background:'var(--teach-bg)', color:'var(--teach-fg)', display:'flex', flexDirection:'column' }}>
      <NavBar />
      <div style={{ display:'flex', flex:1 }}>
        <TeachNavMenu variant="editcourse" course={{id:Number(id)}} />
        <main style={{ flex:1, padding:32 }}>
          <h1 style={{ fontWeight:700, fontSize:32, marginBottom:24, color: dark? '#fff':'#23272f' }}>{t('course_search.title')}</h1>
          <p style={{ fontSize:16, marginBottom:12 }}>{t('course_search.placeholder')}</p>
          <p style={{ fontSize:16, marginBottom:24 }}>{t('course_search.description')}</p>
          <input type="text" value={query} onChange={e=>setQuery(e.target.value)} placeholder={t('course_search.placeholder')} style={{ width:'100%', maxWidth:480, padding:'10px 14px', borderRadius:6, border:'1.5px solid var(--border-color)', background:'var(--field-bg)', color:'var(--text-color)', fontSize:16 }} />
          <button className="button anim-btn" onClick={handleSearch} style={{ marginLeft:12, padding:'10px 24px', borderRadius:6, background:'#4485ed', color:'#fff', border:'none', fontWeight:600, fontSize:16 }}>{t('course_search.button')}</button>
        </main>
      </div>
      <Footer />
    </div>
  )
};

export default CourseSearchAdmin; 