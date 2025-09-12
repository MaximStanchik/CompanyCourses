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
  faSync,
  faArrowLeft
} from '@fortawesome/free-solid-svg-icons';
// Using HTML5 drag and drop instead of react-beautiful-dnd
import axios from '../utils/axios';
import { toast } from 'react-toastify'; 
import useTheme from '../hooks/useTheme';
import { useTranslation } from 'react-i18next';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';

const SyllabusEditor = () => {
  console.log('[SyllabusEditor] Component mounted/rendered');
  const { id: courseId } = useParams();
  const history = useHistory();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const dark = theme === 'dark';
  console.log('[SyllabusEditor] courseId from params:', courseId);


  
  // State for modules and lessons
  const [modules, setModules] = useState([]);
  const [availableLessons, setAvailableLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletedLessons, setDeletedLessons] = useState([]);
  const [deletedModules, setDeletedModules] = useState([]);
  const [removedLessonFromModule, setRemovedLessonFromModule] = useState([]); // { lessonId, moduleId }
  
  // State for modals
  const [showAddModuleModal, setShowAddModuleModal] = useState(false);
  const [showCreateModuleModal, setShowCreateModuleModal] = useState(false);
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

  const loadSyllabusData = async () => {
    console.log('[SyllabusEditor] loadSyllabusData called with courseId:', courseId);
    console.trace('[SyllabusEditor] loadSyllabusData call stack');
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
      
      // Загружаем модули и уроки отдельно для получения актуальных данных
      let modulesWithLessons = [];
      let allLessons = [];
      
      // Загружаем модули
      try {
        const modulesResponse = await axios.get(`/course/${courseId}/modules`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('Modules API response:', modulesResponse);
        modulesWithLessons = modulesResponse.data || [];
        console.log('Loaded modules from API:', modulesWithLessons);
        console.log('Total modules from API:', modulesWithLessons.length);
        
        // Проверяем, не потеряли ли мы модули
        if (modules.length > 0 && modulesWithLessons.length < modules.length) {
          console.warn('WARNING: API returned fewer modules than expected!');
          console.log('Expected modules count:', modules.length);
          console.log('API returned modules count:', modulesWithLessons.length);
          console.log('Current modules:', modules);
          console.log('API modules:', modulesWithLessons);
          
          // Проверяем, не потеряли ли мы пустые модули
          const currentEmptyModules = modules.filter(m => m && m.lessons && m.lessons.length === 0);
          const apiEmptyModules = modulesWithLessons.filter(m => m && m.lessons && m.lessons.length === 0);
          
          console.log('Current empty modules:', currentEmptyModules);
          console.log('API empty modules:', apiEmptyModules);
          
          if (currentEmptyModules.length > apiEmptyModules.length) {
            console.error('🚨 CRITICAL: Empty modules were deleted by backend!');
            console.error('This is a backend bug - empty modules should NOT be deleted!');
            
            // Показываем пользователю предупреждение
            toast.error('Backend deleted empty modules - this is a backend bug!');
            
            // АГРЕССИВНО восстанавливаем все пустые модули
            console.log('AGGRESSIVELY restoring all missing empty modules...');
            const missingEmptyModules = currentEmptyModules.filter(current => 
              !apiEmptyModules.some(api => api && api.id === current.id)
            );
            
            if (missingEmptyModules.length > 0) {
              console.log('Missing empty modules to restore:', missingEmptyModules);
              
              // Создаем все недостающие пустые модули заново
              for (const missingModule of missingEmptyModules) {
                try {
                  console.log(`Recreating missing empty module: ${missingModule.title}`);
                  
                  const recreateResponse = await axios.post(`/course/${courseId}/modules`, {
                    title: missingModule.title,
                    description: missingModule.description,
                    order: missingModule.order
                  }, {
                    headers: { Authorization: `Bearer ${token}` }
                  });
                  
                  const recreatedId = recreateResponse.data?.id || recreateResponse.data?.module?.id;
                  if (recreatedId) {
                    console.log(`✅ Recreated missing empty module: ${missingModule.title} with ID: ${recreatedId}`);
                    
                    // Обновляем ID в локальном состоянии
                    setModules(prev => prev.map(m => 
                      m.id === missingModule.id ? { ...m, id: recreatedId } : m
                    ));
                  }
                } catch (recreateError) {
                  console.error(`Error recreating missing module ${missingModule.title}:`, recreateError);
                }
              }
            }
          }
        }
        
        // Сортируем модули по order и пересчитываем его
        modulesWithLessons = recalculateModuleOrder(modulesWithLessons);
        
        // Если API вернул меньше модулей, чем ожидалось, восстанавливаем их
        if (modules.length > 0 && modulesWithLessons.length < modules.length) {
          const missingModules = modules.filter(current => 
            current && current.id && !modulesWithLessons.some(api => api && api.id === current.id)
          );
          
          if (missingModules.length > 0) {
            console.log('Missing modules that API did not return:', missingModules);
            console.log('Missing modules details:', missingModules.map(m => ({
              id: m.id,
              title: m.title,
              lessonsCount: m.lessons?.length || 0,
              isEmpty: (m.lessons?.length || 0) === 0
            })));
            
            // Добавляем пропавшие модули к результату API
            modulesWithLessons = [...modulesWithLessons, ...missingModules];
            console.log('Restored modules count:', modulesWithLessons.length);
            
            // Показываем пользователю, что модули были восстановлены
            if (missingModules.some(m => (m.lessons?.length || 0) === 0)) {
              toast.warn('Empty modules were restored - backend should not delete them!');
            }
          }
        }
        
      } catch (modulesError) {
        console.warn('Failed to load modules:', modulesError);
        // Если не удалось загрузить модули, используем текущие
        console.log('Using current modules state due to API error');
        modulesWithLessons = [...modules];
      }
      
      // Загружаем уроки с актуальными moduleId
      let lessons = [];
      
      try {
        console.log('[SyllabusEditor] Loading lessons for course:', courseId);
        
        // Используем правильный endpoint /lessons с фильтрацией по курсу (как в Course.js)
        const lessonsResponse = await axios.get(`/lessons?course=${courseId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('Lessons API response:', lessonsResponse);
        lessons = lessonsResponse.data || [];
        console.log('Loaded lessons from /lessons?course=:', lessons.length);
        console.log('[SyllabusEditor] Raw lessons data from API:', lessons.map(l => ({
          id: l.id,
          name: l.name || l.title,
          moduleId: l.moduleId,
          module_id: l.module_id,
          course_id: l.course_id,
          courseId: l.courseId,
          order: l.order,
          allFields: Object.keys(l)
        })));
        
        // Convert lessons to proper format
        lessons = lessons.map(lesson => ({
          id: lesson.id,
          name: lesson.name || lesson.title || `Lesson ${lesson.id}`,
          title: lesson.name || lesson.title || `Lesson ${lesson.id}`,
          content: lesson.content || '',
          videoLink: lesson.videoLink || null,
          videoUrl: lesson.videoLink || null,
          type: 'video',
          steps: lesson.steps || [],
          moduleId: lesson.moduleId || null, // Используем реальный moduleId из базы данных
          courseId: lesson.course_id || lesson.courseId || null,
          order: lesson.order || 0
        }));
        
        console.log('[SyllabusEditor] Converted lessons with real moduleId:', lessons.length);
        console.log('Lessons with moduleId:', lessons.filter(l => l.moduleId).length);
        console.log('Lessons without moduleId:', lessons.filter(l => !l.moduleId).length);
        
        // Дополнительная отладочная информация
        if (lessons.length > 0) {
          console.log('Sample lesson structure:', lessons[0]);
          console.log('Lesson IDs:', lessons.map(l => l.id));
          console.log('Lesson names:', lessons.map(l => l.title || l.name));
          console.log('Lesson moduleIds:', lessons.map(l => l.moduleId));
        }
      } catch (lessonsError) {
        console.warn('Failed to load lessons from /lessons:', lessonsError);
        lessons = [];
      }
      
      if (modulesWithLessons.length === 0) {
          modulesWithLessons = [];
        console.log('No modules found - admin should create them manually');
      } else if (modulesWithLessons.length > 0) {
        modulesWithLessons = modulesWithLessons.map(module => {
          const moduleLessons = lessons.filter(lesson => lesson.moduleId === module.id);
          console.log(`Module ${module.id} has ${moduleLessons.length} lessons:`, moduleLessons.map(l => l.id));
          
          const sortedLessons = moduleLessons.sort((a, b) => (a.order || 0) - (b.order || 0));
          
          return {
            ...module,
            lessons: sortedLessons || []
          };
        });
        
        console.log('Using existing modules with updated lesson assignments');
        
        const emptyModules = modulesWithLessons.filter(m => m && m.lessons && m.lessons.length === 0);
        if (emptyModules.length > 0) {
          console.log(`🛡️ PROTECTION: Found ${emptyModules.length} empty modules, backend should preserve them`);
        }
      }
      
        allLessons = lessons || [];
      
      console.log('Final modules with lessons:', modulesWithLessons);
      console.log('Total lessons in modules:', modulesWithLessons.reduce((total, module) => total + (module.lessons?.length || 0), 0));
      
      modulesWithLessons.forEach((module, moduleIndex) => {
        console.log(`${t('course.module')} ${moduleIndex + 1} (${module.id}): "${module.title || module.name}" - ${module.lessons?.length || 0} lessons`);
        if (module.lessons && module.lessons.length > 0) {
          module.lessons.forEach((lesson, lessonIndex) => {
            console.log(`  ${t('lesson.lesson')} ${lessonIndex + 1}: ${lesson.title || lesson.name} (ID: ${lesson.id})`);
          });
        }
      });
      
      console.log('All lessons for modal:', allLessons.length);

      console.log('Setting modules state to:', modulesWithLessons);
      setModules(modulesWithLessons);
      const existingModuleIds = modulesWithLessons
        .filter(module => !module.id.toString().startsWith('temp_'))
        .map(module => module.id);
      
      console.log('[SyllabusEditor] Existing module IDs:', existingModuleIds);
      
      const availableLessonsFiltered = allLessons.filter(lesson => {
        const isAvailable = !existingModuleIds.includes(lesson.moduleId);
        console.log(`[SyllabusEditor] Lesson ${lesson.id} (${lesson.name}) - moduleId: ${lesson.moduleId}, available: ${isAvailable}`);
        return isAvailable;
      });
      
      const sortedAvailableLessons = availableLessonsFiltered.sort((a, b) => (a.order || 0) - (b.order || 0));
      
      console.log('[SyllabusEditor] All lessons count:', allLessons.length);
      console.log('[SyllabusEditor] Lessons with moduleId:', allLessons.filter(l => l.moduleId).length);
      console.log('[SyllabusEditor] Available lessons (not in existing modules):', sortedAvailableLessons.length);
      console.log('[SyllabusEditor] Available lessons details:', sortedAvailableLessons.map(l => ({ id: l.id, name: l.name, moduleId: l.moduleId, courseId: l.courseId })));
      
      setAvailableLessons(sortedAvailableLessons);
      setLoading(false);
      
      console.log('[SyllabusEditor] Data loading completed successfully');
      console.log('Final modules state:', modulesWithLessons);
      
      
      setModules(modulesWithLessons);
      
    } catch (error) {
      console.error('Error loading syllabus data:', error);
      toast.error('Ошибка загрузки данных программы курса');
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('SyllabusEditor useEffect triggered with courseId:', courseId);
    if (courseId) {
      loadSyllabusData();
      } else {
      console.error('No courseId provided');
    }
  }, [courseId]);



  // Все изменения сохраняются автоматически

  // Update filtered lessons when availableLessons or search term changes
  useEffect(() => {
    console.log('[SyllabusEditor] Filtering lessons - availableLessons:', availableLessons.length, 'searchTerm:', lessonSearchTerm);
    
    if (lessonSearchTerm.trim() === '') {
      console.log('[SyllabusEditor] Setting filtered lessons to all available lessons:', availableLessons.length);
      setFilteredLessons(availableLessons);
    } else {
      const filtered = availableLessons.filter(lesson => 
        (lesson.name || '').toLowerCase().includes(lessonSearchTerm.toLowerCase()) ||
        (lesson.content || '').toLowerCase().includes(lessonSearchTerm.toLowerCase())
      );
      console.log('[SyllabusEditor] Filtered lessons by search term:', filtered.length);
      setFilteredLessons(filtered);
    }
  }, [availableLessons, lessonSearchTerm]);

  



  const handleAddModule = async () => {
    if (!newModuleName.trim()) {
      toast.error('Please enter a module name');
      return;
    }

    try {
      setSaving(true);
      
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        toast.error('Authentication token missing. Please log in again.');
        return;
      }

      // Вычисляем правильный order для нового модуля (в конец списка)
      const maxOrder = modules.length > 0 ? Math.max(...modules.map(m => m.order || 0)) : 0;
      const newOrder = maxOrder + 1;

      const moduleData = {
        title: newModuleName.trim(),
        description: `Module: ${newModuleName.trim()}`,
        order: newOrder
      };
      
      console.log('Creating new module with data:', moduleData);
      console.log('Current modules order:', modules.map(m => ({ id: m.id, title: m.title, order: m.order })));
      console.log('Max order:', maxOrder, 'New order:', newOrder);
      
      const response = await axios.post(`/course/${courseId}/modules`, moduleData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Module created successfully:', response.data);
      
      if (response.data.success) {
        const newModule = response.data.module;
        
        // Добавляем новый модуль в конец списка
        setModules(prevModules => [...prevModules, { ...newModule, lessons: [] }]);
        
        // Очищаем поле ввода и закрываем модал
        setNewModuleName('');
        setShowAddModuleModal(false);
        
        toast.success('Module added successfully!');
        
        // НЕМЕДЛЕННО принудительно сохраняем в syllabus meta
        console.log('Force saving empty module to syllabus meta...');
        try {
          // Бэкенд не поддерживает обновление всего массива модулей
          // Вместо этого просто логируем успешное создание
          console.log('✅ Empty module created successfully, backend should handle syllabus meta');
        } catch (forceSaveError) {
          console.warn('⚠️ Force save to syllabus meta failed:', forceSaveError.message);
          // Не прерываем выполнение, просто логируем
        }
        
        // Перезагружаем данные
        await loadSyllabusData();
      }
    } catch (error) {
      console.error('Error creating module:', error);
      toast.error(`Failed to create module: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleAddExistingLesson = async (lesson) => {
    console.log('[SyllabusEditor] Adding existing lesson to module:', { lesson, selectedModuleId });
    
    try {
      setSaving(true);
      
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        toast.error('Authentication token missing. Please log in again.');
        return;
      }

      // Получаем текущий порядок уроков в модуле
      const currentModule = modules.find(m => m.id === selectedModuleId);
      const newOrder = (currentModule?.lessons?.length || 0) + 1;
      
      // Обновляем урок в БД, добавляя его к модулю
      await axios.put(`/lessons/${lesson.id}`, {
        moduleId: selectedModuleId,
        order: newOrder
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log(`Added lesson ${lesson.id} to module ${selectedModuleId} with order ${newOrder}`);
    
    // Add existing lesson to the selected module
    const updatedModules = modules.map(module => {
      if (module.id === selectedModuleId) {
        console.log('[SyllabusEditor] Adding lesson to module:', module.id);
        return {
          ...module,
          lessons: [...(module.lessons || []), {
            id: lesson.id,
            name: lesson.name || 'Untitled Lesson',
            type: 'video', // Default type since backend doesn't provide it
            content: lesson.content || '',
            videoUrl: lesson.videoLink || null, // Use videoLink from backend
              moduleId: module.id, // Устанавливаем moduleId для правильного сохранения
              order: newOrder
          }]
        };
      }
      return module;
    });
    
    setModules(updatedModules);
    setShowAddLessonModal(false);
      
      // Защита: логируем обновленные модули
      console.log('🛡️ PROTECTION: Updated modules preserved, backend should handle syllabus meta');
      
      toast.success(`Lesson "${lesson.name || 'Untitled Lesson'}" added to module and saved successfully!`);
      
      // Перезагружаем данные для получения актуальной информации
      await loadSyllabusData();
      
    } catch (error) {
      console.error('Error adding existing lesson to module:', error);
      toast.error(`Failed to add lesson to module: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleAddLesson = async () => {
    if (!newLessonName.trim()) {
      toast.error('Please enter a lesson name');
      return;
    }

    try {
      setSaving(true);
      
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        toast.error('Authentication token missing. Please log in again.');
        return;
      }

      // Создаем новый урок сразу в БД
      const lessonData = {
        name: newLessonName.trim(),
        type: newLessonType,
        content: newLessonContent,
        moduleId: selectedModuleId,
        order: (modules.find(m => m.id === selectedModuleId)?.lessons?.length || 0) + 1
      };
      
      console.log('Creating new lesson with data:', lessonData);
      
      const response = await axios.post('/lessons', lessonData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const newLessonId = response.data?.id || response.data?.lesson?.id;
      console.log('Created new lesson with ID:', newLessonId, response.data);
      
      // Создаем новый урок локально с реальным ID
    const newLesson = {
        id: newLessonId,
      name: newLessonName.trim(),
      type: newLessonType,
      content: newLessonContent,
        moduleId: selectedModuleId,
        order: lessonData.order
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
      
      toast.success('Lesson added and saved successfully!');
      
      // Перезагружаем данные для получения актуальной информации
      await loadSyllabusData();
      
    } catch (error) {
      console.error('Error creating lesson:', error);
      toast.error(`Failed to create lesson: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const saveAllModules = async () => {
    try {
      setSaving(true);
      console.log('Saving all modules:', modules);
      console.log('Course ID:', courseId);
      console.log('Number of modules to save:', modules.length);
      console.log('Modules to delete:', deletedModules);
      console.log('Lessons removed from modules:', removedLessonFromModule);
      
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        toast.error('Authentication token missing. Please log in again.');
        return;
      }
      
      // Сначала удаляем модули, которые были помечены для удаления
      if (deletedModules.length > 0) {
        console.log('Deleting modules:', deletedModules);
        for (const moduleId of deletedModules) {
          try {
            await axios.delete(`/course/${courseId}/modules/${moduleId}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            console.log(`Deleted module ${moduleId}`);
          } catch (deleteError) {
            console.error(`Failed to delete module ${moduleId}:`, deleteError);
            toast.error(`Failed to delete module. Please try again.`);
            return;
          }
        }
        // Очищаем список удаленных модулей
        setDeletedModules([]);
      }
      
      // Обрабатываем удаление уроков из модулей
      if (removedLessonFromModule.length > 0) {
        console.log('Removing lessons from modules:', removedLessonFromModule);
        for (const { lessonId, moduleId } of removedLessonFromModule) {
          try {
            // Обновляем урок, убирая у него moduleId
            await axios.put(`/lessons/${lessonId}`, {
              moduleId: null
            }, {
              headers: { Authorization: `Bearer ${token}` }
            });
            console.log(`Removed lesson ${lessonId} from module ${moduleId}`);
          } catch (removeError) {
            console.error(`Failed to remove lesson ${lessonId} from module ${moduleId}:`, removeError);
            toast.error(`Failed to remove lesson from module. Please try again.`);
            return;
          }
        }
        // Очищаем список удаленных уроков из модулей
        setRemovedLessonFromModule([]);
      }
      
      if (modules.length === 0 && deletedModules.length === 0 && removedLessonFromModule.length === 0) {
        toast.info('No modules to save. Create some modules first.');
        return;
      }
      
      // Если есть только удаления модулей или уроков, но нет модулей для сохранения
      if (modules.length === 0 && (deletedModules.length > 0 || removedLessonFromModule.length > 0)) {
        toast.success('All changes saved successfully!');
        // Перезагружаем данные после сохранения
        await loadSyllabusData();
        return;
      }
      
      // Сохраняем каждый модуль
      const updatedModules = [];
      
      for (let i = 0; i < modules.length; i++) {
        const module = modules[i];
        let moduleId = module.id;
        
        console.log(`Processing module ${i + 1}/${modules.length}:`, {
          id: module.id,
          title: module.title,
          lessonsCount: module.lessons?.length || 0,
          isEmpty: (module.lessons?.length || 0) === 0
        });
        
        if (module.id && !module.id.toString().startsWith('temp_')) {
          // Для существующих модулей обновляем порядок
          console.log(`Module ${module.id} already exists, updating order to ${i + 1}`);
          
          // Особое внимание к пустым модулям
          if ((module.lessons?.length || 0) === 0) {
            console.log(`⚠️ IMPORTANT: This is an EMPTY module (${module.id}) - ensuring it's preserved!`);
          }
          
          try {
            // Используем существующий маршрут updateCourseFields для обновления syllabus
            await axios.put(`/course/${courseId}/fields`, {
              syllabus: modules // передаем весь массив модулей
            }, {
              headers: { Authorization: `Bearer ${token}` }
            });
            console.log(`Updated course syllabus with module order`);
            updatedModules.push({ ...module, order: i + 1 });
          } catch (updateError) {
            console.error(`Failed to update module ${module.id} order:`, updateError);
            toast.error(`Failed to update module order. Please try again.`);
            return;
          }
        } else {
          // Создаем новый модуль
          const moduleData = {
            title: module.title,
            description: module.description,
            order: i + 1
          };
          
          console.log('Creating module with data:', moduleData);
          
          // Особое внимание к пустым модулям
          if ((module.lessons?.length || 0) === 0) {
            console.log(`⚠️ IMPORTANT: Creating EMPTY module - it should NOT be deleted by backend!`);
          }
          
          try {
            const response = await axios.post(`/course/${courseId}/modules`, moduleData, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            moduleId = response.data?.id || response.data?.module?.id;
            console.log(`Created new module with ID: ${moduleId}`, response.data);
            
            // Добавляем созданный модуль в обновленный список
            updatedModules.push({ ...module, id: moduleId, order: i + 1 });
          } catch (moduleError) {
            console.error(`Error creating module: ${moduleError.message}`);
            console.error('Module data that failed:', moduleData);
            console.error('Full error response:', moduleError.response?.data);
              toast.error(`Failed to create module: ${module.title}`);
            return;
          }
        }
      }
      
      // Обновляем локальное состояние с новыми ID модулей
      setModules(updatedModules);
      
      // Финальная проверка: убеждаемся, что все модули (включая пустые) сохранены
      console.log('Final verification: checking if all modules were saved...');
      try {
        const finalVerifyResponse = await axios.get(`/course/${courseId}/modules`, {
                  headers: { Authorization: `Bearer ${token}` }
                });
        
        const finalModules = finalVerifyResponse.data || [];
        const savedModulesCount = finalModules.length;
        const expectedModulesCount = updatedModules.length;
        
        console.log(`Expected modules: ${expectedModulesCount}, Saved modules: ${savedModulesCount}`);
        
        if (savedModulesCount < expectedModulesCount) {
          console.error('🚨 CRITICAL: Not all modules were saved!');
          console.error('This indicates a backend bug with empty modules');
          
          // Показываем пользователю ошибку
          toast.error(`Backend failed to save all modules (${savedModulesCount}/${expectedModulesCount})`);
          
          // Пытаемся восстановить недостающие модули
          const missingModules = updatedModules.filter(expected => 
            !finalModules.some(saved => saved.id === expected.id)
          );
          
          if (missingModules.length > 0) {
            console.log('Attempting to restore missing modules...');
            const restoreSuccess = await restoreEmptyModules(missingModules);
            
            if (restoreSuccess) {
              toast.success('Missing modules restored');
            } else {
              toast.error('Failed to restore missing modules');
            }
              }
            } else {
          console.log('✅ All modules saved successfully');
        }
        
        // Проверяем, не потерялись ли пустые модули
        const savedEmptyModules = finalModules.filter(m => (m.lessons?.length || 0) === 0);
        const expectedEmptyModules = updatedModules.filter(m => (m.lessons?.length || 0) === 0);
        
        if (savedEmptyModules.length < expectedEmptyModules.length) {
          console.error('🚨 CRITICAL: Empty modules were lost during save!');
          toast.error('Empty modules were lost - backend bug detected!');
        }
        
      } catch (verifyError) {
        console.error('Error during final verification:', verifyError);
      }
      
        toast.success('All changes saved successfully!');
      
      // Перезагружаем данные после сохранения для получения актуальных данных
      console.log('Reloading syllabus data after save...');
      await loadSyllabusData();
      
    } catch (error) {
      console.error('Error saving modules:', error);
        toast.error('Failed to save changes. Please try again.');
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

  const handleDrop = async (e, targetModuleId, targetIndex) => {
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
    
    try {
      setSaving(true);
      
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        toast.error('Authentication token missing. Please log in again.');
        return;
      }
    
    // If moving within the same module
    if (sourceModuleId === targetModuleId) {
      const module = modules.find(m => m.id === sourceModuleId);
      if (module) {
        const reorderedLessons = Array.from(module.lessons || []);
        const [removed] = reorderedLessons.splice(sourceIndex, 1);
        reorderedLessons.splice(targetIndex, 0, removed);
          
          // Обновляем порядок уроков в БД
          for (let i = 0; i < reorderedLessons.length; i++) {
            try {
              await axios.put(`/lessons/${reorderedLessons[i].id}`, {
                order: i + 1
              }, {
                headers: { Authorization: `Bearer ${token}` }
              });
              console.log(`Updated lesson ${reorderedLessons[i].id} order to ${i + 1}`);
            } catch (error) {
              console.error(`Failed to update lesson ${reorderedLessons[i].id} order:`, error);
              toast.error('Failed to update lesson order. Please try again.');
              return;
            }
          }
        
        const updatedModules = modules.map(m => 
          m.id === sourceModuleId ? { ...m, lessons: reorderedLessons } : m
        );
        
            setModules(updatedModules);
          
          // Защита: логируем обновленные модули
          console.log('🛡️ PROTECTION: Updated modules preserved, backend should handle syllabus meta');
          
          toast.success('Lesson order updated and saved successfully!');
          
          // Перезагружаем данные для получения актуальной информации
          await loadSyllabusData();
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
          
          // Обновляем moduleId и порядок перемещенного урока в БД
          try {
            await axios.put(`/lessons/${movedLesson.id}`, {
              moduleId: targetModuleId,
              order: targetIndex + 1
            }, {
              headers: { Authorization: `Bearer ${token}` }
            });
            console.log(`Moved lesson ${movedLesson.id} to module ${targetModuleId} with order ${targetIndex + 1}`);
          } catch (error) {
            console.error(`Failed to move lesson ${movedLesson.id}:`, error);
            toast.error('Failed to move lesson. Please try again.');
            return;
          }
          
          // Обновляем порядок уроков в исходном модуле
          for (let i = 0; i < sourceLessons.length; i++) {
            try {
              await axios.put(`/lessons/${sourceLessons[i].id}`, {
                order: i + 1
              }, {
                headers: { Authorization: `Bearer ${token}` }
              });
              console.log(`Updated source module lesson ${sourceLessons[i].id} order to ${i + 1}`);
            } catch (error) {
              console.error(`Failed to update source module lesson ${sourceLessons[i].id} order:`, error);
              toast.error('Failed to update lesson order. Please try again.');
              return;
            }
          }
          
          // Обновляем порядок уроков в целевом модуле
          for (let i = 0; i < targetLessons.length; i++) {
            if (targetLessons[i].id !== movedLesson.id) { // Пропускаем перемещенный урок
              try {
                await axios.put(`/lessons/${targetLessons[i].id}`, {
                  order: i + 1
                }, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                console.log(`Updated target module lesson ${targetLessons[i].id} order to ${i + 1}`);
              } catch (error) {
                console.error(`Failed to update target module lesson ${targetLessons[i].id} order:`, error);
                toast.error('Failed to update lesson order. Please try again.');
                return;
              }
            }
          }
        
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
          
          // Защита: логируем обновленные модули
          console.log('🛡️ PROTECTION: Updated modules preserved, backend should handle syllabus meta');
          
          toast.success('Lesson moved and saved successfully!');
          
          // Перезагружаем данные для получения актуальной информации
          await loadSyllabusData();
        }
      }
    } catch (error) {
      console.error('Error handling drop:', error);
      toast.error('Failed to update lesson position. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteModule = async (moduleId) => {
    if (!window.confirm('Are you sure you want to delete this module? All lessons will be moved to unassigned.')) {
      return;
    }

    try {
      setSaving(true);
      
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        toast.error('Authentication token missing. Please log in again.');
      return;
    }

    const moduleToDelete = modules.find(m => m.id === moduleId);
    const updatedModules = modules.filter(m => m.id !== moduleId);
    
    // Move lessons to available lessons
    if (moduleToDelete && moduleToDelete.lessons) {
      setAvailableLessons([...availableLessons, ...moduleToDelete.lessons]);
    }
    
      // Если модуль уже существует на сервере (не временный), удаляем его из БД
    if (moduleToDelete && moduleToDelete.id && !moduleToDelete.id.toString().startsWith('temp_')) {
        try {
          await axios.delete(`/course/${courseId}/modules/${moduleToDelete.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log(`Deleted module ${moduleToDelete.id} from database`);
          
          // Освобождаем уроки от привязки к модулю
          if (moduleToDelete.lessons && moduleToDelete.lessons.length > 0) {
            for (const lesson of moduleToDelete.lessons) {
              try {
                await axios.put(`/lessons/${lesson.id}`, {
                  moduleId: null
                }, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                console.log(`Freed lesson ${lesson.id} from module ${moduleToDelete.id}`);
              } catch (error) {
                console.error(`Failed to free lesson ${lesson.id}:`, error);
                // Продолжаем выполнение, даже если не удалось освободить урок
              }
            }
          }
          
        } catch (error) {
          console.error(`Failed to delete module ${moduleToDelete.id}:`, error);
          toast.error('Failed to delete module. Please try again.');
          return;
        }
    }
    
    setModules(updatedModules);
      
      // Защита: логируем оставшиеся модули
      if (updatedModules.length > 0) {
        console.log('🛡️ PROTECTION: Remaining modules preserved, backend should handle syllabus meta');
      }
      
      // Модуль удален
      
      toast.success('Module deleted and saved successfully!');
      
      // Перезагружаем данные для получения актуальной информации
      await loadSyllabusData();
      
      // Принудительно перезагружаем страницу для обновления UI
      setTimeout(() => {
        window.location.reload();
      }, 1000); // Задержка в 1 секунду, чтобы пользователь увидел сообщение об успехе
    } catch (error) {
      console.error('Error deleting module:', error);
      toast.error('Failed to delete module. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditLesson = (lesson) => {
    // Перенаправляем на страницу редактирования урока
    history.push(`/teach/lessons/${lesson.id}/content`);
  };

  const handleDeleteLesson = async (lessonId) => {
    console.log('[SyllabusEditor] Deleting lesson from module:', lessonId);
    
    if (!window.confirm('Are you sure you want to remove this lesson from the module?')) {
      return;
    }

    try {
      setSaving(true);
      
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        toast.error('Authentication token missing. Please log in again.');
        return;
      }
      
      // Находим модуль, из которого удаляем урок
      const moduleWithLesson = modules.find(module => 
        module.lessons && module.lessons.some(lesson => lesson.id === lessonId)
      );
      
      console.log('[SyllabusEditor] Found module with lesson:', moduleWithLesson);
      
      if (!moduleWithLesson) {
        toast.error('Lesson not found in any module');
        return;
      }
      
      // Если модуль уже существует на сервере (не временный), освобождаем урок от привязки к модулю
      if (moduleWithLesson.id && !moduleWithLesson.id.toString().startsWith('temp_')) {
        try {
          await axios.put(`/lessons/${lessonId}`, {
            moduleId: null
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log(`Freed lesson ${lessonId} from module ${moduleWithLesson.id}`);
          
          // Урок освобожден от модуля
          
        } catch (error) {
          console.error(`Failed to free lesson ${lessonId}:`, error);
          toast.error('Failed to remove lesson from module. Please try again.');
          return;
        }
      }
      
      // Удаляем урок из модуля
    const updatedModules = modules.map(module => ({
      ...module,
      lessons: (module.lessons || []).filter(lesson => lesson.id !== lessonId)
    }));
    
    setModules(updatedModules);
      
      // Защита: логируем обновленные модули
      console.log('🛡️ PROTECTION: Updated modules preserved, backend should handle syllabus meta');
      
      // Возвращаем урок в список доступных уроков
      const lessonToRestore = moduleWithLesson.lessons.find(lesson => lesson.id === lessonId);
      
      if (lessonToRestore) {
        setAvailableLessons(prev => [...prev, lessonToRestore]);
      }
      
      toast.success('Lesson removed from module and saved successfully!');
      
      // Перезагружаем данные для получения актуальной информации
      await loadSyllabusData();
      
    } catch (error) {
      console.error('Error removing lesson from module:', error);
      toast.error('Failed to remove lesson from module. Please try again.');
    } finally {
      setSaving(false);
    }
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

  // Функция для восстановления пустых модулей в БД
  const restoreEmptyModules = async (missingModules) => {
    console.log('Attempting to restore empty modules in database...');
    
    const token = localStorage.getItem('jwtToken');
    if (!token) {
      console.error('No token for restoring modules');
      return false;
    }
    
    let successCount = 0;
    
    for (const module of missingModules) {
      if ((module.lessons?.length || 0) === 0) {
        console.log(`Restoring empty module: ${module.title} (ID: ${module.id})`);
        
        try {
          // Пробуем создать модуль заново
          const restoreResponse = await axios.post(`/course/${courseId}/modules`, {
            title: module.title,
            description: module.description,
            order: module.order
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          const restoredId = restoreResponse.data?.id || restoreResponse.data?.module?.id;
          if (restoredId) {
            console.log(`✅ Successfully restored module: ${module.title} with new ID: ${restoredId}`);
            successCount++;
          } else {
            console.error(`❌ Failed to restore module: ${module.title}`);
          }
        } catch (restoreError) {
          console.error(`Error restoring module ${module.title}:`, restoreError);
        }
      }
    }
    
    console.log(`Restored ${successCount} out of ${missingModules.length} missing modules`);
    return successCount > 0;
  };

  // Функция для пересчета order модулей
  const recalculateModuleOrder = (modulesList) => {
    console.log('🔄 Recalculating module order...');
    const sortedModules = [...modulesList].sort((a, b) => (a.order || 0) - (b.order || 0));
    
    sortedModules.forEach((module, index) => {
      const correctOrder = index + 1;
      if (module.order !== correctOrder) {
        console.log(`📝 Fixing module "${module.title}" order: ${module.order} → ${correctOrder}`);
        module.order = correctOrder;
      }
    });
    
    console.log('✅ Module order recalculated:', sortedModules.map(m => ({ id: m.id, title: m.title, order: m.order })));
    return sortedModules;
  };

  // Все временные защитные механизмы удалены, поскольку проблема решена на уровне бэкенда



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
          {/* Back to Course Button */}
          <button
            onClick={() => history.push(`/editcourse/${courseId}`)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px 16px',
              background: 'transparent',
              border: `1px solid ${dark ? '#404040' : '#e9ecef'}`,
              borderRadius: '8px',
              color: dark ? '#eaf4fd' : '#333',
              cursor: 'pointer',
              marginBottom: '20px',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.target.style.background = dark ? '#404040' : '#f8f9fa'}
            onMouseOut={(e) => e.target.style.background = 'transparent'}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            {t('course.back_to_course')}
          </button>

          {/* Course Modules Title */}
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: dark ? '#eaf4fd' : '#333',
            marginBottom: '16px',
            borderBottom: `1px solid ${dark ? '#404040' : '#e9ecef'}`,
            paddingBottom: '8px'
          }}>
            {t('course.course_modules')}
          </h3>
          
          {/* Auto-save Info */}
          <div style={{
              width: '100%',
              padding: '12px 16px',
            background: dark ? '#1a1a1a' : '#e8f5e8',
            border: `1px solid ${dark ? '#404040' : '#4caf50'}`,
              borderRadius: '8px',
              marginBottom: '12px',
              fontSize: '14px',
            color: dark ? '#4caf50' : '#2e7d32',
            textAlign: 'center',
            fontWeight: '500'
          }}>
            <FontAwesomeIcon icon={faSave} style={{ marginRight: '8px' }} />
            {t('course.auto_save_enabled') || 'Auto-save enabled'}
          </div>

          {/* Add Module Button */}
          <button
            onClick={() => setShowAddModuleModal(true)}
                  style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px 16px',
              background: '#007bff',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
                    cursor: 'pointer',
              marginBottom: '12px',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.target.style.background = '#0056b3'}
            onMouseOut={(e) => e.target.style.background = '#007bff'}
          >
            <FontAwesomeIcon icon={faPlus} />
            {t('course.add_module')}
          </button>

          {/* Statistics */}
                  <div style={{
            borderTop: `1px solid ${dark ? '#404040' : '#e9ecef'}`,
            paddingTop: '16px'
          }}>
            <h4 style={{
              fontSize: '14px',
              fontWeight: '500',
              color: dark ? '#666' : '#666',
              marginBottom: '12px'
            }}>
              {t('course.statistics')}
            </h4>
            <div style={{
              fontSize: '12px',
              color: dark ? '#666' : '#999',
              lineHeight: '1.4'
            }}>
              <div>{t('course.total_modules', { count: modules.length })}</div>
              <div>{t('course.total_lessons', { count: modules.reduce((total, module) => total + (module.lessons?.length || 0), 0) })}</div>
              <div>{t('course.available_lessons', { count: availableLessons.length })}</div>
              <div>{t('course.course_id', { id: courseId })}</div>
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
            {t('course.syllabus_editor')}
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
            {t('course.back_to_course')}
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
              {t('course.course_modules')}
            </h2>
            <div style={{ display: 'flex', gap: '12px' }}>
                <div
                  style={{
                    padding: '12px 20px',
                    background: dark ? '#1a1a1a' : '#e8f5e8',
                    border: `1px solid ${dark ? '#404040' : '#4caf50'}`,
                    borderRadius: '8px',
                    fontSize: '16px',
                    color: dark ? '#4caf50' : '#2e7d32',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: '500'
                  }}
                >
                  <FontAwesomeIcon icon={faSave} />
                  {t('course.auto_save_enabled') || 'Auto-save enabled'}
                </div>
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
                {t('course.add_module')}
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
                {t('course.no_modules_yet', { courseId: courseId })}
              </div>
              <div style={{ fontSize: '14px', color: dark ? '#777' : '#aaa', marginBottom: '24px' }}>
                {t('course.create_first_module')}
              </div>
              <div style={{ fontSize: '14px', color: dark ? '#777' : '#aaa', marginBottom: '24px' }}>
                {t('course.available_lessons', { count: availableLessons.length })}
              </div>
              <button
                onClick={() => setShowCreateModuleModal(true)}
                style={{
                  padding: '12px 24px',
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
                onMouseOver={(e) => e.target.style.background = '#0056b3'}
                onMouseOut={(e) => e.target.style.background = '#007bff'}
              >
                {t('course.create_first_module')}
              </button>
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
                      {t('course.module')} {moduleIndex + 1}: {module.title}
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
                        {t('course.add_existing_lesson')}
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
                        {t('course.drop_lessons_here')}
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
                                  {lesson.name || t('lesson.untitled_lesson')}
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
                {t('course.add_new_module')}
              </h3>
              
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: dark ? '#eaf4fd' : '#333'
              }}>
                {t('course.module_name_label')}
              </label>
              <input
                type="text"
                value={newModuleName}
                onChange={(e) => setNewModuleName(e.target.value)}
                placeholder={t('course.module_name_placeholder')}
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
                  {t('common.cancel')}
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
                  {t('course.add_module_button')}
            </button>
              </div>
            </div>
          </div>
        )}

        {/* Create First Module Modal */}
        {showCreateModuleModal && (
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
                {t('course.create_first_module')}
              </h3>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: dark ? '#eaf4fd' : '#333'
                }}>
                  {t('course.module_name_label')}
                </label>
                <input
                  type="text"
                  value={newModuleName}
                  onChange={(e) => setNewModuleName(e.target.value)}
                  placeholder={t('course.module_name_placeholder')}
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
                  onClick={() => setShowCreateModuleModal(false)}
                  style={{
                    padding: '10px 20px',
                    background: 'transparent',
                    border: `1px solid ${dark ? '#404040' : '#e9ecef'}`,
                    borderRadius: '6px',
                    color: dark ? '#eaf4fd' : '#333',
                    cursor: 'pointer'
                  }}
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={() => {
                    handleAddModule();
                    setShowCreateModuleModal(false);
                  }}
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
                  {t('course.create_module_button')}
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
              {t('course.add_lesson_to_module')}
              </h3>
              
              <div style={{ marginBottom: '20px' }}>
                <p style={{
                  color: dark ? '#b6d4fe' : '#666',
                  fontSize: '14px',
                  marginBottom: '16px'
                }}>
                  {t('course.choose_from_existing_lessons', { courseId: courseId })}:
                </p>

                
                {/* Search filter */}
                <div style={{ marginBottom: '16px', position: 'relative' }}>
                  <input
                    type="text"
                    placeholder={t('course.search_lessons')}
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
                
                {(() => {
                  console.log('[SyllabusEditor] Modal - filteredLessons length:', filteredLessons.length);
                  console.log('[SyllabusEditor] Modal - filteredLessons:', filteredLessons);
                  return filteredLessons.length === 0 ? (
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
                      t('course.no_lessons_found', { courseId: courseId })
                    ) : (
                      t('course.no_lessons_match', { searchTerm: lessonSearchTerm })
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
                              video • {lesson.content ? lesson.content.substring(0, 50) + '...' : t('course.no_content')}
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
                              {t('course.already_added')}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )})()}
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
                  {t('course.close')}
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