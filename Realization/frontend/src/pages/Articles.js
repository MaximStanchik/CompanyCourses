import React, { useState, useRef, useEffect } from 'react';
import { useHistory, Link } from 'react-router-dom';
import axios from '../utils/axios';
import i18n from '../i18n';
import { FaHeart, FaRegHeart } from 'react-icons/fa';

const mockArticles = [
  // Пустой массив статей
];

const mockAllArticles = [
  { id: 1, title: 'React Hooks Guide' },
  { id: 2, title: 'Understanding Redux' },
  { id: 3, title: 'JavaScript ES2024 Features' },
  { id: 4, title: 'CSS Grid vs Flexbox' },
];

const langOptions = [
  { value: 'en', label: 'EN' },
  { value: 'ru', label: 'RU' },
  { value: 'de', label: 'DE' },
  { value: 'es', label: 'ES' },
  { value: 'pt', label: 'PT' },
  { value: 'uk', label: 'UK' },
  { value: 'zh', label: 'ZH' },
  { value: 'be', label: 'BE' },
];

const t = i18n.t.bind(i18n);

function sortArticles(articles, sort) {
  if (sort === 'popularity') return [...articles].sort((a, b) => b.popularity - a.popularity);
  if (sort === 'new') return [...articles].sort((a, b) => new Date(b.date) - new Date(a.date));
  if (sort === 'old') return [...articles].sort((a, b) => new Date(a.date) - new Date(b.date));
  return articles;
}

function usePrefersDark() {
  const [dark, setDark] = useState(() => window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = e => setDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return dark;
}

function formatDate(iso){
  if(!iso) return '';
  const d=new Date(iso);
  return d.toLocaleDateString();
}

export default function Articles() {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('new');
  const [lang, setLang] = useState(()=>localStorage.getItem('language')||'ru');
  const [sortDropdown, setSortDropdown] = useState(false);
  const [tab, setTab] = useState('my'); // 'my' | 'all'
  const [theme, setTheme] = useState(null); // null=auto, 'dark', 'light'
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const prefersDark = usePrefersDark();
  const dark = theme ? theme === 'dark' : prefersDark;
  const history = useHistory();
  const inputRef = useRef();
  const [likes,setLikes]=useState(()=>JSON.parse(localStorage.getItem('articleLikes')||'{}'));
  const [myLikes,setMyLikes]=useState(()=>{
    try{return JSON.parse(localStorage.getItem('myArticleLikes')||'[]');}catch{return [];} });

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('articles')||'[]');
    const withLikes = stored.map(a=>({...a,popularity: likes[a.id]||a.popularity||0}));
    if(withLikes.length>0){
      setArticles(withLikes);
    } else {
      (async ()=>{
        setLoading(true);
        try{
          const res=await axios.get('/articles');
          const arr = (res.data||[]).map(a=>({...a,popularity: likes[a.id]||a.popularity||0}));
          setArticles(arr);
        }catch(err){console.error(err);}finally{setLoading(false);}
      })();
    }
  }, [likes]);

  const sortOptions = [
    { value: 'popularity', label: t('articles.sortPopularity') || 'По популярности' },
    { value: 'new', label: t('articles.sortNew') || 'Сначала новые' },
    { value: 'old', label: t('articles.sortOld') || 'Сначала старые' },
  ];

  const filtered = sortArticles(
    articles.filter(a => a.title?.toLowerCase().includes(query.toLowerCase())),
    sort
  );

  const formBg = dark ? '#26272b' : '#fff';
  const pageBg = dark ? '#18191c' : '#f6f7fa';
  const fieldBg = dark ? '#213747' : '#f9fafd';
  const fieldColor = dark ? '#ddd' : '#222';
  const borderColor = dark ? '#36607e' : '#e0e0e0';
  const tabActive = dark ? '#23272f' : '#fff';
  const tabInactive = dark ? 'transparent' : 'transparent';
  const tabActiveColor = dark ? '#eaf4fd' : '#3976a8';
  const tabInactiveColor = dark ? '#888' : '#888';

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) setTheme(savedTheme);
  }, []);
  useEffect(() => {
    if (theme) localStorage.setItem('theme', theme);
  }, [theme]);

  // Для кастомного dropdown
  const handleSortSelect = (val) => {
    setSort(val);
    setSortDropdown(false);
  };

  const handleLike = (id) => {
    const liked = myLikes.includes(id);
    setLikes(prev=>{
      let delta = liked? -1 : 1;
      const newCount=Math.max((prev[id]||0)+delta,0);
      const updated={...prev,[id]:newCount};
      localStorage.setItem('articleLikes',JSON.stringify(updated));
      setArticles(arts=>arts.map(a=>a.id===id? {...a,popularity:updated[id]}:a));
      return updated;
    });
    setMyLikes(prev=>{
      let arr=[...prev];
      if(liked){arr=arr.filter(x=>x!==id);}else{arr.push(id);} 
      localStorage.setItem('myArticleLikes',JSON.stringify(arr));
      return arr;
    });
  };

  // update language globally
  useEffect(()=>{
    i18n.changeLanguage(lang);
    localStorage.setItem('language',lang);
  },[lang]);

  return (
    <div style={{ background: pageBg, minHeight: '100vh', padding: '40px 0' }}>
      <div className="container">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, justifyContent: 'flex-end' }}>
          <select
            aria-label="Select language"
            style={{ padding: '0.4rem 1rem', borderRadius: 20, border: `1px solid ${borderColor}`, background: fieldBg, color: tabActiveColor, fontWeight: 'bold', cursor: 'pointer', marginRight: 10, fontSize: '1rem' }}
            value={lang}
            onChange={e => { localStorage.setItem('language', e.target.value); window.location.reload(); }}
          >
            {langOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            style={{ padding: '0.5rem 1.5rem', backgroundColor: '#3976a8', color: '#fff', border: 'none', borderRadius: 20, cursor: 'pointer', fontSize: '1rem', transition: '0.3s', transform: 'translateY(0px)', boxShadow: 'none', marginRight: 10 }}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {dark ? (t('navbar.light_mode') || 'Светлая тема') : (t('navbar.dark_mode') || 'Тёмная тема')}
          </button>
          <button
            style={{ padding: '0.5rem 1.5rem', backgroundColor: '#3976a8', color: '#fff', border: 'none', borderRadius: 20, cursor: 'pointer', fontSize: '1rem', transition: '0.3s', transform: 'translateY(0px)', boxShadow: 'none', marginRight: 10 }}
            onClick={() => history.push('/')}
          >
            {t('reviews.back') || 'Назад'}
          </button>
        </div>
        <div style={{ display: 'flex', gap: 0, marginBottom: 32, borderBottom: `2px solid ${borderColor}` }}>
          <button
            onClick={() => setTab('my')}
            style={{
              background: tab === 'my' ? tabActive : tabInactive,
              border: 'none',
              borderBottom: tab === 'my' ? `2.5px solid #3976a8` : `2.5px solid transparent`,
              color: tab === 'my' ? tabActiveColor : tabInactiveColor,
              fontWeight: 600,
              fontSize: 18,
              padding: '12px 32px',
              cursor: 'pointer',
              borderTopLeftRadius: 12,
              borderTopRightRadius: 12,
              transition: 'background 0.18s, color 0.18s',
            }}
          >{t('articles.articles') || 'Статьи'}</button>
          <button
            onClick={() => setTab('all')}
            style={{
              background: tab === 'all' ? tabActive : tabInactive,
              border: 'none',
              borderBottom: tab === 'all' ? `2.5px solid #3976a8` : `2.5px solid transparent`,
              color: tab === 'all' ? tabActiveColor : tabInactiveColor,
              fontWeight: 600,
              fontSize: 18,
              padding: '12px 32px',
              cursor: 'pointer',
              borderTopLeftRadius: 12,
              borderTopRightRadius: 12,
              transition: 'background 0.18s, color 0.18s',
            }}
          >{t('articles.all') || 'Все статьи'}</button>
        </div>
        {tab === 'my' && (
          <>
            <div className="filter__container" style={{ display: 'flex', gap: 24, alignItems: 'center', marginBottom: 32 }}>
              <div className="filter__slot filter__slot--push-next filter__search-large" style={{ flex: 1 }}>
                <div className="search__container" style={{ display: 'flex', alignItems: 'center', background: fieldBg, borderRadius: 12, boxShadow: dark ? '0 2px 8px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.04)', padding: '0 16px', height: 48 }}>
                  <input
                    ref={inputRef}
                    type="search"
                    placeholder={t('articles.search') || 'Поиск'}
                    className="form-control"
                    style={{ border: 'none', outline: 'none', fontSize: 18, flex: 1, background: 'transparent', boxShadow: 'none', color: fieldColor }}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onFocus={e => e.target.style.boxShadow = 'none'}
                    onBlur={e => e.target.style.boxShadow = 'none'}
                  />
                  <button type="button" aria-label="Search" className="button button--search button--sm" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: fieldColor }}>
                    <svg aria-hidden="true" className="icon icon--common-search" width="22" height="22" viewBox="0 0 22 22"><circle cx="10" cy="10" r="7" stroke="#888" strokeWidth="2" fill="none"/><line x1="15.5" y1="15.5" x2="20" y2="20" stroke="#888" strokeWidth="2" strokeLinecap="round"/></svg>
                  </button>
                </div>
              </div>
              <div className="filter__slot filter__submit">
                <button
                  type="button"
                  className="button button--create button--sm-wide create-button"
                  style={{ borderRadius: 12, height: 48, fontSize: 16, background: '#3976a8', color: '#fff', border: 'none', padding: '0 28px', fontWeight: 600 }}
                  onClick={() => history.push('/articles/newPost')}
                >
                  {t('articles.create') || 'Написать статью'}
                </button>
              </div>
              <div className="filter__slot filter__sort" style={{ minWidth: 180, position: 'relative' }}>
                <button
                  type="button"
                  tabIndex={0}
                  className="dropdown-select-control"
                  title={sortOptions.find(opt => opt.value === sort)?.label || ''}
                  style={{
                    border: 'none',
                    background: fieldBg,
                    borderRadius: 20,
                    padding: '0.4rem 1rem',
                    fontWeight: 'bold',
                    color: '#3976a8',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    minWidth: 150,
                    boxShadow: dark ? '0 2px 8px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.04)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    justifyContent: 'space-between',
                  }}
                  onClick={() => setSortDropdown(v => !v)}
                >
                  <span className="dropdown-select-label">{sortOptions.find(opt => opt.value === sort)?.label}</span>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 6L8 10L12 6" stroke="#3976a8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                {sortDropdown && (
                  <div style={{ position: 'absolute', top: 44, left: 0, background: fieldBg, borderRadius: 12, boxShadow: dark ? '0 2px 8px rgba(0,0,0,0.18)' : '0 2px 8px rgba(0,0,0,0.08)', zIndex: 10, minWidth: 150 }}>
                    {sortOptions.map(opt => (
                      <div
                        key={opt.value}
                        onClick={() => handleSortSelect(opt.value)}
                        style={{ padding: '10px 18px', cursor: 'pointer', color: opt.value === sort ? '#3976a8' : fieldColor, fontWeight: opt.value === sort ? 700 : 500, background: opt.value === sort ? (dark ? '#23272f' : '#f0f6fa') : 'transparent' }}
                      >
                        {opt.value === 'new' ? (t('articles.sortNew') || 'Сначала новые') : opt.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {filtered.length === 0 ? (
              <div style={{ color: '#888', fontSize: 18, textAlign: 'center', padding: 40 }}>{t('articles.noArticles') || 'Нет статей'}</div>
            ) : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {filtered.map(article => (
                  <li key={article.id} style={{ padding: '18px 0', borderBottom: `1px solid ${borderColor}` }}>
                    <div style={{display:'flex',gap:14,alignItems:'flex-start'}}>
                      {article.cover && <img src={article.cover} alt='' style={{width:80,height:60,objectFit:'cover',borderRadius:8,flexShrink:0}}/>}
                      {article.authorAvatar && <img src={article.authorAvatar} alt='' style={{width:40,height:40,borderRadius:'50%',objectFit:'cover',flexShrink:0}}/>}
                      <div style={{flex:1}}>
                        <Link to={`/articles/${article.id}`} style={{ color: '#3976a8', textDecoration: 'none', fontSize: 19, fontWeight: 500 }}>{article.title}</Link>
                        {article.description && <p style={{margin:'4px 0',fontSize:14,color:'#666'}}>{article.description}</p>}
                        <span style={{fontSize:13,color:'#999'}}>{formatDate(article.date)} • {(article.authorName || article.author?.username || article.author?.name || 'Unknown')}</span>
                      </div>
                      <button onClick={()=>handleLike(article.id)} style={{background:'none',border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:4,color:'#ff5722'}}>
                        {myLikes.includes(article.id)?<FaHeart/>:<FaRegHeart/>} {likes[article.id]||0}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
        {tab === 'all' && (
          <div style={{ background: formBg, borderRadius: 12, boxShadow: dark ? '0 2px 8px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.04)', padding: 24 }}>
            {loading ? (
              <div style={{ color: '#888', fontSize: 18, textAlign: 'center', padding: 40 }}>{t('articles.loading') || 'Загрузка...'}</div>
            ) : error ? (
              <div style={{ color: 'red', fontSize: 18, textAlign: 'center', padding: 40 }}>{error}</div>
            ) : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {articles.length === 0 ? (
                  <li style={{ color: '#888', fontSize: 18, textAlign: 'center', padding: 40 }}>{t('articles.noArticles') || 'Нет статей'}</li>
                ) : (
                  articles.map(article => (
                    <li key={article.id} style={{ padding: '4px 0' }}>
                      <div style={{display:'flex',alignItems:'center',gap:12}}>
                        {(article.authorAvatar || article.author?.avatar) && <img src={article.authorAvatar || article.author?.avatar} alt='' style={{width:32,height:32,borderRadius:'50%',objectFit:'cover',flexShrink:0}}/>}
                        <Link to={`/articles/${article.id}`} style={{ color: '#3976a8', textDecoration: 'underline', fontSize: 19, fontWeight: 500 }}>{article.title}</Link>
                        <button onClick={()=>handleLike(article.id)} style={{marginLeft:'auto',background:'none',border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:4,color:'#ff5722'}}>
                          {myLikes.includes(article.id)?<FaHeart size={14}/>:<FaRegHeart size={14}/>} {likes[article.id]||0}
                        </button>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 