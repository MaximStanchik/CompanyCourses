import React, { useRef, useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import i18n from '../i18n';

const icons = [
  { title: 'Жирный (Ctrl+B)', icon: 'bold', svg: <svg aria-hidden="true" className="icon icon--rich-editor-bold" width="20" height="20" viewBox="0 0 20 20"><path d="M6 4h5a3 3 0 0 1 0 6H6zm0 6h6a3 3 0 0 1 0 6H6z" fill="#3976a8"/></svg> },
  { title: 'Курсив (Ctrl+I)', icon: 'italic', svg: <svg aria-hidden="true" className="icon icon--rich-editor-italic" width="20" height="20" viewBox="0 0 20 20"><path d="M8 4h7M5 16h7M10 4l-4 12" stroke="#3976a8" strokeWidth="2" fill="none"/></svg> },
  { title: 'Подчеркнутый (Ctrl+U)', icon: 'underline', svg: <svg aria-hidden="true" className="icon icon--rich-editor-underline" width="20" height="20" viewBox="0 0 20 20"><path d="M6 4v6a4 4 0 0 0 8 0V4" stroke="#3976a8" strokeWidth="2" fill="none"/><path d="M4 16h12" stroke="#3976a8" strokeWidth="2"/></svg> },
  { title: 'Зачеркнутый (Ctrl+S)', icon: 'strike', svg: <svg aria-hidden="true" className="icon icon--rich-editor-strike" width="20" height="20" viewBox="0 0 20 20"><path d="M4 10h12M8 4h4a3 3 0 0 1 0 6H8a3 3 0 0 0 0 6h4" stroke="#3976a8" strokeWidth="2" fill="none"/></svg> },
  { title: 'Emoji', icon: 'smile', svg: <svg aria-hidden="true" className="icon icon--rich-editor-smile" width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" stroke="#3976a8" strokeWidth="2" fill="none"/><circle cx="7" cy="8" r="1" fill="#3976a8"/><circle cx="13" cy="8" r="1" fill="#3976a8"/><path d="M7 13a3 3 0 0 0 6 0" stroke="#3976a8" strokeWidth="2" fill="none"/></svg> },
  { title: 'Вставить ссылку', icon: 'link', svg: <svg aria-hidden="true" className="icon icon--rich-editor-link" width="20" height="20" viewBox="0 0 20 20"><path d="M7 13a5 5 0 0 1 0-6m6 6a5 5 0 0 0 0-6M8.5 11.5l3-3" stroke="#3976a8" strokeWidth="2" fill="none"/></svg> },
  { title: 'Вставить изображение', icon: 'image', svg: <svg aria-hidden="true" className="icon icon--rich-editor-image" width="20" height="20" viewBox="0 0 20 20"><rect x="3" y="5" width="14" height="10" rx="2" stroke="#3976a8" strokeWidth="2" fill="none"/><circle cx="7" cy="9" r="1" fill="#3976a8"/><path d="M3 15l4-4a2 2 0 0 1 2.8 0l4.2 4" stroke="#3976a8" strokeWidth="2" fill="none"/></svg> },
  { title: 'Редактор кода', icon: 'code', svg: <span style={{fontSize:'1.1em',letterSpacing:'1px'}}>&lt;/&gt;</span> },
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

export default function NewPost() {
  const fileInput = useRef();
  const [cover, setCover] = useState(null);
  const [coverUrl, setCoverUrl] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [lang, setLang] = useState('ru');
  const [theme, setTheme] = useState(null); // null=auto, 'dark', 'light'
  const prefersDark = usePrefersDark();
  const dark = theme ? theme === 'dark' : prefersDark;
  const history = useHistory();
  const [emojiPicker, setEmojiPicker] = useState({ visible: false, x: 0, y: 0 });
  const emojiPickerRef = useRef(null);
  const textareaRef = useRef();
  const [linkModal, setLinkModal] = useState({ open: false, url: '', text: '' });
  const [imageModal, setImageModal] = useState({ open: false, url: '', file: null, size: '512' });
  // Code editor modal
  const codeLanguages = [
    {value:'java',label:'Java'},{value:'python',label:'Python'},{value:'markdown',label:'Markdown'},{value:'javascript',label:'JavaScript'},{value:'typescript',label:'TypeScript'},{value:'csharp',label:'C#'},{value:'css',label:'CSS'},{value:'html',label:'HTML'},{value:'json',label:'JSON'},{value:'yaml',label:'YAML'},{value:'xml',label:'XML'},{value:'bash',label:'Bash'},{value:'sql',label:'SQL'},{value:'plsql',label:'PL/SQL'},{value:'groovy',label:'Groovy'},{value:'kotlin',label:'Kotlin'},{value:'dockerfile',label:'Dockerfile'},{value:'text',label:'Text'}
  ];
  const [codeModal,setCodeModal]=useState({open:false,lang:'javascript',code:''});

  const formBg = dark ? '#26272b' : '#fff';
  const pageBg = dark ? '#18191c' : '#f6f7fa';
  const fieldBg = dark ? '#213747' : '#f9fafd';
  const fieldColor = dark ? '#ddd' : '#222';
  const borderColor = dark ? '#36607e' : '#e0e0e0';

  const t = i18n.t.bind(i18n);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) setTheme(savedTheme);
  }, []);
  useEffect(() => {
    if (theme) localStorage.setItem('theme', theme);
  }, [theme]);

  const handleFileChange = e => {
    const file = e.target.files[0];
    setCover(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => setCoverUrl(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      setCoverUrl(null);
    }
  };

  // Скрыть emoji picker при клике вне
  useEffect(() => {
    if (!emojiPicker.visible) return;
    const handleClick = (e) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setEmojiPicker(c => ({ ...c, visible: false }));
      }
    };
    window.addEventListener('mousedown', handleClick);
    return () => window.removeEventListener('mousedown', handleClick);
  }, [emojiPicker.visible]);

  // Вставка эмодзи в textarea
  const handleSelectEmoji = (emojiObj) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = textarea.value.slice(0, start) + emojiObj.native + textarea.value.slice(end);
    textarea.value = newValue;
    textarea.focus();
    textarea.setSelectionRange(start + emojiObj.native.length, start + emojiObj.native.length);
    setEmojiPicker({ ...emojiPicker, visible: false });
  };

  // --- Функция для форматирования текста ---
  const formatText = (type) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;
    const selected = value.slice(start, end);
    let before = value.slice(0, start);
    let after = value.slice(end);
    let newText = value;
    let cursorPos = start;
    if (type === 'link') {
      setLinkModal({ open: true, url: '', text: selected });
      return;
    }
    if (type === 'image') {
      setImageModal({ open: true, url: '', file: null, size: '512' });
      return;
    }
    switch (type) {
      case 'bold':
        newText = before + '<strong>' + selected + '</strong>' + after;
        cursorPos = start + 8;
        break;
      case 'italic':
        newText = before + '<em>' + selected + '</em>' + after;
        cursorPos = start + 4;
        break;
      case 'underline':
        newText = before + '<u>' + selected + '</u>' + after;
        cursorPos = start + 3;
        break;
      case 'strike':
        newText = before + '<s>' + selected + '</s>' + after;
        cursorPos = start + 3;
        break;
      case 'code':
        if (selected.includes('\n')) {
          newText = before + '\n```\n' + selected + '\n```\n' + after;
          cursorPos = start + 5;
        } else {
          newText = before + '`' + selected + '`' + after;
          cursorPos = start + 1;
        }
        break;
      default:
        return;
    }
    textarea.value = newText;
    textarea.focus();
    textarea.setSelectionRange(cursorPos, cursorPos + selected.length);
  };

  // --- Вставка ссылки из модального окна ---
  const handleInsertLink = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;
    const before = value.slice(0, start);
    const after = value.slice(end);
    const url = linkModal.url || 'https://';
    const text = linkModal.text || 'ссылка';
    const link = `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`;
    const newValue = before + link + after;
    textarea.value = newValue;
    textarea.focus();
    textarea.setSelectionRange(before.length + link.length, before.length + link.length);
    setLinkModal({ open: false, url: '', text: '' });
  };

  // --- Вставка изображения из модального окна ---
  const handleInsertImage = async () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;
    const before = value.slice(0, start);
    const after = value.slice(end);
    let src = imageModal.url;
    if (!src && imageModal.file) {
      // Локальный preview (base64)
      src = await new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.readAsDataURL(imageModal.file);
      });
    }
    if (!src) return;
    const img = `<img src="${src}" width="${imageModal.size}" />`;
    const newValue = before + img + after;
    textarea.value = newValue;
    textarea.focus();
    textarea.setSelectionRange(before.length + img.length, before.length + img.length);
    setImageModal({ open: false, url: '', file: null, size: '512' });
  };

  return (
    <div style={{ background: pageBg, minHeight: '100vh', padding: '40px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, justifyContent: 'flex-end', maxWidth: 700, margin: '0 auto 24px auto' }}>
        <select
          aria-label="Select language"
          style={{ padding: '0.4rem 1rem', borderRadius: 20, border: `1px solid ${borderColor}`, background: fieldBg, color: dark ? '#eaf4fd' : '#3976a8', fontWeight: 'bold', cursor: 'pointer', marginRight: 10, fontSize: '1rem' }}
          value={lang}
          onChange={e => setLang(e.target.value)}
        >
          {langOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <button
          style={{ padding: '0.5rem 1.5rem', backgroundColor: '#3976a8', color: '#fff', border: 'none', borderRadius: 20, cursor: 'pointer', fontSize: '1rem', transition: '0.3s', transform: 'translateY(0px)', boxShadow: 'none', marginRight: 10 }}
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {dark ? 'Светлая тема' : 'Тёмная тема'}
        </button>
        <button
          style={{ padding: '0.5rem 1.5rem', backgroundColor: '#3976a8', color: '#fff', border: 'none', borderRadius: 20, cursor: 'pointer', fontSize: '1rem', transition: '0.3s', transform: 'translateY(0px)', boxShadow: 'none' }}
          onClick={() => history.push('/articles')}
        >
          Назад
        </button>
      </div>
      <form onSubmit={e=>{
        e.preventDefault();
        const content = textareaRef.current ? textareaRef.current.value : '';
        const id = Date.now();
        const article = { id, title, description, cover: coverUrl, content, date: new Date().toISOString(), popularity: 0 };
        try {
          const arr = JSON.parse(localStorage.getItem('articles')||'[]');
          arr.unshift(article);
          localStorage.setItem('articles', JSON.stringify(arr));
        } catch { localStorage.setItem('articles', JSON.stringify([article])); }
        history.push('/articles');
      }} style={{ maxWidth: 700, margin: '40px auto', background: formBg, borderRadius: 16, boxShadow: '0 2px 16px rgba(0,0,0,0.06)', padding: 32 }}>
        <label style={{ display: 'block', width: '100%', height: 220, background: fieldBg, border: `2px dashed ${borderColor}`, borderRadius: 16, marginBottom: 24, cursor: 'pointer', position: 'relative', overflow: 'hidden', textAlign: 'center' }}>
          {coverUrl ? (
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              <img src={coverUrl} alt="cover" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 16, display: 'block', margin: '0 auto' }} />
              <button type="button" onClick={e => { e.stopPropagation(); setCover(null); setCoverUrl(null); fileInput.current.value = ''; }} style={{ position: 'absolute', top: 10, right: 10, background: '#fff', color: '#3976a8', border: '1.5px solid #3976a8', borderRadius: 8, padding: '4px 14px', fontWeight: 600, fontSize: 15, cursor: 'pointer', zIndex: 2 }}>{t('common.reset') || 'Сбросить'}</button>
            </div>
          ) : (
            <div style={{ color: '#7d7e7f', fontSize: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <svg width="48" height="48" fill="none" viewBox="0 0 48 48"><rect x="8" y="12" width="32" height="24" rx="4" stroke={borderColor} strokeWidth="2" fill={fieldBg}/><path d="M8 36l8-8a4 4 0 0 1 5.7 0l10.3 10" stroke={borderColor} strokeWidth="2" fill="none"/><circle cx="16" cy="20" r="2" fill={borderColor}/></svg>
              <span style={{ marginTop: 12, fontWeight: 500 }}>{t('editor.uploadCover') || 'Загрузить обложку'}</span>
            </div>
          )}
          <input
            ref={fileInput}
            name="file"
            type="file"
            accept="image/*"
            className="inputfile"
            id="file"
            style={{ display: 'block', position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
            onChange={handleFileChange}
          />
        </label>
        <input
          type="text"
          value={title}
          onChange={e=>setTitle(e.target.value)}
          placeholder={t('editor.titlePlaceholder') || 'Введите заголовок'}
          className="form-control"
          style={{ fontSize: 22, marginBottom: 18, borderRadius: 12, padding: '12px 18px', border: `1.5px solid ${borderColor}`, background: fieldBg, color: fieldColor }}
        />
        <textarea
          placeholder={t('editor.descPlaceholder') || 'Введите краткое описание'}
          value={description}
          onChange={e=>setDescription(e.target.value)}
          className="form-control"
          style={{ fontSize: 17, marginBottom: 18, borderRadius: 12, padding: '12px 18px', border: `1.5px solid ${borderColor}`, minHeight: 80, background: fieldBg, color: fieldColor }}
        />
        <div className="toolbar__controls" style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {icons.filter(btn => btn.icon !== 'smile').map(btn => (
            <button key={btn.icon} type="button" title={btn.title} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 6, transition: 'background 0.15s', color: fieldColor }}
              onClick={() => {
                if(btn.icon==='code'){
                  setCodeModal({open:true,lang:'javascript',code:''});
                } else {
                  formatText(btn.icon);
                }
              }}
            >
              {btn.svg}
            </button>
          ))}
          <button type="button" title="Эмодзи" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 6, fontSize: 22, color: '#fbc02d' }} onClick={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            setEmojiPicker({ visible: true, x: rect.left, y: rect.bottom });
          }}>😊</button>
          {emojiPicker.visible && (
            <div ref={emojiPickerRef} style={{ position: 'fixed', top: emojiPicker.y, left: emojiPicker.x, zIndex: 10000 }}>
              <Picker data={data} theme={dark ? 'dark' : 'light'} onEmojiSelect={handleSelectEmoji} searchPosition="top" previewPosition="none" skinTonePosition="search" />
            </div>
          )}
        </div>
        <button type="button" title="Увеличить" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 6, float: 'right', marginBottom: 8, color: fieldColor }}>
          <svg aria-hidden="true" className="icon icon--common-maximize-on" width="20" height="20" viewBox="0 0 20 20"><rect x="3" y="3" width="14" height="14" rx="2" stroke="#3976a8" strokeWidth="2" fill="none"/><path d="M7 7h6v6" stroke="#3976a8" strokeWidth="2"/></svg>
        </button>
        <textarea ref={textareaRef} className="rich-editor__textarea form-control" id="reachEditorInputId" style={{ minHeight: 300, height: 300, borderRadius: 12, padding: '12px 18px', border: `1.5px solid ${borderColor}`, width: '100%', fontSize: 16, marginBottom: 18, background: fieldBg, color: fieldColor }} />
        <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', marginTop: 18 }}>
          <button type="button" onClick={()=>setPreviewOpen(true)} className="button button--info button--md" style={{ background: dark ? '#eaf4fd' : '#3976a8', color: dark ? '#3976a8' : '#fff', border: 'none', borderRadius: 22, padding: '10px 32px', fontWeight: 600, fontSize: 17 }}>{t('editor.preview') || 'Предпросмотр'}</button>
          <button type="submit" className="button button--apply-alt button--md button--bold" style={{ background: '#3976a8', color: '#fff', border: 'none', borderRadius: 22, padding: '10px 32px', fontWeight: 600, fontSize: 17 }}>{t('editor.publish') || 'Опубликовать'}</button>
        </div>
      </form>
      {/* Модальное окно для вставки ссылки */}
      {linkModal.open && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.25)', zIndex: 20000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: dark ? '#23272f' : '#fff', color: dark ? '#eaf4fd' : '#23272f', borderRadius: 16, padding: 32, minWidth: 340, boxShadow: '0 4px 32px rgba(0,0,0,0.18)', position: 'relative' }}>
            <button onClick={() => setLinkModal({ open: false, url: '', text: '' })} style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 22, color: '#888', cursor: 'pointer' }} aria-label={t('common.close') || 'Закрыть'}>×</button>
            <h3 style={{ margin: '0 0 18px 0', fontWeight: 700, fontSize: 20 }}>{t('editor.insertLink') || 'Вставить ссылку'}</h3>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontWeight: 600, fontSize: 15 }}>{t('editor.linkUrl') || 'Введите URL ссылки'}</label>
              <input type="text" value={linkModal.url} onChange={e => setLinkModal(m => ({ ...m, url: e.target.value }))} placeholder="https://" style={{ width: '100%', borderRadius: 8, border: `1.5px solid ${borderColor}`, padding: '10px 14px', fontSize: 16, marginTop: 4, marginBottom: 10, background: dark ? '#213747' : '#f9fafd', color: dark ? '#eaf4fd' : '#23272f' }} />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontWeight: 600, fontSize: 15 }}>{t('editor.linkName') || 'Имя ссылки'}</label>
              <input type="text" value={linkModal.text} onChange={e => setLinkModal(m => ({ ...m, text: e.target.value }))} placeholder={t('editor.linkName') || 'Имя ссылки'} style={{ width: '100%', borderRadius: 8, border: `1.5px solid ${borderColor}`, padding: '10px 14px', fontSize: 16, marginTop: 4, background: dark ? '#213747' : '#f9fafd', color: dark ? '#eaf4fd' : '#23272f' }} />
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button type="button" onClick={() => setLinkModal({ open: false, url: '', text: '' })} style={{ background: '#eee', color: '#3976a8', border: 'none', borderRadius: 8, padding: '8px 22px', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>{t('common.cancel') || 'Отменить'}</button>
              <button type="button" onClick={handleInsertLink} style={{ background: '#3976a8', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 22px', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>{t('common.insert') || 'Вставить'}</button>
            </div>
          </div>
        </div>
      )}
      {/* Модальное окно для вставки изображения */}
      {imageModal.open && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.25)', zIndex: 20000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: dark ? '#23272f' : '#fff', color: dark ? '#eaf4fd' : '#23272f', borderRadius: 16, padding: 32, minWidth: 360, boxShadow: '0 4px 32px rgba(0,0,0,0.18)', position: 'relative' }}>
            <button onClick={() => setImageModal({ open: false, url: '', file: null, size: '512' })} style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 22, color: '#888', cursor: 'pointer' }} aria-label={t('common.close') || 'Закрыть'}>×</button>
            <h3 style={{ margin: '0 0 18px 0', fontWeight: 700, fontSize: 20, color: dark ? '#fff' : '#23272f' }}>{t('editor.imageUpload') || 'Загрузка изображения'}</h3>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontWeight: 600, fontSize: 15 }}>{t('editor.imageUrl') || 'Введите URL картинки'}</label>
              <input type="text" value={imageModal.url} onChange={e => setImageModal(m => ({ ...m, url: e.target.value, file: null }))} placeholder="https://example.com/image.jpg" style={{ width: '100%', borderRadius: 8, border: `1.5px solid ${borderColor}`, padding: '10px 14px', fontSize: 16, marginTop: 4, marginBottom: 10, background: dark ? '#213747' : '#f9fafd', color: dark ? '#eaf4fd' : '#23272f' }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontWeight: 600, fontSize: 15 }}>{t('editor.imageFile') || 'Выберите изображение или перетащите его мышью'}</label>
              <input type="file" accept="image/*" onChange={e => setImageModal(m => ({ ...m, file: e.target.files[0], url: '' }))} style={{ width: '100%', borderRadius: 8, border: `1.5px solid ${borderColor}`, padding: '10px 14px', fontSize: 16, marginTop: 4, background: dark ? '#213747' : '#f9fafd', color: dark ? '#eaf4fd' : '#23272f' }} />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontWeight: 600, fontSize: 15 }}>{t('editor.imageSize') || 'Размер вставки изображения'}</label>
              <div style={{ display: 'flex', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
                {["256","512","800","1024","1080"].map(size => (
                  <label key={size} style={{ fontWeight: 500, fontSize: 15, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <input type="radio" name="imgsize" value={size} checked={imageModal.size === size} onChange={e => setImageModal(m => ({ ...m, size }))} /> {size}px
                  </label>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button type="button" onClick={() => setImageModal({ open: false, url: '', file: null, size: '512' })} style={{ background: '#eee', color: '#3976a8', border: 'none', borderRadius: 8, padding: '8px 22px', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>{t('common.cancel') || 'Отменить'}</button>
              <button type="button" onClick={handleInsertImage} style={{ background: '#3976a8', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 22px', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>{t('common.insert') || 'Вставить'}</button>
            </div>
          </div>
        </div>
      )}
      {/* Модальное окно редактора кода */}
      {codeModal.open && (
        <div style={{ position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.25)',zIndex:20000,display:'flex',alignItems:'center',justifyContent:'center' }}>
          <div style={{ background: dark ? '#23272f' : '#fff', color: dark ? '#eaf4fd' : '#23272f', borderRadius: 16, padding: 32, minWidth: 480, maxWidth:'90vw', boxShadow: '0 4px 32px rgba(0,0,0,0.18)', position: 'relative', width:'90vw', maxHeight:'90vh', display:'flex', flexDirection:'column' }}>
            <button onClick={() => setCodeModal({open:false,lang:'javascript',code:''})} style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 22, color: '#888', cursor: 'pointer' }} aria-label="Close">×</button>
            <h3 style={{ margin: '0 0 18px 0', fontWeight: 700, fontSize: 20 }}>{t('editor.codeEditor')||'Редактор кода'}</h3>
            <div style={{marginBottom:12}}>
              <label style={{fontWeight:600, fontSize:15, marginRight:10}}>{t('editor.language')||'Язык'}:</label>
              <select value={codeModal.lang} onChange={e=>setCodeModal(m=>({...m,lang:e.target.value}))} style={{padding:'6px 10px',borderRadius:8,border:`1.5px solid ${borderColor}`,background: dark? '#213747':'#f9fafd', color: fieldColor}}>
                {codeLanguages.map(l=> (<option key={l.value} value={l.value}>{l.label}</option>))}
              </select>
            </div>
            <div style={{flex:1, overflow:'auto', border:`1.5px solid ${borderColor}`, borderRadius:8, display:'flex', maxHeight:'60vh'}}>
              <pre style={{margin:0,padding:'10px 10px',background: dark? '#1b1e24':'#f3f4f6',color:'#888',textAlign:'right',userSelect:'none'}}>{codeModal.code.split('\n').map((_,i)=>i+1).join('\n')}</pre>
              <textarea value={codeModal.code} onChange={e=>setCodeModal(m=>({...m,code:e.target.value}))} spellCheck={false} style={{flex:1,border:'none',outline:'none',fontFamily:'monospace',fontSize:15,resize:'none',padding:'10px 14px',background: dark? '#1b1e24':'#fff',color: dark? '#eaf4fd':'#23272f',whiteSpace:'pre'}} />
            </div>
            <div style={{ display:'flex', gap:12, justifyContent:'flex-end', marginTop: 18 }}>
              <button type="button" onClick={()=>setCodeModal({open:false,lang:'javascript',code:''})} style={{ background: '#eee', color: '#3976a8', border: 'none', borderRadius: 8, padding: '8px 22px', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>{t('common.cancel')||'Отменить'}</button>
              <button type="button" onClick={()=>{
                const textarea = textareaRef.current; if(!textarea) return; const start=textarea.selectionStart; const end=textarea.selectionEnd; const value=textarea.value; const before=value.slice(0,start); const after=value.slice(end); const snippet = `\n\`\`\`${codeModal.lang}\n${codeModal.code}\n\`\`\`\n`; const newVal=before+snippet+after; textarea.value=newVal; textarea.focus(); textarea.setSelectionRange(before.length+snippet.length,before.length+snippet.length); setCodeModal({open:false,lang:'javascript',code:''}); }} style={{ background: '#3976a8', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 22px', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>{t('common.insert')||'Вставить'}</button>
            </div>
          </div>
        </div>
      )}
      {/* Preview Modal */}
      {previewOpen && (
        <div style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.35)',zIndex:30000,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:dark?'#23272f':'#fff',color:dark?'#eaf4fd':'#23272f',borderRadius:16,padding:32,maxWidth:'90vw',maxHeight:'90vh',overflowY:'auto',position:'relative'}}>
            <button onClick={()=>setPreviewOpen(false)} style={{ position:'absolute', top:12, right:16, background:'none', border:'none', fontSize:22, color:'#888', cursor:'pointer' }}>×</button>
            {coverUrl && <img src={coverUrl} alt="cover" style={{maxWidth:'100%',borderRadius:12,marginBottom:18}}/>}
            <h1 style={{marginTop:0}}>{title}</h1>
            <p style={{fontStyle:'italic',color:'#666'}}>{description}</p>
            <div dangerouslySetInnerHTML={{__html: textareaRef.current? textareaRef.current.value : ''}} style={{fontSize:16,lineHeight:1.6}} />
          </div>
        </div>
      )}
    </div>
  );
} 