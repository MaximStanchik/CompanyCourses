import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisV } from '@fortawesome/free-solid-svg-icons';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import TeachNavMenu from './TeachNavMenu';
import { useTranslation } from 'react-i18next';
import useTheme from '../hooks/useTheme';
import './admin.css';
import axios from '../utils/axios';
import { useParams } from 'react-router-dom';

export default function SyllabusEditor() {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [softDeadline, setSoftDeadline] = useState('');
  const [hardDeadline, setHardDeadline] = useState('');
  const [endDate, setEndDate] = useState('');
  const [gradingPolicy, setGradingPolicy] = useState('none');
  /* ===== Модули ===== */
  const [modules, setModules] = useState([]); // array of {id, ...}
  const [lessonInputs, setLessonInputs] = useState({}); // {moduleId: text}
  const [moduleAdvancedOpen, setModuleAdvancedOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const dropdownRef = useRef();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const dark = theme === 'dark';

  const addModule = () => {
    setModules(prev => [...prev, { id: Date.now(), lessons: [] }]);
  };

  const deleteModule = (id) => {
    setModules(prev => prev.filter(m => m.id !== id));
    setActiveMenuId(null);
  };

  const copyModule = (id) => {
    setModules(prev => {
      const mod = prev.find(m => m.id === id);
      if (!mod) return prev;
      return [...prev, { ...mod, id: Date.now() }];
    });
    setActiveMenuId(null);
  };

  // close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) && !e.target.closest('.menu-more_icon')) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ===== Создание урока ===== */
  const { id: courseId } = useParams();

  const handleLessonInput = (moduleId, value) => {
    setLessonInputs(prev => ({ ...prev, [moduleId]: value }));
  };

  const createLesson = async (moduleId) => {
    const title = (lessonInputs[moduleId] || '').trim();
    if (!title) return;
    try {
      await axios.post(`/courses/${courseId}/lectures`, { name: title, content: '' }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` }
      });
      // сброс ввода и визуальное добавление (упрощённо)
      setLessonInputs(prev => ({ ...prev, [moduleId]: '' }));
      alert('Урок создан');
    } catch (e) {
      console.error(e);
      alert('Не удалось создать урок');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: dark ? '#18191c' : '#fff', display: 'flex', flexDirection: 'column', color: dark ? '#eaf4fd':'#222' }}>
      <NavBar />
      <div style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - 60px)' }}>
        <TeachNavMenu variant="editcourse" />
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: 32, background: dark ? '#23272a' : '#fff' }}>
          {/* Заглушка + кнопка */}
          <div style={{ width: '100%', maxWidth: 700 }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 18 }}>{t('course.syllabus','Программа курса')}</h1>
            {modules.length === 0 && (
              <div style={{ color: '#888', fontSize: 18, fontStyle: 'italic', marginBottom: 12 }}>
                В курсе пока нет ни одного урока.<br />
                Создайте первый модуль, чтобы добавить уроки
              </div>
            )}
          </div>
          {/* ====== Список / редактор модулей ====== */}
          {modules.length > 0 && (
            <div style={{ width:'100%', maxWidth:700, background:'#f8f8fb', borderRadius:8, padding:32, boxShadow:'0 2px 8px rgba(0,0,0,0.04)', marginTop:24 }}>
              {modules.map((mod,idx)=>(
              <div key={idx} style={{ marginBottom:32 }}>
              {/* Header */}
              <div style={{ display:'flex', alignItems:'flex-start', gap:20, flexWrap:'wrap', position:'relative' }}>
                <div style={{ fontWeight:700, fontSize:20, width:40, height:40, borderRadius:'50%', background:'#4485ed', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>{idx+1}</div>
                <div style={{ flex:1, minWidth:240 }}>
                  <input
                    className="st-input st-input-expand"
                    maxLength={64}
                    required
                    placeholder="Название модуля"
                    style={{ width:'100%', fontSize:18, fontWeight:600, padding:8, borderRadius:6, border:'1.5px solid #eaeaea', marginBottom:6 }}
                  />
                  <div style={{ color:'#888', fontSize:13 }}>0/64</div>
                </div>
                <div style={{ whiteSpace:'nowrap', fontSize:15, color:'#666', alignSelf:'center' }}>Всего баллов: 0</div>

                {/* Menu icon */}
                <button className="st-button_style_none section-editor__menu-toggler" type="button" onClick={(e)=>{e.stopPropagation(); setActiveMenuId(prev=> prev===mod.id ? null : mod.id);}} style={{ background:'none', border:'none', padding:0, margin:0 }}>
                  <span id="ember881" className="svg-icon menu-more_icon svg-icon_inline ember-view" style={{ cursor:'pointer', color:'#888' }}>
                    <FontAwesomeIcon icon={faEllipsisV} />
                  </span>
                </button>

                {activeMenuId===mod.id && (
                  <div ref={dropdownRef} className="item-tile__dropdown" style={{ position:'absolute', top:40, right:0, background:'#fff', border:'1px solid #eaeaea', borderRadius:6, boxShadow:'0 4px 8px rgba(0,0,0,0.1)', zIndex:5, minWidth:140 }}>
                    <button className="dropdown-item" style={{ display:'flex', alignItems:'center', width:'100%', background:'none', border:'none', padding:'8px 12px', cursor:'pointer' }} onClick={()=>copyModule(mod.id)}>Копировать модуль</button>
                    <button className="dropdown-item" style={{ display:'flex', alignItems:'center', width:'100%', background:'none', border:'none', padding:'8px 12px', cursor:'pointer', color:'#d9534f' }} onClick={()=>deleteModule(mod.id)}>Удалить</button>
                  </div>
                )}
              </div>
              {/* Description */}
              <textarea rows={2} maxLength={256} placeholder="Дополнительное описание" style={{ width:'100%', fontSize:15, padding:8, borderRadius:6, border:'1.5px solid #eaeaea', marginTop:14, resize:'vertical' }}/>
              <div style={{ color:'#888', fontSize:13, textAlign:'right' }}>0/256</div>
              {/* Deadlines basic */}
              <div style={{ marginTop:24 }}>
                <label style={{ fontWeight:500, fontSize:15, display:'block', marginBottom:6 }}>Начало модуля</label>
                <input type="datetime-local" style={{ width:220, fontSize:16, padding:8, borderRadius:6, border:'1.5px solid #eaeaea' }} />
              </div>
              {/* Advanced toggle shared state */}
              {idx===0 && (
              <button type="button" onClick={()=>setModuleAdvancedOpen(v=>!v)} style={{ background:'none', border:'none', color:'#4485ed', fontWeight:500, fontSize:16, cursor:'pointer', marginTop:16, display:'flex', alignItems:'center', gap:6 }}>
                {t('course.advanced_date_settings','Расширенные настройки дат')} {moduleAdvancedOpen ? '▲':'▼'}
              </button> )}
              {moduleAdvancedOpen && idx===0 && (
                <div style={{ marginTop:16 }}>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:16 }}>
                    <div style={{ flex:'1 1 180px' }}>
                      <label style={{ fontWeight:500, fontSize:15, display:'block', marginBottom:4 }}>Мягкий дедлайн</label>
                      <input type="datetime-local" style={{ width:'100%', fontSize:16, padding:8, borderRadius:6, border:'1.5px solid #eaeaea' }}/>
                    </div>
                    <div style={{ flex:'1 1 180px' }}>
                      <label style={{ fontWeight:500, fontSize:15, display:'block', marginBottom:4 }}>Жесткий дедлайн</label>
                      <input type="datetime-local" style={{ width:'100%', fontSize:16, padding:8, borderRadius:6, border:'1.5px solid #eaeaea' }}/>
                    </div>
                  </div>
                </div>
              )}
              {/* Lesson stub */}
              <div style={{ marginTop:32, background:'#fff', border:'1.5px dashed #b6d4fe', borderRadius:8, padding:24, display:'flex', gap:16, flexWrap:'wrap' }}>
                <div style={{ width:120, height:88, backgroundImage:"url('/static/frontend/lesson_cover.svg')", backgroundSize:'cover', backgroundPosition:'center', borderRadius:4 }} />
                <div style={{ flex:1, minWidth:220 }}>
                  <textarea
                    rows={2}
                    placeholder="Введите название нового урока и нажмите Enter."
                    className="st-input st-input-expand"
                    maxLength={64}
                    style={{ width:'100%', fontSize:16, padding:8, borderRadius:6, border:'1.5px solid #eaeaea', marginBottom:6, resize:'vertical', lineHeight: '20px' }}
                    value={lessonInputs[mod.id] || ''}
                    onChange={e=>handleLessonInput(mod.id, e.target.value)}
                  />
                  <div style={{ color:'#888', fontSize:13 }}>{(lessonInputs[mod.id]||'').length}/64</div>
                </div>
                <button
                  disabled={!(lessonInputs[mod.id]||'').trim()}
                  onClick={()=>createLesson(mod.id)}
                  style={{ background:'#4485ed', opacity: !(lessonInputs[mod.id]||'').trim() ? 0.4 : 1, color:'#fff', border:'none', borderRadius:6, padding:'10px 16px', fontSize:15, fontWeight:600, cursor: !(lessonInputs[mod.id]||'').trim() ? 'not-allowed' : 'pointer' }}
                >{t('course.create_lesson','Создать урок')}</button>
              </div>
              </div>
              ))}

              {/* Bottom action buttons */}
              <div style={{ marginTop:24, display:'flex', gap:16 }}>
                <button style={{ background:'#54ad54', color:'#fff', border:'none', borderRadius:6, padding:'10px 24px', fontWeight:600, fontSize:16 }}>{t('common.save','Сохранить')}</button>
                <button style={{ background:'#fff', color:'#4485ed', border:'1.5px solid #4485ed', borderRadius:6, padding:'10px 24px', fontWeight:600, fontSize:16 }}>{t('common.back_to_preview','Вернуться к просмотру')}</button>
              </div>
            </div>
          )}

          {/* Панель дедлайнов курса — всегда отображается и располагается сразу перед футером */}
          <div id="deadlines" style={{ width: '100%', maxWidth: 600, background: '#f7f8fa', borderRadius: 8, padding: 32, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginTop: 24, display:'flex', flexDirection:'column' }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 18 }}>{t('course.launch_settings','Настройки запуска курса')}</h2>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontWeight: 500, fontSize: 16, display: 'block', marginBottom: 6 }}>Начало курса <span title="С этого момента всем учащимся, записанным на курс, будут доступны все уроки, в том числе приватные." style={{ color: '#888', cursor: 'help' }}>?</span></label>
              <input
                type="datetime-local"
                className="date-picker__input st-input deadlines-editor__date-picker-input"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                placeholder="Выберите дату и время"
                style={{ width: 220, fontSize: 16, padding: 8, borderRadius: 6, border: '1.5px solid #eaeaea', background: '#fff', color: '#222' }}
              />
            </div>
            <button
              type="button"
              style={{ background: 'none', border: 'none', color: '#4485ed', fontWeight: 500, fontSize: 16, cursor: 'pointer', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}
              onClick={() => setShowAdvanced(v => !v)}
            >
              <span style={{ fontSize: 16, fontWeight: 600, color: '#4485ed' }}>★</span> {t('course.advanced_date_settings','Расширенные настройки дат')} {showAdvanced ? '▲' : '▼'}
            </button>
            {showAdvanced && (
              <>
              <div style={{ display: 'flex', gap: 16, marginBottom: 18 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontWeight: 500, fontSize: 15, display: 'block', marginBottom: 4 }}>Мягкий дедлайн <span title="Дата, после которой баллы могут уменьшаться." style={{ color: '#888', cursor: 'help' }}>?</span></label>
                  <input
                    type="datetime-local"
                    className="date-picker__input st-input deadlines-editor__date-picker-input"
                    value={softDeadline}
                    onChange={e => setSoftDeadline(e.target.value)}
                    placeholder="Выберите дату и время"
                    style={{ width: 180, fontSize: 16, padding: 8, borderRadius: 6, border: '1.5px solid #eaeaea', background: '#fff', color: '#222' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontWeight: 500, fontSize: 15, display: 'block', marginBottom: 4 }}>Жесткий дедлайн <span title="Дата, после которой сдача невозможна." style={{ color: '#888', cursor: 'help' }}>?</span></label>
                  <input
                    type="datetime-local"
                    className="date-picker__input st-input deadlines-editor__date-picker-input"
                    value={hardDeadline}
                    onChange={e => setHardDeadline(e.target.value)}
                    placeholder="Выберите дату и время"
                    style={{ width: 180, fontSize: 16, padding: 8, borderRadius: 6, border: '1.5px solid #eaeaea', background: '#fff', color: '#222' }}
                  />
                </div>
              </div>
              {/* Конец курса */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontWeight: 500, fontSize: 15, display: 'block', marginBottom: 4 }}>Конец курса</label>
                <input
                  type="datetime-local"
                  className="date-picker__input st-input deadlines-editor__date-picker-input"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  placeholder="Выберите дату и время"
                  style={{ width: 220, fontSize: 16, padding: 8, borderRadius: 6, border: '1.5px solid #eaeaea', background: '#fff', color: '#222' }}
                />
              </div>

              {/* Как начислять баллы */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontWeight: 500, fontSize: 15, display: 'block', marginBottom: 4 }}>Как начислять баллы</label>
                <select
                  className="st-input"
                  value={gradingPolicy}
                  onChange={e => setGradingPolicy(e.target.value)}
                  style={{ width: 320, fontSize: 16, padding: 8, borderRadius: 6, border: '1.5px solid #eaeaea', background: '#fff', color: '#222' }}
                >
                  <option value="none">Не учитывать дедлайны</option>
                  <option value="half">Половина баллов</option>
                  <option value="linear">Баллы убывают линейно</option>
                </select>
              </div>
              </>
            )}

            {/* Action buttons */}
            <div style={{ marginTop:'auto', display:'flex', gap:16 }}>
              <button style={{ background:'#54ad54', color:'#fff', border:'none', borderRadius:6, padding:'10px 24px', fontWeight:600, fontSize:16 }}>{t('common.save','Сохранить')}</button>
              <button style={{ background:'#fff', color:'#4485ed', border:'1.5px solid #4485ed', borderRadius:6, padding:'10px 24px', fontWeight:600, fontSize:16 }}>{t('common.back_to_preview','Вернуться к просмотру')}</button>
            </div>
          </div>

          {/* Кнопка Новый модуль сразу под панелью дедлайнов */}
          <button onClick={addModule} style={{ background:'#43b04a', color:'#fff', border:'none', borderRadius:6, padding:'12px 32px', fontWeight:600, fontSize:18, margin:'18px 0', cursor:'pointer', display:'block' }}>+ {t('course.new_module','Новый модуль')}</button>
        </main>
      </div>
      <Footer />
    </div>
  );
} 