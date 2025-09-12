import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import TeachNavMenu from './TeachNavMenu';
import { useTranslation } from 'react-i18next';
import useTheme from '../hooks/useTheme';
import axios from '../utils/axios';
import { toast, ToastContainer } from 'react-toastify';
import { useParams, useHistory } from 'react-router-dom';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import 'react-toastify/dist/ReactToastify.css';
import './LessonContentEditor.css';

export default function LessonContentEditor({ lessonId: propId }) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { id: routeId } = useParams();
  const history = useHistory();
  
  // Проверяем, что все зависимости загружены
  useEffect(() => {
    console.log('🎯 LessonContentEditor dependencies check:', {
      hasData: !!data,
      hasPicker: !!Picker,
      hasToast: !!toast,
      hasAxios: !!axios
    });
  }, []);
  // Universal back handler: returns to previous page or default lesson list
  const handleBack = () => {
    if (history.length > 1) {
      history.goBack();
    } else {
      // fallback – go to teacher lessons list
      history.push('/teach/lessons');
    }
  };
  const lessonId = propId || routeId;
  const [lesson, setLesson] = useState(null);
  const [steps, setSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVideoFiles, setSelectedVideoFiles] = useState({}); // Добавляем состояние для отслеживания выбранных видео файлов
  const [selectedImageFiles, setSelectedImageFiles] = useState({}); // Добавляем состояние для отслеживания выбранных изображений
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showAddStep, setShowAddStep] = useState(false);
  const [newStepType, setNewStepType] = useState('text');
  const [emojiPicker, setEmojiPicker] = useState({ visible: false, x: 0, y: 0, targetEditor: null });
  const emojiPickerRef = useRef(null);
  const [emojiAnim, setEmojiAnim] = useState('in');
  const savedSelectionByStep = useRef({});
  const [formatByStep, setFormatByStep] = useState({});

  // Состояния для работы с изображениями
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageEditModal, setImageEditModal] = useState(false);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 300, height: 200 });
  const [imageAlignment, setImageAlignment] = useState('center'); // left, center, right

  // Состояние для модального окна вставки ссылки
  const [linkModal, setLinkModal] = useState({ visible: false, stepId: null, url: '', text: '' });

  const stepTypes = [
    { id: 'text', name: t('lesson.text'), icon: '📝' },
    { id: 'video', name: t('lesson.video'), icon: '🎥' },
    { id: 'quiz', name: t('lesson.quiz'), icon: '❓' },
    { id: 'code', name: t('lesson.code'), icon: '💻' },
    { id: 'file', name: t('lesson.file'), icon: '📁' }
  ];

  const languageColors = {
    javascript: { bg: '#f7df1e', text: '#000', border: '#d4af37' },
    typescript: { bg: '#3178c6', text: '#fff', border: '#235a97' },
    python: { bg: '#3776ab', text: '#fff', border: '#2d5aa0' },
    java: { bg: '#ed8b00', text: '#fff', border: '#b86e00' },
    c: { bg: '#a8b9cc', text: '#000', border: '#7a8b9c' },
    cpp: { bg: '#00599c', text: '#fff', border: '#004080' },
    csharp: { bg: '#239120', text: '#fff', border: '#1a6b18' },
    go: { bg: '#00add8', text: '#fff', border: '#0088b3' },
    rust: { bg: '#ce422b', text: '#fff', border: '#a63321' },
    kotlin: { bg: '#7f52ff', text: '#fff', border: '#5a3cc7' },
    swift: { bg: '#f05138', text: '#fff', border: '#d13a22' },
    php: { bg: '#777bb4', text: '#fff', border: '#5a5d8a' },
    ruby: { bg: '#cc342d', text: '#fff', border: '#a62a24' },
    perl: { bg: '#39457e', text: '#fff', border: '#2a335f' },
    scala: { bg: '#dc322f', text: '#fff', border: '#b82927' },
    haskell: { bg: '#5d4f85', text: '#fff', border: '#4a3f6a' },
    elixir: { bg: '#4b275f', text: '#fff', border: '#3a1f4a' },
    erlang: { bg: '#a40033', text: '#fff', border: '#7a0026' },
    dart: { bg: '#00b4ab', text: '#fff', border: '#008f88' },
    lua: { bg: '#000080', text: '#fff', border: '#000060' },
    bash: { bg: '#4eaa25', text: '#fff', border: '#3d851d' },
    sql: { bg: '#336791', text: '#fff', border: '#2a5475' },
    r: { bg: '#276dc3', text: '#fff', border: '#1f5a9e' },
    matlab: { bg: '#e16737', text: '#fff', border: '#b84d2a' },
    groovy: { bg: '#4298b8', text: '#fff', border: '#357a94' }
  };

  const parseContent = (step) => {
    console.log('parseContent called with step:', step);
    
    // Проверяем, есть ли прямые поля fileUrl и filename
    if (step.fileUrl || step.filename) {
      console.log('Found direct fileUrl/filename fields:', { fileUrl: step.fileUrl, filename: step.filename });
    }
    
    if (!step || !step.content) {
      console.log('No step or content, returning empty object');
      return {};
    }
    
    // Если content уже является объектом, возвращаем его
    if (typeof step.content === 'object') {
      console.log('Content is already an object:', step.content);
      // Очищаем объект от пустых значений
      const cleanObject = {};
      Object.keys(step.content).forEach(key => {
        if (step.content[key] !== null && step.content[key] !== undefined && step.content[key] !== '') {
          cleanObject[key] = step.content[key];
        }
      });
      
      // Добавляем прямые поля fileUrl и filename, если они есть
      if (step.fileUrl) cleanObject.fileUrl = step.fileUrl;
      if (step.filename) cleanObject.filename = step.filename;
      
      console.log('Cleaned object with direct fields:', cleanObject);
      return cleanObject;
    }
    
    // Если content - строка, пытаемся распарсить JSON
    if (typeof step.content === 'string') {
      console.log('Content is string, trying to parse JSON:', step.content);
      try { 
        const parsed = JSON.parse(step.content);
        // Проверяем, что распарсенный объект не пустой и содержит нужные поля
        if (parsed && typeof parsed === 'object') {
          console.log('Successfully parsed JSON:', parsed);
          // Убираем пустые поля, чтобы избежать отображения {"text":""}
          const cleanParsed = {};
          Object.keys(parsed).forEach(key => {
            if (parsed[key] !== null && parsed[key] !== undefined && parsed[key] !== '') {
              cleanParsed[key] = parsed[key];
            }
          });
          
          // Добавляем прямые поля fileUrl и filename, если они есть
          if (step.fileUrl) cleanParsed.fileUrl = step.fileUrl;
          if (step.filename) cleanParsed.filename = step.filename;
          
          console.log('Cleaned parsed object with direct fields:', cleanParsed);
          return cleanParsed;
        }
        // Если распарсенный объект пустой, возвращаем пустой объект
        console.log('Parsed object is empty, checking for direct fields');
        const result = {};
        
        // Добавляем прямые поля fileUrl и filename, если они есть
        if (step.fileUrl) result.fileUrl = step.fileUrl;
        if (step.filename) result.filename = step.filename;
        
        console.log('Result with direct fields:', result);
        return result;
      } catch { 
        // Если не JSON, возвращаем как обычный текст
        // Но только если строка не пустая и не содержит только пробелы
        if (step.content.trim() !== '') {
          console.log('Content is not JSON, treating as text:', step.content);
          const result = { text: step.content };
          
          // Добавляем прямые поля fileUrl и filename, если они есть
          if (step.fileUrl) result.fileUrl = step.fileUrl;
          if (step.filename) result.filename = step.filename;
          
          return result;
        }
        console.log('Content is empty string, checking for direct fields');
        const result = {};
        
        // Добавляем прямые поля fileUrl и filename, если они есть
        if (step.fileUrl) result.fileUrl = step.fileUrl;
        if (step.filename) result.filename = step.filename;
        
        console.log('Result with direct fields:', result);
        return result;
      }
    }
    
    console.log('Content type not recognized, checking for direct fields');
    const result = {};
    
    // Добавляем прямые поля fileUrl и filename, если они есть
    if (step.fileUrl) result.fileUrl = step.fileUrl;
    if (step.filename) result.filename = step.filename;
    
    console.log('Result with direct fields:', result);
    return result;
  };

  const encodeContent = (type, payload) => {
    console.log('encodeContent called with:', { type, payload });
    
    try { 
      // Очищаем payload от пустых значений перед кодированием
      const cleanPayload = {};
      Object.keys(payload).forEach(key => {
        if (payload[key] !== null && payload[key] !== undefined && payload[key] !== '') {
          cleanPayload[key] = payload[key];
        }
      });
      
      console.log('Clean payload for encoding:', cleanPayload);
      
      // Если payload пустой, возвращаем пустую строку
      if (Object.keys(cleanPayload).length === 0) {
        console.log('Payload is empty, returning empty string');
        return '';
      }
      
      const encoded = JSON.stringify(cleanPayload);
      console.log('Encoded content:', encoded);
      return encoded;
    } catch (error) { 
      console.error('Error encoding content:', error);
      return String(payload || ''); 
    }
  };

  const setContentPayload = (stepIndex, payload) => {
    try {
      console.log('setContentPayload called:', { stepIndex, payload });
      
      const newSteps = [...steps];
      
      // Очищаем payload от пустых значений перед сохранением
      const cleanPayload = {};
      Object.keys(payload).forEach(key => {
        if (payload[key] !== null && payload[key] !== undefined && payload[key] !== '') {
          cleanPayload[key] = payload[key];
        }
      });
      
      console.log('Clean payload:', cleanPayload);
      
      newSteps[stepIndex].content = encodeContent(newSteps[stepIndex].type, cleanPayload);
      console.log('Updated step content:', newSteps[stepIndex].content);
      
      setSteps(newSteps);
      
      // Убираем автоматическое сохранение - теперь только ручное сохранение
      // if (newSteps[stepIndex].id) {
      //   // Очищаем предыдущий таймер
      //   if (autoSaveTimers.current[`${newSteps[stepIndex].id}-content`]) {
      //     clearTimeout(autoSaveTimers.current[`${newSteps[stepIndex].id}-content`]);
      //   }
      //   
      //   // Устанавливаем новый таймер
      //   autoSaveTimers.current[`${newSteps[stepIndex].id}-content`] = setTimeout(() => {
      //     handleSaveStep(newSteps[stepIndex].id, newSteps[stepIndex], false); // Не показываем уведомления при автосохранении
      //   }, 3000); // Увеличиваем задержку до 3 секунд для content
      // }
    } catch (error) {
      console.warn('Error in setContentPayload:', error);
    }
  };

  const handleUpload = async (type, file, onUrl) => {
    if (!file) {
      toast.error(t('lesson.select_file'));
      return;
    }

    console.log('handleUpload called with:', { type, file, onUrl });
    
    // Обновляем состояние выбранных файлов
    if (type === 'video') {
      setSelectedVideoFiles(prev => ({
        ...prev,
        [currentStepIndex]: file.name
      }));
    } else if (type === 'image') {
      setSelectedImageFiles(prev => ({
        ...prev,
        [currentStepIndex]: file.name
      }));
    }

    const isLargeFile = file.size > 1024 * 1024 * 1024; // > 1GB

    if (isLargeFile) {
      const confirmUpload = window.confirm(
        `Файл очень большой (${(file.size / (1024 * 1024 * 1024)).toFixed(2)} GB). Загрузка может занять много времени и быть нестабильной. Продолжить?`
      );
      if (!confirmUpload) {
        // Сбрасываем состояние выбранного файла
        if (type === 'video') {
          setSelectedVideoFiles(prev => {
            const newState = { ...prev };
            delete newState[currentStepIndex];
            return newState;
          });
        } else if (type === 'image') {
          setSelectedImageFiles(prev => {
            const newState = { ...prev };
            delete newState[currentStepIndex];
            return newState;
          });
        }
        return;
      }
      
      toast.info(`Начинаем загрузку большого файла: ${(file.size / (1024 * 1024 * 1024)).toFixed(2)} GB`);
    }
    
    console.log('Uploading file:', {
      type,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      courseId: lesson.course_id
    });
    
    if (isLargeFile) {
      toast.info(`Starting upload of large file (${(file.size / (1024 * 1024 * 1024)).toFixed(2)} GB). This may take a while...`);
    }
    
    try {
      const form = new FormData();
      form.append('file', file);
      
      const uploadUrl = `/courses/${lesson.course_id}/upload?type=${type}`;
      console.log('Upload URL:', uploadUrl);
      
      const res = await axios.post(uploadUrl, form, {
        headers:{ 'Content-Type':'multipart/form-data', Authorization: `Bearer ${localStorage.getItem('jwtToken')}` },
       
        timeout: isLargeFile ? 0 : 30000, 
        onUploadProgress: isLargeFile ? (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload progress: ${percentCompleted}%`);
        } : undefined
      });
      
      const url = res.data.url;
      const filename = res.data.filename;
      console.log('Upload successful, received URL:', url, 'filename:', filename);
      console.log('Filename encoding check:', {
        original: filename,
        encoded: filename ? encodeURIComponent(filename) : null,
        decoded: filename ? decodeURIComponent(encodeURIComponent(filename)) : null
      });
      
      if (url && typeof onUrl === 'function') {
        console.log('Calling onUrl callback with URL:', url, 'and filename:', filename);
        onUrl(url, filename);
        
        setTimeout(() => {
          const currentStep = steps[currentStepIndex];
          if (currentStep && currentStep.id) {
            console.log('Saving step after video upload:', currentStep);
            handleSaveStep(currentStep.id, currentStep, true);
          }
        }, 1000);
        
        if (type === 'video') {
          setSelectedVideoFiles(prev => {
            const newState = { ...prev };
            delete newState[currentStepIndex];
            return newState;
          });
        } else if (type === 'image') {
          setSelectedImageFiles(prev => {
            const newState = { ...prev };
            delete newState[currentStepIndex];
            return newState;
          });
        }
        
      } 
      else {
        console.warn('URL or onUrl callback not available:', { url, onUrl: typeof onUrl });
      }
      
      if (isLargeFile) {
        toast.success(`Large file uploaded successfully! (${(file.size / (1024 * 1024 * 1024)).toFixed(2)} GB)`);
      } else {
        toast.success(t('lesson.file_uploaded'));
      }
    } catch (e) {
      console.error('Upload error:', e);
      
      if (type === 'video') {
        setSelectedVideoFiles(prev => {
          const newState = { ...prev };
          delete newState[currentStepIndex];
          return newState;
        });
      } else if (type === 'image') {
        setSelectedImageFiles(prev => {
          const newState = { ...prev };
          delete newState[currentStepIndex];
          return newState;
        });
      }
      
      if (e.response) {
        toast.error(`Upload failed: ${e.response.data?.message || e.response.statusText}`);
      } else if (e.request) {
        toast.error('Upload failed: No response from server');
      } else {
        toast.error(`Upload failed: ${e.message}`);
      }
    }
  };

  const handleImageInsert = async (e, stepId) => {
    const file = e.target.files[0];
    if (!file || !stepId) return;
    
    if (!file.name || file.size === 0) {
      toast.error('Выбранный файл недействителен');
      e.target.value = '';
      return;
    }
    
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Неподдерживаемый тип файла. Разрешены только: JPEG, PNG, GIF, WebP');
      e.target.value = '';
      return;
    }
    
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await axios.post(`/courses/${lesson.course_id}/upload?type=image`, form, {
        headers:{
          'Content-Type':'multipart/form-data',
          Authorization:`Bearer ${localStorage.getItem('jwtToken')}`
        }
      });
      
      const imageUrl = res.data.url;
      
      const textarea = textEditorRefs.current[stepId];
      if (textarea) {
        const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const imgElement = document.createElement('img');
        imgElement.src = imageUrl;
        imgElement.id = imageId;
        imgElement.className = 'editable-image';
        imgElement.style.cssText = 'max-width:100%; cursor:pointer !important; user-select:none; -webkit-user-select:none; -moz-user-select:none; -ms-user-select:none; -webkit-user-modify:read-only; -moz-user-modify:read-only; -ms-user-modify:read-only; user-modify:read-only; pointer-events:auto;';
        imgElement.setAttribute('data-image-url', imageUrl);
        imgElement.onclick = (event) => selectImage(imageId, event, stepId);
        imgElement.onmousedown = (event) => {
          event.preventDefault();
          event.stopPropagation();
        };
        
        // Создаем DOM элемент для изображения
        const imageDiv = document.createElement('div');
        imageDiv.contentEditable = false;
        imageDiv.style.cssText = 'display:inline-block; cursor:pointer; user-select:none; -webkit-user-select:none; -moz-user-select:none; -ms-user-select:none; margin: 0 8px;';
        imageDiv.onclick = (event) => selectImage(imageId, event, stepId);
        imageDiv.onmousedown = (event) => {
          event.preventDefault();
          event.stopPropagation();
        };
        
        const img = document.createElement('img');
        img.src = imageUrl;
        img.id = imageId;
        img.className = 'editable-image';
        img.style.cssText = 'max-width:100%; cursor:pointer !important; user-select:none; -webkit-user-select:none; -moz-user-select:none; -ms-user-select:none; -webkit-user-modify:read-only; -moz-user-modify:read-only; -ms-user-modify:read-only; user-modify:read-only; pointer-events:auto;';
        img.setAttribute('data-image-url', imageUrl);
        img.onmouseover = () => img.style.cursor = 'pointer';
        
        imageDiv.appendChild(img);
        
        // Вставляем изображение в текущую позицию курсора
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.insertNode(imageDiv);
          
          // Добавляем пробел после изображения
          const space = document.createTextNode('\u00A0');
          range.setStartAfter(imageDiv);
          range.insertNode(space);
          
          // Обновляем курсор
          range.setStartAfter(space);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        }
        
        const step = steps.find(s => s.id === stepId);
        if (step) {
          const c = parseContent(step);
          const cleanedHtml = cleanHtml(textarea.innerHTML);
          const newContent = { ...c, text: cleanedHtml };
          const updatedStep = {
            ...step,
            content: JSON.stringify(newContent)
          };
          
          console.log('🖼️ Saving step after image insert:', {
            stepId,
            originalContent: step.content,
            cleanedHtml,
            newContent,
            updatedStep
          });
          
          // Используем handleSaveStep для правильного сохранения
          handleSaveStep(stepId, updatedStep, false, true);
          
          // Принудительно сохраняем содержимое редактора
          setTimeout(() => {
            if (textarea) {
              const currentHtml = textarea.innerHTML;
              const cleanedHtml = cleanHtml(currentHtml);
              const c = parseContent(step);
              const newContent = { ...c, text: cleanedHtml };
              const finalStep = {
                ...step,
                content: JSON.stringify(newContent)
              };
              
              console.log('🔄 Force saving step after image insert:', {
                stepId,
                currentHtml,
                cleanedHtml,
                finalContent: finalStep.content
              });
              
              handleSaveStep(stepId, finalStep, false, true);
            }
          }, 100);
        }
      }
      
      e.target.value = '';
      
      toast.success('Изображение успешно добавлено');
    } 
    catch (error) {
      console.error('Failed to upload image:', error);
      toast.error('Ошибка при загрузке изображения');
      e.target.value = '';
    }
  };

  const selectImage = (imageId, event = null, stepId = null) => {
    const image = document.getElementById(imageId);
    if (image) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      
      document.querySelectorAll('.editable-image').forEach(img => {
        img.classList.remove('selected');
      });
      
      image.classList.add('selected');
      
      setSelectedImage({
        id: imageId,
        element: image,
        src: image.src,
        stepId: stepId,
        currentStyle: image.style.cssText
      });
      setImageEditModal(true);
      
      const computedStyle = window.getComputedStyle(image);
      setImageSize({
        width: parseInt(computedStyle.width) || 300,
        height: parseInt(computedStyle.height) || 200
      });
      
      const textAlign = computedStyle.textAlign || 'center';
      setImageAlignment(textAlign);
    }
  };

  const applyImageChanges = () => {
    if (selectedImage && selectedImage.element) {
      const image = selectedImage.element;
      
      image.style.width = `${imageSize.width}px`;
      image.style.height = `${imageSize.height}px`;
      
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
      
      image.classList.remove('selected');
      
      if (selectedImage.stepId) {
        const textarea = textEditorRefs.current[selectedImage.stepId];
        if (textarea) {
          const step = steps.find(s => s.id === selectedImage.stepId);
          if (step) {
            const c = parseContent(step);
            const newContent = { ...c, text: textarea.innerHTML };
            const updatedStep = {
              ...step,
              content: JSON.stringify(newContent)
            };
            
            const newSteps = [...steps];
            const stepIndex = newSteps.findIndex(s => s.id === selectedImage.stepId);
            if (stepIndex !== -1) {
              newSteps[stepIndex] = updatedStep;
              setSteps(newSteps);
            }
            
            axios.put(`/lessons/${lessonId}/steps/${selectedImage.stepId}`, updatedStep, {
              headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` }
            }).catch(error => {
              console.error('Error saving step:', error);
              toast.error('Ошибка при сохранении изменений изображения');
            });
          }
        }
      }
      
      setImageEditModal(false);
      setSelectedImage(null);
    }
  };

  const deleteSelectedImage = () => {
    if (selectedImage && selectedImage.element) {
      selectedImage.element.remove();
      
      if (selectedImage.stepId) {
        const textarea = textEditorRefs.current[selectedImage.stepId];
        if (textarea) {
          const step = steps.find(s => s.id === selectedImage.stepId);
          if (step) {
            const c = parseContent(step);
            const newContent = { ...c, text: textarea.innerHTML };
            const updatedStep = {
              ...step,
              content: JSON.stringify(newContent)
            };
            
            const newSteps = [...steps];
            const stepIndex = newSteps.findIndex(s => s.id === selectedImage.stepId);
            if (stepIndex !== -1) {
              newSteps[stepIndex] = updatedStep;
              setSteps(newSteps);
            }
            
            axios.put(`/lessons/${lessonId}/steps/${selectedImage.stepId}`, updatedStep, {
              headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` }
            }).catch(error => {
              console.error('Error saving step:', error);
              toast.error('Ошибка при сохранении изменений изображения');
            });
          }
        }
      }
      
      setImageEditModal(false);
      setSelectedImage(null);
    }
  };

  const closeImageEditModal = () => {
    if (selectedImage && selectedImage.element) {
      selectedImage.element.classList.remove('selected');
    }
    setImageEditModal(false);
    setSelectedImage(null);
  };

  const cleanHtml = (html) => {
    if (!html) return '';
    
    // Создаем временный div для работы с HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Удаляем пустые элементы, но сохраняем изображения
    const emptyElements = tempDiv.querySelectorAll('div:empty, span:empty, p:empty');
    emptyElements.forEach(el => el.remove());
    
    // Удаляем лишние пробелы, но сохраняем структуру
    let cleaned = tempDiv.innerHTML
      .replace(/\s+/g, ' ')
      .replace(/>\s+</g, '><')
      .trim();
    
    return cleaned;
  };


  useEffect(() => {
    window.selectImage = selectImage;
    window.applyImageChanges = applyImageChanges;
    window.deleteSelectedImage = deleteSelectedImage;
    window.closeImageEditModal = closeImageEditModal;
    
    return () => {
      delete window.selectImage;
      delete window.applyImageChanges;
      delete window.deleteSelectedImage;
      delete window.closeImageEditModal;
    };
  }, [selectedImage, imageSize, imageAlignment, steps]);

  useEffect(() => {
    if (steps.length > 0 && !loading) {
      steps.forEach((step) => {
        if (step.type === 'text') {
          const textarea = textEditorRefs.current[step.id];
          if (textarea) {
            const images = textarea.querySelectorAll('img');
            images.forEach((img) => {
              if (!img.classList.contains('editable-image')) {
                const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                img.id = imageId;
                img.className = 'editable-image';
                img.style.cssText = 'max-width:100%; cursor:pointer !important; user-select:none; -webkit-user-select:none; -moz-user-select:none; -ms-user-select:none; -webkit-user-modify:read-only; -moz-user-modify:read-only; -ms-user-modify:read-only; user-modify:read-only; pointer-events:auto;';
                img.setAttribute('data-image-url', img.src);
                img.onclick = (event) => selectImage(imageId, event, step.id);
                img.onmousedown = (event) => {
                  event.preventDefault();
                  event.stopPropagation();
                };
              }
            });
          }
        }
      });
    }
  }, [loading]);



  useEffect(() => {
    if (lessonId) {
      loadLesson();
    }
  }, [lessonId]);
  useEffect(() => {
    setSelectedVideoFiles({});
    setSelectedImageFiles({});
  }, [lesson?.id, steps.length]);

  useEffect(() => {
    if (steps.length > 0 && !loading) {
      requestAnimationFrame(() => {
        setSteps([...steps]);
      });
      
      setTimeout(() => {
        setSteps([...steps]);
      }, 200);
    }
  }, [steps, loading]);

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

  useEffect(() => {
    if (emojiPicker.visible) {
      setEmojiAnim('in');
    } else if (emojiAnim === 'in') {
      setEmojiAnim('out');
      setTimeout(() => setEmojiAnim('in'), 200);
    }
  }, [emojiPicker.visible]);

  // Очистка таймеров при размонтировании компонента
  useEffect(() => {
    return () => {
      // Очищаем все таймеры автосохранения
      Object.values(autoSaveTimers.current).forEach(timer => {
        if (timer) clearTimeout(timer);
      });
      
      // Очищаем все таймеры форматирования
      Object.values(formatTimersRef.current).forEach(timer => {
        if (timer) clearTimeout(timer);
      });
    };
  }, []);

  // Обработка изображений в редакторе
  useEffect(() => {
    if (steps.length > 0 && !loading) {
      // Добавляем обработчики для изображений в редакторе
      steps.forEach((step, stepIndex) => {
        if (step.type === 'text') {
          const textarea = textEditorRefs.current[step.id];
          if (textarea) {
            const images = textarea.querySelectorAll('img');
            images.forEach(img => {
              if (!img.hasAttribute('data-resize-handlers-added')) {
                img.setAttribute('data-resize-handlers-added', 'true');
                
                // Создаем маркеры для изменения размера
                const createResizeMarker = (position) => {
                  const marker = document.createElement('div');
                  marker.style.cssText = `
                    position: absolute;
                    width: 8px;
                    height: 8px;
                    background: #007bff;
                    border: 1px solid white;
                    border-radius: 50%;
                    cursor: ${position.includes('n') ? 'n-resize' : position.includes('s') ? 's-resize' : ''}${position.includes('e') ? 'e-resize' : position.includes('w') ? 'w-resize' : ''};
                    z-index: 1001;
                    display: none;
                  `;
                  
                  // Позиционирование маркеров
                  if (position.includes('n')) marker.style.top = '-4px';
                  if (position.includes('s')) marker.style.bottom = '-4px';
                  if (position.includes('e')) marker.style.right = '-4px';
                  if (position.includes('w')) marker.style.left = '-4px';
                  if (position === 'ne') marker.style.top = '-4px';
                  if (position === 'nw') marker.style.top = '-4px';
                  if (position === 'se') marker.style.bottom = '-4px';
                  if (position === 'sw') marker.style.bottom = '-4px';
                  
                  return marker;
                };
                
                // Создаем маркеры для всех углов и краев
                const markers = {
                  n: createResizeMarker('n'),
                  s: createResizeMarker('s'),
                  e: createResizeMarker('e'),
                  w: createResizeMarker('w'),
                  ne: createResizeMarker('ne'),
                  nw: createResizeMarker('nw'),
                  se: createResizeMarker('se'),
                  sw: createResizeMarker('sw')
                };
                
                // Добавляем маркеры к изображению
                Object.values(markers).forEach(marker => img.appendChild(marker));
                
                // Показываем/скрываем маркеры при наведении
                img.onmouseenter = () => {
                  Object.values(markers).forEach(marker => marker.style.display = 'block');
                };
                img.onmouseleave = () => {
                  if (!img.classList.contains('selected-image')) {
                    Object.values(markers).forEach(marker => marker.style.display = 'none');
                  }
                };
                
                // Функция для изменения размера
                const startResize = (e, direction) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  const startX = e.clientX;
                  const startY = e.clientY;
                  const startWidth = img.offsetWidth;
                  const startHeight = img.offsetHeight;
                  const startRatio = startWidth / startHeight;
                  
                  const handleMouseMove = (moveEvent) => {
                    const deltaX = moveEvent.clientX - startX;
                    const deltaY = moveEvent.clientY - startY;
                    
                    let newWidth = startWidth;
                    let newHeight = startHeight;
                    
                    // Изменяем размер в зависимости от направления
                    if (direction.includes('e')) newWidth = startWidth + deltaX;
                    if (direction.includes('w')) newWidth = startWidth - deltaX;
                    if (direction.includes('s')) newHeight = startHeight + deltaY;
                    if (direction.includes('n')) newHeight = startHeight - deltaY;
                    
                    if (moveEvent.shiftKey) {
                      if (direction.includes('e') || direction.includes('w')) {
                        newHeight = newWidth / startRatio;
                      } else if (direction.includes('s') || direction.includes('n')) {
                        newWidth = newHeight * startRatio;
                      }
                    }
                    
                    newWidth = Math.max(50, newWidth);
                    newHeight = Math.max(50, newHeight);
                    
                    img.style.width = newWidth + 'px';
                    img.style.height = newHeight + 'px';
                    img.style.maxWidth = 'none';
                    img.style.maxHeight = 'none';
                  };
                  
                  const handleMouseUp = () => {
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                  };
                  
                  document.addEventListener('mousemove', handleMouseMove);
                  document.addEventListener('mouseup', handleMouseUp);
                };
                
                Object.entries(markers).forEach(([direction, marker]) => {
                  marker.addEventListener('mousedown', (e) => startResize(e, direction));
                });
                
                img.onclick = (e) => {
                  if (e.target === img) {
                    e.stopPropagation();
                    
                    if (img.classList.contains('selected-image')) {
                      img.classList.remove('selected-image');
                      img.style.outline = '';
                      Object.values(markers).forEach(marker => marker.style.display = 'none');
                      return;
                    }
                    
                    document.querySelectorAll('.selected-image').forEach(el => {
                      el.classList.remove('selected-image');
                      el.style.outline = '';
                    });
                    
                    img.classList.add('selected-image');
                    img.style.outline = '2px solid #007bff';
                    
                    Object.values(markers).forEach(marker => marker.style.display = 'block');
                  }
                };
                
                img.onwheel = (e) => {
                  if (img.classList.contains('selected-image')) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const currentWidth = parseInt(img.style.width) || img.offsetWidth;
                    const currentHeight = parseInt(img.style.height) || img.offsetHeight;
                    const scale = e.deltaY > 0 ? 0.95 : 1.05;
                    
                    const newWidth = Math.max(50, Math.round(currentWidth * scale));
                    const newHeight = Math.max(50, Math.round(currentHeight * scale));
                    
                    img.style.width = newWidth + 'px';
                    img.style.height = newHeight + 'px';
                    img.style.maxWidth = 'none';
                    img.style.maxHeight = 'none';
                  }
                };
                
                document.addEventListener('click', (e) => {
                  if (!img.contains(e.target) && !e.target.classList.contains('selected-image')) {
                    img.classList.remove('selected-image');
                    img.style.outline = '';
                    Object.values(markers).forEach(marker => marker.style.display = 'none');
                  }
                });
              }
            });
          }
        }
      });
    }
  }, [steps, loading]);

  // Обработка изображений после загрузки контента
  useEffect(() => {
    if (steps.length > 0 && !loading) {
      // Добавляем обработчики для изображений в редакторе
      steps.forEach((step, stepIndex) => {
        if (step.type === 'text') {
          const textarea = textEditorRefs.current[step.id];
          if (textarea) {
            // Обрабатываем изображения, которые уже есть в контенте
            const images = textarea.querySelectorAll('img');
            images.forEach(img => {
              if (!img.hasAttribute('data-resize-handlers-added')) {
                img.setAttribute('data-resize-handlers-added', 'true');
                
                // Создаем маркеры для изменения размера
                const createResizeMarker = (position) => {
                  const marker = document.createElement('div');
                  marker.style.cssText = `
                    position: absolute;
                    width: 8px;
                    height: 8px;
                    background: #007bff;
                    border: 1px solid white;
                    border-radius: 50%;
                    cursor: ${position.includes('n') ? 'n-resize' : position.includes('s') ? 's-resize' : ''}${position.includes('e') ? 'e-resize' : position.includes('w') ? 'w-resize' : ''};
                    z-index: 1001;
                    display: none;
                  `;
                  
                  // Позиционирование маркеров
                  if (position.includes('n')) marker.style.top = '-4px';
                  if (position.includes('s')) marker.style.bottom = '-4px';
                  if (position.includes('e')) marker.style.right = '-4px';
                  if (position.includes('w')) marker.style.left = '-4px';
                  if (position === 'ne') marker.style.top = '-4px';
                  if (position === 'nw') marker.style.top = '-4px';
                  if (position === 'se') marker.style.bottom = '-4px';
                  if (position === 'sw') marker.style.bottom = '-4px';
                  
                  return marker;
                };
                
                // Создаем маркеры для всех углов и краев
                const markers = {
                  n: createResizeMarker('n'),
                  s: createResizeMarker('s'),
                  e: createResizeMarker('e'),
                  w: createResizeMarker('w'),
                  ne: createResizeMarker('ne'),
                  nw: createResizeMarker('nw'),
                  se: createResizeMarker('se'),
                  sw: createResizeMarker('sw')
                };
                
                // Добавляем маркеры к изображению
                Object.values(markers).forEach(marker => img.appendChild(marker));
                
                // Показываем/скрываем маркеры при наведении
                img.onmouseenter = () => {
                  Object.values(markers).forEach(marker => marker.style.display = 'block');
                };
                img.onmouseleave = () => {
                  if (!img.classList.contains('selected-image')) {
                    Object.values(markers).forEach(marker => marker.style.display = 'none');
                  }
                };
                
                // Функция для изменения размера
                const startResize = (e, direction) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  const startX = e.clientX;
                  const startY = e.clientY;
                  const startWidth = img.offsetWidth;
                  const startHeight = img.offsetHeight;
                  const startRatio = startWidth / startHeight;
                  
                  const handleMouseMove = (moveEvent) => {
                    const deltaX = moveEvent.clientX - startX;
                    const deltaY = moveEvent.clientY - startY;
                    
                    let newWidth = startWidth;
                    let newHeight = startHeight;
                    
                    if (direction.includes('e')) newWidth = startWidth + deltaX;
                    if (direction.includes('w')) newWidth = startWidth - deltaX;
                    if (direction.includes('s')) newHeight = startHeight + deltaY;
                    if (direction.includes('n')) newHeight = startHeight - deltaY;
                    
                    if (moveEvent.shiftKey) {
                      if (direction.includes('e') || direction.includes('w')) {
                        newHeight = newWidth / startRatio;
                      } else if (direction.includes('s') || direction.includes('n')) {
                        newWidth = newHeight * startRatio;
                      }
                    }
                    
                    newWidth = Math.max(50, newWidth);
                    newHeight = Math.max(50, newHeight);
                    
                    img.style.width = newWidth + 'px';
                    img.style.height = newHeight + 'px';
                    img.style.maxWidth = 'none';
                    img.style.maxHeight = 'none';
                  };
                  
                  const handleMouseUp = () => {
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                  };
                  
                  document.addEventListener('mousemove', handleMouseMove);
                  document.addEventListener('mouseup', handleMouseUp);
                };
                
                // Добавляем обработчики событий для маркеров
                Object.entries(markers).forEach(([direction, marker]) => {
                  marker.addEventListener('mousedown', (e) => startResize(e, direction));
                });
                
                // Выделение изображения при клике
                img.onclick = (e) => {
                  if (e.target === img) {
                    e.stopPropagation();
                    
                    // Если изображение уже выделено, убираем выделение
                    if (img.classList.contains('selected-image')) {
                      img.classList.remove('selected-image');
                      img.style.outline = '';
                      Object.values(markers).forEach(marker => marker.style.display = 'none');
                      return;
                    }
                    
                    // Убираем выделение со всех изображений
                    document.querySelectorAll('.selected-image').forEach(el => {
                      el.classList.remove('selected-image');
                      el.style.outline = '';
                    });
                    
                    // Выделяем текущее изображение
                    img.classList.add('selected-image');
                    img.style.outline = '2px solid #007bff';
                    
                    // Показываем маркеры постоянно для выделенного изображения
                    Object.values(markers).forEach(marker => marker.style.display = 'block');
                  }
                };
                
                // Изменение размера при прокрутке колесиком мыши
                img.onwheel = (e) => {
                  if (img.classList.contains('selected-image')) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const currentWidth = parseInt(img.style.width) || img.offsetWidth;
                    const currentHeight = parseInt(img.style.height) || img.offsetHeight;
                    const scale = e.deltaY > 0 ? 0.95 : 1.05;
                    
                    const newWidth = Math.max(50, Math.round(currentWidth * scale));
                    const newHeight = Math.max(50, Math.round(currentHeight * scale));
                    
                    img.style.width = newWidth + 'px';
                    img.style.height = newHeight + 'px';
                    img.style.maxWidth = 'none';
                    img.style.maxHeight = 'none';
                  }
                };
                
                // Убираем выделение при клике вне изображения
                document.addEventListener('click', (e) => {
                  if (!img.contains(e.target) && !e.target.classList.contains('selected-image')) {
                    img.classList.remove('selected-image');
                    img.style.outline = '';
                    Object.values(markers).forEach(marker => marker.style.display = 'none');
                  }
                });
              }
            });
          }
        }
      });
    }
  }, [steps, loading]);

  const loadLesson = async (silent=false) => {
    try {
      if(!silent) setLoading(true);
      const response = await axios.get(`/lessons/${lessonId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` }
      });
      setLesson(response.data);
      
      // Загружаем шаги урока
      const stepsResponse = await axios.get(`/lessons/${lessonId}/steps`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` }
      });
      
      // Используем шаги как есть, без агрессивной очистки, чтобы не терять изображения/позиции
      setSteps(stepsResponse.data || []);
    } catch (error) {
      console.error('Error loading lesson:', error);
      if (error.response?.status === 404) {
        setError(t('lesson.find_error'));
      } else if (error.response?.status === 401) {
        setError(t('lesson.auth_error'));
      } else if (error.response?.status === 403) {
        setError(t('lesson.rights_error'));
      } else {
        setError(t('lesson.load_error'));
      }
    } finally {
      if(!silent) setLoading(false);
    }
  };

  const handleSaveStep = async (stepId, stepData, showNotification = true, silent = false) => {
    try {
      if (!silent) setSaving(true);
      
      // Если создаем новый шаг, сначала сохраняем все существующие шаги
      if (!stepId) {
        // Сохраняем все существующие шаги
        const existingSteps = steps.filter(s => s.id);
        if (existingSteps.length > 0) {
          try {
            for (const step of existingSteps) {
              const editorEl = textEditorRefs.current[step.id];
              let contentStr = step.content;
              if (editorEl && step.type === 'text') {
                const cleaned = cleanHtml(editorEl.innerHTML);
                const c = parseContent(step);
                const newContent = { ...c, text: cleaned };
                contentStr = JSON.stringify(newContent);
              }
              const payload = {
                title: step.title,
                type: step.type,
                content: contentStr,
                order: step.order
              };
              
              await axios.put(`/lessons/${lessonId}/steps/${step.id}`, payload, {
                headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` }
              });
            }
          } catch (err) {
            console.error('Error saving existing steps before adding new one:', err);
            toast.error(t('lesson.step_save_error'));
            return;
          }
        }
      }
      
      if (stepId) {
        // Обновляем существующий шаг без перезагрузки
        let finalStepData = { ...stepData };
        
        // Если это текстовый шаг, обновляем содержимое из редактора
        if (stepData.type === 'text') {
          const editorEl = textEditorRefs.current[stepId];
          if (editorEl) {
            const cleaned = cleanHtml(editorEl.innerHTML);
            const c = parseContent(stepData);
            const newContent = { ...c, text: cleaned };
            finalStepData = {
              ...finalStepData,
              content: JSON.stringify(newContent)
            };
            
            console.log('💾 Saving text step:', {
              stepId,
              originalHTML: editorEl.innerHTML,
              cleanedHTML: cleaned,
              originalContent: stepData.content,
              newContent,
              finalContent: finalStepData.content
            });
          }
        }
        
        await axios.put(`/lessons/${lessonId}/steps/${stepId}`, finalStepData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` }
        });
        
        // Обновляем локальное состояние шага
        setSteps(prev => {
          const next = [...prev];
          const idx = next.findIndex(s => s.id === stepId);
          if (idx !== -1) next[idx] = { ...next[idx], ...finalStepData };
          return next;
        });
        
        if (showNotification) {
          toast.success(t('lesson.step_saved'));
        }
        return;
      } else {
        // Создаем новый шаг без перезагрузки
        const response = await axios.post(`/lessons/${lessonId}/steps`, stepData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` }
        });
        setSteps(prev => {
          const next = [...prev, response.data].sort((a,b)=>(a.order||0)-(b.order||0));
          requestAnimationFrame(()=>{
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
          });
          return next;
        });
        if (showNotification) {
          toast.success(t('lesson.step_added'));
          // Перезагружаем страницу после добавления шага
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
        return;
      }
    } catch (error) {
      console.error('Error saving step:', error);
      if (showNotification) {
        toast.error(t('lesson.step_save_error'));
      }
    } finally {
      if (!silent) setSaving(false);
    }
  };

  const handleDeleteStep = async (stepId) => {
    if (!window.confirm(t('lesson.confirm_delete_step'))) {
      return;
    }

    try {
      await axios.delete(`/lessons/${lessonId}/steps/${stepId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` }
      });
      setSteps(prev => prev.filter(step => step.id !== stepId));
      toast.success(t('lesson.step_deleted'));
      // Сохраняем все и перезагружаем
      await saveAllStepsForce();
      return;
    } catch (error) {
      console.error('Error deleting step:', error);
      toast.error(t('lesson.step_delete_error'));
    }
  };

  const handleReorderSteps = async (fromIndex, toIndex) => {
    try {
      const newSteps = [...steps];
      const [removed] = newSteps.splice(fromIndex, 1);
      newSteps.splice(toIndex, 0, removed);
      
      setSteps(newSteps);
      
      // Обновляем порядок на сервере
      await axios.put(`/lessons/${lessonId}/steps/reorder`, {
        stepIds: newSteps.map(step => step.id)
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` }
      });
      
      toast.success(t('lesson.steps_reordered'));
    } catch (error) {
      console.error('Error reordering steps:', error);
      toast.error(t('lesson.steps_reorder_error'));
    }
  };

  const handleSaveAllSteps = async () => {
    try {
      setSaving(true);
      const hasUntitled = steps.some(s => (s.title || '').trim() === '');
      if (hasUntitled) {
        toast.error(t('lesson.title_required', { defaultValue: 'У каждого шага должно быть название' }));
        setSaving(false);
        return;
      }

      try {
        Object.keys(autoSaveTimers.current || {}).forEach(k => {
          clearTimeout(autoSaveTimers.current[k]);
        });
        autoSaveTimers.current = {};
      } catch {}

      const prepared = steps.map((step) => {
        const editorEl = textEditorRefs.current[step.id];
        let contentStr = step.content;
        if (editorEl && step.type === 'text') {
          const cleaned = cleanHtml(editorEl.innerHTML);
          const c = parseContent(step);
          const newContent = { ...c, text: cleaned };
          contentStr = JSON.stringify(newContent);
        }
        const payload = {
          title: step.title,
          type: step.type,
          content: contentStr,
          order: step.order
        };
        return { id: step.id, payload };
      });

      // Отправляем запросы последовательно, чтобы ловить ошибки
      for (const { id, payload } of prepared) {
        if (!id) continue;
        try {
          await axios.put(`/lessons/${lessonId}/steps/${id}`, payload, {
            headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` }
          });
        } catch (err) {
          console.error('Save step failed', { id, payload, err });
          toast.error(`${t('lesson.step_save_error', { defaultValue: 'Ошибка сохранения шага' })} #${id}`);
          // Прерываем общее сохранение, чтобы не перетереть
          throw err;
        }
      }

      // Обновляем локальное состояние на основе отправленного
      setSteps(prev => prev.map(s => {
        const preparedItem = prepared.find(p => p.id === s.id);
        if (!preparedItem) return s;
        return { ...s, ...preparedItem.payload };
      }));

      toast.success(t('lesson.all_steps_saved'));
      // Подтягиваем данные с сервера без мерцания
      await loadLesson(true);
    } catch (error) {
      console.error('Error saving all steps:', error);
      toast.error(t('lesson.save_all_error'));
    } finally {
      setSaving(false);
    }
  };

  // Принудительное сохранение без валидации (для автосохранения перед перезагрузкой)
  const saveAllStepsForce = async () => {
    try {
      // Сброс таймеров автосохранения
      try { Object.values(autoSaveTimers.current || {}).forEach(clearTimeout); autoSaveTimers.current = {}; } catch {}
      // Принудительно читаем HTML (с очисткой)
      const flushedSteps = steps.map((step) => {
        const editorEl = textEditorRefs.current[step.id];
        if (!editorEl) return step;
        const currentHtml = editorEl.innerHTML;
        const cleaned = cleanHtml(currentHtml);
        const c = parseContent(step);
        const newContent = { ...c, text: cleaned };
        return { ...step, content: JSON.stringify(newContent) };
      });
      setSteps(flushedSteps);
      // Сохраняем все существующие шаги
      for (const step of flushedSteps) {
        if (step.id) {
          await axios.put(`/lessons/${lessonId}/steps/${step.id}`, step, {
            headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` }
          });
        }
      }
      // Без перезагрузки страницы
    } catch (e) {
      console.error('Force save failed', e);
      // Без перезагрузки
    }
  };

  // Используем useRef для отслеживания таймеров автосохранения на уровне компонента
  const autoSaveTimers = React.useRef({});
  // Таймеры для дебаунса обновления состояния форматирования
  const formatTimersRef = React.useRef({});
  
  // useRef для работы с текстовым редактором
  const textEditorRefs = useRef({});
  const currentStepRef = useRef(null);

  // Функция для вставки тегов (как в Support)
  const insertTag = (startTag, endTag = '', stepIndex) => {
    const textarea = textEditorRefs.current[stepIndex];
    if (!textarea) return;
    
    // Проверяем параметры
    if (!startTag || typeof startTag !== 'string') {
      console.warn('Invalid startTag:', startTag);
      return;
    }
    
    // Получаем текущее выделение
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    const selectedText = range.toString();
    
    // Создаем HTML-элемент для вставки
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = startTag + selectedText + endTag;
    
    // Проверяем, что у нас есть дочерний элемент для вставки
    if (!tempDiv.firstChild) {
      console.warn('Failed to create HTML element for insertion');
      return;
    }
    
    try {
      // Удаляем выделенный текст и вставляем новый
      range.deleteContents();
      range.insertNode(tempDiv.firstChild);
      
              // Сохраняем содержимое без перерендера
        const step = steps[stepIndex];
        if (step) {
          const c = parseContent(step);
          const newContent = { ...c, text: textarea.innerHTML };
          const updatedStep = {
            ...step,
            content: JSON.stringify(newContent)
          };
          
          // Убираем автосохранение
          // if (autoSaveTimers.current[`tag-${step.id}`]) {
          //   clearTimeout(autoSaveTimers.current[`tag-${step.id}`]);
          // }
          // autoSaveTimers.current[`tag-${step.id}`] = setTimeout(() => {
          //   handleSaveStep(step.id, updatedStep, false);
          // }, 2000);
        }
      
      // Восстанавливаем позицию курсора
      setTimeout(() => {
        textarea.focus();
        // Устанавливаем курсор после вставленного тега
        if (tempDiv.firstChild) {
          try {
            const newRange = document.createRange();
            newRange.setStartAfter(tempDiv.firstChild);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
          } catch (error) {
            console.warn('Failed to set cursor position:', error);
            // Fallback: устанавливаем курсор в конец текста
            const newRange = document.createRange();
            newRange.selectNodeContents(textarea);
            newRange.collapse(false);
            selection.removeAllRanges();
            selection.addRange(newRange);
          }
        } else {
          // Fallback: устанавливаем курсор в конец текста
          const newRange = document.createRange();
          newRange.selectNodeContents(textarea);
          newRange.collapse(false);
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
      }, 0);
    } catch (error) {
      console.error('Failed to insert tag:', error);
      toast.error('Failed to insert tag');
    }
  };

  // Функция для вставки эмодзи
  const insertEmoji = async (emoji, stepKey) => {
    console.log('🎯 insertEmoji called:', { emoji, stepIndex: stepKey, emojiType: typeof emoji });
    
    // Проверяем входные параметры
    if (!stepKey && stepKey !== 0) {
      console.error('❌ stepKey is invalid:', stepKey);
      toast.error('Invalid step index for emoji insertion');
      return;
    }
    
    if (!emoji || typeof emoji !== 'string') {
      console.error('❌ Invalid emoji:', emoji);
      toast.error('Invalid emoji data');
      return;
    }
    
    const editor = textEditorRefs.current[stepKey];
    if (!editor) {
      console.error('❌ Text editor not found for step:', stepKey);
      toast.error('Text editor not found');
      return;
    }
    
    try {
      console.log('📝 Starting emoji insertion process...');
      
      // Восстанавливаем курсор туда, где был перед открытием пикера
      restoreSelectionForStep(stepKey);
      console.log('✅ Cursor position restored');
      
      // Фокусируемся на редакторе
      editor.focus();
      console.log('✅ Editor focused');
      
      // Получаем текущее выделение
      const selection = window.getSelection();
      let range;
      
      if (!selection.rangeCount) {
        console.log('📍 No selection, creating new range at end');
        // Если нет выделения, создаем новый диапазон в конце
        range = document.createRange();
        range.selectNodeContents(editor);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        range = selection.getRangeAt(0);
        console.log('📍 Using existing selection range');
      }
      
      // Используем более надежный способ вставки эмодзи
      console.log('💾 Inserting emoji:', emoji);
      
      // Предотвращаем автоматическое копирование в буфер обмена
      let originalClipboardData = '';
      try {
        if (navigator.clipboard && navigator.clipboard.readText) {
          originalClipboardData = await navigator.clipboard.readText();
        }
      } catch (error) {
        console.warn('Failed to read clipboard:', error);
      }
      
      // Создаем текстовый узел с эмодзи
      const textNode = document.createTextNode(emoji);
      
      // Удаляем выделенное содержимое (если есть)
      if (!range.collapsed) {
      range.deleteContents();
      }
      
      // Вставляем эмодзи
      range.insertNode(textNode);
      
      // Альтернативный способ вставки, если первый не сработал
      if (!editor.textContent.includes(emoji)) {
        console.log('🔄 First insertion method failed, trying alternative...');
        
        // Восстанавливаем выделение и фокус
        editor.focus();
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        
        // Пытаемся вставить через execCommand
        if (document.queryCommandSupported('insertText')) {
          document.execCommand('insertText', false, emoji);
        } else {
          // Если execCommand не поддерживается, используем paste
          try {
            const clipboardData = new DataTransfer();
            clipboardData.setData('text/plain', emoji);
            const pasteEvent = new ClipboardEvent('paste', {
              clipboardData: clipboardData,
              bubbles: true
            });
            editor.dispatchEvent(pasteEvent);
          } catch (pasteError) {
            console.warn('Paste method failed, trying direct DOM manipulation:', pasteError);
            
            // Последний способ - прямая манипуляция с DOM
      const textNode = document.createTextNode(emoji);
      range.insertNode(textNode);
            
            // Перемещаем курсор после вставленного эмодзи
            const after = document.createRange();
            after.setStart(textNode, textNode.length);
            after.collapse(true);
            selection.removeAllRanges();
            selection.addRange(after);
          }
        }
        
        // Проверяем, что эмодзи действительно вставлен
        if (!editor.textContent.includes(emoji)) {
          console.error('❌ All insertion methods failed for emoji:', emoji);
          toast.error('Failed to insert emoji. Please try again.');
          return;
        }
      }
      
      // Очищаем буфер обмена от эмодзи, если он там появился
      setTimeout(() => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(originalClipboardData);
        }
      }, 100);
      
      // Перемещаем курсор после вставленного эмодзи
      const after = document.createRange();
      after.setStart(textNode, textNode.length);
      after.collapse(true);
      selection.removeAllRanges();
      selection.addRange(after);
      
      // Помечаем редактор как непустой
      editor.setAttribute('data-empty', 'false');
      
      // Обновляем содержимое шага
      const step = steps.find(s => s.id === stepKey);
      if (step) {
        console.log('💾 Updating step content...');
        const c = parseContent(step);
        const newContent = { ...c, text: editor.innerHTML };
        const updatedStep = { ...step, content: JSON.stringify(newContent) };
        
        // Сохраняем изменения
        handleSaveStep(step.id, updatedStep, false, true);
        console.log('✅ Step content saved');
      } else {
        console.warn('⚠️ Step not found for saving:', stepKey);
      }
      
      // Триггерим событие input для обновления состояния
      const inputEvent = new Event('input', { bubbles: true });
      editor.dispatchEvent(inputEvent);
      
      console.log('🎉 Emoji inserted successfully:', emoji);
      toast.success(`Emoji ${emoji} inserted successfully!`);
      
    } catch (error) {
      console.error('❌ Failed to insert emoji:', error);
      toast.error(`Failed to insert emoji: ${error.message}`);
    }
  };

  // Функция для вставки изображения
  const insertImage = (imageUrl, stepIndex) => {
    const textarea = textEditorRefs.current[stepIndex];
    if (!textarea) return;
    
    // Проверяем, что imageUrl не undefined
    if (!imageUrl || typeof imageUrl !== 'string') {
      console.warn('Invalid image URL:', imageUrl);
      return;
    }
    
    try {
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      
      // Создаем уникальный ID для изображения
      const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Создаем элемент изображения с возможностью редактирования
      const img = document.createElement('img');
      img.src = imageUrl;
      img.alt = 'Image';
      img.id = imageId;
      img.className = 'editable-image';
      img.style.cssText = 'max-width:100%; cursor:pointer !important; user-select:none; -webkit-user-select:none; -moz-user-select:none; -ms-user-select:none; -webkit-user-modify:read-only; -moz-user-modify:read-only; -ms-user-modify:read-only; user-modify:read-only; pointer-events:auto;';
      img.setAttribute('data-image-url', imageUrl);
      img.onclick = (event) => selectImage(imageId, event, stepIndex);
      img.onmousedown = (event) => {
        event.preventDefault();
        event.stopPropagation();
      };
      
      // Создаем маркеры для изменения размера
      const createResizeMarker = (position) => {
        const marker = document.createElement('div');
        marker.style.cssText = `
          position: absolute;
          width: 8px;
          height: 8px;
          background: #007bff;
          border: 1px solid white;
          border-radius: 50%;
          cursor: ${position.includes('n') ? 'n-resize' : position.includes('s') ? 's-resize' : ''}${position.includes('e') ? 'e-resize' : position.includes('w') ? 'w-resize' : ''};
          z-index: 1001;
          display: none;
        `;
        
        // Позиционирование маркеров
        if (position.includes('n')) marker.style.top = '-4px';
        if (position.includes('s')) marker.style.bottom = '-4px';
        if (position.includes('e')) marker.style.right = '-4px';
        if (position.includes('w')) marker.style.left = '-4px';
        if (position === 'ne') marker.style.top = '-4px';
        if (position === 'nw') marker.style.top = '-4px';
        if (position === 'se') marker.style.bottom = '-4px';
        if (position === 'sw') marker.style.bottom = '-4px';
        
        return marker;
      };
      
      // Создаем маркеры для всех углов и краев
      const markers = {
        n: createResizeMarker('n'),    // верхний край
        s: createResizeMarker('s'),    // нижний край
        e: createResizeMarker('e'),    // правый край
        w: createResizeMarker('w'),    // левый край
        ne: createResizeMarker('ne'),  // правый верхний угол
        nw: createResizeMarker('nw'),  // левый верхний угол
        se: createResizeMarker('se'),  // правый нижний угол
        sw: createResizeMarker('sw')   // левый нижний угол
      };
      
      // Добавляем маркеры к изображению
      Object.values(markers).forEach(marker => img.appendChild(marker));
      
      // Показываем/скрываем маркеры при наведении
      img.onmouseenter = () => {
        Object.values(markers).forEach(marker => marker.style.display = 'block');
      };
      img.onmouseleave = () => {
        Object.values(markers).forEach(marker => marker.style.display = 'none');
      };
      
      // Функция для изменения размера
      const startResize = (e, direction) => {
        e.preventDefault();
        e.stopPropagation();
        
        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = img.offsetWidth;
        const startHeight = img.offsetHeight;
        const startRatio = startWidth / startHeight;
        
        const handleMouseMove = (moveEvent) => {
          const deltaX = moveEvent.clientX - startX;
          const deltaY = moveEvent.clientY - startY;
          
          let newWidth = startWidth;
          let newHeight = startHeight;
          
          // Изменяем размер в зависимости от направления
          if (direction.includes('e')) newWidth = startWidth + deltaX;
          if (direction.includes('w')) newWidth = startWidth - deltaX;
          if (direction.includes('s')) newHeight = startHeight + deltaY;
          if (direction.includes('n')) newHeight = startHeight - deltaY;
          
          if (moveEvent.shiftKey) {
            if (direction.includes('e') || direction.includes('w')) {
              newHeight = newWidth / startRatio;
            } else if (direction.includes('s') || direction.includes('n')) {
              newWidth = newHeight * startRatio;
            }
          }
          
          newWidth = Math.max(50, newWidth);
          newHeight = Math.max(50, newHeight);
          
          img.style.width = newWidth + 'px';
          img.style.height = newHeight + 'px';
          img.style.maxWidth = 'none';
          img.style.maxHeight = 'none';
        };
        
        const handleMouseUp = () => {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
        };
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
      };
      
      // Добавляем обработчики событий для маркеров
      Object.entries(markers).forEach(([direction, marker]) => {
        marker.addEventListener('mousedown', (e) => startResize(e, direction));
      });
      
      // Выделение изображения при клике
      img.onclick = (e) => {
        if (e.target === img) {
          e.stopPropagation();
          
          // Если изображение уже выделено, убираем выделение
          if (img.classList.contains('selected-image')) {
            img.classList.remove('selected-image');
            img.style.outline = '';
            Object.values(markers).forEach(marker => marker.style.display = 'none');
            return;
          }
          
          // Убираем выделение со всех изображений
          document.querySelectorAll('.selected-image').forEach(el => {
            el.classList.remove('selected-image');
            el.style.outline = '';
          });
          
          // Выделяем текущее изображение
          img.classList.add('selected-image');
          img.style.outline = '2px solid #007bff';
          
          // Показываем маркеры постоянно для выделенного изображения
          Object.values(markers).forEach(marker => marker.style.display = 'block');
        }
      };
      
      // Изменение размера при прокрутке колесиком мыши
      img.onwheel = (e) => {
        if (img.classList.contains('selected-image')) {
          e.preventDefault();
          e.stopPropagation();
          
          const currentWidth = parseInt(img.style.width) || img.offsetWidth;
          const currentHeight = parseInt(img.style.height) || img.offsetHeight;
          const scale = e.deltaY > 0 ? 0.95 : 1.05;
          
          const newWidth = Math.max(50, Math.round(currentWidth * scale));
          const newHeight = Math.max(50, Math.round(currentHeight * scale));
          
          img.style.width = newWidth + 'px';
          img.style.height = newHeight + 'px';
          img.style.maxWidth = 'none';
          img.style.maxHeight = 'none';
        }
      };
      
      // Убираем выделение при клике вне изображения
      document.addEventListener('click', (e) => {
        if (!img.contains(e.target) && !e.target.classList.contains('selected-image')) {
          img.classList.remove('selected-image');
          img.style.outline = '';
          Object.values(markers).forEach(marker => marker.style.display = 'none');
        }
      });
      
      // Вставляем изображение в текущую позицию курсора
      range.deleteContents();
      range.insertNode(img);
      
      // Устанавливаем курсор после вставленного изображения
      const newRange = document.createRange();
      newRange.setStartAfter(img);
      newRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(newRange);
      
      // Сохраняем содержимое на сервер
      const step = steps[stepIndex];
      if (step) {
        const c = parseContent(step);
        const cleanedHtml = cleanHtml(textarea.innerHTML);
        const newContent = { ...c, text: cleanedHtml };
        const updatedStep = {
          ...step,
          content: JSON.stringify(newContent)
        };
        
        // Обновляем локальное состояние
        const newSteps = [...steps];
        newSteps[stepIndex] = updatedStep;
        setSteps(newSteps);
        
        // Сохраняем на сервер без перезагрузки
        axios.put(`/lessons/${lessonId}/steps/${step.id}`, updatedStep, {
          headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` }
        }).catch(error => {
          console.error('Error saving step:', error);
          toast.error('Ошибка при сохранении изображения');
        });
      }
    } catch (error) {
      console.error('Failed to insert image:', error);
      toast.error('Failed to insert image');
    }
  };

  // Функция для вставки эмодзи
  // Функция для выбора эмодзи - теперь копирует в буфер обмена
  const handleSelectEmoji = async (emojiObj) => {
    console.log('🎯 handleSelectEmoji called:', { 
      emojiObj, 
      stepIndex: emojiPicker.stepIndex,
      hasNative: !!emojiObj?.native,
      nativeType: typeof emojiObj?.native,
      emojiPickerState: emojiPicker
    });
    
    // Проверяем валидность данных
    if (!emojiObj || !emojiObj.native || typeof emojiObj.native !== 'string') {
      console.error('❌ Invalid emoji object:', emojiObj);
      toast.error('Invalid emoji data received');
      setEmojiPicker({ visible: false, x: 0, y: 0, stepIndex: undefined });
      return;
    }
    
    console.log('✅ Valid data, copying emoji to clipboard:', emojiObj.native);
    
    try {
      // Копируем эмодзи в буфер обмена
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(emojiObj.native);
        toast.success(`Emoji ${emojiObj.native} copied to clipboard!`);
        console.log('✅ Emoji copied to clipboard successfully');
      } else {
        // Fallback для старых браузеров
        const textArea = document.createElement('textarea');
        textArea.value = emojiObj.native;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        toast.success(`Emoji ${emojiObj.native} copied to clipboard!`);
        console.log('✅ Emoji copied to clipboard using fallback method');
      }
    } catch (error) {
      console.error('❌ Failed to copy emoji to clipboard:', error);
      toast.error(`Failed to copy emoji: ${error.message}`);
    }
    
    // Закрываем пикер
    setEmojiPicker({ visible: false, x: 0, y: 0, stepIndex: undefined });
    console.log('🎯 Emoji picker closed');
  };

  // Helper to run document.execCommand in a specific text editor of a step
  const applyCommand = (stepIdx, cmd, val = null) => {
    const editor = textEditorRefs.current[stepIdx];
    if (!editor) return;
    
    // Сохраняем текущее выделение
    saveSelectionForStep(stepIdx);
    
    // Фокусируемся на редакторе
    editor.focus();
    
    // Восстанавливаем выделение
    restoreSelectionForStep(stepIdx);

    // 1. Выполняем команду
    if (cmd === 'createLink') {
      // Показываем модальное окно для вставки ссылки
      const selection = window.getSelection();
      const selectedText = selection.toString();
      setLinkModal({ 
        visible: true, 
        stepId: stepIdx, 
        url: 'https://', 
        text: selectedText || '' 
      });
      return; // Выходим, так как ссылка будет создана в модальном окне
    } else if (cmd === 'removeFormat') {
      // Для отмены форматирования используем более надежную логику
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        
        // Создаем новый текстовый узел с содержимым без форматирования
        const textContent = range.toString();
        const textNode = document.createTextNode(textContent);
        
        // Удаляем выделенное содержимое и вставляем обычный текст
        range.deleteContents();
        range.insertNode(textNode);
        
        // Выделяем вставленный текст
        const newRange = document.createRange();
        newRange.setStart(textNode, 0);
        newRange.setEnd(textNode, textContent.length);
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
    } else {
      document.execCommand(cmd, false, val);
    }

    // 2. Обновляем содержимое шага
    try {
      const step = steps.find(s => s.id === stepIdx);
      if (step) {
        const c = parseContent(step);
        const newContent = { ...c, text: editor.innerHTML };
        step.content = JSON.stringify(newContent);
        
        // Немедленно сохраняем изменения
        handleSaveStep(step.id, step, false);
      }
    } catch (err) {
      console.warn('Failed to update content after command', err);
    }

    // 3. Стабилизируем состояние редактора
    setTimeout(() => {
      stabilizeEditorState(stepIdx);
    }, 10);

    // 4. Обновляем состояние форматирования
    setTimeout(() => {
      updateFormatStateForStep(stepIdx);
    }, 50);
  };

  
  const renderStepEditor = (step, stepIndex) => {
    const c = parseContent(step);
    console.log(`Rendering step ${stepIndex}:`, { step, parsedContent: c });
    
    // Дополнительная очистка от пустых значений
    const cleanContent = {};
    Object.keys(c).forEach(key => {
      if (c[key] !== null && c[key] !== undefined && c[key] !== '') {
        cleanContent[key] = c[key];
      }
    });
    
    // Используем очищенный контент
    const cleanC = Object.keys(cleanContent).length > 0 ? cleanContent : {};
    console.log(`Clean content for step ${stepIndex}:`, cleanC);
    
    const setStepField = (field, value) => {
      const newSteps = [...steps];
      newSteps[stepIndex][field] = value;
      setSteps(newSteps);
      
      // Убираем автоматическое сохранение
      // if (step.id && field !== 'content') {
      //   // Очищаем предыдущий таймер
      //   if (autoSaveTimers.current[`${step.id}-${field}`]) {
      //     clearTimeout(autoSaveTimers.current[`${step.id}-${field}`]);
      //   }
      //   
      //   // Устанавливаем новый таймер
      //   autoSaveTimers.current[`${step.id}-${field}`] = setTimeout(() => {
      //     handleSaveStep(step.id, newSteps[stepIndex], false); // Не показываем уведомления при автосохранении
      //   }, 2000);
      // }
    };
    

        return (
      <div key={step.id} style={{ border: '1.5px solid var(--border-color)', borderRadius: 8, padding: 16, background: 'var(--teach-tile-bg)', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <strong style={{ minWidth: 64, color: 'var(--text-color)' }}>{stepTypes.find(t => t.id === step.type)?.name || step.type}</strong>
            <input
              type="text"
              value={step.title || ''}
            onChange={(e) => setStepField('title', e.target.value)}
            placeholder={t('lesson.step_title')}
            style={{ flex: 1, minWidth: 220, padding: '8px 10px', borderRadius: 6, border: '1.5px solid var(--border-color)', background: 'var(--teach-bg)', color: 'var(--teach-fg)' }}
          />
        </div>
        <div style={{ marginTop: 12 }}>
          {step.type === 'text' && (
            <div>
              <div style={{ display:'flex', gap:8, marginBottom:8, padding:'8px 12px', background: theme === 'dark' ? '#2d3038' : '#fff', borderRadius:'6px 6px 0 0', border: `1.5px solid ${theme === 'dark' ? '#404040' : '#eaeaea'}`, borderBottom:'none' }}>
                {/* --- New rich-text toolbar (similar to EditCourse) --- */}
                <span onMouseDown={(e)=>{e.preventDefault(); restoreSelectionForStep(step.id);}} onClick={()=>{applyCommand(step.id,'undo'); updateFormatStateForStep(step.id);}} style={{ cursor:'pointer', width:16, height:16, backgroundImage:"url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/icons.png?t=M199')", backgroundPosition:'0 -1536px', backgroundSize:'auto', display:'inline-block', filter: theme === 'dark' ? 'invert(1) brightness(1.5)' : 'none' }}></span>
                <span onMouseDown={(e)=>{e.preventDefault(); restoreSelectionForStep(step.id);}} onClick={()=>{applyCommand(step.id,'redo'); updateFormatStateForStep(step.id);}} style={{ cursor:'pointer', width:16, height:16, backgroundImage:"url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/icons.png?t=M199')", backgroundPosition:'0 -1488px', backgroundSize:'auto', display:'inline-block', filter: theme === 'dark' ? 'invert(1) brightness(1.5)' : 'none' }}></span>
                <span 
                  onMouseDown={(e)=>{e.preventDefault(); restoreSelectionForStep(step.id);}} 
                  onClick={()=>{
                    // Проверяем текущее состояние стиля
                    const isBold = document.queryCommandState('bold');
                    console.log(`Кнопка Bold: текущее состояние = ${isBold}`);
                    applyCommand(step.id, isBold ? 'removeFormat' : 'bold');
                    if (formatTimersRef.current[step.id]) clearTimeout(formatTimersRef.current[step.id]);
                    formatTimersRef.current[step.id] = setTimeout(()=>updateFormatStateForStep(step.id),120);
                  }} 
                  style={{ 
                    cursor:'pointer', 
                    width:16, 
                    height:16, 
                    backgroundImage:"url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/basicstyles/icons/bold.png?t=1750845176')", 
                    backgroundSize:'16px', 
                    display:'inline-block', 
                    backgroundColor: (formatByStep[step.id]?.bold ? 'rgba(68,133,237,0.18)' : 'transparent'), 
                    borderRadius:4,
                    filter: theme === 'dark' ? 'invert(1) brightness(1.5)' : 'none'
                  }}
                ></span>
                <span 
                  onMouseDown={(e)=>{e.preventDefault(); restoreSelectionForStep(step.id);}} 
                  onClick={()=>{
                    // Проверяем текущее состояние стиля
                    const isItalic = document.queryCommandState('italic');
                    console.log(`Кнопка Italic: текущее состояние = ${isItalic}`);
                    applyCommand(step.id, isItalic ? 'removeFormat' : 'italic');
                    if (formatTimersRef.current[step.id]) clearTimeout(formatTimersRef.current[step.id]);
                    formatTimersRef.current[step.id] = setTimeout(()=>updateFormatStateForStep(step.id),120);
                  }} 
                  style={{ 
                    cursor:'pointer', 
                    width:16, 
                    height:16, 
                    backgroundImage:"url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/basicstyles/icons/italic.png?t=1750845176')", 
                    backgroundSize:'16px', 
                    display:'inline-block', 
                    backgroundColor: (formatByStep[step.id]?.italic ? 'rgba(68,133,237,0.18)' : 'transparent'), 
                    borderRadius:4,
                    filter: theme === 'dark' ? 'invert(1) brightness(1.5)' : 'none'
                  }}
                ></span>
                <span 
                  onMouseDown={(e)=>{e.preventDefault(); restoreSelectionForStep(step.id);}} 
                  onClick={()=>{
                    // Проверяем текущее состояние стиля
                    const isUnderline = document.queryCommandState('underline');
                    console.log(`Кнопка Underline: текущее состояние = ${isUnderline}`);
                    applyCommand(step.id, isUnderline ? 'removeFormat' : 'underline');
                    if (formatTimersRef.current[step.id]) clearTimeout(formatTimersRef.current[step.id]);
                    formatTimersRef.current[step.id] = setTimeout(()=>updateFormatStateForStep(step.id),120);
                  }} 
                  style={{ 
                    cursor:'pointer', 
                    width:16, 
                    height:16, 
                    backgroundImage:"url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/basicstyles/icons/underline.png?t=1750845176')", 
                    backgroundSize:'16px', 
                    display:'inline-block', 
                    backgroundColor: (formatByStep[step.id]?.underline ? 'rgba(68,133,237,0.18)' : 'transparent'), 
                    borderRadius:4,
                    filter: theme === 'dark' ? 'invert(1) brightness(1.5)' : 'none'
                  }}
                ></span>
                <span onMouseDown={(e)=>{e.preventDefault();}} onClick={()=>{toggleList(step.id, true);}} style={{ cursor:'pointer', width:16, height:16, backgroundImage:"url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/icons.png?t=M199')", backgroundPosition:'0 -1080px', backgroundSize:'auto', display:'inline-block', filter: theme === 'dark' ? 'invert(1) brightness(1.5)' : 'none' }}></span>
                <span onMouseDown={(e)=>{e.preventDefault();}} onClick={()=>{toggleList(step.id, false);}} style={{ cursor:'pointer', width:16, height:16, backgroundImage:"url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/icons.png?t=M199')", backgroundPosition:'0 -1032px', backgroundSize:'auto', display:'inline-block', filter: theme === 'dark' ? 'invert(1) brightness(1.5)' : 'none' }}></span>
                <span onMouseDown={(e)=>{e.preventDefault(); restoreSelectionForStep(step.id);}} onClick={()=>{applyCommand(step.id,'createLink');}} style={{ cursor:'pointer', width:16, height:16, backgroundImage:"url('https://cdn.stepik.net/static/frontend-build/ckeditor/plugins/icons.png?t=M199')", backgroundPosition:'0 -960px', backgroundSize:'auto', display:'inline-block', filter: theme === 'dark' ? 'invert(1) brightness(1.5)' : 'none' }}></span>
                

                
                {/* old formatting buttons removed */}
                <button 
                  type="button" 
                  onMouseDown={() => {
                    // Сохраняем позицию курсора ДО потери фокуса кнопкой
                    console.log('🎯 Saving cursor position for step:', step.id);
                    saveSelectionForStep(step.id);
                  }}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    console.log('🎯 Opening emoji picker for step:', step.id, 'at position:', { x: rect.left, y: rect.bottom });
                    setEmojiPicker({ 
                      visible: true, 
                      x: rect.left, 
                      y: rect.bottom, 
                      stepIndex: step.id 
                    });
                  }}
                  style={{ 
                    padding:'6px 8px', 
                    borderRadius:4, 
                    border: `1px solid ${theme === 'dark' ? '#404040' : '#eaeaea'}`, 
                    background: theme === 'dark' ? '#23272f' : '#fff', 
                    color: theme === 'dark' ? '#eaf4fd' : '#23272f', 
                    cursor:'pointer', 
                    transition:'all 0.2s',
                    fontSize: '16px'
                  }} 
                  onMouseOver={(e)=>e.target.style.background='var(--border-color)'} 
                  onMouseOut={(e)=>e.target.style.background='var(--teach-bg)'}
                >
                  😊
                </button>
                

              </div>
                            <div
                ref={(el) => { textEditorRefs.current[step.id] = el; }}
                contentEditable={true}
                suppressContentEditableWarning={true}
                dangerouslySetInnerHTML={{ __html: cleanC.text || '' }}
                onFocus={(e) => {
                  // Инициализируем состояние форматирования при фокусе
                  setTimeout(() => {
                    updateFormatStateForStep(step.id);
                  }, 100);
                  
                  // Убеждаемся, что редактор не пустой
                  if (e.target) {
                    const txt = (e.target.textContent || '').trim();
                    if (txt === '' && (e.target.innerHTML || '') === '') {
                      e.target.innerHTML = '<br>';
                    }
                  }
                }}
                onInput={(e) => {
                  const newContent = e.target.innerHTML;
                  saveSelectionForStep(step.id);
                  
                  // Обновляем состояние форматирования
                  if (formatTimersRef.current[step.id]) clearTimeout(formatTimersRef.current[step.id]);
                  formatTimersRef.current[step.id] = setTimeout(() => updateFormatStateForStep(step.id), 100);
                  
                  // Автоматически сохраняем содержимое при изменении (с задержкой)
                  if (autoSaveTimers.current[step.id]) clearTimeout(autoSaveTimers.current[step.id]);
                  autoSaveTimers.current[step.id] = setTimeout(() => {
                    const currentStep = steps.find(s => s.id === step.id);
                    if (currentStep) {
                      const c = parseContent(currentStep);
                      const normalized = newContent.replace(/<div><br><\/div>/g, '<br>').replace(/<div><\/div>/g, '');
                      const newContentObj = { ...c, text: normalized };
                      const updatedStep = {
                        ...currentStep,
                        content: JSON.stringify(newContentObj)
                      };
                      
                      console.log('🔄 Auto-saving step on input:', {
                        stepId: step.id,
                        newContent: normalized,
                        updatedStep
                      });
                      
                      handleSaveStep(step.id, updatedStep, false, true);
                    }
                  }, 2000); // Сохраняем через 2 секунды после последнего изменения
                }}
                onKeyUp={() => saveSelectionForStep(step.id)}
                onMouseUp={() => saveSelectionForStep(step.id)}
                onBlur={(e) => {
                  // Сохраняем содержимое при потере фокуса
                  if (e.target) {
                    const raw = e.target.innerHTML;
                    // Нормализуем HTML содержимое
                    const normalized = raw.replace(/<div><br><\/div>/g, '<br>').replace(/<div><\/div>/g, '');
                    setContentPayload(stepIndex, { ...cleanC, text: normalized });
                    
                    // Автоматически сохраняем шаг при потере фокуса
                    setTimeout(() => {
                      const currentStep = steps.find(s => s.id === step.id);
                      if (currentStep) {
                        const c = parseContent(currentStep);
                        const newContent = { ...c, text: normalized };
                        const updatedStep = {
                          ...currentStep,
                          content: JSON.stringify(newContent)
                        };
                        
                        console.log('💾 Auto-saving step on blur:', {
                          stepId: step.id,
                          normalizedText: normalized,
                          updatedStep
                        });
                        
                        handleSaveStep(step.id, updatedStep, false, true);
                      }
                    }, 500);
                  }
                }}
                style={{ 
                  minHeight: 120, 
                  width: '100%', 
                  padding: '12px 16px', 
                  borderRadius:'0 0 6px 6px', 
                  border:'1.5px solid var(--border-color)', 
                  background:'var(--teach-bg)', 
                  color:'var(--teach-fg)',
                  fontSize: '16px',
                  lineHeight: '1.6',
                  outline: 'none',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  wordBreak: 'break-word'
                }}
                className="text-editor"
              />


            </div>
          )}
          {step.type === 'video' && (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:8 }}>
                <label style={{ display:'flex', alignItems:'center', gap:6, color:'var(--text-color)' }}>
                  <input 
                    type="radio" 
                    name={`video-source-${step.id}`} 
                    checked={!cleanC.videoFile}
                    onChange={() => {
                      setContentPayload(stepIndex, { ...cleanC, videoFile: null, videoUrl: cleanC.videoUrl || '' });
                      // Сбрасываем выбранный файл при переключении на URL
                      setSelectedVideoFiles(prev => {
                        const newState = { ...prev };
                        delete newState[stepIndex];
                        return newState;
                      });
                    }}
                  />
                  {t('lesson.video_url')}
                </label>
                <label style={{ display:'flex', alignItems:'center', gap:6, color:'var(--text-color)' }}>
                  <input 
                    type="radio" 
                    name={`video-source-${step.id}`} 
                    checked={!!cleanC.videoFile}
                    onChange={() => {
                      setContentPayload(stepIndex, { ...cleanC, videoFile: true, videoUrl: '' });
                      // Сбрасываем URL при переключении на файл
                    }}
                  />
                  {t('lesson.video_file')}
                </label>
              </div>
              
              {!cleanC.videoFile ? (
                <input 
                  type="url" 
                  value={cleanC.videoUrl || ''}
                  onChange={(e)=>setContentPayload(stepIndex, { ...cleanC, videoUrl: e.target.value })} 
                  placeholder={t('lesson.video_url')} 
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1.5px solid var(--border-color)', background: 'var(--teach-bg)', color: 'var(--teach-fg)' }} 
                />
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    <input 
                      type="file" 
                      accept="video/*" 
                      onChange={(e)=> {
                        const file = e.target.files[0];
                        if (file) {
                          handleUpload('video', file, (url)=> setContentPayload(stepIndex, { ...cleanC, videoUrl: url }));
                        }
                      }} 
                    />
                    {selectedVideoFiles[stepIndex] && (
                      <div style={{ 
                        padding: '8px 12px', 
                        background: 'var(--success-bg)', 
                        color: 'var(--success-fg)', 
                        borderRadius: 6, 
                        border: '1px solid var(--success-border)',
                        fontSize: '14px',
                        fontWeight: '500',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span>✅ Файл выбран: {selectedVideoFiles[stepIndex]}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedVideoFiles(prev => {
                              const newState = { ...prev };
                              delete newState[stepIndex];
                              return newState;
                            });
                            // Очищаем input
                            const fileInput = document.querySelector(`input[type="file"][accept="video/*"]`);
                            if (fileInput) fileInput.value = '';
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--danger-fg)',
                            cursor: 'pointer',
                            fontSize: '16px',
                            padding: '0 4px'
                          }}
                          title={t('course_catalog.clear_selection')}
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                  {cleanC.videoUrl && (
                    <div style={{ padding:8, background:'var(--teach-tile-bg)', borderRadius:6, border:'1px solid var(--border-color)' }}>
                      <div style={{ fontSize:14, color:'var(--text-color)', marginBottom:4 }}>{t('lesson.uploaded_video')}:</div>
                      <div style={{ fontSize:12, color:'var(--text-color)', opacity:0.7, wordBreak:'break-all' }}>{cleanC.videoUrl}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {step.type === 'code' && (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ maxHeight: 160, overflowY: 'auto', width: 200 }}>
                  <select 
                    value={cleanC.language || 'javascript'}
                    onChange={(e)=>setContentPayload(stepIndex, { ...cleanC, language: e.target.value })} 
                    style={{ 
                      width: '100%', 
                      padding: '8px 10px', 
                      borderRadius: 6, 
                      border: '1.5px solid var(--border-color)', 
                      background:'var(--teach-bg)', 
                      color:'var(--teach-fg)',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    {['javascript','typescript','python','java','c','cpp','csharp','go','rust','kotlin','swift','php','ruby','perl','scala','haskell','elixir','erlang','dart','lua','bash','sql','r','matlab','groovy'].map(lang => (
                      <option 
                        key={lang} 
                        value={lang}
                        style={{
                          backgroundColor: languageColors[lang]?.bg || '#f0f0f0',
                          color: languageColors[lang]?.text || '#000',
                          padding: '8px 12px',
                          fontWeight: '600'
                        }}
                      >
                        {lang}
                      </option>
                    ))}
                  </select>
                </div>
                <div 
                  style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                                      backgroundColor: languageColors[cleanC.language || 'javascript']?.bg || '#f0f0f0',
                  color: languageColors[cleanC.language || 'javascript']?.text || '#000',
                    fontSize: '12px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    border: `2px solid ${languageColors[cleanC.language || 'javascript']?.border || '#ccc'}`,
                    minWidth: '60px',
                    textAlign: 'center'
                  }}
                >
                  {cleanC.language || 'javascript'}
                </div>
              </div>
              <textarea 
                rows={12} 
                                value={cleanC.code || ''}
                onChange={(e)=>setContentPayload(stepIndex, { ...cleanC, code: e.target.value })} 
                placeholder={t('lesson.insert_code')} 
                style={{ 
                  width: '100%', 
                  padding: '16px 20px', 
                  borderRadius: 8, 
                                    border: `3px solid ${languageColors[cleanC.language || 'javascript']?.border || 'var(--border-color)'}`,
                  background: `linear-gradient(135deg, ${languageColors[cleanC.language || 'javascript']?.bg || '#f0f0f0'}10, ${languageColors[cleanC.language || 'javascript']?.bg || '#f0f0f0'}05)`, 
                  color: 'var(--teach-fg)', 
                  fontFamily: '"Fira Code", "Consolas", "Monaco", "Courier New", monospace',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  fontWeight: '500',
                  letterSpacing: '0.3px',
                  boxShadow: `inset 0 2px 8px ${languageColors[cleanC.language || 'javascript']?.bg || '#f0f0f0'}20`,
                  transition: 'all 0.3s ease',
                  outline: 'none',
                  resize: 'vertical'
                }} 
                onFocus={(e) => {
                  e.target.style.boxShadow = `inset 0 2px 8px ${languageColors[cleanC.language || 'javascript']?.bg || '#f0f0f0'}30, 0 0 0 3px ${languageColors[cleanC.language || 'javascript']?.bg || '#f0f0f0'}20`;
                }}
                onBlur={(e) => {
                  e.target.style.boxShadow = `inset 0 2px 8px ${languageColors[cleanC.language || 'javascript']?.bg || '#f0f0f0'}20`;
                }}
              />
              <textarea rows={4} value={cleanC.description || ''} onChange={(e)=>setContentPayload(stepIndex, { ...cleanC, description: e.target.value })} placeholder={t('lesson.task_description')} style={{ width:'100%', padding:'10px 12px', borderRadius:6, border:'1.5px solid var(--border-color)', background:'var(--teach-bg)', color:'var(--teach-fg)' }} />
            </div>
          )}
          {step.type === 'quiz' && (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {(cleanC.questions || [{ question:'', options: [{text:'',correct:false}] }]).map((q, qi)=> {
                // Убеждаемся, что у каждого вопроса есть хотя бы один вариант ответа
                const questionOptions = q.options && q.options.length > 0 ? q.options : [{text:'',correct:false}];
                
                return (
                <div key={qi} style={{ border:'1px solid var(--border-color)', borderRadius:8, padding:12 }}>
                  <input type="text" value={q.question || ''} onChange={(e)=>{
                                          const qs=[...(cleanC.questions||[])]; qs[qi]={...qs[qi], question:e.target.value}; setContentPayload(stepIndex, { ...cleanC, questions: qs });
                  }} placeholder={`${t('lesson.question')} ${qi+1}`} style={{ width:'100%', padding:'10px 12px', borderRadius:6, border:'1.5px solid var(--border-color)', background:'var(--teach-bg)', color:'var(--teach-fg)', marginBottom:8 }} />
                  {questionOptions.map((opt, oi)=> (
                    <div key={oi} style={{ display:'flex', gap:8, alignItems:'center', marginBottom:6 }}>
                      <input type="text" value={opt.text || ''} onChange={(e)=>{
                        const qs=[...(cleanC.questions||[])]; const opts=[...(q.options||[])]; opts[oi]={...opts[oi], text:e.target.value}; qs[qi]={...qs[qi], options: opts}; setContentPayload(stepIndex, { ...cleanC, questions: qs });
                      }} placeholder={`${t('lesson.option')} ${oi+1}`} style={{ flex:1, padding:'8px 10px', borderRadius:6, border:'1.5px solid var(--border-color)', background:'var(--teach-bg)', color:'var(--teach-fg)' }} />
                      <label style={{ color:'var(--text-color)', display:'flex', alignItems:'center', gap:6 }}>
                        <input type="checkbox" checked={!!opt.correct} onChange={(e)=>{ const qs=[...(cleanC.questions||[])]; const opts=[...(q.options||[])]; opts[oi]={...opts[oi], correct:e.target.checked}; qs[qi]={...qs[qi], options: opts}; setContentPayload(stepIndex, { ...cleanC, questions: qs }); }} />
                        {t('lesson.correct')}
            </label>
                                              <button type="button" onClick={()=>{ const qs=[...(cleanC.questions||[])]; const opts=[...(q.options||[])]; opts.splice(oi,1); qs[qi]={...qs[qi], options: opts}; setContentPayload(stepIndex, { ...cleanC, questions: qs }); }} style={{ padding:'6px 10px', borderRadius:6, border:'1.5px solid #e74c3c', background:'transparent', color:'#e74c3c' }}>{t('lesson.delete_option')}</button>
                    </div>
                  ))}
                  <div style={{ display:'flex', gap:8 }}>
                    <button type="button" onClick={()=>{ const qs=[...(cleanC.questions||[])]; const opts=[...(q.options||[]), { text:'', correct:false }]; qs[qi]={...qs[qi], options: opts}; setContentPayload(stepIndex, { ...cleanC, questions: qs }); }} style={{ padding:'8px 12px', borderRadius:6, border:'none', background:'#54ad54', color:'#fff' }}>{t('lesson.add_option')}</button>
                    <button type="button" onClick={()=>{ const qs=[...(cleanC.questions||[])]; qs.splice(qi,1); setContentPayload(stepIndex, { ...cleanC, questions: qs }); }} style={{ padding:'8px 12px', borderRadius:6, border:'1.5px solid #e74c3c', background:'transparent', color:'#e74c3c' }}>{t('lesson.delete_question')}</button>
                  </div>
                </div>
              )})}
              <button type="button" onClick={()=> setContentPayload(stepIndex, { ...cleanC, questions:[...(cleanC.questions||[]), { question:'', options:[{text:'',correct:false}] }] })} style={{ padding:'8px 12px', borderRadius:6, border:'none', background:'#4485ed', color:'#fff', alignSelf:'flex-start' }}>{t('lesson.add_question')}</button>
            </div>
          )}
          {step.type === 'file' && (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {/* Убрали опцию URL файла, оставили только загрузку с компьютера */}
              
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  <input 
                    type="file" 
                    onChange={(e)=> handleUpload('file', e.target.files[0], (url, filename)=> setContentPayload(stepIndex, { ...cleanC, fileUrl: url, filename: filename || e.target.files[0].name }))} 
                  />
                  {cleanC.fileUrl && (
                    <div style={{ padding:8, background:'var(--teach-tile-bg)', borderRadius:6, border:'1px solid var(--border-color)' }}>
                      <div style={{ fontSize:14, color:'var(--text-color)', marginBottom:4 }}>{t('lesson.uploaded_file')}:</div>
                        <div style={{ fontSize:12, color:'var(--text-color)', opacity:0.7, wordBreak:'break-all' }}>
                          {cleanC.filename || 'Файл загружен'}
                        </div>
                      <div style={{ fontSize:10, color:'var(--text-color)', opacity:0.5, wordBreak:'break-all', marginTop:2 }}>
                        {cleanC.fileUrl}
                      </div>
                    </div>
                  )}
                </div>
              
              {/* Показываем поле названия файла только если это загруженный файл (не внешняя ссылка) */}
              {/* Упростили логику - всегда показываем поле названия файла */}
                <input 
                  type="text" 
                  value={cleanC.filename || ''}
                  onChange={(e)=>setContentPayload(stepIndex, { ...cleanC, filename: e.target.value })} 
                  placeholder={cleanC.fileUrl ? 'Название файла (автоматически заполнено)' : t('lesson.filename_optional')} 
                  style={{ width:'100%', padding:'10px 12px', borderRadius:6, border:'1.5px solid var(--border-color)', background:'var(--teach-bg)', color:'var(--teach-fg)' }} 
                />
              <textarea 
                rows={4} 
                                value={cleanC.description || ''}
                onChange={(e)=>setContentPayload(stepIndex, { ...cleanC, description: e.target.value })} 
                placeholder={t('lesson.description')} 
                style={{ width:'100%', padding:'10px 12px', borderRadius:6, border:'1.5px solid var(--border-color)', background:'var(--teach-bg)', color:'var(--teach-fg)' }} 
              />
            </div>
          )}
          </div>
          </div>
        );
  };

  // Refresh steps list from server without toggling global loading
  const refreshSteps = async () => {
    try {
      const res = await axios.get(`/lessons/${lessonId}/steps`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` }
      });
      setSteps(res.data || []);
    } catch (e) { console.error('Failed to refresh steps', e); }
  };

  const saveSelectionForStep = (stepKey) => {
    try {
      const editor = textEditorRefs.current[stepKey];
      if (!editor) return;
      
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        // Проверяем, что выделение находится внутри нашего редактора
        if (editor.contains(range.commonAncestorContainer) || editor === range.commonAncestorContainer) {
          savedSelectionByStep.current[stepKey] = range.cloneRange();
        }
      }
      
      // debounce обновление состояния форматирования, чтобы уменьшить дергание
      if (formatTimersRef.current[stepKey]) clearTimeout(formatTimersRef.current[stepKey]);
      formatTimersRef.current[stepKey] = setTimeout(() => updateFormatStateForStep(stepKey), 120);
    } catch (err) {
      console.warn('Failed to save selection for step', stepKey, err);
    }
  };

  const restoreSelectionForStep = (stepKey) => {
    try {
      const editor = textEditorRefs.current[stepKey];
      const range = savedSelectionByStep.current[stepKey];
      if (!editor || !range) return;
      
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      editor.focus();
    } catch (err) {
      console.warn('Failed to restore selection for step', stepKey, err);
    }
  };

  const updateFormatStateForStep = (stepKey) => {
    try {
      const editor = textEditorRefs.current[stepKey];
      if (!editor) return;
      
      // Фокусируемся на редакторе для правильного определения состояния
      editor.focus();
      
      const boldState = document.queryCommandState('bold');
      const italicState = document.queryCommandState('italic');
      const underlineState = document.queryCommandState('underline');
      
      console.log(`Обновление состояния форматирования для шага ${stepKey}:`, {
        bold: boldState,
        italic: italicState,
        underline: underlineState
      });
      
      setFormatByStep(prev => ({
        ...prev,
        [stepKey]: {
          bold: boldState,
          italic: italicState,
          underline: underlineState,
        }
      }));
    } catch (err) {
      console.warn('Failed to update format state for step', stepKey, err);
    }
  };

  // Функция для стабилизации состояния редактора
  const stabilizeEditorState = (stepKey) => {
    try {
      const editor = textEditorRefs.current[stepKey];
      if (!editor) return;
      
      // Сохраняем текущее содержимое
      const currentContent = editor.innerHTML;
      
      // Предотвращаем перерендер, если содержимое не изменилось
      const step = steps.find(s => s.id === stepKey);
      if (step) {
        const c = parseContent(step);
        if (c.text === currentContent) {
          return; // Содержимое не изменилось, не обновляем
        }
      }
      
      // Обновляем состояние только если содержимое действительно изменилось
      setSteps(prev => {
        const newSteps = [...prev];
        const stepIndex = newSteps.findIndex(s => s.id === stepKey);
        if (stepIndex !== -1) {
          const c = parseContent(newSteps[stepIndex]);
          newSteps[stepIndex] = {
            ...newSteps[stepIndex],
            content: JSON.stringify({ ...c, text: currentContent })
          };
        }
        return newSteps;
      });
    } catch (err) {
      console.warn('Failed to stabilize editor state', err);
    }
  };

  const toggleList = (stepKey, ordered = true) => {
    const editor = textEditorRefs.current[stepKey];
    if (!editor) return;
    restoreSelectionForStep(stepKey);
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    let range = sel.getRangeAt(0);
    let node = range.commonAncestorContainer.nodeType === 3 ? range.commonAncestorContainer.parentElement : range.commonAncestorContainer;
    // Поднимаемся до LI/OL/UL
    let currentLi = null; let currentList = null;
    let cur = node;
    while (cur && cur !== editor) {
      if (cur.tagName === 'LI') currentLi = cur;
      if (cur.tagName === 'OL' || cur.tagName === 'UL') { currentList = cur; break; }
      cur = cur.parentElement;
    }
    // Если уже в списке и хотим его снять — выделим весь список целиком
    if (currentList && ((ordered && currentList.tagName === 'OL') || (!ordered && currentList.tagName === 'UL'))) {
      const listRange = document.createRange();
      listRange.selectNodeContents(currentList);
      sel.removeAllRanges(); sel.addRange(listRange);
    }
    document.execCommand(ordered ? 'insertOrderedList' : 'insertUnorderedList', false, null);
    // Принудительно задаём тип маркеров
    try {
      const postSel = window.getSelection();
      if (postSel && postSel.rangeCount > 0) {
        const r = postSel.getRangeAt(0);
        let n = r.commonAncestorContainer.nodeType === 3 ? r.commonAncestorContainer.parentElement : r.commonAncestorContainer;
        while (n && n !== editor && n.tagName !== 'OL' && n.tagName !== 'UL') n = n.parentElement;
        if (n && (n.tagName === 'OL' || n.tagName === 'UL')) {
          n.style.listStyleType = ordered ? 'decimal' : 'disc';
          n.style.paddingLeft = '1.25rem';
          n.style.marginLeft = '0.25rem';
        }
      }
    } catch {}
    editor.setAttribute('data-empty', 'false');
    // Зафиксируем контент и состояние
    const currentStep = steps.find(s => s.id === stepKey);
    if (currentStep) {
      const c = parseContent(currentStep);
      const newContent = { ...c, text: editor.innerHTML };
      currentStep.content = JSON.stringify(newContent);
    }
    saveSelectionForStep(stepKey);
    updateFormatStateForStep(stepKey);
  };

  // Функция для создания ссылки из модального окна
  const handleCreateLink = () => {
    if (!linkModal.url || !linkModal.stepId) return;
    
    const editor = textEditorRefs.current[linkModal.stepId];
    if (!editor) return;
    
    // Сохраняем текущее выделение
    saveSelectionForStep(linkModal.stepId);
    
    // Фокусируемся на редакторе
    editor.focus();
    
    // Восстанавливаем выделение
    restoreSelectionForStep(linkModal.stepId);
    
    // Создаем ссылку
    const selection = window.getSelection();
    const selectedText = selection.toString();
    
    if (selectedText && linkModal.text) {
      // Если есть выделенный текст и введен текст ссылки, заменяем выделенный текст на текст ссылки
      const linkHTML = `<a href="${linkModal.url}" target="_blank">${linkModal.text}</a>`;
      document.execCommand('insertHTML', false, linkHTML);
    } else if (selectedText) {
      // Если есть выделенный текст, но нет текста ссылки, делаем выделенный текст ссылкой
      document.execCommand('createLink', false, linkModal.url);
    } else if (linkModal.text) {
      // Если нет выделенного текста, но есть текст ссылки, вставляем ссылку с пользовательским текстом
      const linkHTML = `<a href="${linkModal.url}" target="_blank">${linkModal.text}</a>`;
      document.execCommand('insertHTML', false, linkHTML);
    } else {
      // Если ничего не выделено и нет текста ссылки, вставляем URL как ссылку
      const linkHTML = `<a href="${linkModal.url}" target="_blank">${linkModal.url}</a>`;
      document.execCommand('insertHTML', false, linkHTML);
    }
    
    // Обновляем содержимое шага
    try {
      const step = steps.find(s => s.id === linkModal.stepId);
      if (step) {
        const c = parseContent(step);
        const newContent = { ...c, text: editor.innerHTML };
        step.content = JSON.stringify(newContent);
        
        // Немедленно сохраняем изменения
        handleSaveStep(step.id, step, false);
      }
    } catch (err) {
      console.warn('Failed to update content after link creation', err);
    }
    
    // Закрываем модальное окно
    setLinkModal({ visible: false, stepId: null, url: '', text: '' });
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--teach-bg)', color: 'var(--teach-fg)', display: 'flex', flexDirection: 'column' }}>
        <NavBar />
        <div style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - 60px)' }}>
          <TeachNavMenu variant="teach" />
          <main style={{ flex: 1, padding: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div>{t('lesson.loading')}</div>
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--teach-bg)', color: 'var(--teach-fg)', display: 'flex', flexDirection: 'column' }}>
        <NavBar />
        <div style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - 60px)' }}>
          <TeachNavMenu variant="teach" />
          <main style={{ flex: 1, padding: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', maxWidth: 500 }}>
              <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.6 }}>⚠️</div>
              <h2 style={{ marginBottom: 16, color: 'var(--text-color)' }}>{t('lesson.error_title')}</h2>
              <p style={{ marginBottom: 24, color: 'var(--text-color)', opacity: 0.8 }}>{error}</p>
              <button
                onClick={handleBack}
                style={{
                  padding: '12px 24px',
                  borderRadius: 8,
                  background: '#54ad54',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: 16,
                  cursor: 'pointer'
                }}
              >
                {t('common.back')}
              </button>
            </div>
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--teach-bg)', color: 'var(--teach-fg)', display: 'flex', flexDirection: 'column' }}>
        <NavBar />
        <div style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - 60px)' }}>
          <TeachNavMenu variant="teach" />
          <main style={{ flex: 1, padding: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div>{t('lesson.not_found')}</div>
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--teach-bg)', color: 'var(--teach-fg)', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        .emoji-picker-anim {
          transition: all 0.2s ease;
        }
        .emoji-picker-anim-in {
          opacity: 1;
          transform: scale(1);
        }
        .emoji-picker-anim-out {
          opacity: 0;
          transform: scale(0.95);
        }
        /* Не применять спецстили к эмодзи в редакторе */
        .text-editor img, .text-editor span[role="img"], .text-editor .emoji, 
        .text-editor [data-emoji], .text-editor [class*="emoji"] { 
          all: unset !important; 
          font-family: inherit !important;
          font-size: inherit !important;
          line-height: inherit !important;
          display: inline !important;
          font-style: normal !important;
          font-weight: normal !important;
          text-decoration: none !important;
          transform: none !important;
          filter: none !important;
        }
      `}</style>
      <NavBar />
      <div style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - 60px)' }}>
        <TeachNavMenu variant="teach" />
        <main style={{ flex: 1, padding: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <button
                onClick={handleBack}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  background: 'var(--teach-tile-bg)',
                  color: 'var(--teach-fg)',
                  border: '1.5px solid var(--border-color)',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                ← {t('common.back')}
              </button>
              <h1 style={{ fontWeight: 700, fontSize: 32, color: theme === 'dark' ? '#fff' : '#23272f' }}>
                {t('lesson.content')}: {lesson.name}
              </h1>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowAddStep(true)}
                style={{
                  padding: '10px 22px',
                  borderRadius: 6,
                  background: theme === 'dark' ? '#2d3038' : '#fff',
                  color: theme === 'dark' ? '#eaf4fd' : '#23272f',
                  border: `1.5px solid ${theme === 'dark' ? '#404040' : '#eaeaea'}`,
                  fontWeight: 600,
                  fontSize: 16,
                  cursor: 'pointer'
                }}
              >
                {t('lesson.add_step')}
              </button>
              <button
                onClick={() => handleSaveAllSteps()}
                disabled={saving}
                style={{
                  padding: '10px 22px',
                  borderRadius: 6,
                  background: '#54ad54',
                  color: 'white',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: 16,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.6 : 1
                }}
              >
                {saving ? t('lesson.saving') : t('lesson.save_all')}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ 
              padding: '16px 20px', 
              background: '#fef2f2', 
              color: '#dc2626', 
              borderRadius: 8, 
              marginBottom: 20,
              border: '2px solid #fecaca',
              display: 'flex',
              alignItems: 'center',
              gap: 12
            }}>
              <div style={{ fontSize: 20 }}>⚠️</div>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Ошибка загрузки</div>
                <div>{error}</div>
              </div>
            </div>
          )}

          {/* Сообщение об отсутствии шагов */}
          {!loading && !error && steps.length === 0 && (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 40px', 
              color: 'var(--text-color)',
              background: 'var(--teach-tile-bg)',
              border: '2px dashed var(--border-color)',
              borderRadius: 12,
              margin: '20px 0'
            }}>
              <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.6 }}>📝</div>
              <h3 style={{ 
                fontSize: 24, 
                fontWeight: 600, 
                marginBottom: 12,
                color: 'var(--text-color)'
              }}>
                {t('lesson.no_steps')}
              </h3>
              <p style={{ 
                fontSize: 16, 
                opacity: 0.7, 
                marginBottom: 24,
                maxWidth: 400,
                marginLeft: 'auto',
                marginRight: 'auto'
              }}>
                {t('lesson.no_steps_description')}
              </p>
              <button 
                onClick={() => setShowAddStep(true)}
                style={{ 
                  padding: '12px 24px', 
                  borderRadius: 8, 
                  background: '#54ad54', 
                  color: '#fff', 
                  border: 'none', 
                  fontWeight: 600, 
                  fontSize: 16,
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.target.style.background = '#45a045'}
                onMouseOut={(e) => e.target.style.background = '#54ad54'}
              >
                {t('lesson.add_step')}
              </button>
            </div>
          )}

          {/* Список шагов */}
          {steps.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {steps.map((step, index) => (
                <div 
                  key={step.id} 
                  style={{
                    padding: '20px',
                    border: '1px solid var(--border-color)',
                    borderRadius: 8,
                    background: 'var(--teach-tile-bg)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 20 }}>{stepTypes.find(t => t.id === step.type)?.icon}</span>
                      <h3 style={{ 
                        margin: 0, 
                        fontWeight: 600, 
                        fontSize: 18,
                        color: theme === 'dark' ? '#ffffff' : 'var(--text-color)'
                      }}>
                        {t('lesson.step')} {index + 1}: {step.title || t('lesson.no_title')}
                      </h3>
                      <span style={{ 
                        fontSize: 14, 
                        color: 'var(--text-color)', 
                        opacity: 0.7 
                      }}>
                        ({stepTypes.find(t => t.id === step.type)?.name})
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => handleDeleteStep(step.id)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: 6,
                          background: '#e74c3c',
                          color: 'white',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: 14
                        }}
                      >
                        {t('common.delete')}
                      </button>
                    </div>
                  </div>
                  
                  {renderStepEditor(step, index)}
                </div>
              ))}
            </div>
          )}

          {/* Модальное окно добавления шага */}
          {showAddStep && (
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
                background: theme === 'dark' ? '#2d3038' : '#fff',
                padding: '24px',
                borderRadius: 8,
                maxWidth: 500,
                width: '90%',
                maxHeight: '80vh',
                overflowY: 'auto'
              }}>
                <h3 style={{ margin: '0 0 20px 0', fontWeight: 600, color: theme === 'dark' ? '#eaf4fd' : '#23272f' }}>
                {t('lesson.add_step')}
                </h3>
                
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: theme === 'dark' ? '#eaf4fd' : '#23272f' }}>
                  {t('lesson.step_type')}
                  </label>
                  <select
                    value={newStepType}
                    onChange={(e) => setNewStepType(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: `1.5px solid ${theme === 'dark' ? '#404040' : '#eaeaea'}`,
                      background: theme === 'dark' ? '#23272f' : '#fff',
                      color: theme === 'dark' ? '#eaf4fd' : '#23272f',
                      fontSize: 16
                    }}
                  >
                    {stepTypes.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.icon} {type.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setShowAddStep(false)}
                    style={{
                      padding: '10px 20px',
                      borderRadius: 6,
                      background: theme === 'dark' ? '#23272f' : '#fff',
                      color: theme === 'dark' ? '#eaf4fd' : '#23272f',
                      border: `1.5px solid ${theme === 'dark' ? '#404040' : '#eaeaea'}`,
                      cursor: 'pointer'
                    }}
                  >
                    {t('common.cancel')}
                  </button>
                  
                  <button
                    onClick={() => {
                      const newStep = {
                        type: newStepType,
                        title: '',
                        content: '',
                        order: steps.length
                      };
                      handleSaveStep(null, newStep);
                    }}
                    style={{
                      padding: '10px 20px',
                      borderRadius: 6,
                      background: theme === 'dark' ? '#2d3038' : '#fff',
                      color: theme === 'dark' ? '#eaf4fd' : '#23272f',
                      border: `1.5px solid ${theme === 'dark' ? '#404040' : '#eaeaea'}`,
                      cursor: 'pointer'
                    }}
                  >
                    {t('common.add')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
      <Footer />
      <ToastContainer position="top-center" theme={theme === 'dark' ? 'dark' : 'light'} />
      
      {/* Эмодзи пикер с правильным позиционированием */}
      {emojiPicker.visible && createPortal(
        (
          <div 
            ref={emojiPickerRef} 
            style={{
              position: 'fixed',
              top: emojiPicker.y,
              left: emojiPicker.x,
              zIndex: 10001,
              background: theme === 'dark' ? '#23272f' : '#fff',
              borderRadius: '8px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
              border: `1px solid ${theme === 'dark' ? '#4a5568' : '#e2e8f0'}`
            }}
            onMouseDownCapture={(e)=>{ e.preventDefault(); if (emojiPicker.stepIndex !== undefined) restoreSelectionForStep(emojiPicker.stepIndex); }}

          >
            <Picker 
              data={data} 
              theme={theme === 'dark' ? 'dark' : 'light'} 
              onEmojiSelect={(emojiObj) => {
                console.log('🎯 Picker onEmojiSelect called:', emojiObj);
                console.log('🎯 Data loaded:', !!data);
                
                handleSelectEmoji(emojiObj).catch(error => {
                  console.error('Failed to handle emoji selection:', error);
                });
              }} 
              searchPosition="top" 
              previewPosition="none" 
              skinTonePosition="search" 
            />
          </div>
        ),
        document.body
      )}

      {/* Модальное окно для редактирования изображений */}
      {imageEditModal && selectedImage && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            background: theme === 'dark' ? '#23272f' : '#fff',
            borderRadius: 12,
            padding: 24,
            maxWidth: 500,
            width: '90vw',
            maxHeight: '80vh',
            overflowY: 'auto',
            border: `1.5px solid ${theme === 'dark' ? '#4a5568' : '#e2e8f0'}`
          }}>
            <h3 style={{
              margin: '0 0 20px 0',
              color: theme === 'dark' ? '#eaf4fd' : '#1a202c',
              fontSize: 20,
              fontWeight: 600
            }}>
              Редактирование изображения
            </h3>
            
            {/* Предварительный просмотр изображения */}
            <div style={{
              marginBottom: 20,
              textAlign: 'center',
              padding: '16px',
              background: theme === 'dark' ? '#2d3748' : '#f7fafc',
              borderRadius: 8,
              border: `1px solid ${theme === 'dark' ? '#4a5568' : '#e2e8f0'}`
            }}>
              <img 
                src={selectedImage.src} 
                alt="Preview" 
                style={{
                  maxWidth: '100%',
                  maxHeight: 200,
                  borderRadius: 4
                }}
              />
            </div>
            
            {/* Настройки размера */}
            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: 'block',
                marginBottom: 8,
                color: theme === 'dark' ? '#eaf4fd' : '#1a202c',
                fontWeight: 500
              }}>
                Размер изображения:
              </label>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, color: theme === 'dark' ? '#a0aec0' : '#718096' }}>Ширина (px)</label>
                  <input 
                    type="number" 
                    value={imageSize.width}
                    onChange={(e) => setImageSize(prev => ({ ...prev, width: parseInt(e.target.value) || 300 }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: `1px solid ${theme === 'dark' ? '#4a5568' : '#e2e8f0'}`,
                      background: theme === 'dark' ? '#2d3748' : '#fff',
                      color: theme === 'dark' ? '#eaf4fd' : '#1a202c'
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, color: theme === 'dark' ? '#a0aec0' : '#718096' }}>Высота (px)</label>
                  <input 
                    type="number" 
                    value={imageSize.height}
                    onChange={(e) => setImageSize(prev => ({ ...prev, height: parseInt(e.target.value) || 200 }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: `1px solid ${theme === 'dark' ? '#4a5568' : '#e2e8f0'}`,
                      background: theme === 'dark' ? '#2d3748' : '#fff',
                      color: theme === 'dark' ? '#eaf4fd' : '#1a202c'
                    }}
                  />
                </div>
              </div>
            </div>
            
            {/* Настройки выравнивания */}
            <div style={{ marginBottom: 24 }}>
              <label style={{
                display: 'block',
                marginBottom: 8,
                color: theme === 'dark' ? '#eaf4fd' : '#1a202c',
                fontWeight: 500
              }}>
                Выравнивание:
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['left', 'center', 'right'].map(align => (
                  <button
                    key={align}
                    onClick={() => setImageAlignment(align)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: `1px solid ${imageAlignment === align ? '#3182ce' : theme === 'dark' ? '#4a5568' : '#e2e8f0'}`,
                      background: imageAlignment === align ? '#3182ce' : theme === 'dark' ? '#2d3748' : '#fff',
                      color: imageAlignment === align ? '#fff' : theme === 'dark' ? '#eaf4fd' : '#1a202c',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {align === 'left' ? '←' : align === 'center' ? '↔' : '→'}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Кнопки действий */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={deleteSelectedImage}
                style={{
                  padding: '10px 16px',
                  borderRadius: 6,
                  border: '1px solid #e53e3e',
                  background: 'transparent',
                  color: '#e53e3e',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.target.style.background = '#e53e3e'}
                onMouseOut={(e) => e.target.style.background = 'transparent'}
              >
                Удалить
              </button>
              <button
                onClick={closeImageEditModal}
                style={{
                  padding: '10px 16px',
                  borderRadius: 6,
                  border: `1px solid ${theme === 'dark' ? '#4a5568' : '#e2e8f0'}`,
                  background: theme === 'dark' ? '#2d3748' : '#fff',
                  color: theme === 'dark' ? '#eaf4fd' : '#1a202c',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Отмена
              </button>
              <button
                onClick={applyImageChanges}
                style={{
                  padding: '10px 16px',
                  borderRadius: 6,
                  border: '1px solid #3182ce',
                  background: '#3182ce',
                  color: '#fff',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.target.style.background = '#2c5282'}
                onMouseOut={(e) => e.target.style.background = '#3182ce'}
              >
                Применить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно для вставки ссылки */}
      {linkModal.visible && (
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
            background: theme === 'dark' ? '#2d3038' : '#fff',
            padding: '24px',
            borderRadius: 8,
            maxWidth: 400,
            width: '90%'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontWeight: 600, color: theme === 'dark' ? '#eaf4fd' : '#23272f' }}>
              {t('lesson.insert_link')}
            </h3>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: theme === 'dark' ? '#eaf4fd' : '#23272f' }}>
                {t('lesson.link_text')}:
              </label>
              <input
                type="text"
                value={linkModal.text}
                onChange={(e) => setLinkModal({ ...linkModal, text: e.target.value })}
                placeholder={t('lesson.link_text_placeholder')}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: `1.5px solid ${theme === 'dark' ? '#404040' : '#eaeaea'}`,
                  background: theme === 'dark' ? '#23272f' : '#fff',
                  color: theme === 'dark' ? '#eaf4fd' : '#23272f',
                  fontSize: 16
                }}
              />
              {linkModal.text && (
                <div style={{ 
                  fontSize: 12, 
                  color: theme === 'dark' ? '#a0aec0' : '#718096', 
                  marginTop: 4 
                }}>
                  {t('lesson.link_text_hint')}
                </div>
              )}
            </div>
            
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: theme === 'dark' ? '#eaf4fd' : '#23272f' }}>
                {t('lesson.link_url')}:
              </label>
              <input
                type="url"
                value={linkModal.url}
                onChange={(e) => setLinkModal({ ...linkModal, url: e.target.value })}
                placeholder="https://example.com"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: `1.5px solid ${theme === 'dark' ? '#404040' : '#eaeaea'}`,
                  background: theme === 'dark' ? '#23272f' : '#fff',
                  color: theme === 'dark' ? '#eaf4fd' : '#23272f',
                  fontSize: 16
                }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setLinkModal({ visible: false, stepId: null, url: '', text: '' })}
                style={{
                  padding: '10px 20px',
                  borderRadius: 6,
                  background: theme === 'dark' ? '#23272f' : '#fff',
                  color: theme === 'dark' ? '#eaf4fd' : '#23272f',
                  border: `1.5px solid ${theme === 'dark' ? '#404040' : '#eaeaea'}`,
                  cursor: 'pointer'
                }}
              >
                {t('common.cancel')}
              </button>
              
              <button
                onClick={handleCreateLink}
                style={{
                  padding: '10px 20px',
                  borderRadius: 6,
                  background: '#54ad54',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                {t('common.insert')}
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
} 