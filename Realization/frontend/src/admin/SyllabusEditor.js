import React, { useState, useEffect, useRef } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faTrash, 
  faEdit, 
  faGripVertical, 
  faImage,
  faVideo,
  faFileAlt,
  faSave,
  faTimes,
  faEye,
  faEyeSlash,
  faSync
} from '@fortawesome/free-solid-svg-icons';
// Using HTML5 drag and drop instead of react-beautiful-dnd
import axios from '../utils/axios';
import { toast } from 'react-toastify'; 
import useTheme from '../hooks/useTheme';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';

const SyllabusEditor = () => {
  const { id: courseId } = useParams();
  const history = useHistory();
  const { theme } = useTheme();
  const dark = theme === 'dark';


  
  // State for modules and lessons
  const [modules, setModules] = useState([]);
  const [availableLessons, setAvailableLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // State for modals
  const [showAddModuleModal, setShowAddModuleModal] = useState(false);
  const [showAddLessonModal, setShowAddLessonModal] = useState(false);
  const [showLessonSelector, setShowLessonSelector] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  
  // State for lesson filtering
  const [lessonSearchTerm, setLessonSearchTerm] = useState('');
  const [filteredLessons, setFilteredLessons] = useState([]);
  
  // Form states
  const [newModuleName, setNewModuleName] = useState('');
  const [newLessonName, setNewLessonName] = useState('');
  const [newLessonType, setNewLessonType] = useState('video');
  const [newLessonContent, setNewLessonContent] = useState('');

  useEffect(() => {
    console.log('SyllabusEditor useEffect triggered with courseId:', courseId);
    if (courseId) {
      loadSyllabusData();
    } else {
      console.error('No courseId provided');
    }
  }, [courseId]);



  // Предупреждение при попытке покинуть страницу с несохраненными изменениями
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'У вас есть несохраненные изменения. Вы уверены, что хотите покинуть страницу?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Update filtered lessons when availableLessons or search term changes
  useEffect(() => {
    if (lessonSearchTerm.trim() === '') {
      setFilteredLessons(availableLessons);
    } else {
      const filtered = availableLessons.filter(lesson => 
        (lesson.name || '').toLowerCase().includes(lessonSearchTerm.toLowerCase()) ||
        (lesson.content || '').toLowerCase().includes(lessonSearchTerm.toLowerCase())
      );
      setFilteredLessons(filtered);
    }
  }, [availableLessons, lessonSearchTerm]);

  const loadSyllabusData = async () => {
    console.log('loadSyllabusData called with courseId:', courseId);
    try {
      setLoading(true);
      
      // Validate courseId
      if (!courseId || isNaN(Number(courseId))) {
        toast.error('Invalid course ID');
        return;
      }
      
      const token = localStorage.getItem('jwtToken');
      console.log('JWT Token:', token ? 'Present' : 'Missing');
      
      if (!token) {
        toast.error('Authentication token missing. Please log in again.');
        return;
      }
      
      // Загружаем полный syllabus с модулями и уроками
      let modulesWithLessons = [];
      let allLessons = [];
      
      try {
        const fullSyllabusResponse = await axios.get(`/course/${courseId}/full-syllabus`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('Full syllabus API response:', fullSyllabusResponse);
        const syllabusData = fullSyllabusResponse.data;
        modulesWithLessons = syllabusData.modules || [];
        allLessons = syllabusData.modules?.flatMap(m => m.lessons || []) || [];
        
        console.log('Syllabus data:', syllabusData);
        console.log('Modules from full syllabus:', modulesWithLessons);
        console.log('All lessons from full syllabus:', allLessons);
        console.log('Loaded modules with lessons:', modulesWithLessons);
        console.log('Total modules:', modulesWithLessons.length);
        console.log('Total lessons:', allLessons.length);
        
        // Если full-syllabus не содержит уроков, загружаем их отдельно
        if (allLessons.length === 0) {
          console.log('No lessons in full-syllabus, loading lessons separately...');
          
          // Load lessons from database
          let lessons = [];
          
          try {
            const lessonsResponse = await axios.get(`/course/${courseId}/lessons`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            console.log('Lessons API response:', lessonsResponse);
            lessons = lessonsResponse.data || [];
            console.log('Loaded lessons from /course/:id/lessons:', lessons.length);
            
            // Convert lessons to proper format
            lessons = lessons.map(lesson => ({
              id: lesson.id,
              name: lesson.title || lesson.name || `Lesson ${lesson.id}`,
              title: lesson.title || lesson.name || `Lesson ${lesson.id}`,
              content: lesson.content || '',
              videoLink: lesson.videoUrl || lesson.videoLink || null,
              videoUrl: lesson.videoUrl || lesson.videoLink || null,
              type: 'video',
              steps: lesson.steps || []
            }));
            
            console.log('Converted lessons:', lessons.length);
          } catch (lessonsError) {
            console.warn('Failed to load lessons from /course/:id/lessons:', lessonsError);
            lessons = [];
          }
          
          console.log('Final lessons loaded:', lessons);
          console.log('Lessons count:', lessons.length);
          console.log('Lessons with moduleId:', lessons.filter(l => l.moduleId || l.module_id).length);
          
          // Дополнительная отладочная информация
          if (lessons.length > 0) {
            console.log('Sample lesson structure:', lessons[0]);
            console.log('Lesson IDs:', lessons.map(l => l.id));
            console.log('Lesson names:', lessons.map(l => l.title || l.name));
            console.log('Lesson moduleIds:', lessons.map(l => l.moduleId || l.module_id));
          }
          
          // --- Раскладываем уроки по модулям ---
          if (modulesWithLessons.length === 0 && lessons.length > 0) {
            // Создаем модули автоматически если их нет
            const lessonsPerModule = 3;
            const numberOfModules = Math.ceil(lessons.length / lessonsPerModule);
            
            modulesWithLessons = [];
            for (let i = 0; i < numberOfModules; i++) {
              const moduleLessons = lessons.slice(i * lessonsPerModule, (i + 1) * lessonsPerModule);
              modulesWithLessons.push({
                id: `temp_module_${i + 1}`,
                title: `Module ${i + 1}`,
                description: `Auto-generated module ${i + 1}`,
                order: i + 1,
                lessons: moduleLessons
              });
            }
          } else if (modulesWithLessons.length > 0) {
            // Используем существующие модули и распределяем уроки по moduleId
            const lessonsByModule = {};
            
            // Группируем уроки по moduleId
            lessons.forEach(lesson => {
              const moduleId = lesson.moduleId || lesson.module_id;
              if (moduleId) {
                if (!lessonsByModule[moduleId]) {
                  lessonsByModule[moduleId] = [];
                }
                lessonsByModule[moduleId].push(lesson);
              }
            });
            
            // Распределяем уроки по модулям
            modulesWithLessons = modulesWithLessons.map(module => ({
              ...module,
              lessons: lessonsByModule[module.id] || []
            }));
            
            // Если есть уроки без moduleId, распределяем их по модулям
            const unassignedLessons = lessons.filter(lesson => !lesson.moduleId && !lesson.module_id);
            if (unassignedLessons.length > 0) {
              const lessonsPerModule = Math.ceil(unassignedLessons.length / modulesWithLessons.length);
              unassignedLessons.forEach((lesson, index) => {
                const moduleIndex = Math.floor(index / lessonsPerModule);
                if (modulesWithLessons[moduleIndex]) {
                  modulesWithLessons[moduleIndex].lessons.push(lesson);
                }
              });
            }
          }
          
          allLessons = lessons || [];
        }
      } catch (fullSyllabusError) {
        console.warn('Failed to load full syllabus, trying fallback approach');
        
        // Fallback: загружаем модули и уроки отдельно
        let modules = [];
        try {
          const modulesResponse = await axios.get(`/course/${courseId}/modules`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          console.log('Modules API response:', modulesResponse);
          modules = modulesResponse.data || [];
          console.log('Loaded modules:', modules);
          console.log('Modules count:', modules.length);
        } catch (modulesError) {
          console.warn('Failed to load modules, using empty array');
          modules = [];
        }
        
        // Load lessons from database
        let lessons = [];
        
        try {
          const lessonsResponse = await axios.get(`/course/${courseId}/lessons`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          console.log('Lessons API response:', lessonsResponse);
          lessons = lessonsResponse.data || [];
          console.log('Loaded lessons from /course/:id/lessons:', lessons.length);
          
          // Convert lessons to proper format
          lessons = lessons.map(lesson => ({
            id: lesson.id,
            name: lesson.title || lesson.name || `Lesson ${lesson.id}`,
            title: lesson.title || lesson.name || `Lesson ${lesson.id}`,
            content: lesson.content || '',
            videoLink: lesson.videoUrl || lesson.videoLink || null,
            videoUrl: lesson.videoUrl || lesson.videoLink || null,
            type: 'video',
            steps: lesson.steps || []
          }));
          
          console.log('Converted lessons:', lessons.length);
        } catch (lessonsError) {
          console.warn('Failed to load lessons from /course/:id/lessons:', lessonsError);
          lessons = [];
        }
        
        console.log('Final lessons loaded:', lessons);
        console.log('Lessons count:', lessons.length);
        console.log('Lessons with moduleId:', lessons.filter(l => l.moduleId || l.module_id).length);
        
        // Дополнительная отладочная информация
        if (lessons.length > 0) {
          console.log('Sample lesson structure:', lessons[0]);
          console.log('Lesson IDs:', lessons.map(l => l.id));
          console.log('Lesson names:', lessons.map(l => l.title || l.name));
          console.log('Lesson moduleIds:', lessons.map(l => l.moduleId || l.module_id));
        }
        
        // --- Раскладываем уроки по модулям ---
        if (modules.length === 0 && lessons.length > 0) {
          // Создаем модули автоматически если их нет
          const lessonsPerModule = 3;
          const numberOfModules = Math.ceil(lessons.length / lessonsPerModule);
          
          modulesWithLessons = [];
          for (let i = 0; i < numberOfModules; i++) {
            const moduleLessons = lessons.slice(i * lessonsPerModule, (i + 1) * lessonsPerModule);
            modulesWithLessons.push({
              id: `temp_module_${i + 1}`,
              title: `Module ${i + 1}`,
              description: `Auto-generated module ${i + 1}`,
              order: i + 1,
              lessons: moduleLessons
            });
          }
        } else if (modules.length > 0) {
          // Используем существующие модули и распределяем уроки по moduleId
          const lessonsByModule = {};
          
          // Группируем уроки по moduleId
          lessons.forEach(lesson => {
            const moduleId = lesson.moduleId || lesson.module_id;
            if (moduleId) {
              if (!lessonsByModule[moduleId]) {
                lessonsByModule[moduleId] = [];
              }
              lessonsByModule[moduleId].push(lesson);
            }
          });
          
          // Распределяем уроки по модулям
          modulesWithLessons = modules.map(module => ({
            ...module,
            lessons: lessonsByModule[module.id] || []
          }));
          
          // Если есть уроки без moduleId, распределяем их по модулям
          const unassignedLessons = lessons.filter(lesson => !lesson.moduleId && !lesson.module_id);
          if (unassignedLessons.length > 0) {
            const lessonsPerModule = Math.ceil(unassignedLessons.length / modulesWithLessons.length);
            unassignedLessons.forEach((lesson, index) => {
              const moduleIndex = Math.floor(index / lessonsPerModule);
              if (modulesWithLessons[moduleIndex]) {
                modulesWithLessons[moduleIndex].lessons.push(lesson);
              }
            });
          }
        } else {
          modulesWithLessons = [];
        }
        
        allLessons = lessons || [];
      }
      
      console.log('Final modules with lessons:', modulesWithLessons);
      console.log('Total lessons in modules:', modulesWithLessons.reduce((sum, m) => sum + (m.lessons?.length || 0), 0));
      
      // Дополнительная отладочная информация для модулей
      modulesWithLessons.forEach((module, index) => {
        console.log(`Module ${index + 1} (${module.id}): "${module.title}" - ${module.lessons?.length || 0} lessons`);
        if (module.lessons && module.lessons.length > 0) {
          module.lessons.forEach((lesson, lessonIndex) => {
            console.log(`  Lesson ${lessonIndex + 1}: ${lesson.title || lesson.name} (ID: ${lesson.id})`);
          });
        }
      });
      

      
      setModules(modulesWithLessons);

      // Все уроки -> available (для добавления в модули)
      console.log('All lessons for modal:', allLessons.length);
      setAvailableLessons(allLessons);
      setFilteredLessons(allLessons);
      
      // Сбрасываем флаг несохраненных изменений при загрузке данных
      setHasUnsavedChanges(false);
      

      
    } catch (error) {
      console.error('Error loading syllabus data:', error);
      if (error.response?.status === 401) {
        toast.error('Authentication failed. Please log in again.');
      } else if (error.response?.status === 403) {
        toast.error('Access denied. Admin privileges required.');
      } else if (error.response?.status === 404) {
        toast.error('No lessons found for this course');
      } else if (error.response?.status >= 500) {
        toast.error('Server error. Please try again later.');
      } else if (error.request) {
        toast.error('Network error. Please check your connection.');
      } else {
        toast.error('Failed to load syllabus data');
      }
    } finally {
      setLoading(false);
    }
  };



  const handleAddModule = () => {
    if (!newModuleName.trim()) {
      toast.error('Please enter a module name');
      return;
    }

    // Create a new module locally with temporary ID
    const newModule = {
      id: `temp_${Date.now()}`, // Temporary ID with prefix
      title: newModuleName.trim(),
      description: `Module: ${newModuleName.trim()}`,
      order: modules.length + 1,
      lessons: [] // Initialize with empty lessons array
    };
    
    setModules([...modules, newModule]);
    setNewModuleName('');
    setShowAddModuleModal(false);
    setHasUnsavedChanges(true);
    toast.success('Module added successfully! Don\'t forget to click "Save All" to persist changes.');
  };

  const handleAddExistingLesson = (lesson) => {
    // Add existing lesson to the selected module
    const updatedModules = modules.map(module => {
      if (module.id === selectedModuleId) {
        return {
          ...module,
          lessons: [...(module.lessons || []), {
            id: lesson.id,
            name: lesson.name || 'Untitled Lesson',
            type: 'video', // Default type since backend doesn't provide it
            content: lesson.content || '',
            videoUrl: lesson.videoLink || null // Use videoLink from backend
          }]
        };
      }
      return module;
    });
    
    setModules(updatedModules);
    setShowAddLessonModal(false);
    setHasUnsavedChanges(true);
    toast.success(`Lesson "${lesson.name || 'Untitled Lesson'}" added to module successfully!`);
  };

  const handleAddLesson = () => {
    if (!newLessonName.trim()) {
      toast.error('Please enter a lesson name');
      return;
    }

    // Create a new lesson locally (frontend-only for now)
    const newLesson = {
      id: `temp_${Date.now()}`, // Temporary ID with prefix
      name: newLessonName.trim(),
      type: newLessonType,
      content: newLessonContent,
      module_id: selectedModuleId
    };
    
    // Update modules with new lesson
    const updatedModules = modules.map(module => {
      if (module.id === selectedModuleId) {
        return {
          ...module,
          lessons: [...(module.lessons || []), newLesson]
        };
      }
      return module;
    });
    
    setModules(updatedModules);
    setNewLessonName('');
    setNewLessonType('video');
    setNewLessonContent('');
    setShowAddLessonModal(false);
    setHasUnsavedChanges(true);
    toast.success('Lesson added successfully! Don\'t forget to click "Save All" to persist changes.');
  };

  const saveAllModules = async () => {
    try {
      setSaving(true);
      console.log('Saving all modules:', modules);
      console.log('Course ID:', courseId);
      console.log('Number of modules to save:', modules.length);
      
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        toast.error('Authentication token missing. Please log in again.');
        return;
      }
      
      if (modules.length === 0) {
        toast.info('No modules to save. Create some modules first.');
        return;
      }
      
      // Сохраняем каждый модуль
      for (const module of modules) {
        let moduleId = module.id;
        
        if (module.id && !module.id.toString().startsWith('temp_')) {
          // Для существующих модулей пока просто логируем
          console.log(`Module ${module.id} already exists, skipping module creation`);
        } else {
          // Создаем новый модуль через course endpoint
          const moduleData = {
            name: module.title,
            description: module.description,
            order: module.order
          };
          
          try {
            // Основной: множественное /modules
            const response = await axios.post(`/course/${courseId}/modules`, {
              ...moduleData,
              title: module.title // дублируем на всякий случай
            }, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            moduleId = response.data?.id || response.data?.module?.id;
            console.log(`Created new module:`, response.data);
          } catch (moduleError) {
            console.error(`Error creating module (primary): ${moduleError.message}`);
            // Пробуем альтернативные endpoints
            try {
              const alt1 = await axios.post(`/course/${courseId}/module`, {
                ...moduleData,
                title: module.title
              }, {
                headers: { Authorization: `Bearer ${token}` }
              });
              moduleId = alt1.data?.id || alt1.data?.module?.id;
              console.log(`Created module via /course/:id/module:`, alt1.data);
            } catch (alt1Err) {
              try {
                const alt2 = await axios.post('/module', {
                  ...moduleData,
                  title: module.title,
                  courseId: courseId
                }, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                moduleId = alt2.data?.id || alt2.data?.module?.id;
                console.log(`Created module via /module:`, alt2.data);
              } catch (alt2Err) {
                try {
                  const alt3 = await axios.post('/modules', {
                    ...moduleData,
                    title: module.title,
                    courseId: courseId
                  }, {
                    headers: { Authorization: `Bearer ${token}` }
                  });
                  moduleId = alt3.data?.id || alt3.data?.module?.id;
                  console.log(`Created module via /modules:`, alt3.data);
                } catch (alt3Err) {
                  console.error(`All module endpoints failed`, { moduleError, alt1Err, alt2Err, alt3Err });
                  throw new Error(`Failed to create module: ${module.title}`);
                }
              }
            }
          }
        }
        
        // Сохраняем уроки модуля
        if (module.lessons && module.lessons.length > 0) {
          for (let lessonIndex = 0; lessonIndex < module.lessons.length; lessonIndex++) {
            const lesson = module.lessons[lessonIndex];
            
            if (lesson.id && !lesson.id.toString().startsWith('temp_')) {
              // === Обновляем привязку урока к модулю и порядок ===
              try {
                await axios.put(`/lessons/${lesson.id}`, {
                  moduleId: moduleId,
                  module_id: moduleId, // альтернативный ключ
                  order: lessonIndex + 1,
                }, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                console.log(`Updated lesson ${lesson.id} -> module ${moduleId}`);
              } catch (updErr) {
                console.warn(`Failed to update lesson ${lesson.id}, maybe endpoint unsupported`, updErr.message);
              }

              // Добавляем/обновляем lesson в структуре модуля (course meta)
              try {
                await axios.post(`/course/${courseId}/modules/${moduleId}/lessons`, {
                  name: lesson.name,
                  title: lesson.name,
                  content: lesson.content,
                  videoLink: lesson.videoUrl,
                  order: lessonIndex + 1,
                }, {
                  headers: { Authorization: `Bearer ${token}` },
                });
              } catch (metaErr) {
                console.warn('Meta lesson add failed (maybe duplicate)', metaErr.response?.data?.message || metaErr.message);
              }
            } else {
              // Создаем новый урок
              const lessonData = {
                name: lesson.name,
                content: lesson.content,
                videoLink: lesson.videoUrl || null,
                order: lessonIndex + 1,
                courseId: courseId,
                moduleId: moduleId
              };
              // альтернативные ключи на случай другого формата бекенда
              const altLessonDataA = {
                name: lesson.name,
                content: lesson.content || '',
                videoLink: lesson.videoUrl || '',
                order: lessonIndex + 1,
                course: courseId,
                module: moduleId
              };
              
              try {
                const response = await axios.post(`/course/${courseId}/modules/${moduleId}/lessons`, lessonData, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                
                console.log(`Created new lesson:`, response.data);
              } catch (lessonError) {
                console.error(`Error creating lesson ${lesson.name} (primary):`, lessonError.message);
                
                // Пробуем альтернативные endpoints/форматы
                try {
                  const altResponse1 = await axios.post('/lessons', lessonData, {
                    headers: { Authorization: `Bearer ${token}` }
                  });
                  console.log(`Created lesson via /lessons with moduleId:`, altResponse1.data);
                } catch (err1) {
                  try {
                    const altResponse2 = await axios.post('/lessons', altLessonDataA, {
                      headers: { Authorization: `Bearer ${token}` }
                    });
                    console.log(`Created lesson via /lessons alt format:`, altResponse2.data);
                  } catch (err2) {
                    console.error('All lesson endpoints failed', { lessonError, err1, err2 });
                    throw new Error(`Failed to create lesson: ${lesson.name}`);
                  }
                }
              }

              // Добавляем lesson в meta
              try {
                await axios.post(`/course/${courseId}/modules/${moduleId}/lessons`, {
                  name: lesson.name,
                  title: lesson.name,
                  content: lesson.content,
                  videoLink: lesson.videoUrl,
                  order: lessonIndex + 1,
                }, {
                  headers: { Authorization: `Bearer ${token}` },
                });
              } catch (metaErr) {
                console.warn('Meta lesson add failed', metaErr.response?.data?.message || metaErr.message);
              }
            }
          }
        }
      }
      
      setHasUnsavedChanges(false);
      toast.success('Все модули успешно сохранены!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      
      // Сохраняем структуру локально для последующей загрузки
      try {
        localStorage.setItem(`syllabus:${courseId}`, JSON.stringify(modules));
        console.log('Syllabus structure saved to localStorage');
      } catch (error) {
        console.error('Failed to save to localStorage:', error);
      }
      
      // НЕ перезагружаем данные после сохранения, чтобы не потерять текущее состояние
      // await loadSyllabusData();
      
    } catch (error) {
      console.error('Error saving modules:', error);
      
      // Всегда сохраняем структуру локально как fallback
      try {
        localStorage.setItem(`syllabus:${courseId}`, JSON.stringify(modules));
        console.log('Syllabus structure saved to localStorage as fallback');
      } catch (lsErr) {
        console.error('Failed to save syllabus locally:', lsErr);
      }
      
      // Показываем информативное сообщение об ошибке
      if (error.response?.status === 404) {
        toast.info('Серверные эндпоинты для модулей недоступны (404). Структура курса сохранена локально в браузере.', {
          position: 'top-right', autoClose: 5000
        });
      } else {
        toast.error(`Ошибка при сохранении модулей: ${error.response?.data?.message || error.message}`, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDragStart = (e, lessonId) => {
    e.dataTransfer.setData('text/plain', lessonId.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetModuleId, targetIndex) => {
    e.preventDefault();
    const lessonId = parseInt(e.dataTransfer.getData('text/plain'));
    
    // Find the lesson and its current module
    let sourceModuleId = null;
    let sourceIndex = null;
    let lesson = null;
    
    for (const module of modules) {
      const lessonIndex = (module.lessons || []).findIndex(l => l.id === lessonId);
      if (lessonIndex !== -1) {
        sourceModuleId = module.id;
        sourceIndex = lessonIndex;
        lesson = module.lessons[lessonIndex];
        break;
      }
    }
    
    if (!lesson) return;
    
    // If moving within the same module
    if (sourceModuleId === targetModuleId) {
      const module = modules.find(m => m.id === sourceModuleId);
      if (module) {
        const reorderedLessons = Array.from(module.lessons || []);
        const [removed] = reorderedLessons.splice(sourceIndex, 1);
        reorderedLessons.splice(targetIndex, 0, removed);
        
        const updatedModules = modules.map(m => 
          m.id === sourceModuleId ? { ...m, lessons: reorderedLessons } : m
        );
        
            setModules(updatedModules);
    setHasUnsavedChanges(true);
    
    // Update local state only (frontend-only solution)
    toast.success('Lesson order updated!');
      }
    }
    // If moving between modules
    else {
      const sourceModule = modules.find(m => m.id === sourceModuleId);
      const targetModule = modules.find(m => m.id === targetModuleId);
      
      if (sourceModule && targetModule) {
        const sourceLessons = Array.from(sourceModule.lessons || []);
        const targetLessons = Array.from(targetModule.lessons || []);
        
        const [movedLesson] = sourceLessons.splice(sourceIndex, 1);
        targetLessons.splice(targetIndex, 0, movedLesson);
        
        const updatedModules = modules.map(m => {
          if (m.id === sourceModuleId) {
            return { ...m, lessons: sourceLessons };
          }
          if (m.id === targetModuleId) {
            return { ...m, lessons: targetLessons };
          }
          return m;
        });
        
        setModules(updatedModules);
        setHasUnsavedChanges(true);
        
        // Update local state only (frontend-only solution)
        toast.success('Lesson moved successfully!');
      }
    }
  };

  const handleDeleteModule = (moduleId) => {
    if (!window.confirm('Are you sure you want to delete this module? All lessons will be moved to unassigned.')) {
      return;
    }

    const moduleToDelete = modules.find(m => m.id === moduleId);
    const updatedModules = modules.filter(m => m.id !== moduleId);
    
    // Move lessons to available lessons
    if (moduleToDelete && moduleToDelete.lessons) {
      setAvailableLessons([...availableLessons, ...moduleToDelete.lessons]);
    }
    
    setModules(updatedModules);
    setHasUnsavedChanges(true);
    toast.success('Module deleted successfully!');
  };

  const handleEditLesson = (lesson) => {
    // Перенаправляем на страницу редактирования урока
    history.push(`/teach/lessons/${lesson.id}/content`);
  };

  const handleDeleteLesson = (lessonId) => {
    if (!window.confirm('Are you sure you want to delete this lesson?')) {
      return;
    }

    // Remove from modules
    const updatedModules = modules.map(module => ({
      ...module,
      lessons: (module.lessons || []).filter(lesson => lesson.id !== lessonId)
    }));
    
    setModules(updatedModules);
    setAvailableLessons(availableLessons.filter(lesson => lesson.id !== lessonId));
    setHasUnsavedChanges(true);
    toast.success('Lesson deleted successfully!');
  };

  const getLessonIcon = (type) => {
    switch (type) {
      case 'video':
        return <FontAwesomeIcon icon={faVideo} />;
      case 'text':
        return <FontAwesomeIcon icon={faFileAlt} />;
      case 'image':
        return <FontAwesomeIcon icon={faImage} />;
      default:
        return <FontAwesomeIcon icon={faFileAlt} />;
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: dark ? '#1a1a1a' : '#f8f9fa'
      }}>
        <div style={{ fontSize: '18px', color: dark ? '#eaf4fd' : '#333' }}>
          Loading syllabus editor...
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      background: dark ? '#1a1a1a' : '#f8f9fa',
      color: dark ? '#eaf4fd' : '#333',
      display: 'flex',
      flexDirection: 'column'
    }}>

      <NavBar />
      
      <div style={{ 
        flex: 1,
        display: 'flex',
        padding: '32px',
        maxWidth: '1400px',
        margin: '0 auto',
        width: '100%'
      }}>
        {/* Left Sidebar */}
        <div style={{
          width: '280px',
          background: dark ? '#2d2d2d' : '#fff',
          borderRadius: '12px',
          padding: '24px',
          marginRight: '24px',
          border: `1px solid ${dark ? '#404040' : '#e9ecef'}`,
          height: 'fit-content',
          position: 'sticky',
          top: '32px'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: dark ? '#eaf4fd' : '#333',
            marginBottom: '20px',
            borderBottom: `1px solid ${dark ? '#404040' : '#e9ecef'}`,
            paddingBottom: '12px'
          }}>
            Навигация
          </h3>
          
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{
              fontSize: '14px',
              fontWeight: '500',
              color: dark ? '#666' : '#666',
              marginBottom: '12px'
            }}>
              Модули ({modules.length})
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {modules.map((module, index) => (
                <div
                  key={module.id}
                  style={{
                    padding: '8px 12px',
                    background: dark ? '#1a1a1a' : '#f8f9fa',
                    borderRadius: '6px',
                    fontSize: '14px',
                    color: dark ? '#eaf4fd' : '#333',
                    cursor: 'pointer',
                    border: `1px solid ${dark ? '#404040' : '#e9ecef'}`
                  }}
                  onClick={() => {
                    const element = document.getElementById(`module-${module.id}`);
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                >
                  {index + 1}. {module.title || module.name}
                  <div style={{
                    fontSize: '12px',
                    color: dark ? '#666' : '#999',
                    marginTop: '4px'
                  }}>
                    {module.lessons?.length || 0} уроков
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          
          
          <div>
            <h4 style={{
              fontSize: '14px',
              fontWeight: '500',
              color: dark ? '#666' : '#666',
              marginBottom: '12px'
            }}>
              Статистика
            </h4>
            <div style={{
              fontSize: '12px',
              color: dark ? '#666' : '#999',
              lineHeight: '1.4'
            }}>
              <div>Всего модулей: {modules.length}</div>
              <div>Всего уроков: {modules.reduce((total, module) => total + (module.lessons?.length || 0), 0)}</div>
              <div>Доступно уроков: {availableLessons.length}</div>
              <div>Курс ID: {courseId}</div>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div style={{ flex: 1 }}>
              {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '32px'
        }}>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: '700',
            color: dark ? '#eaf4fd' : '#333'
          }}>
            Syllabus Editor
          </h1>
          <button
            onClick={() => history.goBack()}
            style={{
              padding: '12px 24px',
              background: dark ? '#2d2d2d' : '#fff',
              border: `1px solid ${dark ? '#404040' : '#e9ecef'}`,
              borderRadius: '8px',
              color: dark ? '#eaf4fd' : '#333',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            Back to Course
          </button>
                </div>

        {/* Modules Section */}
        <div style={{
          background: dark ? '#2d2d2d' : '#fff',
          borderRadius: '12px',
          padding: '24px',
          border: `1px solid ${dark ? '#404040' : '#e9ecef'}`
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <h2 style={{ 
              fontSize: '24px', 
              fontWeight: '600',
              color: dark ? '#eaf4fd' : '#333'
            }}>
              Course Modules
            </h2>
            <div style={{ display: 'flex', gap: '12px' }}>
              {modules.length > 0 && (
                <button
                  onClick={saveAllModules}
                  disabled={saving}
                  style={{
                    padding: '12px 20px',
                    background: saving ? '#6c757d' : (hasUnsavedChanges ? '#dc3545' : '#28a745'),
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    opacity: saving ? 0.7 : 1
                  }}
                >
                  <FontAwesomeIcon icon={faSave} />
                  {saving ? 'Saving...' : (hasUnsavedChanges ? 'Save All*' : 'Save All')}
                </button>
              )}
              <button
                onClick={() => setShowAddModuleModal(true)}
                style={{
                  padding: '12px 20px',
                  background: '#4485ed',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <FontAwesomeIcon icon={faPlus} />
                Add Module
              </button>
            </div>
          </div>

          {modules.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: dark ? '#666' : '#999',
              fontSize: '16px'
            }}>
              <div style={{ marginBottom: '16px' }}>
                No modules yet for course ID: {courseId}
              </div>
              <div style={{ fontSize: '14px', color: dark ? '#777' : '#aaa' }}>
                Create your first module to start organizing lessons from this course.
              </div>
              <div style={{ marginTop: '16px', fontSize: '14px', color: dark ? '#777' : '#aaa' }}>
                Available lessons: {availableLessons.length}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {modules.map((module, moduleIndex) => (
                <div
                  key={module.id}
                    id={`module-${module.id}`}
                  style={{
                    border: `1px solid ${dark ? '#404040' : '#e9ecef'}`,
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}
                >
                  {/* Module Header */}
                  <div style={{
                    background: dark ? '#404040' : '#f8f9fa',
                    padding: '16px 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: dark ? '#eaf4fd' : '#333',
                      margin: 0
                    }}>
                      Module {moduleIndex + 1}: {module.title}
                    </h3>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => {
                          setSelectedModuleId(module.id);
                          setShowAddLessonModal(true);
                        }}
                        style={{
                          padding: '6px 12px',
                          background: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '14px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <FontAwesomeIcon icon={faPlus} />
                        Add Existing Lesson
                      </button>
                      <button
                        onClick={() => handleDeleteModule(module.id)}
                        style={{
                          padding: '6px 12px',
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '14px',
                          cursor: 'pointer'
                        }}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>

                  {/* Lessons List */}
                  <div
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, module.id, (module.lessons || []).length)}
                    style={{
                      padding: '16px',
                      minHeight: '60px',
                      transition: 'background-color 0.2s ease'
                    }}
                  >
                    {(module.lessons || []).length === 0 ? (
                      <div style={{
                        textAlign: 'center',
                        padding: '20px',
                        color: dark ? '#666' : '#999',
                        fontSize: '14px',
                        border: `2px dashed ${dark ? '#404040' : '#e9ecef'}`,
                        borderRadius: '6px',
                        background: dark ? '#1a1a1a' : '#f8f9fa'
                      }}>
                        Drop lessons here or add new ones!
                </div>
                    ) : (
                      (module.lessons || []).map((lesson, lessonIndex) => (
                        <div
                          key={lesson.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, lesson.id)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, module.id, lessonIndex)}
                          style={{
                              padding: '12px',
                              marginBottom: '8px',
                              background: dark ? '#1a1a1a' : '#fff',
                            border: `1px solid ${dark ? '#404040' : '#e9ecef'}`,
                            borderRadius: '6px',
                  display: 'flex', 
                              justifyContent: 'space-between',
                  alignItems: 'center', 
                              cursor: 'grab'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <FontAwesomeIcon 
                                icon={faGripVertical} 
                            style={{
                              color: dark ? '#666' : '#999',
                                  cursor: 'grab'
                                }} 
                              />
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {getLessonIcon(lesson.type)}
                                <span style={{
                              fontSize: '16px',
                              fontWeight: '500',
                              color: dark ? '#eaf4fd' : '#333'
                            }}>
                                  {lesson.name || 'Untitled Lesson'}
                                </span>
                            </div>
                </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={() => handleEditLesson(lesson)}
                                style={{
                                  padding: '4px 8px',
                                  background: '#4485ed',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  cursor: 'pointer'
                                }}
                              >
                                <FontAwesomeIcon icon={faEdit} />
                              </button>
                <button
                            onClick={() => handleDeleteLesson(lesson.id)}
                            style={{
                              padding: '4px 8px',
                                  background: '#dc3545',
                                  color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                                  fontSize: '12px',
                                  cursor: 'pointer'
                            }}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                            </div>
                        </div>
                      ))
                    )}
              </div>
              </div>
              ))}
            </div>
          )}
          </div>
        </div>
        </div>

        {/* Add Module Modal */}
        {showAddModuleModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: dark ? '#2d2d2d' : '#fff',
              borderRadius: '12px',
              padding: '24px',
              width: '400px',
            maxWidth: '90vw',
            border: `1px solid ${dark ? '#404040' : '#e9ecef'}`
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
              color: dark ? '#eaf4fd' : '#333',
              marginBottom: '20px'
              }}>
                Add New Module
              </h3>
              
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: dark ? '#eaf4fd' : '#333'
              }}>
                Module Name
              </label>
              <input
                type="text"
                value={newModuleName}
                onChange={(e) => setNewModuleName(e.target.value)}
                placeholder="Enter module name"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${dark ? '#404040' : '#e9ecef'}`,
                  background: dark ? '#1a1a1a' : '#fff',
                  color: dark ? '#eaf4fd' : '#333',
                  fontSize: '14px'
                }}
              />
            </div>
              
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowAddModuleModal(false)}
                  style={{
                    padding: '10px 20px',
                    background: 'transparent',
                    border: `1px solid ${dark ? '#404040' : '#e9ecef'}`,
                    borderRadius: '6px',
                    color: dark ? '#eaf4fd' : '#333',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
            <button
                  onClick={handleAddModule}
                disabled={!newModuleName.trim()}
                  style={{
                    padding: '10px 20px',
                  background: newModuleName.trim() ? '#28a745' : '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                  cursor: newModuleName.trim() ? 'pointer' : 'not-allowed',
                  opacity: newModuleName.trim() ? 1 : 0.7
                  }}
                >
                  Add Module
            </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Lesson Modal */}
        {showAddLessonModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: dark ? '#2d2d2d' : '#fff',
              borderRadius: '12px',
              padding: '24px',
              width: '600px',
              maxWidth: '90vw',
              maxHeight: '80vh',
            overflow: 'auto',
            border: `1px solid ${dark ? '#404040' : '#e9ecef'}`
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
              color: dark ? '#eaf4fd' : '#333',
              marginBottom: '20px'
            }}>
              Add Lesson to Module
              </h3>
              
              <div style={{ marginBottom: '20px' }}>
                <p style={{
                  color: dark ? '#b6d4fe' : '#666',
                  fontSize: '14px',
                  marginBottom: '16px'
                }}>
                  Choose from existing lessons in this course (ID: {courseId}):
                </p>

                
                {/* Search filter */}
                <div style={{ marginBottom: '16px', position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Search lessons..."
                    value={lessonSearchTerm}
                    onChange={(e) => {
                      setLessonSearchTerm(e.target.value);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      paddingRight: lessonSearchTerm ? '40px' : '12px',
                      borderRadius: '6px',
                      border: `1px solid ${dark ? '#404040' : '#e9ecef'}`,
                      background: dark ? '#2d2d2d' : '#fff',
                      color: dark ? '#eaf4fd' : '#333',
                      fontSize: '14px'
                    }}
                  />
                  {lessonSearchTerm && (
                    <button
                      onClick={() => setLessonSearchTerm('')}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: dark ? '#666' : '#999',
                        cursor: 'pointer',
                        fontSize: '16px',
                        padding: '4px'
                      }}
                      title="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>
                
                {filteredLessons.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '20px',
                    color: dark ? '#666' : '#999',
                    fontSize: '14px',
                    border: `1px dashed ${dark ? '#404040' : '#e9ecef'}`,
                    borderRadius: '6px',
                    background: dark ? '#1a1a1a' : '#f8f9fa'
                  }}>
                    {lessonSearchTerm.trim() === '' ? (
                      `No lessons found for course ID: ${courseId}. Create lessons first in the course management section.`
                    ) : (
                      `No lessons match "${lessonSearchTerm}". Try a different search term.`
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {filteredLessons.map((lesson) => {
                      // Check if lesson is already in any module
                      const isAlreadyInModule = modules.some(module => 
                        module.lessons && module.lessons.some(l => l.id === lesson.id)
                      );
                      
                      console.log(`Lesson ${lesson.id} (${lesson.name}) - already in module:`, isAlreadyInModule);
                      
                      return (
                        <div
                          key={lesson.id}
                          style={{
                            padding: '12px',
                            border: `1px solid ${dark ? '#404040' : '#e9ecef'}`,
                            borderRadius: '6px',
                            background: dark ? '#2d2d2d' : '#fff',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            opacity: isAlreadyInModule ? 0.5 : 1
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontSize: '16px',
                              fontWeight: '500',
                              color: dark ? '#eaf4fd' : '#333',
                              marginBottom: '4px'
                            }}>
                              {lesson.name || 'Untitled Lesson'}
                            </div>
                            <div style={{
                              fontSize: '14px',
                              color: dark ? '#666' : '#999'
                            }}>
                              video • {lesson.content ? lesson.content.substring(0, 50) + '...' : 'No content'}
                              {lesson.videoLink && (
                                <span style={{ marginLeft: '8px', color: dark ? '#28a745' : '#28a745' }}>
                                  • Has video
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {!isAlreadyInModule ? (
                            <button
                              onClick={() => handleAddExistingLesson(lesson)}
                              style={{
                                padding: '8px 16px',
                                background: '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '14px'
                              }}
                            >
                              Add to Module
                            </button>
                          ) : (
                            <span style={{
                              color: dark ? '#666' : '#999',
                              fontSize: '14px',
                              fontStyle: 'italic'
                            }}>
                              Already added
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowAddLessonModal(false)}
                  style={{
                    padding: '10px 20px',
                    background: 'transparent',
                    border: `1px solid ${dark ? '#404040' : '#e9ecef'}`,
                    borderRadius: '6px',
                    color: dark ? '#eaf4fd' : '#333',
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      <Footer />
    </div>
  );
};

export default SyllabusEditor; 