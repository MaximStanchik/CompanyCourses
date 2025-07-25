import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import i18n from '../i18n';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';
import 'highlight.js/styles/github-dark.css';
import axios from '../utils/axios';

const langOptions=[{value:'en',label:'EN'},{value:'ru',label:'RU'},{value:'de',label:'DE'},{value:'es',label:'ES'},{value:'pt',label:'PT'},{value:'uk',label:'UK'},{value:'zh',label:'ZH'},{value:'be',label:'BE'}];

function usePrefersDark(){
  const [dark,setDark]=useState(()=>window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches);
  useEffect(()=>{
    const mq=window.matchMedia('(prefers-color-scheme: dark)');
    const h=e=>setDark(e.matches);
    mq.addEventListener('change',h);
    return()=>mq.removeEventListener('change',h);
  },[]);
  return dark;
}

export default function ArticleView(){
  const { id } = useParams();
  const history = useHistory();

  const [theme,setTheme]=useState(null);
  const prefersDark=usePrefersDark();
  const dark=theme? theme==='dark':prefersDark;
  const borderColor= dark? '#36607e':'#e0e0e0';
  const fieldBg= dark? '#213747':'#f9fafd';

  const [lang,setLang]=useState(()=>localStorage.getItem('language')||'ru');
  const t=i18n.t.bind(i18n);

  const [likes,setLikes]=useState(()=>JSON.parse(localStorage.getItem('articleLikes')||'{}'));
  const [myLikes,setMyLikes]=useState(()=>{
    try{return JSON.parse(localStorage.getItem('myArticleLikes')||'[]');}catch{return [];} });
  const liked = myLikes.includes(id);
  const likeCount = likes[id]||0;
  const handleLike=()=>{
    setLikes(prev=>{
      let delta = liked ? -1 : 1;
      const updatedCount = Math.max((prev[id]||0)+delta,0);
      const updated={...prev,[id]:updatedCount};
      localStorage.setItem('articleLikes',JSON.stringify(updated));
      return updated;
    });
    setMyLikes(prev=>{
      let arr = [...prev];
      if(liked){ arr = arr.filter(a=>a!==id);} else {arr.push(id);} 
      localStorage.setItem('myArticleLikes',JSON.stringify(arr));
      return arr;
    });
  };
  const [comments,setComments]=useState(()=>{
    const all=JSON.parse(localStorage.getItem('articleComments')||'{}');
    return all[id]||[];
  });
  const [commentText,setCommentText]=useState('');
  const addComment=()=>{
    const txt=commentText.trim();
    if(!txt) return;
    const newComment={id:Date.now(),user:{name:currentUser.username,avatar:currentUser.avatar},text:txt,date:new Date().toISOString()};
    const updated=[...comments,newComment];
    setComments(updated);
    const all=JSON.parse(localStorage.getItem('articleComments')||'{}');
    all[id]=updated;
    localStorage.setItem('articleComments',JSON.stringify(all));
    setCommentText('');
  };

  // current user info
  const [currentUser,setCurrentUser]=useState(()=>{
    const token=localStorage.getItem('jwtToken');
    if(!token) return {id:null,username:t('chat.you')||'You',avatar:null};
    try{
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        id: payload.id || payload.userId || null,
        username: payload.username || payload.name || (t('chat.you')||'You'),
        avatar: payload.avatar || null
      };
    }catch{return {id:null,username:t('chat.you')||'You',avatar:null};}
  });

  // fetch avatar if missing
  useEffect(()=>{
    if(currentUser.id && !currentUser.avatar){
      axios.get(`/profile/user/${currentUser.id}`).then(res=>{
        if(res.data && res.data.user && res.data.user.avatar){
          setCurrentUser(u=>({...u,avatar:res.data.user.avatar}));
        }
      }).catch(()=>{});
    }
  },[currentUser.id]);

  useEffect(()=>{const saved=localStorage.getItem('theme'); if(saved) setTheme(saved);},[]);
  useEffect(()=>{if(theme) localStorage.setItem('theme',theme);},[theme]);
  useEffect(()=>{i18n.changeLanguage(lang); localStorage.setItem('language',lang);},[lang]);

  // ---- compute article and content before highlight effect ----
  const article = useMemo(()=>{
    try{
      const arr = JSON.parse(localStorage.getItem('articles')||'[]');
      return arr.find(a=> String(a.id)===String(id));
    }catch{ return null; }
  },[id]);

  // Convert markdown ```lang code ``` to HTML
  function renderMarkdown(md=''){
    return md.replace(/```(\w+)?\n([\s\S]*?)```/g,(match,lang,code)=>{
      let esc = code.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      // simple comment highlight
      esc = esc.replace(/(^|\n)(\s*)(\/\/.*)/g,`$1$2<span style=\"color:#8bc34a;\">$3</span>`); // // comments
      esc = esc.replace(/(^|\n)(\s*)(#.*)/g,`$1$2<span style=\"color:#8bc34a;\">$3</span>`); // # comments
      return `<pre style=\"background:${dark?'#1b1e24':'#f3f4f6'};padding:12px;border-radius:8px;overflow:auto\"><code style=\"color:${dark?'#eaf4fd':'#23272f'}\" data-lang=\"${lang||''}\">${esc}</code></pre>`;
    });
  }

  const renderedContent = useMemo(()=> article? renderMarkdown(article.content):'', [article, dark]);

  useEffect(()=>{
    hljs.highlightAll();
  },[renderedContent,dark]);

  if(!article){
    return <div style={{padding:40,fontSize:18,textAlign:'center'}}>Article not found</div>;
  }

  return (
    <div style={{minHeight:'100vh',background:dark?'#18191c':'#f6f7fa',color:dark?'#eaf4fd':'#23272f',paddingBottom:120}}>
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'flex-end',gap:10,padding:'20px 24px',background:dark?'#23272f':'#e0eafc',borderBottom:`1.5px solid ${borderColor}`}}>
        <select value={lang} onChange={e=>setLang(e.target.value)} style={{ padding: '0.35rem 0.8rem', borderRadius: 16, border: `1px solid ${borderColor}`, background: fieldBg, color: dark? '#eaf4fd':'#3976a8', fontWeight:'bold', cursor:'pointer', fontSize:'0.9rem' }}>
          {langOptions.map(opt=>(<option key={opt.value} value={opt.value}>{opt.label}</option>))}
        </select>
        <button onClick={()=>setTheme(theme==='dark'?'light':'dark')} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color: dark? '#ffe082':'#222' }}>{dark?'☀️':'🌙'}</button>
        <button onClick={()=>history.push('/articles')} style={{ background:'#3976a8',color:'#fff',border:'none',borderRadius:10,padding:'8px 22px',fontWeight:600,fontSize:16,cursor:'pointer' }}>Back</button>
      </div>
      {/* Content */}
      <div style={{maxWidth:800,margin:'40px auto',padding:'0 16px'}}>
        {article.cover && <img src={article.cover} alt="cover" style={{maxWidth:'100%',borderRadius:16,marginBottom:24}}/>}
        <h1 style={{color: dark ? '#eaf4fd' : '#23272f'}}>{article.title}</h1>
        {article.description && <p style={{fontStyle:'italic',color:dark?'#ddd':'#666'}}>{article.description}</p>}
        <div dangerouslySetInnerHTML={{__html:renderedContent}} style={{fontSize:16,lineHeight:1.6}} />
        <div style={{display:'flex',alignItems:'center',gap:14,marginTop:24}}>
          <button onClick={handleLike} style={{display:'flex',alignItems:'center',gap:6,background:'none',border:'none',cursor:'pointer',color: liked ? (dark?'#ff9800':'#ff5722') : (dark?'#888':'#888'),fontSize:16}}>
            {liked? '❤️':'🤍'} {likeCount}
          </button>
        </div>
        <div style={{marginTop:40}}>
          <h3 style={{marginBottom:16,color:dark?'#eaf4fd':'#23272f'}}>{t('articles.comments')||'Comments'} ({comments.length})</h3>
          {comments.length===0&&<p style={{color:dark?'#999':'#666'}}>{t('articles.noComments')||'No comments yet'}</p>}
          <ul style={{listStyle:'none',padding:0,margin:0}}>
            {comments.map(c=>(
              <li key={c.id} style={{display:'flex',gap:12,marginBottom:18}}>
                {c.user.avatar ? (
                   <img src={c.user.avatar} alt='' style={{width:32,height:32,borderRadius:'50%',objectFit:'cover'}}/>
                 ) : (
                   <div style={{width:32,height:32,borderRadius:'50%',background:'#b6d4fe',color:'#3976a8',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:16}}>{c.user.name?.[0]?.toUpperCase()||'?'}</div>
                 )}
                <div>
                  <div style={{fontWeight:600,fontSize:15,color:dark?'#eaf4fd':'#23272f'}}>{c.user.name}</div>
                  <div style={{fontSize:14,color:dark?'#ddd':'#444'}}>{c.text}</div>
                  <div style={{fontSize:12,color:dark?'#888':'#999'}}>{new Date(c.date).toLocaleString()}</div>
                </div>
              </li>
            ))}
          </ul>
          <div style={{display:'flex',gap:12,marginTop:12}}>
            <input value={commentText} onChange={e=>setCommentText(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();addComment();}}} placeholder={t('articles.addComment')||'Add a comment'} style={{flex:1,padding:'10px 14px',fontSize:14,borderRadius:8,border:`1px solid ${borderColor}`,background:fieldBg,color:dark?'#eaf4fd':'#23272f'}}/>
            <button onClick={addComment} style={{background:'#3976a8',color:'#fff',border:'none',borderRadius:8,padding:'10px 18px',fontWeight:600,cursor:'pointer'}}>{t('chat.send')}</button>
          </div>
        </div>
      </div>
    </div>
  );
} 