import React, { useState, useEffect, useRef } from "react";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import TeachNavMenu from "./TeachNavMenu";
import { CKEditor } from 'ckeditor4-react';
import useTheme from '../hooks/useTheme';
import 'flatpickr/dist/flatpickr.min.css';
import { useHistory, useLocation, useParams, Prompt } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './admin.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPen, 
  faEye, 
  faGlobe, 
  faEyeSlash,
  faUpload,
  faImage,
  faVideo,
  faEdit,
  faPlus,
  faPlay,
  faBan
} from '@fortawesome/free-solid-svg-icons';
import axios from '../utils/axios';
import CategorySelectorModal from '../components/CategorySelectorModal';
import { getCourseFileUrl, getVideoUrl } from '../utils/minioUtils';
import { languageOptions } from '../utils/languageOptions';

export default function EditCourse() {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const [section, setSection] = useState('info');
  const [showEditInfo, setShowEditInfo] = useState(false);
  const [title, setTitle] = useState('');
  const [shortDescr, setShortDescr] = useState('');
  const [workload, setWorkload] = useState('');
  const [learningOutcomes, setLearningOutcomes] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [learningFormat, setLearningFormat] = useState('');
  const [categories, setCategories] = useState([]);
  const [categoryNames, setCategoryNames] = useState({}); 
  const [lang, setLang] = useState('ru');
  const [level, setLevel] = useState('');
  const [acquiredAssets, setAcquiredAssets] = useState(''); 
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [courseStatus, setCourseStatus] = useState('draft'); 
  


  const [logoHover, setLogoHover] = useState(false);
  const [videoHover, setVideoHover] = useState(false);
  const [targeting, setTargeting] = useState('');
  const history = useHistory();
  const location = useLocation();
  const { t } = useTranslation();
  const { id } = useParams();

  const [dirty, setDirty] = useState(false);
  const [modules, setModules] = useState([]);

  // compute progress

  const [logoUrl, setLogoUrl] = useState(null);
  const [introUrl, setIntroUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const logoInputRef = useRef(null);
  const introInputRef = useRef(null);
  const descriptionRef = useRef(null);
  const requirementsRef = useRef(null);
  const learningFormatRef = useRef(null);
  const targetingRef = useRef(null);
  const [formatStates, setFormatStates] = useState({
    desc: { bold:false, italic:false, underline:false, ordered:false, unordered:false, link:false },
    req:  { bold:false, italic:false, underline:false, ordered:false, unordered:false, link:false },
    learn:{ bold:false, italic:false, underline:false, ordered:false, unordered:false, link:false },
    targ: { bold:false, italic:false, underline:false, ordered:false, unordered:false, link:false }
  });

  const activeBtnStyle = { backgroundColor: '#d7d3ff', borderRadius: 4 };
  const [savedRange, setSavedRange] = useState(null);
  const [savedEditor, setSavedEditor] = useState(null);
  

  const [activeEditor, setActiveEditor] = useState(null);
const [savedRanges, setSavedRanges] = useState({
    desc: null,
    req: null,
    learn: null,
    targ: null
});

const saveSelection = (editorType) => {
  const editor = 
    editorType === 'desc' ? descriptionRef.current :
    editorType === 'req' ? requirementsRef.current :
    editorType === 'learn' ? learningFormatRef.current :
    targetingRef.current;
  
  if (!editor) return;

  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    if (editor.contains(range.commonAncestorContainer)) {
      setSavedRanges(prev => ({
        ...prev,
        [editorType]: range.cloneRange()
      }));
    }
  }
};


const restoreSelection = (editorType) => {
  const range = savedRanges[editorType];
  if (!range) return;

  const editor = 
    editorType === 'desc' ? descriptionRef.current :
    editorType === 'req' ? requirementsRef.current :
    editorType === 'learn' ? learningFormatRef.current :
    targetingRef.current;
  
  if (editor) {
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    editor.focus();
  }
};

  const saveSelectionImproved = () => {
    if (!activeEditor) return;
    try {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        if (activeEditor.contains(range.commonAncestorContainer)) {
          setSavedRange(range.cloneRange());
          setSavedEditor(activeEditor);
        }
      }
    } catch (error) {
      console.warn('Error saving selection:', error);
    }
  };

  const restoreSelectionImproved = () => {
    if (savedRange && savedEditor && savedEditor === activeEditor) {
      try {
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(savedRange);
      } catch (error) {
        console.warn('Error restoring selection:', error);
      }
    }
  };

  const editorCommonProps = (ref, setter) => ({
    ref,
    contentEditable: true,
    suppressContentEditableWarning: true,
    onFocus: (e) => {
      setActiveEditor(ref.current);
      if (ref.current) {
        const txt = (ref.current.textContent || '').trim();
        if (txt === '' && (ref.current.innerHTML || '') === '') {
          ref.current.innerHTML = '<br>';
          ref.current.setAttribute('data-empty', 'false');
        }
      }
      if (savedEditor && savedEditor !== ref.current) {
        setSavedRange(null);
        setSavedEditor(null);
      }
      if (savedEditor === ref.current && savedRange) {
        setTimeout(() => restoreSelectionImproved(), 0);
      }
    },
    onInput: (e) => {
      if (ref.current) {
        setDirty(true);
        const txt = ref.current.textContent || '';
        ref.current.setAttribute('data-empty', txt.trim() === '' ? 'true' : 'false');
        try {
          const sel = window.getSelection();
          if (sel && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            setSavedRange(range.cloneRange());
            setSavedEditor(ref.current);
          }
        } catch {}
      }
    },
    onBlur: () => {
      if (ref.current) {
        const raw = ref.current.innerHTML;
        const normalized = normalizeHtmlContent(raw);
        setter(normalized);
        setDirty(true);
      }
    }
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
    
    // Сохраняем текущую позицию курсора
    saveSelectionImproved();
    activeEditor.focus();
    document.execCommand('insertHTML', false, html);
    
    // Логируем обновленное содержимое редактора
    if (activeEditor) {
      console.log('Editor content after code insert:', activeEditor.innerHTML);
    }
    
    // Восстанавливаем позицию курсора после вставки
    setTimeout(() => {
      restoreSelectionImproved();
    }, 10);
  };

  const uploadFile = async (file, type)=>{
    if(!file) return;
    
    if (!file.name || file.size === 0) {
      alert('Выбранный файл недействителен');
      return;
    }
    
    setIsUploading(true);
    const form = new FormData();
    form.append('file', file);
    
    try{
      const res = await axios.post(`/courses/${id}/upload?type=${type}`, form, {
        headers:{
          'Content-Type':'multipart/form-data',
          Authorization:`Bearer ${localStorage.getItem('jwtToken')}`
        }
      });
      
      console.log('📤 Upload response:', res.data);
      
      if(type==='logo') {
        console.log('🖼️ Setting logoUrl to:', res.data.url);
        setLogoUrl(res.data.url);
        setDirty(true);
      } else if(type==='intro') {
        console.log('🎬 Setting introUrl to:', res.data.url);
        setIntroUrl(res.data.url);
        setDirty(true);
      }
      
      const typeNames = { logo: 'Логотип', intro: 'Вступительное видео', image: 'Изображение' };
      alert(`${typeNames[type] || type} успешно загружен!`);
    }catch(err){
      console.error('upload fail', err);
      let errorMessage = 'Неизвестная ошибка при загрузке файла';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      const typeNames = { logo: 'логотипа', intro: 'видео', image: 'изображения' };
      alert(`Ошибка при загрузке ${typeNames[type] || type}: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [activeLinkPanel, setActiveLinkPanel] = useState('');

  // Function to fetch category names
  const fetchCategoryNames = async (categoryIds) => {
    if (!categoryIds || categoryIds.length === 0) return;
    try {
      const response = await axios.get('/categories', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('jwtToken')}`
        }
      });
      const names = {};
      const allCategories = response.data;
      
      // Flatten the tree structure to find all categories
      const flattenCategories = (cats) => {
        const result = {};
        cats.forEach(cat => {
          result[cat.id] = cat.nameRu || cat.nameEn || cat.name;
          if (cat.children && cat.children.length > 0) {
            Object.assign(result, flattenCategories(cat.children));
          }
        });
        return result;
      };
      
      const flatCategories = flattenCategories(allCategories);
      categoryIds.forEach(id => {
        names[id] = flatCategories[id] || `Категория ${id}`;
      });
      setCategoryNames(names);
    } catch (error) {
      console.error('Failed to fetch category names:', error);
    }
  };

  // Save function
  const handleSave = async () => {
    try {
      // Basic validation
      if (!shortDescr.trim()) {
        alert('Пожалуйста, заполните краткое описание курса');
        return;
      }
      
      const courseData = {
        shortDescription: shortDescr.trim(),
        workload: workload.trim(),
        learningOutcomes: learningOutcomes.trim(),
        description: description, // Поле "О курсе" - сохраняем как есть
        targeting: targeting, // Поле "Для кого этот курс" - сохраняем отдельно
        requirements: requirements, // Поле "Начальные требования" - содержит HTML
        learningFormat: learningFormat, // Поле "Формат обучения" - содержит HTML
        language: lang,
        level,
        category: categories.length > 0 ? categories[0] : null, // Основная категория (для обратной совместимости)
        categories: categories, // Массив всех категорий (many-to-many)
        logoUrl: logoUrl && !logoUrl.startsWith('blob:') ? logoUrl : null,
        introUrl: introUrl && !introUrl.startsWith('blob:') ? introUrl : null,
        acquiredAssets: acquiredAssets.trim() // Что Вы получаете
      };
      
      // Логируем HTML-поля для отладки
      console.log('HTML fields being saved:');
      console.log('Description (О курсе):', courseData.description);
      console.log('Targeting (Для кого этот курс):', courseData.targeting);
      console.log('Requirements (Начальные требования):', courseData.requirements);
      console.log('Learning Format (Формат обучения):', courseData.learningFormat);
      console.log('Category:', courseData.category);
      
      // Remove empty fields (но не HTML-поля)
      Object.keys(courseData).forEach(key => {
        if (courseData[key] === '' || courseData[key] === null || courseData[key] === undefined) {
          // Не удаляем HTML-поля даже если они пустые
          if (!['description', 'requirements', 'learningFormat', 'targeting'].includes(key)) {
            delete courseData[key];
          }
        }
      });
      
      console.log('Saving course data:', courseData);
      
      try {
        await axios.patch(`/course/update/${id}`, courseData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('jwtToken')}`
          }
        });
      } catch (e) {
        // Если бэкенд ещё не принял поле targeting (устаревшая миграция/клиент)
        const status = e?.response?.status;
        const text = e?.response?.data || '';
        const isPrismaUnknownTargeting = typeof text === 'string' ? text.includes('Unknown arg `targeting`') : false;
        
        if (status === 500 && isPrismaUnknownTargeting && Object.prototype.hasOwnProperty.call(courseData, 'targeting')) {
          const fallbackData = { ...courseData };
          delete fallbackData.targeting;
          console.warn('Retrying save without `targeting` due to server validation error');
          await axios.patch(`/course/update/${id}`, fallbackData, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('jwtToken')}`
            }
          });
        } else {
          throw e;
        }
      }
      
      setDirty(false);
      alert(t('courses.save_success'));
    } catch (error) {
      console.error('Failed to save course:', error);
      if (error.response?.status === 401) {
        alert('Ошибка авторизации. Пожалуйста, войдите в систему заново.');
      } 
      else if (error.response?.status === 404) {
        alert('Курс не найден. Проверьте правильность ID курса.');
      } 
      else {
        alert('Ошибка при сохранении курса. Попробуйте позже.');
      }
    }
  };

  // helper that runs document.execCommand for the currently active editor
  const handleCommand = (editorType, cmd, value = null) => {
  const editor = 
    editorType === 'desc' ? descriptionRef.current :
    editorType === 'req' ? requirementsRef.current :
    editorType === 'learn' ? learningFormatRef.current :
    targetingRef.current;

  if (!editor) return;

  // Устанавливаем активный редактор
  setActiveEditor(editor);
  editor.focus();

  // Сохраняем текущее выделение ДО restoreSelection, оно указывает на позицию курсора
  let selBefore = window.getSelection();
  let rangeBefore = selBefore && selBefore.rangeCount > 0 ? selBefore.getRangeAt(0).cloneRange() : null;

  // Восстанавливаем предыдущее выделение (если сохранено) перед выполнением команды
  try {
    restoreSelectionImproved();
  } catch {}

  // Если restoreSelection изменило выделение, то обновим rangeBefore чтобы execCommand применялся по нужному месту
  selBefore = window.getSelection();
  if (selBefore && selBefore.rangeCount > 0) {
    rangeBefore = selBefore.getRangeAt(0).cloneRange();
  }

  // Явное переключение для B/I/U при пустом выделении: переносим каретку за ближайший форматирующий тег
  if (rangeBefore && rangeBefore.collapsed && ['bold','italic','underline'].includes(cmd)) {
    const getFormattingAncestor = (node, command) => {
      while (node && node !== editor) {
        const tag = node.nodeName;
        if ((command==='bold' && (tag === 'B' || tag === 'STRONG')) ||
            (command==='italic' && (tag === 'I' || tag === 'EM')) ||
            (command==='underline' && tag === 'U')) {
          return node;
        }
        node = node.parentNode;
      }
      return null;
    };

    const ancestor = getFormattingAncestor(rangeBefore.startContainer, cmd);
    if (ancestor) {
      // перемещаем каретку после тега и гарантированно выключаем стиль для дальнейшего ввода
      const after = document.createRange();
      after.setStartAfter(ancestor);
      after.collapse(true);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(after);
      try { if (document.queryCommandState(cmd)) document.execCommand(cmd, false, null); } catch {}
      updateFormatState(editorType);
      return; // не вызываем стандартный execCommand ниже
    }
  }

  // Пытаемся выполнить команду через execCommand
  let applied = false;
  try {
    if (cmd === 'createLink' && value) {
      applied = document.execCommand(cmd, false, value);
    } else {
      applied = document.execCommand(cmd, false, null);
    }
  } catch { applied = false; }

  // Фолбек: если execCommand не сработал — вручную оборачиваем выделение в тег стиля
  if (!applied && (cmd === 'bold' || cmd === 'italic' || cmd === 'underline')) {
    try {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        if (!range.collapsed) {
          const tagName = cmd === 'bold' ? 'strong' : (cmd === 'italic' ? 'em' : 'u');
          const wrapper = document.createElement(tagName);
          wrapper.appendChild(range.extractContents());
          range.insertNode(wrapper);
          sel.removeAllRanges();
          const newRange = document.createRange();
          newRange.selectNodeContents(wrapper);
          newRange.collapse(false);
          sel.addRange(newRange);
          applied = true;
        }
      }
    } catch {}
  }

  // Если курсор был без выделения и стиль выключили, выходим из родительского тега
  if (rangeBefore && rangeBefore.collapsed && ['bold','italic','underline'].includes(cmd)) {
    const isActiveNow = document.queryCommandState(cmd === 'underline' ? 'underline' : cmd);
    if (!isActiveNow) {
      let node = rangeBefore.startContainer;
      while (node && node !== editor) {
        const tag = node.nodeName;
        const match = (cmd==='bold' && /^(B|STRONG)$/i.test(tag)) ||
                      (cmd==='italic' && /^(I|EM)$/i.test(tag)) ||
                      (cmd==='underline' && tag === 'U');
        if (match) {
          const after = document.createRange();
          after.setStartAfter(node);
          after.collapse(true);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(after);
          break;
        }
        node = node.parentNode;
      }
    }
  } else if (rangeBefore) {
    // Восстанавливаем каретку туда, где она была, если был диапазон/выделение
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(rangeBefore);
  }

  // Обновляем состояние кнопок
  updateFormatState(editorType);
};

// Функция для обновления состояния форматирования
const updateFormatState = (editorType) => {
  const editor = 
    editorType === 'desc' ? descriptionRef.current :
    editorType === 'req' ? requirementsRef.current :
    editorType === 'learn' ? learningFormatRef.current :
    targetingRef.current;

  if (!editor) return;

  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    if (range.collapsed) {
      // Если нет выделения, проверяем стиль в позиции курсора
      const node = range.startContainer;
      const parentElement = node.nodeType === 3 ? node.parentElement : node;
      
      setFormatStates(prev => ({
        ...prev,
        [editorType]: {
          bold: document.queryCommandState('bold'),
          italic: document.queryCommandState('italic'),
          underline: document.queryCommandState('underline'),
          ordered: isInsideList(parentElement, 'ol'),
          unordered: isInsideList(parentElement, 'ul'),
          link: isInsideLink(parentElement)
        }
      }));
    } else {
      // Если есть выделение, проверяем состояние команд
      setFormatStates(prev => ({
        ...prev,
        [editorType]: {
          bold: document.queryCommandState('bold'),
          italic: document.queryCommandState('italic'),
          underline: document.queryCommandState('underline'),
          ordered: document.queryCommandState('insertOrderedList'),
          unordered: document.queryCommandState('insertUnorderedList'),
          link: document.queryCommandState('createLink')
        }
      }));
    }
  }
};

// Вспомогательные функции
const isInsideList = (element, listType) => {
  while (element && element !== document.body) {
    if (element.tagName === listType.toUpperCase()) return true;
    element = element.parentElement;
  }
  return false;
};

const isInsideLink = (element) => {
  while (element && element !== document.body) {
    if (element.tagName === 'A') return true;
    element = element.parentElement;
  }
  return false;
};

 const handleCreateLink = () => {
  if (!linkUrl || !activeLinkPanel) return;

  const editor = 
    activeLinkPanel === 'desc' ? descriptionRef.current :
    activeLinkPanel === 'req' ? requirementsRef.current :
    activeLinkPanel === 'learn' ? learningFormatRef.current :
    targetingRef.current;

  if (!editor) return;

  // Restore selection for this editor
  restoreSelection(activeLinkPanel);
  editor.focus();

  if (linkText) {
    // If link text is provided, replace selection with link
    const linkHtml = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
    document.execCommand('insertHTML', false, linkHtml);
  } else {
    // If no link text, create link from selection
    document.execCommand('createLink', false, linkUrl);
  }

  // Update format state
  setFormatStates(prev => ({
    ...prev,
    [activeLinkPanel]: {
      ...prev[activeLinkPanel],
      link: true
    }
  }));

  // Reset and close
  setLinkModalOpen(false);
  setLinkUrl('');
  setLinkText('');
  setActiveLinkPanel('');
};

  const imageInputRef = useRef(null);
  
  // State for image editing
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageEditModal, setImageEditModal] = useState(false);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 300, height: 200 });
  const [imageAlignment, setImageAlignment] = useState('center'); // left, center, right
  
  const handleImageInsert = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeEditor) return;
    
    // Проверяем что файл действительно существует
    if (!file.name || file.size === 0) {
      alert('Выбранный файл недействителен');
      e.target.value = '';
      return;
    }
    
    // Проверяем тип файла
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      alert('Неподдерживаемый тип файла. Разрешены только: JPEG, PNG, GIF');
      e.target.value = '';
      return;
    }
    
    setIsUploading(true);
    try {
      // Сначала загружаем файл на сервер
      const form = new FormData();
      form.append('file', file);
      const res = await axios.post(`/courses/${id}/upload?type=image`, form, {
        headers:{
          'Content-Type':'multipart/form-data',
          Authorization:`Bearer ${localStorage.getItem('jwtToken')}`
        }
      });
      
      // Получаем URL загруженного файла
      const imageUrl = res.data.url;
      
      // Вставляем изображение с реальным URL и возможностью редактирования
      activeEditor.focus();
      if (savedRange) {
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(savedRange);
      }
      
      // Создаем уникальный ID для изображения
      const imageId = `img_${Date.now()}`;
      const html = `<div contenteditable="false" style="display:inline-block; cursor:pointer; user-select:none; -webkit-user-select:none; -moz-user-select:none; -ms-user-select:none;" onclick="window.selectImage('${imageId}', event)" onmousedown="event.preventDefault(); event.stopPropagation();"><img src="${imageUrl}" id="${imageId}" class="editable-image" style="max-width:100%; cursor:pointer !important; user-select:none; -webkit-user-select:none; -moz-user-select:none; -ms-user-select:none; -webkit-user-modify:read-only; -moz-user-modify:read-only; -ms-user-modify:read-only; user-modify:read-only; pointer-events:auto;" data-image-url="${imageUrl}" onmouseover="this.style.cursor='pointer';" /></div>`;
      
      // Добавляем пробелы перед и после изображения
      const imageWithSpaces = `&nbsp;&nbsp;${html}&nbsp;&nbsp;`;
      document.execCommand('insertHTML', false, imageWithSpaces);
      
      // Логируем обновленное содержимое редактора
      if (activeEditor) {
        console.log('Editor content after image insert:', activeEditor.innerHTML);
      }
      
      // Сохраняем новую позицию курсора после вставки изображения
      setTimeout(() => saveSelectionImproved(), 0);
      
      // Очищаем input
      e.target.value = '';
      
      // Помечаем что есть несохраненные изменения
      setDirty(true);
    } catch (error) {
      console.error('Failed to upload image:', error);
      let errorMessage = 'Неизвестная ошибка при загрузке изображения';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      alert(`Ошибка при загрузке изображения: ${errorMessage}`);
      e.target.value = '';
    } finally {
      setIsUploading(false);
    }
  };

  // Function to select image for editing
  const selectImage = (imageId, event = null) => {
    const image = document.getElementById(imageId);
    if (image) {
      // Prevent default behavior
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      
      // Remove selected class from all images
      document.querySelectorAll('.editable-image').forEach(img => {
        img.classList.remove('selected');
      });
      
      // Add selected class to current image
      image.classList.add('selected');
      
      setSelectedImage({
        id: imageId,
        element: image,
        src: image.src,
        currentStyle: image.style.cssText
      });
      setImageEditModal(true);
      
      // Parse current styles
      const computedStyle = window.getComputedStyle(image);
      setImageSize({
        width: parseInt(computedStyle.width) || 300,
        height: parseInt(computedStyle.height) || 200
      });
      
      // Parse alignment
      const textAlign = computedStyle.textAlign || 'center';
      setImageAlignment(textAlign);
    }
  };

  // Function to apply image changes
  const applyImageChanges = () => {
    if (selectedImage && selectedImage.element) {
      const image = selectedImage.element;
      
      // Apply size
      image.style.width = `${imageSize.width}px`;
      image.style.height = `${imageSize.height}px`;
      
      // Apply alignment by wrapping in a div
      const parent = image.parentNode;
      if (parent && parent.tagName !== 'DIV') {
        const wrapper = document.createElement('div');
        wrapper.style.textAlign = imageAlignment;
        wrapper.style.margin = '10px 0';
        parent.insertBefore(wrapper, image);
        wrapper.appendChild(image);
      } else if (parent && parent.tagName === 'DIV') {
        parent.style.textAlign = imageAlignment;
      }
      
      // Ensure spaces around the image
      const imageContainer = image.closest('div[contenteditable="false"]');
      if (imageContainer) {
        // Add spaces before and after the container if they don't exist
        const prevSibling = imageContainer.previousSibling;
        const nextSibling = imageContainer.nextSibling;
        
        if (!prevSibling || (prevSibling.nodeType === Node.TEXT_NODE && !prevSibling.textContent.trim())) {
          const spaceBefore = document.createTextNode('\u00A0\u00A0');
          imageContainer.parentNode.insertBefore(spaceBefore, imageContainer);
        }
        
        if (!nextSibling || (nextSibling.nodeType === Node.TEXT_NODE && !nextSibling.textContent.trim())) {
          const spaceAfter = document.createTextNode('\u00A0\u00A0');
          imageContainer.parentNode.insertBefore(spaceAfter, imageContainer.nextSibling);
        }
      }
      
      // Remove selected class
      image.classList.remove('selected');
      
      setDirty(true);
      setImageEditModal(false);
      setSelectedImage(null);
    }
  };

  // Function to delete selected image
  const deleteSelectedImage = () => {
    if (selectedImage && selectedImage.element) {
      selectedImage.element.remove();
      setDirty(true);
      setImageEditModal(false);
      setSelectedImage(null);
    }
  };

  // Function to close image edit modal
  const closeImageEditModal = () => {
    if (selectedImage && selectedImage.element) {
      selectedImage.element.classList.remove('selected');
    }
    setImageEditModal(false);
    setSelectedImage(null);
  };

  // Add global function for image selection
  useEffect(() => {
    window.selectImage = (imageId, event) => {
      selectImage(imageId, event);
    };
    return () => {
      delete window.selectImage;
    };
  }, []);

  // Add event listeners for images after they are inserted
  useEffect(() => {
    const handleImageClick = (e) => {
      if (e.target.classList.contains('editable-image') || e.target.getAttribute('contenteditable') === 'false') {
        e.preventDefault();
        e.stopPropagation();
        const imageId = e.target.classList.contains('editable-image') ? e.target.id : e.target.querySelector('.editable-image')?.id;
        if (imageId) {
          selectImage(imageId, e);
        }
      }
    };

    const handleImageMouseDown = (e) => {
      if (e.target.classList.contains('editable-image') || e.target.getAttribute('contenteditable') === 'false') {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const handleImageKeyDown = (e) => {
      if (e.target.classList.contains('editable-image') || e.target.getAttribute('contenteditable') === 'false') {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const handleImageFocus = (e) => {
      if (e.target.classList.contains('editable-image') || e.target.getAttribute('contenteditable') === 'false') {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const handleImageMouseOver = (e) => {
      if (e.target.classList.contains('editable-image') || e.target.getAttribute('contenteditable') === 'false') {
        e.target.style.cursor = 'pointer';
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const handleImageMouseEnter = (e) => {
      if (e.target.classList.contains('editable-image') || e.target.getAttribute('contenteditable') === 'false') {
        e.target.style.cursor = 'pointer';
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const handleImagePaste = (e) => {
      if (e.target.classList.contains('editable-image') || e.target.getAttribute('contenteditable') === 'false') {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const handleImageInput = (e) => {
      if (e.target.classList.contains('editable-image') || e.target.getAttribute('contenteditable') === 'false') {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // Add event listeners to all editors
    const editors = [descriptionRef.current, requirementsRef.current, learningFormatRef.current, targetingRef.current];
    editors.forEach(editor => {
      if (editor) {
        editor.addEventListener('click', handleImageClick, true);
        editor.addEventListener('mousedown', handleImageMouseDown, true);
        editor.addEventListener('keydown', handleImageKeyDown, true);
        editor.addEventListener('focus', handleImageFocus, true);
        editor.addEventListener('mouseover', handleImageMouseOver, true);
        editor.addEventListener('mouseenter', handleImageMouseEnter, true);
        editor.addEventListener('paste', handleImagePaste, true);
        editor.addEventListener('input', handleImageInput, true);
      }
    });

    return () => {
      editors.forEach(editor => {
        if (editor) {
          editor.removeEventListener('click', handleImageClick, true);
          editor.removeEventListener('mousedown', handleImageMouseDown, true);
          editor.removeEventListener('keydown', handleImageKeyDown, true);
          editor.removeEventListener('focus', handleImageFocus, true);
          editor.removeEventListener('mouseover', handleImageMouseOver, true);
          editor.removeEventListener('mouseenter', handleImageMouseEnter, true);
          editor.removeEventListener('paste', handleImagePaste, true);
          editor.removeEventListener('input', handleImageInput, true);
        }
      });
    };
  }, [description, requirements, learningFormat, targeting]);

  // (helper removed)
  useEffect(()=>{
    const handler = (e)=>{
      if(dirty){
        e.preventDefault();
        e.returnValue='';
      }
    };
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

  // Очищаем blob URL при изменении URL'ов
  useEffect(() => {
    return () => {
      if (logoUrl && logoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(logoUrl);
      }
    };
  }, [logoUrl]);

  useEffect(() => {
    return () => {
      if (introUrl && introUrl.startsWith('blob:')) {
        URL.revokeObjectURL(introUrl);
      }
    };
  }, [introUrl]);

  // Инициализация содержимого трёх HTML-редакторов (About/Requirements/LearningFormat) из state
  useEffect(() => {
    // Проверяем, что DOM элементы созданы и данные загружены
    if (descriptionRef.current && typeof description === 'string' && activeEditor !== descriptionRef.current) {
      setEditorContent(descriptionRef, description);
    }
    
    if (requirementsRef.current && typeof requirements === 'string' && activeEditor !== requirementsRef.current) {
      setEditorContent(requirementsRef, requirements);
    }
    
    if (learningFormatRef.current && typeof learningFormat === 'string' && activeEditor !== learningFormatRef.current) {
      setEditorContent(learningFormatRef, learningFormat);
    }
    
    if (targetingRef.current && typeof targeting === 'string' && activeEditor !== targetingRef.current) {
      setEditorContent(targetingRef, targeting);
    }
  }, [description, requirements, learningFormat, targeting, activeEditor]);

  // Инициализация после загрузки данных курса
  useEffect(() => {
    if (description || requirements || learningFormat || targeting) {
      if (descriptionRef.current && description) {
        setEditorContent(descriptionRef, description);
      }
      if (requirementsRef.current && requirements) {
        setEditorContent(requirementsRef, requirements);
      }
      if (learningFormatRef.current && learningFormat) {
        setEditorContent(learningFormatRef, learningFormat);
      }
      if (targetingRef.current && targeting) {
        setEditorContent(targetingRef, targeting);
      }
    }
  }, [description, requirements, learningFormat, targeting]);



  // При первой загрузке читаем параметр section из query (?section=checklist)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sectionParam = params.get('section');
    if (sectionParam && ['info','syllabus','news','comments','reviews'].includes(sectionParam)) {
      setSection(sectionParam);
    }
  }, [location.search]);

  // Загружаем данные курса при инициализации
  useEffect(() => {
    const loadCourseData = async () => {
      try {
        const response = await axios.get(`/course?id=${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` }
        });
        
        const course = response.data;
        
        // Заполняем все поля данными курса
        setTitle(course.name || '');
        setShortDescr(course.shortDescription || '');
        setWorkload(course.workload || '');
        setLearningOutcomes(course.learningOutcomes || '');
        setDescription(course.description || '');
        setRequirements(course.requirements || '');
        setLearningFormat(course.learningFormat || '');
        setTargeting(course.targeting || '');
        setLang(course.language || 'ru');
        setLevel(course.level || '');
        setAcquiredAssets(course.acquiredAssets || ''); // Что Вы получаете
        setCourseStatus(course.status || 'draft'); // Set course status
        
        // Устанавливаем категории (массив many-to-many или fallback на старое поле)
        if (Array.isArray(course.categories) && course.categories.length > 0) {
          setCategories(course.categories);
        } else if (course.category) {
          setCategories([course.category]);
        } else {
          setCategories([]);
        }
        
        // Устанавливаем URL для логотипа и видео если они есть и не являются blob URL'ами
            if (course.logoUrl && !course.logoUrl.startsWith('blob:')) {
      setLogoUrl(getCourseFileUrl(course.logoUrl));
    }
        if (course.introUrl && !course.introUrl.startsWith('blob:')) {
          setIntroUrl(getVideoUrl(course.introUrl));
        }
        
        // CKEditor-поля инициализируются из state ниже через useEffect
        
        // Инициализация редакторов после загрузки данных
        if (descriptionRef.current && course.description) {
          setEditorContent(descriptionRef, course.description);
        }
        if (requirementsRef.current && course.requirements) {
          setEditorContent(requirementsRef, course.requirements);
        }
        if (learningFormatRef.current && course.learningFormat) {
          setEditorContent(learningFormatRef, course.learningFormat);
        }
        if (targetingRef.current && course.targeting) {
          setEditorContent(targetingRef, course.targeting);
        }
        
        console.log('Course data loaded:', course);
      } catch (error) {
        console.error('Failed to load course data:', error);
        alert('Ошибка при загрузке данных курса');
      }
    };

    const loadModulesData = async () => {
      try {
        // TODO: Replace with actual API call when modules endpoint is available
        // For now, using mock data
        setModules([]);
      } catch (error) {
        console.error('Failed to load modules data:', error);
      }
    };

    if (id) {
      loadCourseData();
      loadModulesData();
    }

    // Очищаем blob URL при размонтировании компонента
    return () => {
      if (logoUrl && logoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(logoUrl);
      }
      if (introUrl && introUrl.startsWith('blob:')) {
        URL.revokeObjectURL(introUrl);
      }
    };
  }, [id]);

  // Fetch category names when categories change
  useEffect(() => {
    if (categories.length > 0) {
      fetchCategoryNames(categories);
    }
  }, [categories]);

  const handleStatusChange = async (newStatus) => {
    try {
      const response = await axios.patch(`/course/${id}/status`, 
        { status: newStatus }, 
        { headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` } }
      );
      
      setCourseStatus(newStatus);
      alert(`${t('courses.status_changed')} ${newStatus === 'published' ? t('courses.status.published') : t('courses.status.unpublished')}`);
    } catch (error) {
      console.error('Failed to update course status:', error);
              alert(t('courses.status_change_error'));
    }
  };



  // Treat visual-only breaks as empty content
  const normalizeHtmlContent = (html = '') => {
    if (!html) return '';
    
    // Сохраняем неразрывные пробелы перед изображениями
    let processed = html
      .replace(/\u200B/g, '') // Удаляем zero-width spaces
      .replace(/([^>])\s*<img/g, '$1&nbsp;&nbsp;<img') // Добавляем пробелы перед изображениями
      .replace(/<\/img>\s*([^<])/g, '</img>&nbsp;&nbsp;$1') // Добавляем пробелы после изображений
      .replace(/^<img/g, '&nbsp;&nbsp;<img') // Пробелы перед изображением в начале
      .replace(/<\/img>$/g, '</img>&nbsp;&nbsp;'); // Пробелы после изображения в конце
    
    const trimmed = processed.trim();
    if (
      trimmed === '' ||
      /^<br\s*\/?>(<br\s*\/?>)?$/.test(trimmed) ||
      /^<p><br\s*\/?><\/p>$/.test(trimmed) ||
      /^<div><br\s*\/?><\/div>$/.test(trimmed) ||
      /^<p>\s*<\/p>$/.test(trimmed) ||
      /^<div>\s*<\/div>$/.test(trimmed)
    ) {
      return '';
    }
    return processed;
  };

  // Функция для правильного отображения содержимого в редакторах
  const setEditorContent = (ref, content) => {
    if (!ref.current) return;
    
    // Проверяем, не установлено ли уже это содержимое
    if (ref.current.innerHTML === content) {
      return;
    }
    
    // Если содержимое пустое, очищаем редактор
    if (!content || content.trim() === '') {
      ref.current.innerHTML = '';
      ref.current.setAttribute('data-empty', 'true');
      return;
    }
    
    // Устанавливаем содержимое
    ref.current.innerHTML = content;
    
    // Проверяем, действительно ли есть текст
    const textContent = ref.current.textContent || '';
    const isEmpty = textContent.trim() === '';
    ref.current.setAttribute('data-empty', isEmpty ? 'true' : 'false');
    
    // Если содержимое есть, но атрибут data-empty установлен в true, исправляем
    if (!isEmpty && ref.current.getAttribute('data-empty') === 'true') {
      ref.current.setAttribute('data-empty', 'false');
    }
    
    // Убеждаемся, что редактор остается contentEditable
  };

  // === Helper to map a DOM node to editor type ===
  const whichEditorType = (node, refs) => {
    if (!node) return null;
    const { descriptionRef, requirementsRef, learningFormatRef, targetingRef } = refs;
    if (descriptionRef.current && descriptionRef.current.contains(node)) return 'desc';
    if (requirementsRef.current && requirementsRef.current.contains(node)) return 'req';
    if (learningFormatRef.current && learningFormatRef.current.contains(node)) return 'learn';
    if (targetingRef.current && targetingRef.current.contains(node)) return 'targ';
    return null;
  };

  // === Sync toolbar button active states on caret/selection change ===
  useEffect(() => {
    const handler = () => {
      try {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          const node = range.commonAncestorContainer;
          const type = whichEditorType(node, { descriptionRef, requirementsRef, learningFormatRef, targetingRef });
          if (type) {
            // Persist selection so clicking toolbar uses the exact selected range
            const editor = type === 'desc' ? descriptionRef.current : type === 'req' ? requirementsRef.current : type === 'learn' ? learningFormatRef.current : targetingRef.current;
            setActiveEditor(editor);
            setSavedRange(range.cloneRange());
            setSavedEditor(editor);
            updateFormatState(type);
          }
        }
      } catch {}
    };
    document.addEventListener('selectionchange', handler);
    return () => document.removeEventListener('selectionchange', handler);
  }, []);

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
        
        /* Стили для rich text editors */
        .rich-text-editor__content {
          position: relative;
        }
        
        .rich-text-editor__content[data-empty="true"]:empty::before,
        .rich-text-editor__content[data-empty="true"]:has(br:only-child)::before {
          content: attr(data-placeholder);
          position: absolute;
          top: 8px;
          left: 8px;
          color: #999;
          pointer-events: none;
          font-style: italic;
        }
        
        .rich-text-editor__content:focus {
          border-color: #4485ed !important;
          box-shadow: 0 0 0 2px rgba(68, 133, 237, 0.2);
        }
        
        /* Стили для кнопок панели инструментов */
        .custom-toolbar span {
          transition: all 0.2s ease;
        }
        
        .custom-toolbar span:hover {
          background-color: rgba(68, 133, 237, 0.1) !important;
          border-radius: 4px;
        }
        
        /* Стили для активных кнопок */
        .custom-toolbar span[style*="background-color: rgb(215, 211, 255)"] {
          background-color: #d7d3ff !important;
          border-radius: 4px;
        }
        
        /* Улучшенные стили для курсора и выделения */
        .rich-text-editor__content {
          caret-color: #4485ed;
        }
        
        .rich-text-editor__content::selection {
          background-color: rgba(68, 133, 237, 0.2);
        }
        
        .rich-text-editor__content::-moz-selection {
          background-color: rgba(68, 133, 237, 0.2);
        }
        
        /* Стили для кода в редакторе */
        .rich-text-editor__content pre {
          background-color: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 4px;
          padding: 12px;
          margin: 8px 0;
          overflow-x: auto;
          font-family: 'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace;
          font-size: 14px;
          line-height: 1.4;
        }
        
        .rich-text-editor__content code {
          background-color: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 3px;
          padding: 2px 4px;
          font-family: 'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace;
          font-size: 13px;
        }
        
        /* Темная тема для кода */
        [data-theme="dark"] .rich-text-editor__content pre,
        body.dark-theme .rich-text-editor__content pre {
          background-color: #2d3038;
          border-color: #444;
          color: #eaf4fd;
        }
        
        [data-theme="dark"] .rich-text-editor__content code,
        body.dark-theme .rich-text-editor__content code {
          background-color: #2d3038;
          border-color: #444;
          color: #eaf4fd;
        }
        .rich-text-editor__content strong, .rich-text-editor__content b { font-weight: 700; }
        
        /* Стили для редактируемых изображений */
        .rich-text-editor__content .editable-image {
          transition: all 0.2s ease;
          border: 2px solid transparent;
          border-radius: 4px;
          cursor: pointer !important;
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          pointer-events: auto;
          -webkit-user-modify: read-only;
          -moz-user-modify: read-only;
          -ms-user-modify: read-only;
          user-modify: read-only;
        }
        
        /* Стили для div-обертки изображений */
        .rich-text-editor__content div[contenteditable="false"] {
          cursor: pointer !important;
          user-select: none !important;
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          -webkit-user-modify: read-only !important;
          -moz-user-modify: read-only !important;
          -ms-user-modify: read-only !important;
          user-modify: read-only !important;
          pointer-events: auto !important;
        }
        
        .rich-text-editor__content .editable-image:hover {
          border-color: #4485ed;
          box-shadow: 0 0 8px rgba(68, 133, 237, 0.3);
          transform: scale(1.02);
          cursor: pointer !important;
        }
        
        .rich-text-editor__content .editable-image:active {
          transform: scale(0.98);
          cursor: pointer !important;
        }
        
        /* Индикатор выбранного изображения */
        .rich-text-editor__content .editable-image.selected {
          border-color: #28a745;
          box-shadow: 0 0 12px rgba(40, 167, 69, 0.4);
          cursor: pointer !important;
        }
        
        /* Предотвращаем изменение курсора при наведении на изображения */
        .rich-text-editor__content .editable-image * {
          cursor: pointer !important;
        }
        
        /* Отключаем редактирование при наведении на изображения */
        .rich-text-editor__content .editable-image {
          -webkit-user-modify: read-only;
          -moz-user-modify: read-only;
          -ms-user-modify: read-only;
          user-modify: read-only;
        }
        
        /* Предотвращаем выделение изображений */
        .rich-text-editor__content .editable-image::selection {
          background: transparent;
        }
        
        .rich-text-editor__content .editable-image::-moz-selection {
          background: transparent;
        }
        
        /* Принудительно устанавливаем курсор pointer для всех элементов внутри изображения */
        .rich-text-editor__content .editable-image,
        .rich-text-editor__content .editable-image::before,
        .rich-text-editor__content .editable-image::after,
        .rich-text-editor__content .editable-image *,
        .rich-text-editor__content .editable-image *::before,
        .rich-text-editor__content .editable-image *::after {
          cursor: pointer !important;
        }
        
        /* Отключаем все возможности редактирования для изображений */
        .rich-text-editor__content .editable-image {
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          -khtml-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
        }
        
        /* Принудительно отключаем редактирование для изображений */
        .rich-text-editor__content .editable-image {
          contenteditable: false;
          -webkit-user-modify: read-only;
          -moz-user-modify: read-only;
          -ms-user-modify: read-only;
          user-modify: read-only;
        }
        
        /* Дополнительные стили для предотвращения I-курсора */
        .rich-text-editor__content .editable-image {
          caret-color: transparent;
          -webkit-caret-color: transparent;
        }
        
        /* Отключаем все возможности выделения для изображений */
        .rich-text-editor__content .editable-image {
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          user-select: none !important;
          -webkit-touch-callout: none !important;
          -webkit-tap-highlight-color: transparent !important;
        }
        
        /* Стили для div-обертки */
        .rich-text-editor__content div[contenteditable="false"]:hover {
          cursor: pointer !important;
        }
        
        .rich-text-editor__content div[contenteditable="false"]:active {
          cursor: pointer !important;
        }
      `}</style>
        <NavBar />
      <div style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - 60px)' }}>
        <TeachNavMenu variant="editcourse" id={id} onSectionChange={setSection} />
        <main className="marco-layout" style={{ flex: 1, background: 'var(--teach-bg)', padding: 32, display: 'flex', alignItems: 'flex-start', color: 'var(--text-color)' }}>
          {/* section content start */}
          {section === 'info' && (
            <div style={showEditInfo ? { width: '100%' } : { maxWidth: 540, width: '100%' }}>
              {!showEditInfo ? (
                <>
                  <h1 style={{ marginBottom: 18, color: dark ? '#fff' : '#222', transition: 'color 0.22s' }}>{t('courses.about')}</h1>
                  <div className="course-info__actions" style={{ display: 'flex', gap: 16, marginBottom: 18 }}>
                    <a href="#" className="button has-icon teach-nav-link anim-btn" data-qa="course-info__edit-btn" style={{ display: 'flex', alignItems: 'center', gap: 8, background: dark ? 'rgba(68,133,237,0.12)' : '#fff', border: `1.5px solid #4485ed`, borderRadius: 6, padding: '10px 22px', fontWeight: 600, color: dark ? '#eaf4fd' : '#4485ed', textDecoration: 'none', fontSize: 16, boxShadow: dark ? 'none' : '0 2px 4px rgba(0,0,0,0.04)', transition:'background 0.18s, color 0.18s' }} onMouseOver={e=>{e.currentTarget.style.background = '#4485ed'; e.currentTarget.style.color='#fff';}} onMouseOut={e=>{e.currentTarget.style.background = dark ? 'rgba(68,133,237,0.12)' : '#fff'; e.currentTarget.style.color = dark ? '#eaf4fd' : '#4485ed';}} onClick={e => {e.preventDefault(); setShowEditInfo(true);}}>
                      <FontAwesomeIcon icon={faPen} />
                                              <span>{t('courses.edit_description')}</span>
                    </a>
                    {(courseStatus === 'draft' || courseStatus === 'inactive') && (
                      <a href="#" className="button has-icon teach-nav-link anim-btn" style={{ display: 'flex', alignItems: 'center', gap: 8, background: dark ? 'rgba(68,133,237,0.12)' : '#fff', border: `1.5px solid #4485ed`, borderRadius: 6, padding: '10px 22px', fontWeight: 600, color: dark ? '#eaf4fd' : '#4485ed', textDecoration: 'none', fontSize: 16, boxShadow: dark ? 'none' : '0 2px 4px rgba(0,0,0,0.04)', transition:'background 0.18s, color 0.18s', cursor: 'pointer' }} onMouseOver={e=>{e.currentTarget.style.background = '#4485ed'; e.currentTarget.style.color='#fff';}} onMouseOut={e=>{e.currentTarget.style.background = dark ? 'rgba(68,133,237,0.12)' : '#fff'; e.currentTarget.style.color = dark ? '#eaf4fd' : '#4485ed';}} onClick={e => {e.preventDefault(); handleStatusChange('published');}}>
                        <FontAwesomeIcon icon={faGlobe} />
                        <span>{t('courses.publish')}</span>
                      </a>
                    )}
                    {(courseStatus === 'published') && (
                      <a href="#" className="button has-icon teach-nav-link anim-btn" style={{ display: 'flex', alignItems: 'center', gap: 8, background: dark ? 'rgba(68,133,237,0.12)' : '#fff', border: `1.5px solid #4485ed`, borderRadius: 6, padding: '10px 22px', fontWeight: 600, color: dark ? '#eaf4fd' : '#4485ed', textDecoration: 'none', fontSize: 16, boxShadow: dark ? 'none' : '0 2px 4px rgba(0,0,0,0.04)', transition:'background 0.18s, color 0.18s', cursor: 'pointer' }} onMouseOver={e=>{e.currentTarget.style.background = '#4485ed'; e.currentTarget.style.color='#fff';}} onMouseOut={e=>{e.currentTarget.style.background = dark ? 'rgba(68,133,237,0.12)' : '#fff'; e.currentTarget.style.color = dark ? '#eaf4fd' : '#4485ed';}} onClick={e => {e.preventDefault(); handleStatusChange('draft');}}>
                        <FontAwesomeIcon icon={faEyeSlash} />
                        <span>{t('courses.unpublish')}</span>
                      </a>
                    )}
                    <a
                      href={`/course-promo/${id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="button is-outlined has-icon teach-nav-link anim-btn"
                      data-qa="course-info__promo-btn"
                      style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--teach-tile-bg)', border: '1.5px solid var(--border-color)', borderRadius: 6, padding: '10px 22px', fontWeight: 600, color: 'var(--teach-link-color)', textDecoration: 'none', fontSize: 16, transition:'background 0.18s, color 0.18s', boxShadow: 'none' }}
                    >
                      <FontAwesomeIcon icon={faEye} />
                      <span>{t('courses.open_promo')}</span>
                    </a>
                  </div>
                  <div style={{ color: 'var(--text-color)', opacity: 0.85, fontSize: 16, marginTop: 12, transition:'color 0.22s' }}>
                    {t('courses.add_info_placeholder')}
                  </div>
                </>
              ) : (
                <div style={{ background: 'var(--teach-tile-bg)', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: 0 }}>
                  <header className="marco-layout__header" data-marco-full-height-sidebar="" style={{ padding: '24px 24px 0 24px' }}>
                    <h1 style={{ color: 'var(--text-color)' }}>{t('courses.about')}</h1>
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
                        border: '1.5px solid var(--border-color)',
                        background: logoHover ? 'var(--teach-hover-bg)' : 'var(--teach-tile-bg)',
                        borderRadius: 8,
                        transition: 'all 0.18s cubic-bezier(.4,0,.2,1)',
                        position:'relative', overflow:'hidden'
                      }}
                    >
                      {logoUrl ? (
                        <img src={getCourseFileUrl(logoUrl)} alt="logo" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                      ):(
                      <div className="course-info-editor__upload-widget-inner" style={{ color: 'var(--teach-link-color)', transition:'color 0.18s' }}>
                        <FontAwesomeIcon 
                          icon={faImage} 
                          size="3x" 
                          style={{ marginBottom: 8, opacity: 0.7 }} 
                        />
                        <div className="course-info-editor__upload-widget-label" style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-color)' }}>{logoHover ? t('common.upload') : t('courses.logo')}</div>
                        <div className="course-info-editor__upload-widget-text" style={{ color: 'var(--text-color)' }}>{t('courses.logo_hint')}</div>
                      </div>) }
                      <input type="file" accept="image/png,image/jpeg" ref={logoInputRef} style={{ display:'none' }} onChange={e=>{ 
                        const f=e.target.files[0]; 
                        if(f){ 
                          uploadFile(f,'logo');
                        }
                      }} />
                      {isUploading && (
                        <div style={{ 
                          position: 'absolute', 
                          top: '50%', 
                          left: '50%', 
                          transform: 'translate(-50%, -50%)',
                          background: 'rgba(0,0,0,0.7)',
                          color: 'white',
                          padding: '8px 16px',
                          borderRadius: '4px',
                          fontSize: '14px',
                          zIndex: 10
                        }}>
                          {t('courses.loading')}
                        </div>
                      )}
                    </div>
                    <div
                      className="course-info-editor__upload-widget-content"
                      data-state="empty"
                      onMouseEnter={() => setVideoHover(true)}
                      onMouseLeave={() => setVideoHover(false)}
                      onClick={()=> introInputRef.current && introInputRef.current.click()}
                      style={{
                        cursor:'pointer',
                        border: '1.5px solid var(--border-color)',
                        background: videoHover ? 'var(--teach-hover-bg)' : 'var(--teach-tile-bg)',
                        borderRadius: 8,
                        transition: 'all 0.18s cubic-bezier(.4,0,.2,1)',
                        position:'relative', overflow:'hidden'
                      }}
                    >
                      {introUrl ? (
                        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                          <video 
                            src={getVideoUrl(introUrl)} 
                            style={{ width:'100%', height:'100%', objectFit:'cover' }} 
                            muted 
                            controls 
                            onLoadStart={() => console.log('🎬 Video load started:', getVideoUrl(introUrl))}
                            onLoadedData={() => console.log('✅ Video loaded successfully')}
                            onError={(e) => {
                              const videoElement = e.target;
                              console.error('Video error:', e);
                              console.error('Video error details:', {
                                currentSrc: videoElement.currentSrc,
                                networkState: videoElement.networkState,
                                readyState: videoElement.readyState,
                                error: videoElement.error
                              });
                              
                              if (videoElement.error) {
                                const error = videoElement.error;
                                console.error('Video error code:', error.code);
                                console.error('Video error message:', error.message);
                              }
                              
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                            onLoad={() => console.log('Video loaded successfully')}
                          />
                          <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            background: dark ? '#2d2d2d' : '#f8f9fa',
                            border: `1px solid ${dark ? '#404040' : '#e9ecef'}`,
                            borderRadius: 8,
                            display: 'none',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'column',
                            color: dark ? '#ffffff' : '#666666'
                          }}>
                            <FontAwesomeIcon 
                              icon={faPlay} 
                              style={{ 
                                fontSize: '2rem', 
                                marginBottom: '10px', 
                                opacity: 0.5 
                              }} 
                            />
                            <h4 style={{ margin: '0 0 5px 0', fontSize: '14px' }}>
                              {t('courses.video_unavailable')}
                            </h4>
                            <p style={{ fontSize: '12px', margin: '0', textAlign: 'center', opacity: 0.8 }}>
                              {t('courses.video_load_error')}
                            </p>
                          </div>
                        </div>
                      ):(
                      <div className="course-info-editor__upload-widget-inner" style={{ color: 'var(--teach-link-color)', transition:'color 0.18s' }}>
                        <FontAwesomeIcon 
                          icon={faPlay} 
                          size="3x" 
                          style={{ marginBottom: 8, opacity: 0.7 }} 
                        />
                        <div className="course-info-editor__upload-widget-label" style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-color)' }}>{videoHover ? t('courses.add_intro_video') : t('courses.intro_video')}</div>
                        <div className="course-info-editor__upload-widget-text" style={{ color: 'var(--text-color)' }}>{t('courses.video_limit_hint')}</div>
                      </div>) }
                      <input type="file" accept="video/*" ref={introInputRef} style={{ display:'none' }} onChange={e=>{ 
                        const f=e.target.files[0]; 
                        if(f){ 
                          uploadFile(f,'intro');
                        }
                      }} />
                      {isUploading && (
                        <div style={{ 
                          position: 'absolute', 
                          top: '50%', 
                          left: '50%', 
                          transform: 'translate(-50%, -50%)',
                          background: 'rgba(0,0,0,0.7)',
                          color: 'white',
                          padding: '8px 16px',
                          borderRadius: '4px',
                          fontSize: '14px',
                          zIndex: 10
                        }}>
                          {t('courses.loading')}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 260 }}>
                    <div className="course-info-editor__section-heading" data-qa="course-title" style={{ marginBottom: 6 }}>
                      {/* Название курса редактируется в левом боковом меню TeachNavMenu */}
                    </div>
                    <label htmlFor="tags" style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-color)' }}>{t('courses.categories')}</label>
                    <button className="button tags-modal-selector-btn is-outlined has-icon tags-course-tags__btn" type="button" onClick={() => setCategoryModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0', border: `1.5px solid ${dark ? '#4485ed' : '#4485ed'}`, borderRadius: 6, background: dark ? '#23272a' : '#fff', color: dark ? '#eaf4fd' : '#4485ed', fontWeight: 500, fontSize: 15 }}>
                      <FontAwesomeIcon 
                        icon={faPlus} 
                        size="sm" 
                        style={{ display: 'inline-flex', alignItems: 'center' }} 
                      />
                                              <span>{t('courses.category_hint')}</span>
                    </button>
                    
                    {/* Display selected categories */}
                    {categories.length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 14, color: 'var(--text-color)', opacity: 0.8, marginBottom: 8 }}>
                          {t('courses.selected_categories')}:
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {categories.map((categoryId, index) => (
                            <span
                              key={categoryId}
                              style={{
                                background: dark ? '#2d3038' : '#f0f0f0',
                                color: dark ? '#eaf4fd' : '#333',
                                padding: '4px 12px',
                                borderRadius: 16,
                                fontSize: 14,
                                border: `1px solid ${dark ? '#4485ed' : '#ddd'}`,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6
                              }}
                            >
                              {categoryNames[categoryId] || `Категория ${categoryId}`}
                              <button
                                type="button"
                                onClick={() => {
                                  const newCategories = categories.filter((_, i) => i !== index);
                                  setCategories(newCategories);
                                  setDirty(true);
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: 'inherit',
                                  cursor: 'pointer',
                                  fontSize: 16,
                                  padding: 0,
                                  marginLeft: 4,
                                  opacity: 0.7
                                }}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="tags-course-tags__note" style={{ fontSize: 13, color: 'var(--text-color)', opacity: 0.75, marginBottom: 12 }}>
                      {t('courses.category_hint_desc')}
                    </div>
                                          <label htmlFor="short-descr" style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-color)' }}>{t('courses.short_description')}</label>
                                          <textarea id="short-descr" rows={4} className="st-input w-full block" placeholder={t('courses.short_description_placeholder')} maxLength={512} style={{ height: 103, marginBottom: 4, width: '100%', fontSize: 16, padding: 8, borderRadius: 6, border: '1.5px solid var(--border-color)', background: 'var(--teach-bg)', color: 'var(--teach-fg)', transition: 'background 0.18s, color 0.18s' }} value={shortDescr} onChange={e => {setShortDescr(e.target.value); setDirty(true);}} />
                    <div className="course-info-editor__input-note" style={{ fontSize: 13, color: 'var(--text-color)', opacity: 0.75, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                              <span>{t('courses.add_info_note')}</span>
                      <span>{shortDescr.length}/512</span>
                    </div>
                    <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap:'nowrap' }}>
                      <div style={{ flex: 1, minWidth: 120 }}>
                        <label htmlFor="lang" style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, display: 'block', color: 'var(--text-color)' }}>{t('courses.language')}</label>
                        <div style={{ position: 'relative' }}>
                          <div
                            id="lang-select"
                            className="select-box__toggle-btn"
                            style={{ width:'100%', display: 'flex', alignItems: 'center', gap: 8, border: `1.5px solid var(--border-color)`, borderRadius: 6, background: 'var(--teach-tile-bg)', color: 'var(--text-color)', fontWeight: 500, fontSize: 15, padding: '8px 12px', lineHeight:'20px', boxSizing:'border-box', cursor: 'pointer' }}
                            onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                            tabIndex={0}
                          >
                            <span className="select-box-option__slot-item">
                              <span className="select-box-option__content">
                                {languageOptions.find(opt => opt.value === lang)?.label || lang}
                              </span>
                            </span>
                            <span style={{ marginLeft: 'auto', fontSize: 12 }}>▼</span>
                          </div>
                          {langDropdownOpen && (
                            <ul className="drop-down__content drop-down-content select-box__content menu" style={{
                              position: 'absolute',
                              zIndex: 10,
                              background: 'var(--teach-tile-bg)',
                              color: 'var(--text-color)',
                              border: `1.5px solid var(--border-color)`,
                              borderRadius: 6,
                              marginTop: 2,
                              width: '100%',
                              maxHeight: 220,
                              overflowY: 'auto',
                              boxShadow: '0 2px 16px rgba(0,0,0,0.12)',
                              transition: 'background 0.22s, color 0.22s, box-shadow 0.22s',
                            }}>
                              <li hidden className="select-box-item select-box__option menu-item"><button disabled type="button"><span className="select-box-option__content" data-appearance="placeholder">{t('courses.language')}</span></button></li>
                              {languageOptions.map(opt => (
                                <li key={opt.value} className={`select-box-item select-box__option menu-item${lang === opt.value ? ' selected' : ''}`} data-selected={lang === opt.value ? true : undefined}>
                                  <button type="button" style={{
                                    width: '100%',
                                    textAlign: 'left',
                                    background: 'none',
                                    border: 'none',
                                    padding: '8px 12px',
                                    fontSize: 15,
                                    color: 'var(--text-color)',
                                    cursor: 'pointer',
                                    borderRadius: 4,
                                    transition: 'background 0.18s, color 0.18s',
                                  }}
                                  onMouseOver={e => e.currentTarget.style.background = 'var(--teach-hover-bg)'}
                                  onMouseOut={e => e.currentTarget.style.background = 'none'}
                                  onClick={() => { setLang(opt.value); setLangDropdownOpen(false); }}
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
                        <label htmlFor="level" style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, display: 'block', color: 'var(--text-color)' }}>{t('courses.level')}</label>
                        <select id="level" className="st-input w-full block" style={{ width: '100%', fontSize: 16, padding: 8, borderRadius: 6, border: '1.5px solid var(--border-color)', background: 'var(--teach-bg)', color: 'var(--teach-fg)', transition: 'background 0.18s, color 0.18s' }} value={level} onChange={e => {setLevel(e.target.value); setDirty(true);}}>
                          <option value="" disabled>{t('courses.choose_level')}</option>
                          <option value="Beginner">{t('courses.beginner_level')}</option>
                          <option value="Intermediate">{t('courses.intermediate_level')}</option>
                          <option value="Advanced">{t('courses.advanced_level')}</option>
                        </select>
                      </div>
                      <div style={{ flex: 1, minWidth: 120 }}>
                        <label htmlFor="workload" style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, display: 'block', color: 'var(--text-color)' }}>{t('courses.recommended_load')}</label>
                                                  <input id="workload" className="st-input w-full block" placeholder={t('courses.workload_placeholder')} maxLength={64} type="text" style={{ width: '100%', fontSize: 16, padding: 8, borderRadius: 6, border: '1.5px solid var(--border-color)', background: 'var(--teach-bg)', color: 'var(--teach-fg)', transition: 'background 0.18s, color 0.18s' }} value={workload} onChange={e => {setWorkload(e.target.value); setDirty(true);}} />
                      </div>
                    </div>  
                    <label htmlFor="learning-outcomes" style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-color)' }}>{t('courses.what_u_will_learn')}</label>
                    <textarea
                      id="learning-outcomes"
                      rows={5}
                      className="st-input w-full block"
                      placeholder={t('courses.learning_outcomes_placeholder')}
                      maxLength={2000}
                      style={{ height: 123, marginBottom: 4, width: '100%', fontSize: 16, padding: 8, borderRadius: 6, border: '1.5px solid var(--border-color)', background: 'var(--teach-bg)', color: 'var(--teach-fg)', transition: 'background 0.18s, color 0.18s' }}
                      value={learningOutcomes}
                      onChange={e => {setLearningOutcomes(e.target.value); setDirty(true);}}
                    />
                    <div className="course-info-editor__input-note" style={{ fontSize: 13, color: dark ? '#b6d4fe' : '#000', marginBottom: 12 }}>
                      {t('courses.add_info_note_point')}
                      <span style={{ float: 'right' }}>{learningOutcomes.length}/2000</span>
                    </div>
                    <label htmlFor="description" style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-color)' }}>{t('courses.about')}</label>
                    {/* Static toolbar + textarea for target audience */}
                    <div className="custom-toolbar" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 8px', border: `1.5px solid #4485ed`, borderBottom: 'none', borderRadius: '6px 6px 0 0', background: 'var(--teach-bg)' }}>
  {/* Undo/Redo */}
  <span className="cke_button_icon cke_button__undo_icon" 
    onMouseDown={(e)=>e.preventDefault()} 
    onClick={()=>{ setActiveEditor(descriptionRef.current); handleCommand('desc','undo'); }} 
    style={{ cursor:'pointer', width:16, height:16, backgroundImage:"url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/icons.png?t=M199')", backgroundPosition:'0 -1536px', backgroundSize:'auto', display:'inline-block' }}></span>
  <span className="cke_button_icon cke_button__redo_icon" 
    onMouseDown={(e)=>e.preventDefault()} 
    onClick={()=>{ setActiveEditor(descriptionRef.current); handleCommand('desc','redo'); }} 
    style={{ cursor:'pointer', width:16, height:16, backgroundImage:"url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/icons.png?t=M199')", backgroundPosition:'0 -1488px', backgroundSize:'auto', display:'inline-block' }}></span>

  {/* Bold/Italic/Underline */}
  <span className="cke_button_icon cke_button__bold_icon" 
    onMouseDown={(e)=>e.preventDefault()} 
    onClick={()=>{ setActiveEditor(descriptionRef.current); handleCommand('desc','bold'); }} 
    style={{ cursor:'pointer', width:16, height:16, backgroundImage:"url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/basicstyles/icons/bold.png?t=1750845176')", backgroundPosition:'0 0px', backgroundSize:'16px', display:'inline-block', ...(formatStates.desc.bold ? activeBtnStyle : {}) }}></span>
  <span className="cke_button_icon cke_button__italic_icon" 
    onMouseDown={(e)=>e.preventDefault()} 
    onClick={()=>{ setActiveEditor(descriptionRef.current); handleCommand('desc','italic'); }} 
    style={{ cursor:'pointer', width:16, height:16, backgroundImage:"url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/basicstyles/icons/italic.png?t=1750845176')", backgroundPosition:'0 0px', backgroundSize:'16px', display:'inline-block', ...(formatStates.desc.italic ? activeBtnStyle : {}) }}></span>
  <span className="cke_button_icon cke_button__underline_icon" 
    onMouseDown={(e)=>e.preventDefault()} 
    onClick={()=>{ setActiveEditor(descriptionRef.current); handleCommand('desc','underline'); }} 
    style={{ cursor:'pointer', width:16, height:16, backgroundImage:"url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/basicstyles/icons/underline.png?t=1750845176')", backgroundPosition:'0 0px', backgroundSize:'16px', display:'inline-block', ...(formatStates.desc.underline ? activeBtnStyle : {}) }}></span>

  {/* Lists */}
  <span className="cke_button_icon cke_button__numberedlist_icon" 
    onMouseDown={(e)=>e.preventDefault()} 
    onClick={()=>{ setActiveEditor(descriptionRef.current); handleCommand('desc','insertOrderedList'); }} 
    style={{ cursor:'pointer', width:16, height:16, backgroundImage:"url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/icons.png?t=M199')", backgroundPosition:'0 -1080px', backgroundSize:'auto', display:'inline-block', ...(formatStates.desc.ordered ? activeBtnStyle : {}) }}></span>
  <span className="cke_button_icon cke_button__bulletedlist_icon" 
    onMouseDown={(e)=>e.preventDefault()} 
    onClick={()=>{ setActiveEditor(descriptionRef.current); handleCommand('desc','insertUnorderedList'); }} 
    style={{ cursor:'pointer', width:16, height:16, backgroundImage:"url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/icons.png?t=M199')", backgroundPosition:'0 -1032px', backgroundSize:'auto', display:'inline-block', ...(formatStates.desc.unordered ? activeBtnStyle : {}) }}></span>

  {/* Link */}
  <span className="cke_button_icon cke_button__link_icon" 
    onMouseDown={(e)=>e.preventDefault()} 
    onClick={()=>{ 
      setActiveEditor(descriptionRef.current);
      setActiveLinkPanel('desc');
      setLinkModalOpen(true); 
    }} 
    style={{ cursor:'pointer', width:16, height:16, backgroundImage:"url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/icons.png?t=M199')", backgroundPosition:'0 -960px', backgroundSize:'auto', display:'inline-block', ...(formatStates.desc.link ? activeBtnStyle : {}) }}></span>

  {/* Image */}
  <span className="cke_button_icon cke_button__image_icon" 
    onMouseDown={(e)=>e.preventDefault()} 
    onClick={()=>{ 
      setActiveEditor(descriptionRef.current);
      imageInputRef.current?.click(); 
    }} 
    style={{ cursor:'pointer', width:16, height:16, backgroundImage:"url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/icons.png?t=M199')", backgroundPosition:'0 -1560px', backgroundSize:'auto', display:'inline-block' }}></span>
</div>
                    <div
                      id="description"
                      className="rich-text-editor__content cke_editable cke_editable_themed cke_contents_ltr cke_show_borders"
                      {...editorCommonProps(descriptionRef, setDescription)}
                      spellCheck={true}
                      data-placeholder={t('courses.description_placeholder')}
                      data-empty={!description || description.trim() === '' ? 'true' : 'false'}
                      dangerouslySetInnerHTML={{ __html: description || '' }}
                      style={{ 
                        height: 'auto', 
                        minHeight: 225, 
                        marginBottom: 12, 
                        width: '100%', 
                        fontSize: 16, 
                        padding: 8, 
                        borderRadius: 6, 
                        border: `1.5px solid var(--border-color)`, 
                        background: 'var(--teach-bg)', 
                        color: 'var(--teach-fg)', 
                        outline: 'none',
                        textAlign: 'left'
                      }}
                    >
                    </div>
                    <label htmlFor="requirements" style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-color)' }}>{t('courses.requirements')}</label>
                    <div className="custom-toolbar" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 8px', border: `1.5px solid #4485ed`, borderBottom: 'none', borderRadius: '6px 6px 0 0', background: 'var(--teach-bg)' }}>
  {/* Undo/Redo */}
  <span className="cke_button_icon cke_button__undo_icon" 
    onMouseDown={(e)=>e.preventDefault()} 
    onClick={()=>{ setActiveEditor(requirementsRef.current); handleCommand('req','undo'); }} 
    style={{ cursor:'pointer', width:16, height:16, backgroundImage:"url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/icons.png?t=M199')", backgroundPosition:'0 -1536px', backgroundSize:'auto', display:'inline-block' }}></span>
  <span className="cke_button_icon cke_button__redo_icon" 
    onMouseDown={(e)=>e.preventDefault()} 
    onClick={()=>{ setActiveEditor(requirementsRef.current); handleCommand('req','redo'); }} 
    style={{ cursor:'pointer', width:16, height:16, backgroundImage:"url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/icons.png?t=M199')", backgroundPosition:'0 -1488px', backgroundSize:'auto', display:'inline-block' }}></span>

  {/* Bold/Italic/Underline */}
  <span className="cke_button_icon cke_button__bold_icon" 
    onMouseDown={(e)=>e.preventDefault()} 
    onClick={()=>{ setActiveEditor(requirementsRef.current); handleCommand('req','bold'); }} 
    style={{ cursor:'pointer', width:16, height:16, backgroundImage:"url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/basicstyles/icons/bold.png?t=1750845176')", backgroundPosition:'0 0px', backgroundSize:'16px', display:'inline-block', ...(formatStates.req.bold ? activeBtnStyle : {}) }}></span>
  <span className="cke_button_icon cke_button__italic_icon" 
    onMouseDown={(e)=>e.preventDefault()} 
    onClick={()=>{ setActiveEditor(requirementsRef.current); handleCommand('req','italic'); }} 
    style={{ cursor:'pointer', width:16, height:16, backgroundImage:"url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/basicstyles/icons/italic.png?t=1750845176')", backgroundPosition:'0 0px', backgroundSize:'16px', display:'inline-block', ...(formatStates.req.italic ? activeBtnStyle : {}) }}></span>
  <span className="cke_button_icon cke_button__underline_icon" 
    onMouseDown={(e)=>e.preventDefault()} 
    onClick={()=>{ setActiveEditor(requirementsRef.current); handleCommand('req','underline'); }} 
    style={{ cursor:'pointer', width:16, height:16, backgroundImage:"url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/basicstyles/icons/underline.png?t=1750845176')", backgroundPosition:'0 0px', backgroundSize:'16px', display:'inline-block', ...(formatStates.req.underline ? activeBtnStyle : {}) }}></span>

  {/* Lists */}
  <span className="cke_button_icon cke_button__numberedlist_icon" 
    onMouseDown={(e)=>e.preventDefault()} 
    onClick={()=>{ setActiveEditor(requirementsRef.current); handleCommand('req','insertOrderedList'); }} 
    style={{ cursor:'pointer', width:16, height:16, backgroundImage:"url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/icons.png?t=M199')", backgroundPosition:'0 -1080px', backgroundSize:'auto', display:'inline-block', ...(formatStates.req.ordered ? activeBtnStyle : {}) }}></span>
  <span className="cke_button_icon cke_button__bulletedlist_icon" 
    onMouseDown={(e)=>e.preventDefault()} 
    onClick={()=>{ setActiveEditor(requirementsRef.current); handleCommand('req','insertUnorderedList'); }} 
    style={{ cursor:'pointer', width:16, height:16, backgroundImage:"url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/icons.png?t=M199')", backgroundPosition:'0 -1032px', backgroundSize:'auto', display:'inline-block', ...(formatStates.req.unordered ? activeBtnStyle : {}) }}></span>

  {/* Link */}
  <span className="cke_button_icon cke_button__link_icon" 
    onMouseDown={(e)=>e.preventDefault()} 
    onClick={()=>{ 
      setActiveEditor(requirementsRef.current);
      setActiveLinkPanel('req');
      setLinkModalOpen(true); 
    }} 
    style={{ cursor:'pointer', width:16, height:16, backgroundImage:"url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/icons.png?t=M199')", backgroundPosition:'0 -960px', backgroundSize:'auto', display:'inline-block', ...(formatStates.req.link ? activeBtnStyle : {}) }}></span>

  {/* Image */}
  <span className="cke_button_icon cke_button__image_icon" 
    onMouseDown={(e)=>e.preventDefault()} 
    onClick={()=>{ 
      setActiveEditor(requirementsRef.current);
      imageInputRef.current?.click(); 
    }} 
    style={{ cursor:'pointer', width:16, height:16, backgroundImage:"url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/icons.png?t=M199')", backgroundPosition:'0 -1560px', backgroundSize:'auto', display:'inline-block' }}></span>
</div>
                    <div
                      id="requirements"
                      className="rich-text-editor__content cke_editable cke_editable_themed cke_contents_ltr cke_show_borders"
                      {...editorCommonProps(requirementsRef, setRequirements)}
                      spellCheck={true}
                      data-placeholder={t('courses.requirements_placeholder')}
                      data-empty={!requirements || requirements.trim() === '' ? 'true' : 'false'}
                      dangerouslySetInnerHTML={{ __html: requirements || '' }}
                      style={{ 
                        height: 'auto', 
                        minHeight: 120, 
                        marginBottom: 12, 
                        width: '100%', 
                        fontSize: 16, 
                        padding: 8, 
                        borderRadius: 6, 
                        border: `1.5px solid var(--border-color)`, 
                        background: 'var(--teach-bg)', 
                        color: 'var(--teach-fg)', 
                        outline: 'none',
                        textAlign: 'left'
                      }}
                    >
                    </div>
                    <label htmlFor="learning-format" style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-color)' }}>{t('courses.learning_format')}</label>
                    <div className="custom-toolbar" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 8px', border: `1.5px solid #4485ed`, borderBottom: 'none', borderRadius: '6px 6px 0 0', background: 'var(--teach-bg)' }}>
  {/* Undo/Redo */}
  <span className="cke_button_icon cke_button__undo_icon" 
    onMouseDown={(e)=>e.preventDefault()} 
    onClick={()=>{ setActiveEditor(learningFormatRef.current); handleCommand('learn','undo'); }} 
    style={{ cursor:'pointer', width:16, height:16, backgroundImage:"url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/icons.png?t=M199')", backgroundPosition:'0 -1536px', backgroundSize:'auto', display:'inline-block' }}></span>
  <span className="cke_button_icon cke_button__redo_icon" 
    onMouseDown={(e)=>e.preventDefault()} 
    onClick={()=>{ setActiveEditor(learningFormatRef.current); handleCommand('learn','redo'); }} 
    style={{ cursor:'pointer', width:16, height:16, backgroundImage:"url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/icons.png?t=M199')", backgroundPosition:'0 -1488px', backgroundSize:'auto', display:'inline-block' }}></span>

  {/* Bold/Italic/Underline */}
  <span className="cke_button_icon cke_button__bold_icon" 
    onMouseDown={(e)=>e.preventDefault()} 
    onClick={()=>{ setActiveEditor(learningFormatRef.current); handleCommand('learn','bold'); }} 
    style={{ cursor:'pointer', width:16, height:16, backgroundImage:"url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/basicstyles/icons/bold.png?t=1750845176')", backgroundPosition:'0 0px', backgroundSize:'16px', display:'inline-block', ...(formatStates.learn.bold ? activeBtnStyle : {}) }}></span>
  <span className="cke_button_icon cke_button__italic_icon" 
    onMouseDown={(e)=>e.preventDefault()} 
    onClick={()=>{ setActiveEditor(learningFormatRef.current); handleCommand('learn','italic'); }} 
    style={{ cursor:'pointer', width:16, height:16, backgroundImage:"url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/basicstyles/icons/italic.png?t=1750845176')", backgroundPosition:'0 0px', backgroundSize:'16px', display:'inline-block', ...(formatStates.learn.italic ? activeBtnStyle : {}) }}></span>
  <span className="cke_button_icon cke_button__underline_icon" 
    onMouseDown={(e)=>e.preventDefault()} 
    onClick={()=>{ setActiveEditor(learningFormatRef.current); handleCommand('learn','underline'); }} 
    style={{ cursor:'pointer', width:16, height:16, backgroundImage:"url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/basicstyles/icons/underline.png?t=1750845176')", backgroundPosition:'0 0px', backgroundSize:'16px', display:'inline-block', ...(formatStates.learn.underline ? activeBtnStyle : {}) }}></span>

  {/* Lists */}
  <span className="cke_button_icon cke_button__numberedlist_icon" 
    onMouseDown={(e)=>e.preventDefault()} 
    onClick={()=>{ setActiveEditor(learningFormatRef.current); handleCommand('learn','insertOrderedList'); }} 
    style={{ cursor:'pointer', width:16, height:16, backgroundImage:"url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/icons.png?t=M199')", backgroundPosition:'0 -1080px', backgroundSize:'auto', display:'inline-block', ...(formatStates.learn.ordered ? activeBtnStyle : {}) }}></span>
  <span className="cke_button_icon cke_button__bulletedlist_icon" 
    onMouseDown={(e)=>e.preventDefault()} 
    onClick={()=>{ setActiveEditor(learningFormatRef.current); handleCommand('learn','insertUnorderedList'); }} 
    style={{ cursor:'pointer', width:16, height:16, backgroundImage:"url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/icons.png?t=M199')", backgroundPosition:'0 -1032px', backgroundSize:'auto', display:'inline-block', ...(formatStates.learn.unordered ? activeBtnStyle : {}) }}></span>

  {/* Link */}
  <span className="cke_button_icon cke_button__link_icon" 
    onMouseDown={(e)=>e.preventDefault()} 
    onClick={()=>{ 
      setActiveEditor(learningFormatRef.current);
      setActiveLinkPanel('learn');
      setLinkModalOpen(true); 
    }} 
    style={{ cursor:'pointer', width:16, height:16, backgroundImage:"url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/icons.png?t=M199')", backgroundPosition:'0 -960px', backgroundSize:'auto', display:'inline-block', ...(formatStates.learn.link ? activeBtnStyle : {}) }}></span>

  {/* Image */}
  <span className="cke_button_icon cke_button__image_icon" 
    onMouseDown={(e)=>e.preventDefault()} 
    onClick={()=>{ 
      setActiveEditor(learningFormatRef.current);
      imageInputRef.current?.click(); 
    }} 
    style={{ cursor:'pointer', width:16, height:16, backgroundImage:"url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/icons.png?t=M199')", backgroundPosition:'0 -1560px', backgroundSize:'auto', display:'inline-block' }}></span>
</div>
                    <div
                      id="learning-format"
                      className="rich-text-editor__content cke_editable cke_editable_themed cke_contents_ltr cke_show_borders"
                      {...editorCommonProps(learningFormatRef, setLearningFormat)}
                      spellCheck={true}
                      data-placeholder={t('courses.learning_format_placeholder')}
                      data-empty={!learningFormat || learningFormat.trim() === '' ? 'true' : 'false'}
                      dangerouslySetInnerHTML={{ __html: learningFormat || '' }}
                      style={{ 
                        height: 'auto', 
                        minHeight: 120, 
                        marginBottom: 12, 
                        width: '100%', 
                        fontSize: 16, 
                        padding: 8, 
                        borderRadius: 6, 
                        border: `1.5px solid var(--border-color)`, 
                        background: 'var(--teach-bg)', 
                        color: 'var(--teach-fg)', 
                        outline: 'none',
                        textAlign: 'left'
                      }}
                    >
                    </div>
                    <label htmlFor="targeting" style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-color)' }}>{t('courses.targeting')}</label>
                    <div className="custom-toolbar" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 8px', border: `1.5px solid #4485ed`, borderBottom: 'none', borderRadius: '6px 6px 0 0', background: 'var(--teach-bg)' }}>
  {/* Undo/Redo */}
  <span className="cke_button_icon cke_button__undo_icon" 
    onMouseDown={(e)=>e.preventDefault()} 
    onClick={()=>{ setActiveEditor(targetingRef.current); handleCommand('targ','undo'); }} 
    style={{ cursor:'pointer', width:16, height:16, backgroundImage:"url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/icons.png?t=M199')", backgroundPosition:'0 -1536px', backgroundSize:'auto', display:'inline-block' }}></span>
  <span className="cke_button_icon cke_button__redo_icon" 
    onMouseDown={(e)=>e.preventDefault()} 
    onClick={()=>{ setActiveEditor(targetingRef.current); handleCommand('targ','redo'); }} 
    style={{ cursor:'pointer', width:16, height:16, backgroundImage:"url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/icons.png?t=M199')", backgroundPosition:'0 -1488px', backgroundSize:'auto', display:'inline-block' }}></span>

  {/* Bold/Italic/Underline */}
  <span className="cke_button_icon cke_button__bold_icon" 
    onMouseDown={(e)=>e.preventDefault()} 
    onClick={()=>{ setActiveEditor(targetingRef.current); handleCommand('targ','bold'); }} 
    style={{ cursor:'pointer', width:16, height:16, backgroundImage:"url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/basicstyles/icons/bold.png?t=1750845176')", backgroundPosition:'0 0px', backgroundSize:'16px', display:'inline-block', ...(formatStates.targ.bold ? activeBtnStyle : {}) }}></span>
  <span className="cke_button_icon cke_button__italic_icon" 
    onMouseDown={(e)=>e.preventDefault()} 
    onClick={()=>{ setActiveEditor(targetingRef.current); handleCommand('targ','italic'); }} 
    style={{ cursor:'pointer', width:16, height:16, backgroundImage:"url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/basicstyles/icons/italic.png?t=1750845176')", backgroundPosition:'0 0px', backgroundSize:'16px', display:'inline-block', ...(formatStates.targ.italic ? activeBtnStyle : {}) }}></span>
  <span className="cke_button_icon cke_button__underline_icon" 
    onMouseDown={(e)=>e.preventDefault()} 
    onClick={()=>{ setActiveEditor(targetingRef.current); handleCommand('targ','underline'); }} 
    style={{ cursor:'pointer', width:16, height:16, backgroundImage:"url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/basicstyles/icons/underline.png?t=1750845176')", backgroundPosition:'0 0px', backgroundSize:'16px', display:'inline-block', ...(formatStates.targ.underline ? activeBtnStyle : {}) }}></span>

  {/* Lists */}
  <span className="cke_button_icon cke_button__numberedlist_icon" 
    onMouseDown={(e)=>e.preventDefault()} 
    onClick={()=>{ setActiveEditor(targetingRef.current); handleCommand('targ','insertOrderedList'); }} 
    style={{ cursor:'pointer', width:16, height:16, backgroundImage:"url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/icons.png?t=M199')", backgroundPosition:'0 -1080px', backgroundSize:'auto', display:'inline-block', ...(formatStates.targ.ordered ? activeBtnStyle : {}) }}></span>
  <span className="cke_button_icon cke_button__bulletedlist_icon" 
    onMouseDown={(e)=>e.preventDefault()} 
    onClick={()=>{ setActiveEditor(targetingRef.current); handleCommand('targ','insertUnorderedList'); }} 
    style={{ cursor:'pointer', width:16, height:16, backgroundImage:"url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/icons.png?t=M199')", backgroundPosition:'0 -1032px', backgroundSize:'auto', display:'inline-block', ...(formatStates.targ.unordered ? activeBtnStyle : {}) }}></span>

  {/* Link */}
  <span className="cke_button_icon cke_button__link_icon" 
    onMouseDown={(e)=>e.preventDefault()} 
    onClick={()=>{ 
      setActiveEditor(targetingRef.current);
      setActiveLinkPanel('targ');
      setLinkModalOpen(true); 
    }} 
    style={{ cursor:'pointer', width:16, height:16, backgroundImage:"url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/icons.png?t=M199')", backgroundPosition:'0 -960px', backgroundSize:'auto', display:'inline-block', ...(formatStates.targ.link ? activeBtnStyle : {}) }}></span>

  {/* Image */}
  <span className="cke_button_icon cke_button__image_icon" 
    onMouseDown={(e)=>e.preventDefault()} 
    onClick={()=>{ 
      setActiveEditor(targetingRef.current);
      imageInputRef.current?.click(); 
    }} 
    style={{ cursor:'pointer', width:16, height:16, backgroundImage:"url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/icons.png?t=M199')", backgroundPosition:'0 -1560px', backgroundSize:'auto', display:'inline-block' }}></span>
</div>
                    <div
                      id="targeting"
                      className="rich-text-editor__content cke_editable cke_editable_themed cke_contents_ltr cke_show_borders"
                      {...editorCommonProps(targetingRef, setTargeting)}
                      spellCheck={true}
                      data-placeholder={t('courses.targeting_placeholder')}
                      data-empty={!targeting || targeting.trim() === '' ? 'true' : 'false'}
                      dangerouslySetInnerHTML={{ __html: targeting || '' }}
                      style={{ 
                        height: 'auto', 
                        minHeight: 120, 
                        marginBottom: 12, 
                        width: '100%', 
                        fontSize: 16, 
                        padding: 8, 
                        borderRadius: 6, 
                        border: `1.5px solid var(--border-color)`, 
                        background: 'var(--teach-bg)', 
                        color: 'var(--teach-fg)', 
                        outline: 'none',
                        textAlign: 'left'
                      }}
                    >
                    </div>
                    <div className="course-info-editor__section-heading" data-qa="acquired-assets" style={{ marginBottom: 6 }}>
                      <label htmlFor="acquired-assets" style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-color)' }}>{t('courses.acquired_assets')}</label>
                    </div>
                                          <textarea id="acquired-assets" rows={8} className="st-input w-full block" placeholder={t('courses.acquired_assets_placeholder')} maxLength={2000} style={{ height: 183, marginBottom: 18, width: '100%', fontSize: 16, padding: 8, borderRadius: 6, border: `1.5px solid var(--border-color)`, background: 'var(--teach-bg)', color: 'var(--teach-fg)', transition: 'background 0.18s, color 0.18s' }} value={acquiredAssets} onChange={e => {setAcquiredAssets(e.target.value); setDirty(true);}} />

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                      <button type="button" className="button anim-btn" onClick={handleSave} style={{ background: dark ? '#23272a' : '#54ad54', color: dark ? '#eaf4fd' : '#fff', border: 'none', borderRadius: 6, padding: '10px 24px', fontSize: 16, fontWeight: 600 }}>{t('courses.save')}</button>
                      <button type="button" onClick={()=>setShowEditInfo(false)} className="button is-outlined anim-btn" style={{ background: dark ? '#2d3038' : '#fff', color: dark ? '#eaf4fd' : '#4485ed', border: `1.5px solid ${dark ? '#4485ed' : '#4485ed'}`, borderRadius: 6, padding: '10px 24px', fontSize: 16, fontWeight: 600 }}>{t('courses.return_to_preview')}</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {section === 'syllabus' && (
            <div style={{ maxWidth: 540, width: '100%' }}>
              <h1 style={{ marginBottom: 18 }}>{t('courses.syllabus')}</h1>
              <div className="course-info__actions" style={{ display: 'flex', gap: 16, marginBottom: 18 }}>
                <button
                  onClick={() => window.open(`/teach/lessons/${id}/content`, '_blank')}
                  style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: 8, 
                    background: '#4485ed', 
                    color: '#fff', 
                    border: 'none', 
                    borderRadius: 6, 
                    padding: '10px 22px', 
                    fontWeight: 600, 
                    fontSize: 16,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => e.target.style.background = '#3367d6'}
                  onMouseOut={(e) => e.target.style.background = '#4485ed'}
                >
                  <FontAwesomeIcon icon={faEdit} />
                  <span>{t('courses.edit_syllabus')}</span>
                </button>
              </div>
              <div style={{ color: 'var(--text-color)', opacity: 0.85, fontSize: 16, marginTop: 12, transition:'color 0.22s' }}>
                {t('courses.syllabus_empty')}<br />
                {t('courses.syllabus_add_lesson')}
              </div>
            </div>
          )}

          {section === 'news' && (
            <div style={{ maxWidth: 720, width: '100%' }}>
              <header className="marco-layout__header" style={{ marginBottom: 24 }}>
                                    <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: dark ? '#fff' : '#222' }}>{t('courses.news')}</h1>
              </header>
              <p style={{ fontSize: 16, color: dark ? '#eaf4fd' : '#444', marginBottom: 18 }}>
              {t('courses.news_info')}
              </p>
              <p style={{ fontSize: 16, color: dark ? '#eaf4fd' : '#444', marginBottom: 18 }}>
              {t('courses.news_event')}
              </p>
              <p style={{ fontSize: 16, color: dark ? '#eaf4fd' : '#444', marginBottom: 32 }}>
              {t('courses.news_docs')}
              </p>
              <a href="#" className="button has-icon news__add-btn" style={{ display:'inline-flex', alignItems:'center', gap:8, background:'#54ad54', color:'#fff', border:'none', borderRadius:6, padding:'10px 22px', fontWeight:600, fontSize:16 }}>
                <FontAwesomeIcon 
                  icon={faPlus} 
                  size="sm" 
                  style={{ display:'inline-flex', alignItems:'center' }} 
                />
                <span>{t('courses.add_news')}</span>
              </a>
            </div>
          )}
          {section === 'comments' && (
            <div style={{ maxWidth: 720, width: '100%' }}>
              <header className="marco-layout__header course-comments__header" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
                <h1 style={{ margin:0, fontSize:28, fontWeight:700, color: dark ? '#fff' : '#222' }}>{t('comments.comments')}</h1>
                <a href="#" className="btn-link has-icon course-comments__header-link" style={{ display:'flex', alignItems:'center', gap:6, color: dark ? '#8ab4ff' : '#4485ed', textDecoration:'none', fontWeight:500, fontSize:16 }}>
                  <FontAwesomeIcon 
                    icon={faBan} 
                    size="sm" 
                    style={{ display:'inline-flex', alignItems:'center' }} 
                  />
                  <span>{t('courses.blacklist')}</span>
                </a>
              </header>
              <ul className="tab tab--border" style={{ listStyle:'none', padding:0, margin:'0 0 24px 0', display:'flex', gap:16, borderBottom:`1.5px solid ${dark ? '#4485ed' : '#4485ed'}` }}>
                <li className="tab__item discussions__tab" data-active style={{ paddingBottom:8, borderBottom:'3px solid #4485ed', fontWeight:600, color:'#4485ed' }}>
                  <a href="#" style={{ color:'inherit', textDecoration:'none' }}>
                    <span className="tab__item-counter" style={{ marginRight:6 }}>0</span>{t('comments.comments')}
                  </a>
                </li>
              </ul>
              <div className="discussions__empty-placeholder" style={{ textAlign:'center', color: dark ? '#b6d4fe' : '#666', fontSize:16, padding:40, background: dark ? '#2d3038' : '#f8faff', border:`1.5px solid ${dark ? '#4485ed' : '#4485ed'}`, borderRadius:8 }}>
                {t('courses.no_discussions')}
              </div>
            </div>
          )}
          {section === 'reviews' && (
            <div style={{ maxWidth: 720, width: '100%' }}>
              <header className="marco-layout__header" style={{ marginBottom:24 }}>
                <h1 style={{ margin:0, fontSize:28, fontWeight:700, color: dark ? '#fff' : '#222' }}>{t('courses.reviews')}</h1>
              </header>
              {/* Rating & distribution */}
              <div style={{ display:'flex', alignItems:'flex-start', gap:32, marginBottom:24 }}>
                {/* Average */}
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', minWidth:80 }}>
                  <div style={{ fontSize:56, fontWeight:700, lineHeight:1, color: dark ? '#fff' : '#222' }}>0</div>
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
                                      <div style={{ fontSize:14, color:'#666', marginTop:8 }}>{t('courses.of_reviews',{count:0})}</div>
                </div>
              </div>
              <div className="user-reviews__reviews-count" style={{ fontSize:18, fontWeight:700, marginBottom:12 }}>
                                    {t('courses.review_count',{count:0})}
              </div>

              {/* Divider */}
              <div style={{ height:1, background:'#eaeaea', margin:'8px 0 16px 0' }} />

              {/* Filter toggle */}
              <button id="ember866_tb" className="select-box__toggle-btn" type="button" style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 14px', border:`1.5px solid ${dark ? '#4485ed' : '#4485ed'}`, borderRadius:6, background:'#fff', fontSize:15, marginBottom:24 }}>
                <span id="ember866_c" className="select-box__caption ember-view" style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span id="ember870" className="svg-icon sort_icon svg-icon_inline svg-icon_inline-baseline ember-view user-reviews__reviews-filter-ico" style={{ display:'inline-flex', alignItems:'center' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"><use href="/static/frontend-build/icons.svg#sort" /></svg>
                  </span>
                  {t('courses.new')}
                </span>
              </button>
              <div className="user-reviews__reviews" style={{ textAlign:'center', color:'#666', fontSize:16, padding:40, background:'#f8faff', border:`1.5px solid ${dark ? '#4485ed' : '#4485ed'}`, borderRadius:8 }}>
                <p className="user-reviews__empty-note" style={{ margin:0 }}>
                  {t('courses.no_reviews')}
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
            fetchCategoryNames(sel); 
            setCategoryModalOpen(false);
            setDirty(true);
          }}
        />
      )}
      
      {/* Link Creation Modal */}
      {linkModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: dark ? '#2d3038' : '#fff',
            borderRadius: 12,
            padding: 24,
            minWidth: 400,
            maxWidth: 500,
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
            border: `1px solid ${dark ? '#4485ed' : '#eaeaea'}`
          }}>
            <h3 style={{
              margin: '0 0 20px 0',
              fontSize: 20,
              fontWeight: 600,
              color: dark ? '#fff' : '#222'
            }}>
              {t('editor.createLink')}
            </h3>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: 'block',
                marginBottom: 8,
                fontSize: 14,
                fontWeight: 500,
                color: dark ? '#eaf4fd' : '#333'
              }}>
                {t('editor.linkUrlLabel')}:
              </label>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 6,
                  border: `1.5px solid ${dark ? '#36607e' : '#eaeaea'}`,
                  background: dark ? '#23272a' : '#fff',
                  color: dark ? '#eaf4fd' : '#333',
                  fontSize: 16
                }}
              />
            </div>
            
            <div style={{ marginBottom: 24 }}>
              <label style={{
                display: 'block',
                marginBottom: 8,
                fontSize: 14,
                fontWeight: 500,
                color: dark ? '#eaf4fd' : '#333'
              }}>
                {t('editor.linkTextLabel')}:
              </label>
              <input
                type="text"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder={t('editor.link_text_placeholder')}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 6,
                  border: `1.5px solid ${dark ? '#36607e' : '#eaeaea'}`,
                  background: dark ? '#23272a' : '#fff',
                  color: dark ? '#eaf4fd' : '#333',
                  fontSize: 16
                }}
              />
            </div>
            
            <div style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'flex-end'
            }}>
              <button
                type="button"
                onClick={() => {
                  setLinkModalOpen(false);
                  setLinkUrl('');
                  setLinkText('');
                  setActiveLinkPanel('');
                }}
                style={{
                  padding: '10px 20px',
                  borderRadius: 6,
                  border: `1.5px solid ${dark ? '#4485ed' : '#4485ed'}`,
                  background: 'transparent',
                  color: dark ? '#eaf4fd' : '#4485ed',
                  fontSize: 16,
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                {t('editor.cancel')}
              </button>
              <button
                type="button"
                onClick={handleCreateLink}
                disabled={!linkUrl}
                style={{
                  padding: '10px 20px',
                  borderRadius: 6,
                  border: 'none',
                  background: '#4485ed',
                  color: '#fff',
                  fontSize: 16,
                  fontWeight: 500,
                  cursor: linkUrl ? 'pointer' : 'not-allowed',
                  opacity: linkUrl ? 1 : 0.6
                }}
              >
                {t('editor.create_link')}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Image Upload Input */}
      <input
        type="file"
        accept="image/*"
        ref={imageInputRef}
        style={{ display: 'none' }}
        onChange={handleImageInsert}
      />
      
      {/* Image Edit Modal */}
      {imageEditModal && selectedImage && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeImageEditModal();
            }
          }}
        >
          <div style={{
            background: dark ? '#2d3038' : '#fff',
            borderRadius: 12,
            padding: 24,
            minWidth: 500,
            maxWidth: 600,
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
            border: `1px solid ${dark ? '#4485ed' : '#eaeaea'}`
          }}>
            <h3 style={{
              margin: '0 0 20px 0',
              fontSize: 20,
              fontWeight: 600,
              color: dark ? '#fff' : '#222'
            }}>
              {t('editor.editImage')}
            </h3>
            
            {/* Image Preview */}
            <div style={{
              textAlign: 'center',
              marginBottom: 20,
              padding: '20px',
              background: dark ? '#1a1a1a' : '#f8f9fa',
              borderRadius: 8,
              border: `1px solid ${dark ? '#404040' : '#e9ecef'}`
            }}>
              <img
                src={selectedImage.src}
                alt="Preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: '200px',
                  objectFit: 'contain'
                }}
              />
            </div>
            
            {/* Size Controls */}
            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: 'block',
                marginBottom: 8,
                fontSize: 14,
                fontWeight: 500,
                color: dark ? '#eaf4fd' : '#333'
              }}>
                Размер изображения:
              </label>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, color: dark ? '#666' : '#999' }}>Ширина (px)</label>
                  <input
                    type="number"
                    value={imageSize.width}
                    onChange={(e) => setImageSize(prev => ({ ...prev, width: parseInt(e.target.value) || 0 }))}
                    min="50"
                    max="800"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: `1px solid ${dark ? '#404040' : '#e9ecef'}`,
                      background: dark ? '#1a1a1a' : '#fff',
                      color: dark ? '#eaf4fd' : '#333',
                      fontSize: 14
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, color: dark ? '#666' : '#999' }}>Высота (px)</label>
                  <input
                    type="number"
                    value={imageSize.height}
                    onChange={(e) => setImageSize(prev => ({ ...prev, height: parseInt(e.target.value) || 0 }))}
                    min="50"
                    max="600"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: `1px solid ${dark ? '#404040' : '#e9ecef'}`,
                      background: dark ? '#1a1a1a' : '#fff',
                      color: dark ? '#eaf4fd' : '#333',
                      fontSize: 14
                    }}
                  />
                </div>
              </div>
            </div>
            
            {/* Alignment Controls */}
            <div style={{ marginBottom: 24 }}>
              <label style={{
                display: 'block',
                marginBottom: 8,
                fontSize: 14,
                fontWeight: 500,
                color: dark ? '#eaf4fd' : '#333'
              }}>
                Выравнивание:
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['left', 'center', 'right'].map((align) => (
                  <button
                    key={align}
                    type="button"
                    onClick={() => setImageAlignment(align)}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      borderRadius: 6,
                      border: `1px solid ${imageAlignment === align ? '#4485ed' : (dark ? '#404040' : '#e9ecef')}`,
                      background: imageAlignment === align ? '#4485ed' : (dark ? '#1a1a1a' : '#fff'),
                      color: imageAlignment === align ? '#fff' : (dark ? '#eaf4fd' : '#333'),
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {align === 'left' ? 'По левому краю' : 
                     align === 'center' ? 'По центру' : 'По правому краю'}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'space-between'
            }}>
              <button
                type="button"
                onClick={deleteSelectedImage}
                style={{
                  padding: '10px 20px',
                  borderRadius: 6,
                  border: 'none',
                  background: '#dc3545',
                  color: '#fff',
                  fontSize: 16,
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Удалить
              </button>
              
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  onClick={closeImageEditModal}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 6,
                    border: `1px solid ${dark ? '#4485ed' : '#4485ed'}`,
                    background: 'transparent',
                    color: dark ? '#eaf4fd' : '#4485ed',
                    fontSize: 16,
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  {t('editor.cancel')}
                </button>
                <button
                  type="button"
                  onClick={applyImageChanges}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 6,
                    border: 'none',
                    background: '#28a745',
                    color: '#fff',
                    fontSize: 16,
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  {t('editor.apply')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
              <Prompt when={dirty} message={t('courses.message')}/>
      </div>
    );
}