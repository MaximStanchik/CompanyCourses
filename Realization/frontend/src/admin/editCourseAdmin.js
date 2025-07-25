import React, { useState, useEffect, useRef } from "react";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import TeachNavMenu from "./TeachNavMenu";
import { CKEditor } from 'ckeditor4-react';
import useTheme from '../hooks/useTheme';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import { useHistory, useLocation, useParams, Prompt } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './admin.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faEye } from '@fortawesome/free-solid-svg-icons';
import axios from '../utils/axios';
import CategorySelectorModal from '../components/CategorySelectorModal';
import { CSSTransition, SwitchTransition } from 'react-transition-group';

const checklistStructure = [
  {
    title: "Больше 1 модуля",
    desc: "Разбейте курс хотя бы на два модуля, чтобы структурировать содержание. Исходите из того, что учащиеся осваивают материалы модуля в течение недели.",
    btn: "Добавить модуль",
    btnType: 'link',
    done: false
  },
  {
    title: "Больше 9 уроков (сейчас 0)",
    desc: "Хорошо, когда урок можно пройти за один «присест», за 15-30 минут. Мы считаем, что в курсе стоит сделать не менее десяти уроков.",
    btn: "Добавить урок",
    btnType: 'link',
    done: false
  },
  {
    title: "Больше 9 задач (сейчас 0)",
    desc: "Мы верим в обучение через практику, через решение задач. Рекомендуем сделать не менее десяти задач в вашем курсе.",
    btn: "К содержанию",
    btnType: 'link',
    done: false
  },
  {
    title: "Нет пустых модулей",
    desc: "В каждом модуле должен быть хотя бы один урок, иначе курс выглядит недоделанным. Удалите пустые модули или заполните их уроками.",
    btn: "Редактировать содержание",
    btnType: 'link',
    done: false
  },
  {
    title: "У модулей и уроков содержательные названия",
    desc: "Замените стандартные названия модулей «Новый модуль» или «New module» на говорящие.",
    btn: "Переименовать модули",
    btnType: 'link',
    done: false
  },
  {
    title: "Нет шаблонных текстов и задач",
    desc: "Когда вы создаёте шаг, мы добавляем начальный текст для вашего удобства. Обязательно замените его на авторский материал, чтобы ваш курс был уникальным и более ценным для учащихся.",
    btn: null,
    btnType: null,
    done: false
  },
  {
    title: "Всё видео в шагах загружено",
    desc: "Убедитесь в том, что во всех видео-шагах загружено само видео.",
    btn: null,
    btnType: null,
    done: false
  },
  {
    title: "Все задачи прорешены",
    desc: "Проверьте задания: каждая задача должна быть решена верно хотя бы один раз. Вы можете сделать это самостоятельно или пригласить в курс тестировщиков.",
    btn: "Проверить",
    btnType: 'link',
    done: false
  },
];

const checklistPresentationData = [
  {
    title: "Есть логотип",
    desc: "Первое, что видят учащиеся в каталоге, — логотип вашего курса.",
    btn: "Загрузить логотип",
    btnType: 'link',
    done: false
  },
  {
    title: "Краткое описание длиннее 100 символов",
    desc: "Попробуйте ёмко выразить, о чём ваш курс. Это описание учащиеся увидят в поиске и на промостранице сразу после названия курса.",
    btn: "Заполнить описание",
    btnType: 'link',
    done: false
  },
  {
    title: "Указаны категории курса",
    desc: "Выберите точные категории, чтобы учащимся было легче найти ваш курс.",
    btn: "Задать категории",
    btnType: 'link',
    done: false
  },
];

const ckeditorScriptUrl = "https://cdn.ckeditor.com/4.22.1/standard/ckeditor.js";

const descriptionPlaceholder = `Всё, что важно знать учащимся до записи на курс. Расскажите о:\n\n• цели курса,\n• почему стоит выбрать именно его,\n• что приобретут учащиеся после его успешного освоения,\n• какие особенности есть у курса,\n• что нужно будет делать,\n• какие разделы и задания входят в курс.`;

const targetingPlaceholder = `Что нужно знать и уметь до старта, чтобы курс не оказался слишком сложным или слишком простым.`;

export default function EditCourse() {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const [section, setSection] = useState('info');
  const [checklist, setChecklist] = useState(checklistStructure);
  const [showEditInfo, setShowEditInfo] = useState(false);
  const [title, setTitle] = useState('');
  const [shortDescr, setShortDescr] = useState('');
  const [workload, setWorkload] = useState('');
  const [learningOutcomes, setLearningOutcomes] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [learningFormat, setLearningFormat] = useState('');
  const [categories, setCategories] = useState([]);
  const [lang, setLang] = useState('Русский');
  const [level, setLevel] = useState('');
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const languageOptions = [
    { value: 'be', label: 'беларуская' },
    { value: 'de', label: 'Deutsch' },
    { value: 'en', label: 'English' },
    { value: 'es', label: 'español' },
    { value: 'pt', label: 'Português' },
    { value: 'ru', label: 'Русский' },
    { value: 'uk', label: 'Українська' },
    { value: 'zh', label: '简体中文' },
    { value: 'af', label: 'Afrikaans' },
    { value: 'ar', label: 'العربيّة' },
    { value: 'ast', label: 'asturianu' },
    { value: 'az', label: 'Azərbaycanca' },
    { value: 'bg', label: 'български' },
    { value: 'bn', label: 'বাংলা' },
    { value: 'br', label: 'brezhoneg' },
    { value: 'bs', label: 'bosanski' },
    { value: 'ca', label: 'català' },
    { value: 'cs', label: 'česky' },
    { value: 'cy', label: 'Cymraeg' },
    { value: 'da', label: 'dansk' },
    { value: 'el', label: 'Ελληνικά' },
    { value: 'en-AU', label: 'Australian English' },
    { value: 'en-GB', label: 'British English' },
    { value: 'eo', label: 'Esperanto' },
    { value: 'es-AR', label: 'español de Argentina' },
    { value: 'es-CO', label: 'español de Colombia' },
    { value: 'es-MX', label: 'español de Mexico' },
    { value: 'es-NI', label: 'español de Nicaragua' },
    { value: 'es-VE', label: 'español de Venezuela' },
    { value: 'et', label: 'eesti' },
    { value: 'eu', label: 'Basque' },
    { value: 'fa', label: 'فارسی' },
    { value: 'fi', label: 'suomi' },
    { value: 'fr', label: 'français' },
    { value: 'fy', label: 'frysk' },
    { value: 'ga', label: 'Gaeilge' },
    { value: 'gd', label: 'Gàidhlig' },
    { value: 'gl', label: 'galego' },
    { value: 'he', label: 'עברית' },
    { value: 'hi', label: 'Hindi' },
    { value: 'hr', label: 'Hrvatski' },
    { value: 'hu', label: 'Magyar' },
    { value: 'ia', label: 'Interlingua' },
    { value: 'id', label: 'Bahasa Indonesia' },
    { value: 'io', label: 'ido' },
    { value: 'is', label: 'Íslenska' },
    { value: 'it', label: 'italiano' },
    { value: 'ja', label: '日本語' },
    { value: 'ka', label: 'ქართული' },
    { value: 'kk', label: 'Қазақ' },
    { value: 'km', label: 'Khmer' },
    { value: 'kn', label: 'Kannada' },
    { value: 'ko', label: '한국어' },
    { value: 'lb', label: 'Lëtzebuergesch' },
    { value: 'lt', label: 'Lietuviškai' },
    { value: 'lv', label: 'latviešu' },
    { value: 'mk', label: 'Македонски' },
    { value: 'ml', label: 'Malayalam' },
    { value: 'mn', label: 'Mongolian' },
    { value: 'mr', label: 'मराठी' },
    { value: 'my', label: 'မြန်မာဘာသာ' },
    { value: 'nb', label: 'norsk (bokmål)' },
    { value: 'ne', label: 'नेपाली' },
    { value: 'nl', label: 'Nederlands' },
    { value: 'nn', label: 'norsk (nynorsk)' },
    { value: 'os', label: 'Ирон' },
    { value: 'pa', label: 'Punjabi' },
    { value: 'pl', label: 'polski' },
    { value: 'pt-BR', label: 'Português Brasileiro' },
    { value: 'ro', label: 'Română' },
    { value: 'sk', label: 'Slovensky' },
    { value: 'sl', label: 'Slovenščina' },
    { value: 'sq', label: 'shqip' },
    { value: 'sr', label: 'српски' },
    { value: 'sr-Latn', label: 'srpski (latinica)' },
    { value: 'sv', label: 'svenska' },
    { value: 'sw', label: 'Kiswahili' },
    { value: 'ta', label: 'தமிழ்' },
    { value: 'te', label: 'తెలుగు' },
    { value: 'th', label: 'ภาษาไทย' },
    { value: 'tr', label: 'Türkçe' },
    { value: 'tt', label: 'Татарча' },
    { value: 'udm', label: 'Удмурт' },
    { value: 'ur', label: 'اردو' },
    { value: 'vi', label: 'Tiếng Việt' },
    { value: 'zh-TW', label: '繁體中文' },
  ];
  const [logoHover, setLogoHover] = useState(false);
  const [videoHover, setVideoHover] = useState(false);
  const [targeting, setTargeting] = useState('');
  const [syllabusEditMode, setSyllabusEditMode] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [softDeadline, setSoftDeadline] = useState(null);
  const [hardDeadline, setHardDeadline] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [gradingPolicy, setGradingPolicy] = useState('none');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const history = useHistory();
  const location = useLocation();
  const { t } = useTranslation();
  const { id } = useParams();

  // State for presentation checklist
  const [checklistPresentation, setChecklistPresentation] = useState(checklistPresentationData);

  const [dirty, setDirty] = useState(false);

  // При первой загрузке читаем параметр section из query (?section=checklist)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sectionParam = params.get('section');
    if (sectionParam && ['info','syllabus','checklist','news','comments','reviews'].includes(sectionParam)) {
      setSection(sectionParam);
    }
  }, [location.search]);

  function recalcChecklist() {
    const count = Math.floor(Math.random() * 4) + 3;
    const newChecklist = checklistStructure.map((item, idx) => ({ ...item, done: idx < count }));
    const newPresentation = checklistPresentation.map((item, idx) => ({ ...item, done: idx < 2 }));
    // update states
    setChecklist(newChecklist);
    setChecklistPresentation(newPresentation);
  }

  // compute progress
  const doneCountAll = checklistStructure.filter(i=>i.done).length + checklistPresentation.filter(i=>i.done).length;
  const totalChecklist = checklistStructure.length + checklistPresentation.length;

  const [logoUrl, setLogoUrl] = useState(null);
  const [introUrl, setIntroUrl] = useState(null);
  const logoInputRef = useRef(null);
  const introInputRef = useRef(null);
  const descriptionRef = useRef(null);
  const requirementsRef = useRef(null);
  const learningFormatRef = useRef(null);
  const [activeEditor, setActiveEditor] = useState(null);
  const [formatStates, setFormatStates] = useState({
    desc: { bold:false, italic:false, underline:false, ordered:false, unordered:false },
    req:  { bold:false, italic:false, underline:false, ordered:false, unordered:false },
    learn:{ bold:false, italic:false, underline:false, ordered:false, unordered:false }
  });

  const activeBtnStyle = { backgroundColor: '#d7d3ff', borderRadius: 4 };

  const [savedRange, setSavedRange] = useState(null);
  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      setSavedRange(sel.getRangeAt(0).cloneRange());
    }
  };

  // attach listeners to preserve caret
  const editorCommonProps = (ref, setter) => ({
    ref,
    contentEditable: true,
    suppressContentEditableWarning: true,
    onFocus: () => { setActiveEditor(ref.current); saveSelection(); },
    onInput: saveSelection,
    onBlur: () => { if (ref.current){ setter(ref.current.innerHTML); setDirty(true);} },
    onKeyUp: saveSelection,
    onMouseUp: saveSelection,
  });

  const escapeHtml = (str='') => str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const handleInsertCode = () => {
    if (!activeEditor) return;
    const lang = window.prompt('Язык программирования (например, js, python, java):', 'javascript');
    if (lang === null) return;
    const code = window.prompt('Введите код', '');
    if (code === null) return;
    const html = `<pre><code class="language-${lang}">${escapeHtml(code)}</code></pre>`;
    activeEditor.focus();
    document.execCommand('insertHTML', false, html);
    // restore saved caret position (after focus)
    if (savedRange) {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(savedRange);
    }
  };

  const uploadFile = async (file, type)=>{
    if(!file) return;
    const form = new FormData();
    form.append('file', file);
    try{
      const res = await axios.post(`/courses/${id}/upload?type=${type}`, form, { headers:{ 'Content-Type':'multipart/form-data', Authorization:`Bearer ${localStorage.getItem('jwtToken')}` }});
      if(type==='logo') setLogoUrl(res.data.url);
      else setIntroUrl(res.data.url);
    }catch(err){ console.error('upload fail',err);}  
  };

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  // helper that runs document.execCommand for the currently active editor
  const handleCommand = (panel, cmd) => {
    if (!activeEditor) return;
    activeEditor.focus();
    // restore saved caret position (after focus)
    if (savedRange) {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(savedRange);
    }

    // Enable styling with CSS instead of deprecated tags
    if (['bold','italic','underline'].includes(cmd)) {
      try { document.execCommand('styleWithCSS', false, true); } catch(e) {}
    }

    if (cmd === 'createLink') {
      const url = prompt('Введите URL', 'https://');
      if (url) document.execCommand('createLink', false, url);
      return;
    }

    const success = document.execCommand(cmd, false, null);
    // fallback: wrap selection if execCommand failed (some browsers)
    if (!success && ['bold','italic','underline'].includes(cmd) && savedRange) {
      const wrapTag = cmd === 'bold' ? 'strong' : cmd === 'italic' ? 'em' : 'span';
      const span = document.createElement(wrapTag);
      span.style.fontWeight = cmd==='bold'?'700':undefined;
      span.style.fontStyle = cmd==='italic'?'italic':undefined;
      span.style.textDecoration = cmd==='underline'?'underline':undefined;
      span.appendChild(savedRange.extractContents());
      savedRange.insertNode(span);
    }

    // after executing, update local format state for persistent highlight
    const map = { bold:'bold', italic:'italic', underline:'underline', insertOrderedList:'ordered', insertUnorderedList:'unordered' };
    const key = map[cmd];
    if (key) {
      setFormatStates(prev => ({
        ...prev,
        [panel]: { ...prev[panel], [key]: !prev[panel][key] }
      }));
    }
  };

  const imageInputRef = useRef(null);

  const handleImageInsert = (e) => {
    const file = e.target.files[0];
    if (!file || !activeEditor) return;
    const url = URL.createObjectURL(file);
    activeEditor.focus();
    if (savedRange) {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(savedRange);
    }
    const html = `<img src="${url}" style="max-width:100%;" />`;
    document.execCommand('insertHTML', false, html);
    e.target.value = '';
  };

  // (helper removed)

  useEffect(()=>{
    const handler = (e)=>{ if(dirty){ e.preventDefault(); e.returnValue=''; } };
    window.addEventListener('beforeunload', handler);
    return ()=>window.removeEventListener('beforeunload', handler);
  },[dirty]);

  const pageBg = 'var(--teach-bg)';
  const formBg = 'var(--teach-tile-bg)';
  const fieldBg = 'var(--field-bg)';
  const textColor = 'var(--text-color)';
  const borderColor = 'var(--border-color)';
  const titleColor = 'var(--text-color)';
  const toolbarBg = dark ? 'var(--teach-hover-bg)' : '#f8f9fa';

  return (
    <div style={{ minHeight: '100vh', background: dark ? '#18191c' : '#fff', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        body.dark-theme ul.submenu.language-submenu, [data-theme="dark"] ul.submenu.language-submenu {
          background: #23272f !important;
          color: #fff !important;
          box-shadow: 0 6px 20px rgba(0,0,0,0.45) !important;
          border: 1.5px solid #333 !important;
        }
        body.dark-theme ul.submenu.language-submenu li, [data-theme="dark"] ul.submenu.language-submenu li {
          color: #fff !important;
        }
        body.dark-theme ul.submenu.language-submenu li:hover, [data-theme="dark"] ul.submenu.language-submenu li:hover {
          background: #2d3038 !important;
          color: #fff !important;
        }
      `}</style>
        <NavBar />
      <div style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - 60px)' }}>
        <TeachNavMenu variant="editcourse" onSectionChange={setSection} />
        <main className="marco-layout" style={{ flex: 1, background: dark ? '#23272a' : '#fff', padding: 32, display: 'flex', alignItems: 'flex-start', color: dark ? '#eaf4fd' : '#222' }}>
          {/* section content start */}
          {section === 'info' && (
            <div style={showEditInfo ? { width: '100%' } : { maxWidth: 540, width: '100%' }}>
              {!showEditInfo ? (
                <>
                  <h1 style={{ marginBottom: 18, color: dark ? '#fff' : '#222', transition: 'color 0.22s' }}>{t('course.about','О курсе')}</h1>
                  <div className="course-info__actions" style={{ display: 'flex', gap: 16, marginBottom: 18 }}>
                    <a href="#" className="button has-icon teach-nav-link anim-btn" data-qa="course-info__edit-btn" style={{ display: 'flex', alignItems: 'center', gap: 8, background: dark ? 'rgba(68,133,237,0.12)' : '#fff', border: `1.5px solid #4485ed`, borderRadius: 6, padding: '10px 22px', fontWeight: 600, color: dark ? '#eaf4fd' : '#4485ed', textDecoration: 'none', fontSize: 16, boxShadow: dark ? 'none' : '0 2px 4px rgba(0,0,0,0.04)', transition:'background 0.18s, color 0.18s' }} onMouseOver={e=>{e.currentTarget.style.background = '#4485ed'; e.currentTarget.style.color='#fff';}} onMouseOut={e=>{e.currentTarget.style.background = dark ? 'rgba(68,133,237,0.12)' : '#fff'; e.currentTarget.style.color = dark ? '#eaf4fd' : '#4485ed';}} onClick={e => {e.preventDefault(); setShowEditInfo(true);}}>
                      <FontAwesomeIcon icon={faPen} />
                      <span>{t('course.edit_description','Редактировать описание')}</span>
                    </a>
                    <a
                      href={`/course-promo/${id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="button is-outlined has-icon teach-nav-link anim-btn"
                      data-qa="course-info__promo-btn"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, background: dark ? 'rgba(68,133,237,0.12)' : '#fff', border: '1.5px solid #4485ed', borderRadius: 6, padding: '10px 22px', fontWeight: 600, color: dark ? '#eaf4fd' : '#4485ed', textDecoration: 'none', fontSize: 16, transition:'background 0.18s, color 0.18s', boxShadow: dark ? 'none' : '0 2px 4px rgba(0,0,0,0.04)'
                      }}
                    >
                      <FontAwesomeIcon icon={faEye} />
                      <span>{t('course.open_promo','Открыть промостраницу')}</span>
                    </a>
                  </div>
                  <div style={{ color: dark ? '#eaf4fd' : '#666', fontSize: 16, marginTop: 12, transition:'color 0.22s' }}>
                    {t('course.add_info_placeholder','Добавьте информативное описание, чтобы учащимся было проще выбрать курс.')}
                  </div>
                </>
              ) : (
                <div style={{ background: dark ? '#23272a' : '#fff', borderRadius: 12, boxShadow: dark ? '0 2px 8px rgba(0,0,0,0.18)' : '0 2px 8px rgba(0,0,0,0.04)', padding: 0 }}>
                  <header className="marco-layout__header" data-marco-full-height-sidebar="" style={{ padding: '24px 24px 0 24px' }}>
                    <h1>О курсе</h1>
                  </header>
                  <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', padding: 24 }}>
                    <div
                      className="course-info-editor__upload-widget-content"
                      data-state="empty"
                      onMouseEnter={() => setLogoHover(true)}
                      onMouseLeave={() => setLogoHover(false)}
                      onClick={()=> logoInputRef.current && logoInputRef.current.click()}
                      style={{
                        cursor:'pointer',
                        border: '1.5px solid',
                        borderColor: logoHover ? '#4485ed' : (dark ? '#36607e' : '#eaeaea'),
                        background: logoHover ? (dark ? '#23344a' : '#f0f7ff') : (dark ? '#23272a' : '#fff'),
                        borderRadius: 8,
                        transition: 'all 0.18s cubic-bezier(.4,0,.2,1)',
                        position:'relative', overflow:'hidden'
                      }}
                    >
                      {logoUrl ? (
                        <img src={logoUrl} alt="logo" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                      ):(
                      <div className="course-info-editor__upload-widget-inner" style={{ color: logoHover ? '#4485ed' : (dark ? '#b6d4fe' : '#666'), transition:'color 0.18s' }}>
                        <span className="svg-icon img-placeholder_icon course-info-editor__upload-widget-icon" style={{ display: 'inline-block', marginBottom: 8 }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">
                            <use xlinkHref="https://cdn.stepik.net/static/frontend-build/icons.svg#img-placeholder"></use>
                          </svg>
                        </span>
                        <div className="course-info-editor__upload-widget-label" style={{ fontSize: 16, fontWeight: 500 }}>
                          {logoHover ? 'Загрузить' : 'Логотип'}
                        </div>
                        <div className="course-info-editor__upload-widget-text">png-файл<br />с прозрачностью<br />230×230px</div>
                      </div>) }
                      <input type="file" accept="image/png,image/jpeg" ref={logoInputRef} style={{ display:'none' }} onChange={e=>{ const f=e.target.files[0]; if(f){ setLogoUrl(URL.createObjectURL(f)); uploadFile(f,'logo');}}} />
                    </div>
                    <div
                      className="course-info-editor__upload-widget-content"
                      data-state="empty"
                      onMouseEnter={() => setVideoHover(true)}
                      onMouseLeave={() => setVideoHover(false)}
                      onClick={()=> introInputRef.current && introInputRef.current.click()}
                      style={{
                        cursor:'pointer',
                        border: '1.5px solid',
                        borderColor: videoHover ? '#4485ed' : (dark ? '#36607e' : '#eaeaea'),
                        background: videoHover ? (dark ? '#23344a' : '#f0f7ff') : (dark ? '#23272a' : '#fff'),
                        borderRadius: 8,
                        transition: 'all 0.18s cubic-bezier(.4,0,.2,1)',
                        position:'relative', overflow:'hidden'
                      }}
                    >
                      {introUrl ? (
                        <video src={introUrl} style={{ width:'100%', height:'100%', objectFit:'cover' }} muted />
                      ):(
                      <div className="course-info-editor__upload-widget-inner" style={{ color: videoHover ? '#4485ed' : (dark ? '#b6d4fe' : '#666'), transition:'color 0.18s' }}>
                        <span className="svg-icon play-button_icon course-info-editor__upload-widget-icon" style={{ display: 'inline-block', marginBottom: 8 }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">
                            <use xlinkHref="https://cdn.stepik.net/static/frontend-build/icons.svg#play-button"></use>
                          </svg>
                        </span>
                        <div className="course-info-editor__upload-widget-label" style={{ fontSize: 16, fontWeight: 500 }}>
                          {videoHover ? 'Добавить вводное видео' : 'Вводное видео'}
                        </div>
                        <div className="course-info-editor__upload-widget-text">до 500 МБ</div>
                      </div>) }
                      <input type="file" accept="video/*" ref={introInputRef} style={{ display:'none' }} onChange={e=>{ const f=e.target.files[0]; if(f){ setIntroUrl(URL.createObjectURL(f)); uploadFile(f,'intro');}}} />
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 260 }}>
                    <div className="course-info-editor__section-heading" data-qa="course-title" style={{ marginBottom: 6 }}>
                      {/* Название курса редактируется в левом боковом меню TeachNavMenu */}
                    </div>
                    <label htmlFor="tags" style={{ fontSize: 16, fontWeight: 600 }}>Категории курса</label>
                    <button className="button tags-modal-selector-btn is-outlined has-icon tags-course-tags__btn" type="button" onClick={() => setCategoryModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0', border: `1.5px solid ${dark ? '#4485ed' : '#4485ed'}`, borderRadius: 6, background: '#fff', color: dark ? '#eaf4fd' : '#4485ed', fontWeight: 500, fontSize: 15 }}>
                      <span className="svg-icon plus-2_icon svg-icon_inline" style={{ display: 'inline-flex', alignItems: 'center' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><use xlinkHref="https://cdn.stepik.net/static/frontend-build/icons.svg?1750845176#plus-2"></use></svg>
                      </span>
                      <span>{t('course.category_hint','Выберите категорию')}</span>
                    </button>
                    <div className="tags-course-tags__note" style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>
                      {t('course.category_hint_desc','Выберите до 5 категорий, к которым относится курс')}
                    </div>
                    <label htmlFor="short-descr" style={{ fontSize: 16, fontWeight: 600 }}>Краткое описание</label>
                    <textarea id="short-descr" rows={4} className="st-input w-full block" placeholder="Видно в поиске и на промостранице сразу после названия курса. Входит в предпросмотр опубликованной в соцсетях ссылки на курс." maxLength={512} style={{ height: 103, marginBottom: 4, width: '100%', fontSize: 16, padding: 8, borderRadius: 6, border: dark ? '1.5px solid #36607e' : '1.5px solid #eaeaea', background: 'var(--teach-bg)', color: 'var(--teach-fg)', transition: 'background 0.18s, color 0.18s' }} value={shortDescr} onChange={e => {setShortDescr(e.target.value); setDirty(true);}} />
                    <div className="course-info-editor__input-note" style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>
                      {t('course.add_info_note','Для публикации нужно больше 100 символов')}
                      <span style={{ float: 'right' }}>{shortDescr.length}/512</span>
            </div>
                    <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap:'nowrap' }}>
                      <div style={{ flex: 1, minWidth: 120 }}>
                        <label htmlFor="lang" style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, display: 'block' }}>Язык</label>
                        <div style={{ position: 'relative' }}>
                          <div
                            id="lang-select"
                            className="select-box__toggle-btn"
                            style={{ width:'100%', display: 'flex', alignItems: 'center', gap: 8, border: `1.5px solid ${dark ? '#4485ed' : '#4485ed'}`, borderRadius: 6, background: '#fff', color: '#333', fontWeight: 500, fontSize: 15, padding: '8px 12px', lineHeight:'20px', boxSizing:'border-box', cursor: 'pointer' }}
                            onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                            tabIndex={0}
                          >
                            <span className="select-box-option__slot-item">
                              <span className="select-box-option__content">{lang}</span>
                            </span>
                            <span style={{ marginLeft: 'auto', fontSize: 12 }}>▼</span>
                          </div>
                          {langDropdownOpen && (
                            <ul className="drop-down__content drop-down-content select-box__content menu" style={{
                              position: 'absolute',
                              zIndex: 10,
                              background: dark ? '#23272f' : '#fff',
                              color: dark ? '#fff' : '#222',
                              border: dark ? '1.5px solid #333' : '1.5px solid rgb(234, 234, 234)',
                              borderRadius: 6,
                              marginTop: 2,
                              width: '100%',
                              maxHeight: 220,
                              overflowY: 'auto',
                              boxShadow: dark ? '0 2px 16px rgba(0,0,0,0.32)' : '0 2px 8px rgba(0,0,0,0.08)',
                              transition: 'background 0.22s, color 0.22s, box-shadow 0.22s',
                            }}>
                              <li hidden className="select-box-item select-box__option menu-item"><button disabled type="button"><span className="select-box-option__content" data-appearance="placeholder">Язык</span></button></li>
                              {languageOptions.map(opt => (
                                <li key={opt.value} className={`select-box-item select-box__option menu-item${lang === opt.label ? ' selected' : ''}`} data-selected={lang === opt.label ? true : undefined}>
                                  <button type="button" style={{
                                    width: '100%',
                                    textAlign: 'left',
                                    background: 'none',
                                    border: 'none',
                                    padding: '8px 12px',
                                    fontSize: 15,
                                    color: dark ? '#fff' : '#333',
                                    cursor: 'pointer',
                                    borderRadius: 4,
                                    transition: 'background 0.18s, color 0.18s',
                                  }}
                                  onMouseOver={e => e.currentTarget.style.background = dark ? '#2d3038' : '#f0f0f0'}
                                  onMouseOut={e => e.currentTarget.style.background = 'none'}
                                  onClick={() => { setLang(opt.label); setLangDropdownOpen(false); }}
                                  >
                                    <span className="select-box-option__content">{opt.label}</span>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                      <div style={{ flex: 1, minWidth: 120 }}>
                        <label htmlFor="level" style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, display: 'block' }}>Уровень</label>
                        <select id="level" className="st-input w-full block" style={{ width: '100%', fontSize: 16, padding: 8, borderRadius: 6, border: dark ? '1.5px solid #36607e' : '1.5px solid #eaeaea', background: 'var(--teach-bg)', color: 'var(--teach-fg)', transition: 'background 0.18s, color 0.18s' }} value={level} onChange={e => {setLevel(e.target.value); setDirty(true);}}>
                          <option value="" disabled>{t('course.choose_level','Выберите уровень…')}</option>
                          <option value="Начальный">{t('course.beginner_level','Начальный')}</option>
                          <option value="Средний">{t('course.intermediate_level','Средний')}</option>
                          <option value="Продвинутый">{t('course.advanced_level','Продвинутый')}</option>
                        </select>
                      </div>
                      <div style={{ flex: 1, minWidth: 120 }}>
                        <label htmlFor="workload" style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, display: 'block' }}>Рекомендуемая нагрузка</label>
                        <input id="workload" className="st-input w-full block" placeholder="4-5 часов в неделю" maxLength={64} type="text" style={{ width: '100%', fontSize: 16, padding: 8, borderRadius: 6, border: dark ? '1.5px solid #36607e' : '1.5px solid #eaeaea', background: 'var(--teach-bg)', color: 'var(--teach-fg)', transition: 'background 0.18s, color 0.18s' }} value={workload} onChange={e => {setWorkload(e.target.value); setDirty(true);}} />
                      </div>
                    </div>
                    <label htmlFor="learning-outcomes" style={{ fontSize: 16, fontWeight: 600 }}>Чему вы научитесь</label>
                    <textarea
                      id="learning-outcomes"
                      rows={5}
                      className="st-input w-full block"
                      placeholder={`Перечислите ожидаемые результаты обучения — что будут знать и уметь учащиеся после успешного освоения курса.\n\nВам могут помочь глаголы учебных целей таксономии Блума: применять, разрабатывать, строить, сравнивать и т.д.`}
                      maxLength={2000}
                      style={{ height: 123, marginBottom: 4, width: '100%', fontSize: 16, padding: 8, borderRadius: 6, border: dark ? '1.5px solid #36607e' : '1.5px solid #eaeaea', background: 'var(--teach-bg)', color: 'var(--teach-fg)', transition: 'background 0.18s, color 0.18s' }}
                      value={learningOutcomes}
                      onChange={e => setLearningOutcomes(e.target.value)}
                    />
                    <div className="course-info-editor__input-note" style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>
                      {t('course.add_info_note','Каждый пункт начинайте с новой строки')}
                    </div>
                    <label htmlFor="description" style={{ fontSize: 16, fontWeight: 600 }}>О курсе</label>
                    {/* Static toolbar + textarea for target audience */}
                    <div className="custom-toolbar" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 8px', border: `1.5px solid ${dark ? '#4485ed' : '#4485ed'}`, borderBottom: 'none', borderRadius: '6px 6px 0 0', background: toolbarBg }}>
                      <span className="cke_button_icon cke_button__undo_icon" onClick={()=>handleCommand('desc','undo')} style={{ cursor:'pointer', width:16, height:16, backgroundImage:"url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/icons.png?t=M199')", backgroundPosition:'0 -1536px', backgroundSize:'auto', display:'inline-block' }}></span>
                      <span className="cke_button_icon cke_button__redo_icon" onClick={()=>handleCommand('desc','redo')} style={{ cursor:'pointer', width:16, height:16, backgroundImage:"url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/icons.png?t=M199')", backgroundPosition:'0 -1488px', backgroundSize:'auto', display:'inline-block' }}></span>
                      <span className="cke_button_icon cke_button__bold_icon" onClick={()=>handleCommand('desc','bold')} style={{ cursor:'pointer', width:16, height:16, backgroundImage:"url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/basicstyles/icons/bold.png?t=1750845176')", backgroundPosition:'0 0px', backgroundSize:'16px', display:'inline-block', ...(formatStates.desc.bold ? activeBtnStyle : {}) }}></span>
                      <span className="cke_button_icon cke_button__italic_icon" onClick={()=>handleCommand('desc','italic')} style={{ cursor:'pointer', width:16, height:16, backgroundImage:"url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/basicstyles/icons/italic.png?t=1750845176')", backgroundPosition:'0 0px', backgroundSize:'16px', display:'inline-block', ...(formatStates.desc.italic ? activeBtnStyle : {}) }}></span>
                      <span className="cke_button_icon cke_button__underline_icon" onClick={()=>handleCommand('desc','underline')} style={{ cursor:'pointer', width:16, height:16, backgroundImage:"url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/basicstyles/icons/underline.png?t=1750845176')", backgroundPosition:'0 0px', backgroundSize:'16px', display:'inline-block', ...(formatStates.desc.underline ? activeBtnStyle : {}) }}></span>
                      <span className="cke_button_icon cke_button__numberedlist_icon" onClick={()=>handleCommand('desc','insertOrderedList')} style={{ cursor:'pointer', width:16, height:16, backgroundImage:"url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/icons.png?t=M199')", backgroundPosition:'0 -1080px', backgroundSize:'auto', display:'inline-block', ...(formatStates.desc.ordered ? activeBtnStyle : {}) }}></span>
                      <span className="cke_button_icon cke_button__bulletedlist_icon" onClick={()=>handleCommand('desc','insertUnorderedList')} style={{ cursor:'pointer', width:16, height:16, backgroundImage:"url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/icons.png?t=M199')", backgroundPosition:'0 -1032px', backgroundSize:'auto', display:'inline-block', ...(formatStates.desc.unordered ? activeBtnStyle : {}) }}></span>
                      <span className="cke_button_icon cke_button__link_icon" onClick={()=>handleCommand('desc','createLink')} style={{ cursor:'pointer', width:16, height:16, backgroundImage:"url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/icons.png?t=M199')", backgroundPosition:'0 -960px', backgroundSize:'auto', display:'inline-block' }}></span>
                      <span className="cke_button_icon cke_button__unlink_icon" onClick={()=>handleCommand('desc','unlink')} style={{ cursor:'pointer', width:16, height:16, backgroundImage:"url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/icons.png?t=M199')", backgroundPosition:'0 -984px', backgroundSize:'auto', display:'inline-block', opacity: 0.4 }}></span>
                      <span className="cke_button_icon cke_button__image_icon" onClick={()=>imageInputRef.current && imageInputRef.current.click()} style={{ cursor:'pointer', width:16, height:16, backgroundImage:"url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/icons.png?t=M199')", backgroundPosition:'0 -1560px', backgroundSize:'auto', display:'inline-block' }}></span>
                      <input type="file" accept="image/*" ref={imageInputRef} style={{ display:'none' }} onChange={handleImageInsert} />
                      <span className="cke_button_icon cke_button__codesnippet_icon" onClick={handleInsertCode} style={{ cursor:'pointer', width:16, height:16, backgroundImage:"url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/codesnippet/icons/codesnippet.png?t=1750845176')", backgroundPosition:'0 0px', backgroundSize:'16px', display:'inline-block' }}></span>
                      <span className="cke_button_label cke_button__source_label" style={{ fontSize:14, color:textColor }}>Source</span>
                    </div>
                    <div
                      id="targeting"
                      {...editorCommonProps(descriptionRef, setTargeting)}
                      style={{ minHeight:124, marginBottom:12, width:'100%', fontSize:16, padding:8, borderRadius:6, border:dark ? '1.5px solid #36607e' : '1.5px solid rgb(234, 234, 234)', background: 'var(--teach-bg)', color: 'var(--teach-fg)', outline:'none' }}
                    />

                    {/* Requirements (CKEditor) */}
                    <section className="course-info-editor__section">
                      <div className="course-info-editor__section-heading" data-qa="requirements" style={{ fontWeight: 600, fontSize: 14 }}>
                        <label htmlFor="requirements" style={{ fontSize: 16, fontWeight: 600 }}>{t('course.requirements','Начальные требования')}</label>
                        <span className="svg-icon question-filled_icon svg-icon_inline svg-icon_inline-baseline ui-help" tabIndex="0" style={{ marginLeft: 4 }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18">
                            <use xlinkHref="https://cdn.stepik.net/static/frontend-build/icons.svg?1750845176#question-filled"></use>
                          </svg>
                        </span>
                      </div>
                      <div className="custom-toolbar" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 8px', border: `1.5px solid ${dark ? '#4485ed' : '#4485ed'}`, borderBottom: 'none', borderRadius: '6px 6px 0 0', background: toolbarBg }}>
                        <span className="cke_button_icon cke_button__bold_icon" onClick={()=>handleCommand('req','bold')} style={{ cursor:'pointer', width: 16, height: 16, backgroundImage: "url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/basicstyles/icons/bold.png?t=1750845176')", backgroundPosition: '0 0px', backgroundSize: '16px', display: 'inline-block' }}></span>
                        <span className="cke_button_icon cke_button__italic_icon" onClick={()=>handleCommand('req','italic')} style={{ cursor:'pointer', width: 16, height: 16, backgroundImage: "url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/basicstyles/icons/italic.png?t=1750845176')", backgroundPosition: '0 0px', backgroundSize: '16px', display: 'inline-block' }}></span>
                        <span className="cke_button_icon cke_button__underline_icon" onClick={()=>handleCommand('req','underline')} style={{ cursor:'pointer', width: 16, height: 16, backgroundImage: "url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/basicstyles/icons/underline.png?t=1750845176')", backgroundPosition: '0 0px', backgroundSize: '16px', display: 'inline-block' }}></span>
                        <span className="cke_button_icon cke_button__numberedlist_icon" onClick={()=>handleCommand('req','insertOrderedList')} style={{ cursor:'pointer', width: 16, height: 16, backgroundImage: "url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/icons.png?t=M199')", backgroundPosition: '0 -1080px', backgroundSize: 'auto', display: 'inline-block' }}></span>
                        <span className="cke_button_icon cke_button__bulletedlist_icon" onClick={()=>handleCommand('req','insertUnorderedList')} style={{ cursor:'pointer', width: 16, height: 16, backgroundImage: "url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/icons.png?t=M199')", backgroundPosition: '0 -1032px', backgroundSize: 'auto', display: 'inline-block' }}></span>
                        <span className="cke_button_icon cke_button__link_icon" onClick={()=>handleCommand('req','createLink')} style={{ cursor:'pointer', width: 16, height: 16, backgroundImage: "url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/icons.png?t=M199')", backgroundPosition: '0 -960px', backgroundSize: 'auto', display: 'inline-block' }}></span>
                        <span className="cke_button_icon cke_button__unlink_icon" onClick={()=>handleCommand('req','unlink')} style={{ cursor:'pointer', width: 16, height: 16, backgroundImage: "url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/icons.png?t=M199')", backgroundPosition: '0 -984px', backgroundSize: 'auto', display: 'inline-block', opacity: 0.4 }}></span>
                      </div>
                      <div
                        id="requirements"
                        {...editorCommonProps(requirementsRef, setRequirements)}
                        style={{ minHeight:124, marginBottom:12, width:'100%', fontSize:16, padding:8, borderRadius:6, border:dark ? '1.5px solid #36607e' : '1.5px solid rgb(234, 234, 234)', background: 'var(--teach-bg)', color: 'var(--teach-fg)', outline:'none' }}
                      />
                    </section>

                    {/* Learning format (CKEditor) */}
                    <section className="course-info-editor__section">
                      <div className="course-info-editor__section-heading" data-qa="learning-format" style={{ fontWeight: 600, fontSize: 14 }}>
                        <label htmlFor="learning-format" style={{ fontSize: 16, fontWeight: 600 }}>{t('course.learning_format','Как проходит обучение')}</label>
                        <span className="svg-icon question-filled_icon svg-icon_inline svg-icon_inline-baseline ui-help" tabIndex="0" style={{ marginLeft: 4 }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18">
                            <use xlinkHref="https://cdn.stepik.net/static/frontend-build/icons.svg?1750845176#question-filled"></use>
                          </svg>
                        </span>
                      </div>
                      <div className="custom-toolbar" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 8px', border: `1.5px solid ${dark ? '#4485ed' : '#4485ed'}`, borderBottom: 'none', borderRadius: '6px 6px 0 0', background: toolbarBg }}>
                        <span className="cke_button_icon cke_button__bold_icon" onClick={()=>handleCommand('learn','bold')} style={{ cursor:'pointer', width: 16, height: 16, backgroundImage: "url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/basicstyles/icons/bold.png?t=1750845176')", backgroundPosition: '0 0px', backgroundSize: '16px', display: 'inline-block' }}></span>
                        <span className="cke_button_icon cke_button__italic_icon" onClick={()=>handleCommand('learn','italic')} style={{ cursor:'pointer', width: 16, height: 16, backgroundImage: "url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/basicstyles/icons/italic.png?t=1750845176')", backgroundPosition: '0 0px', backgroundSize: '16px', display: 'inline-block' }}></span>
                        <span className="cke_button_icon cke_button__underline_icon" onClick={()=>handleCommand('learn','underline')} style={{ cursor:'pointer', width: 16, height: 16, backgroundImage: "url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/basicstyles/icons/underline.png?t=1750845176')", backgroundPosition: '0 0px', backgroundSize: '16px', display: 'inline-block' }}></span>
                        <span className="cke_button_icon cke_button__numberedlist_icon" onClick={()=>handleCommand('learn','insertOrderedList')} style={{ cursor:'pointer', width: 16, height: 16, backgroundImage: "url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/icons.png?t=M199')", backgroundPosition: '0 -1080px', backgroundSize: 'auto', display: 'inline-block' }}></span>
                        <span className="cke_button_icon cke_button__bulletedlist_icon" onClick={()=>handleCommand('learn','insertUnorderedList')} style={{ cursor:'pointer', width: 16, height: 16, backgroundImage: "url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/icons.png?t=M199')", backgroundPosition: '0 -1032px', backgroundSize: 'auto', display: 'inline-block' }}></span>
                        <span className="cke_button_icon cke_button__link_icon" onClick={()=>handleCommand('learn','createLink')} style={{ cursor:'pointer', width: 16, height: 16, backgroundImage: "url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/icons.png?t=M199')", backgroundPosition: '0 -960px', backgroundSize: 'auto', display: 'inline-block' }}></span>
                        <span className="cke_button_icon cke_button__unlink_icon" onClick={()=>handleCommand('learn','unlink')} style={{ cursor:'pointer', width: 16, height: 16, backgroundImage: "url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/icons.png?t=M199')", backgroundPosition: '0 -984px', backgroundSize: 'auto', display: 'inline-block', opacity: 0.4 }}></span>
                      </div>
                      <div
                        id="learning-format"
                        {...editorCommonProps(learningFormatRef, setLearningFormat)}
                        style={{ minHeight:124, marginBottom:12, width:'100%', fontSize:16, padding:8, borderRadius:6, border:dark ? '1.5px solid #36607e' : '1.5px solid rgb(234, 234, 234)', background: 'var(--teach-bg)', color: 'var(--teach-fg)', outline:'none' }}
                      />
                    </section>

                    {/* Acquired assets */}
                    <div className="course-info-editor__section-heading" data-qa="acquired-assets" style={{ marginBottom: 6 }}>
                      <label htmlFor="acquired-assets" style={{ fontSize: 16, fontWeight: 600 }}>{t('course.acquired_assets','Что вы получаете')}</label>
                      <span className="svg-icon question-filled_icon svg-icon_inline svg-icon_inline-baseline ui-help" style={{ marginLeft: 4 }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18">
                          <use xlinkHref="https://cdn.stepik.net/static/frontend-build/icons.svg?1750845176#question-filled"></use>
                        </svg>
                      </span>
                    </div>
                    <textarea id="acquired-assets" rows={8} className="st-input w-full block" placeholder={"Например:\n\n•  навыки и знания, востребованные работодателем,\n•  возможность отработать теорию на практике,\n•  доступ к форуму решений,\n•  поддержку наставников, которые отвечают в течение дня,\n•  сертификат,\n•  проекты в портфолио."} maxLength={2000} style={{ height: 183, marginBottom: 18, width: '100%', fontSize: 16, padding: 8, borderRadius: 6, border: dark ? '1.5px solid #36607e' : '1.5px solid #eaeaea', background: 'var(--teach-bg)', color: 'var(--teach-fg)', transition: 'background 0.18s, color 0.18s' }} />

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                      <button type="button" className="button anim-btn" style={{ background: dark ? '#23272a' : '#54ad54', color: dark ? '#eaf4fd' : '#fff', border: 'none', borderRadius: 6, padding: '10px 24px', fontSize: 16, fontWeight: 600 }}>{t('course.save','Сохранить')}</button>
                      <button type="button" onClick={()=>setShowEditInfo(false)} className="button is-outlined anim-btn" style={{ background: dark ? '#2d3038' : '#fff', color: dark ? '#eaf4fd' : '#4485ed', border: `1.5px solid ${dark ? '#4485ed' : '#4485ed'}`, borderRadius: 6, padding: '10px 24px', fontSize: 16, fontWeight: 600 }}>{t('course.return_to_preview','Вернуться к предпросмотру')}</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {section === 'syllabus' && (
            <div style={{ maxWidth: 540, width: '100%' }}>
              <h1 style={{ marginBottom: 18 }}>{t('course.syllabus','Программа курса')}</h1>
              <img src="https://cdn.stepik.net/static/frontend/syllabus.png" alt="Содержание" style={{ maxWidth: 320, width: '100%', borderRadius: 12, margin: '18px 0' }} />
              <div className="course-info__actions" style={{ display: 'flex', gap: 16, marginBottom: 18 }}>
                <button
                  className="button has-icon teach-nav-link anim-btn"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8faff', border: `1.5px solid ${dark ? '#4485ed' : '#4485ed'}`, borderRadius: 6, padding: '10px 22px', fontWeight: 500, color: dark ? '#eaf4fd' : '#4485ed', textDecoration: 'none', fontSize: 16 }}
                  onClick={() => history.push(`/editcourse/1/syllabus-editor`)}
                >
                  <span className="svg-icon pencil_icon svg-icon_inline" style={{ display: 'inline-flex', alignItems: 'center' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><use xlinkHref="https://cdn.stepik.net/static/frontend-build/icons.svg#pencil"></use></svg>
                  </span>
                  <span>{t('course.edit_syllabus','Редактировать содержание')}</span>
                </button>
              </div>
              <div style={{ color: dark ? '#eaf4fd' : '#666', fontSize: 16, marginTop: 12, transition:'color 0.22s' }}>
                {t('course.syllabus_empty','В курсе пока что нет ни одного урока.')}<br />
                {t('course.syllabus_add_lesson','Добавьте свой первый урок в редакторе содержания курса')}
              </div>
            </div>
          )}
          {section === 'checklist' && (
            <div style={{ maxWidth: 700, width: '100%' }}>
              <h1 style={{ marginBottom: 18 }}>{t('course.checklist','Чек-лист')}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 18 }}>
                  {t('course.ready_progress','Курс готов на')} {doneCountAll}/{totalChecklist}
                </div>
                <button className="button has-icon course-checklist-refresh" type="button" onClick={recalcChecklist} style={{ background: '#fff', border: `1.5px solid ${dark ? '#4485ed' : '#4485ed'}`, borderRadius: 6, padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'box-shadow .2s' }}>
                  <span className="svg-icon refresh_icon svg-icon_inline" style={{ display: 'inline-flex', alignItems: 'center' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22">
                      <use xlinkHref="https://cdn.stepik.net/static/frontend-build/icons.svg?1750845176#refresh"></use>
                    </svg>
                  </span>
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div className="course-checklist__group-title" style={{ fontWeight: 700, fontSize: 18, margin: '18px 0 8px 0', color: dark ? '#eaf4fd' : '#222', transition:'color 0.22s' }}>
                  {t('course.structure_content','Структура и содержание')}
                </div>
                {checklistStructure.map((item, idx) => (
                  <div key={idx} style={{ background: '#f8faff', border: `1.5px solid ${dark ? '#4485ed' : '#4485ed'}`, borderRadius: 10, padding: '18px 20px', display: 'flex', alignItems: 'flex-start', gap: 18 }}>
                    <span style={{ marginTop: 2, color: item.done ? '#54ad54' : '#e74c3c', fontSize: 22, minWidth: 24, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22">
                        <use xlinkHref={item.done ? "https://cdn.stepik.net/static/frontend-build/icons.svg?1750845176#list-check-mark" : "https://cdn.stepik.net/static/frontend-build/icons.svg?1750845176#list-red-cross-mark"}></use>
                      </svg>
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{t(item.title,item.title)}</div>
                      <div style={{ color: dark ? '#b6d4fe' : '#666', fontSize: 15, marginBottom: 6 }}>{t(item.desc,item.desc)}</div>
                      {item.btn && (
                        <button
                          className="teach-nav-link anim-btn"
                          style={{
                            display: 'inline',
                            background: 'none',
                            border: 'none',
                            color: dark ? '#eaf4fd' : '#4485ed',
                            fontWeight: 500,
                            fontSize: 15,
                            cursor: 'pointer',
                            marginTop: 2,
                            padding: 0,
                            textDecoration: 'underline',
                            textUnderlineOffset: '2px',
                          }}
                          onMouseOver={e => e.currentTarget.style.textDecoration = 'underline'}
                          onMouseOut={e => e.currentTarget.style.textDecoration = 'underline'}
                        >
                          {item.btn}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <div className="course-checklist__group-title" style={{ fontWeight: 700, fontSize: 18, margin: '24px 0 8px 0', color: dark ? '#eaf4fd' : '#222', transition:'color 0.22s' }}>
                  {t('course.presentation','Подача')}
                </div>
                {checklistPresentation.map((item, idx) => (
                  <div key={idx} style={{ background: '#f8faff', border: `1.5px solid ${dark ? '#4485ed' : '#4485ed'}`, borderRadius: 10, padding: '18px 20px', display: 'flex', alignItems: 'flex-start', gap: 18 }}>
                    <span style={{ marginTop: 2, color: item.done ? '#54ad54' : '#e74c3c', fontSize: 22, minWidth: 24, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22">
                        <use xlinkHref={item.done ? "https://cdn.stepik.net/static/frontend-build/icons.svg?1750845176#list-check-mark" : "https://cdn.stepik.net/static/frontend-build/icons.svg?1750845176#list-red-cross-mark"}></use>
                      </svg>
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{t(item.title,item.title)}</div>
                      <div style={{ color: dark ? '#b6d4fe' : '#666', fontSize: 15, marginBottom: 6 }}>{t(item.desc,item.desc)}</div>
                      {item.btn && (
                        <button
                          className="teach-nav-link anim-btn"
                          style={{
                            display: 'inline',
                            background: 'none',
                            border: 'none',
                            color: dark ? '#eaf4fd' : '#4485ed',
                            fontWeight: 500,
                            fontSize: 15,
                            cursor: 'pointer',
                            marginTop: 2,
                            padding: 0,
                            textDecoration: 'underline',
                            textUnderlineOffset: '2px',
                          }}
                          onMouseOver={e => e.currentTarget.style.textDecoration = 'underline'}
                          onMouseOut={e => e.currentTarget.style.textDecoration = 'underline'}
                        >
                          {item.btn}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {section === 'news' && (
            <div style={{ maxWidth: 720, width: '100%' }}>
              <header className="marco-layout__header" style={{ marginBottom: 24 }}>
                <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>{t('course.news','Новости')}</h1>
              </header>
              <p style={{ fontSize: 16, color: '#444', marginBottom: 18 }}>
                Если вы хотите оповестить учащихся о чём-то, то можете использовать для этого новости. Они будут
                видны на странице курса и дополнительно рассылаются на почту.
              </p>
              <p style={{ fontSize: 16, color: '#444', marginBottom: 18 }}>
                Кроме разовых новостей, можно настроить отправку по событию, например, приветственное письмо или
                поздравление с завершением курса.
              </p>
              <p style={{ fontSize: 16, color: '#444', marginBottom: 32 }}>
                Подробнее про новости курса можно почитать в нашей документации
              </p>
              <a href="#" className="button has-icon news__add-btn" style={{ display:'inline-flex', alignItems:'center', gap:8, background:'#54ad54', color:'#fff', border:'none', borderRadius:6, padding:'10px 22px', fontWeight:600, fontSize:16 }}>
                <span className="svg-icon plus_icon svg-icon_inline" style={{ display:'inline-flex', alignItems:'center' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><use href="/static/frontend-build/icons.svg#plus" /></svg>
                </span>
                <span>{t('course.add_news','Добавить новость')}</span>
              </a>
            </div>
          )}
          {section === 'comments' && (
            <div style={{ maxWidth: 720, width: '100%' }}>
              <header className="marco-layout__header course-comments__header" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
                <h1 style={{ margin:0, fontSize:28, fontWeight:700 }}>{t('course.comments','Комментарии')}</h1>
                <a href="#" className="btn-link has-icon course-comments__header-link" style={{ display:'flex', alignItems:'center', gap:6, color:'#4485ed', textDecoration:'none', fontWeight:500, fontSize:16 }}>
                  <span className="svg-icon blacklist_icon svg-icon_inline" style={{ display:'inline-flex', alignItems:'center' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><use href="/static/frontend-build/icons.svg#blacklist" /></svg>
                  </span>
                  <span>{t('course.blacklist','Чёрный список')}</span>
                </a>
              </header>
              <ul className="tab tab--border" style={{ listStyle:'none', padding:0, margin:'0 0 24px 0', display:'flex', gap:16, borderBottom:`1.5px solid ${dark ? '#4485ed' : '#4485ed'}` }}>
                <li className="tab__item discussions__tab" data-active style={{ paddingBottom:8, borderBottom:'3px solid #4485ed', fontWeight:600, color:'#4485ed' }}>
                  <a href="#" style={{ color:'inherit', textDecoration:'none' }}>
                    <span className="tab__item-counter" style={{ marginRight:6 }}>0</span>{t('course.comments','Комментарии')}
                  </a>
                </li>
              </ul>
              <div className="discussions__empty-placeholder" style={{ textAlign:'center', color:'#666', fontSize:16, padding:40, background:'#f8faff', border:`1.5px solid ${dark ? '#4485ed' : '#4485ed'}`, borderRadius:8 }}>
                {t('course.no_discussions','Нет обсуждений. Начните первое.')}
              </div>
            </div>
          )}
          {section === 'reviews' && (
            <div style={{ maxWidth: 720, width: '100%' }}>
              <header className="marco-layout__header" style={{ marginBottom:24 }}>
                <h1 style={{ margin:0, fontSize:28, fontWeight:700 }}>{t('course.reviews','Отзывы')}</h1>
              </header>
              {/* Rating & distribution */}
              <div style={{ display:'flex', alignItems:'flex-start', gap:32, marginBottom:24 }}>
                {/* Average */}
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', minWidth:80 }}>
                  <div style={{ fontSize:56, fontWeight:700, lineHeight:1 }}>0</div>
                  <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                    <span className="svg-icon star2_icon" style={{ color:'#ffb400' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><use href="/static/frontend-build/icons.svg#star2" /></svg>
                    </span>
                  </div>
                </div>
                {/* Distribution */}
                <div style={{ flex:1 }}>
                  {[5,4,3,2,1].map(rate => (
                    <div key={rate} style={{ display:'flex', alignItems:'center', gap:8, height:22 }}>
                      <div style={{ whiteSpace:'nowrap', fontSize:14, color:'#666' }}>{'★'.repeat(rate)}</div>
                      <div style={{ flex:1, height:4, background:'#e6e6e6', borderRadius:2 }}></div>
                    </div>
                  ))}
                  <div style={{ fontSize:14, color:'#666', marginTop:8 }}>{t('course.of_reviews',{count:0, defaultValue:'из 0 отзывов'})}</div>
                </div>
              </div>
              <div className="user-reviews__reviews-count" style={{ fontSize:18, fontWeight:700, marginBottom:12 }}>
                {t('course.review_count',{count:0, defaultValue:'0 отзывов'})}
              </div>

              {/* Divider */}
              <div style={{ height:1, background:'#eaeaea', margin:'8px 0 16px 0' }} />

              {/* Filter toggle */}
              <button id="ember866_tb" className="select-box__toggle-btn" type="button" style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 14px', border:`1.5px solid ${dark ? '#4485ed' : '#4485ed'}`, borderRadius:6, background:'#fff', fontSize:15, marginBottom:24 }}>
                <span id="ember866_c" className="select-box__caption ember-view" style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span id="ember870" className="svg-icon sort_icon svg-icon_inline svg-icon_inline-baseline ember-view user-reviews__reviews-filter-ico" style={{ display:'inline-flex', alignItems:'center' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"><use href="/static/frontend-build/icons.svg#sort" /></svg>
                  </span>
                  {t('course.new','Новые')}
                </span>
              </button>
              <div className="user-reviews__reviews" style={{ textAlign:'center', color:'#666', fontSize:16, padding:40, background:'#f8faff', border:`1.5px solid ${dark ? '#4485ed' : '#4485ed'}`, borderRadius:8 }}>
                <p className="user-reviews__empty-note" style={{ margin:0 }}>
                  {t('course.no_reviews','Ни одного отзыва о вашем курсе пока нет')}
                </p>
          </div>
        </div>
          )}
        </main>
      </div>
      <Footer />
      {categoryModalOpen && (
        <CategorySelectorModal
          open={categoryModalOpen}
          initialSelected={categories}
          onClose={() => setCategoryModalOpen(false)}
          onConfirm={sel => {
            setCategories(sel);
            setCategoryModalOpen(false);
            setDirty(true);
          }}
        />
      )}
      <Prompt when={dirty} message="У вас есть несохранённые изменения. Сохранить перед выходом?" />
      </div>
    );
}
