import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlay, 
  faCheck, 
  faLock, 
  faBook, 
  faClock, 
  faArrowLeft,
  faGraduationCap,
  faList,
  faEye,
  faTrash,
  faBroom,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import axios from '../utils/axios';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import LessonViewer from '../components/LessonViewer';
import ProgressDebugger from '../components/ProgressDebugger';
import AdminCleanup from '../components/AdminCleanup';
import AuthDebugger from '../components/AuthDebugger';
import useTheme from '../hooks/useTheme';
import '../admin/admin.css';
import { useTranslation } from 'react-i18next';

const Course = () => {
  const { id } = useParams();
  const history = useHistory();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [userProgress, setUserProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [testAttempts, setTestAttempts] = useState([]);

  // Local progress fallback helpers
  const normalizeLessonId = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : String(value);
  };

  const findLessonById = (lessonId) => {
    let obj = lessons.find(l => l.id === lessonId);
    if (obj) return obj;
    for (const m of modules) {
      const arr = Array.isArray(m?.lessons) ? m.lessons : [];
      const found = arr.find(l => l.id === lessonId);
      if (found) return found;
    }
    return null;
  };

  useEffect(() => {
    window.saveCourseProgress = (courseId, progress) => {
      try {
        const courseProgresses = JSON.parse(localStorage.getItem('courseProgresses') || '{}');
        courseProgresses[courseId] = {
          progress: progress,
          timestamp: Date.now()
        };
        localStorage.setItem('courseProgresses', JSON.stringify(courseProgresses));
        console.log(`Сохранен прогресс курса ${courseId}: ${progress}%`);
      } catch (error) {
        console.warn('Ошибка при сохранении прогресса курса:', error);
      }
    };
    window.updateCourseProgress = (courseId, lessonId, progress) => {
      console.log(`Обновление прогресса: курс ${courseId}, урок ${lessonId}, прогресс ${progress}%`);
      
      // Сохраняем прогресс урока в базу данных
      const saveLessonProgressToDB = async () => {
        try {
          const token = localStorage.getItem('jwtToken');
          if (!token) {
            console.warn('Нет токена для сохранения прогресса урока');
            return;
          }

          const response = await axios.post(`/course/${courseId}/lesson/${lessonId}/progress`, 
            { progress }, 
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          console.log(`Прогресс урока ${lessonId} сохранен в БД:`, response.data);
        } catch (error) {
          console.error('Ошибка при сохранении прогресса урока в БД:', error);
        }
      };

      // Сохраняем прогресс урока в БД
      saveLessonProgressToDB();
      
      loadUserProgress().then(() => {
        setTimeout(() => {
          const overallProgress = getOverallProgress();
          console.log(`Обновляем MyTraining: ${overallProgress}%`);
          
          if (window.saveCourseProgress) {
            window.saveCourseProgress(Number(id), overallProgress);
          }
          
          if (window.updateMyTrainingProgress) {
            window.updateMyTrainingProgress(Number(id), overallProgress);
          }
        }, 100);
      });
    };

    window.getCourseProgress = (courseId) => {
      if (Number(courseId) === Number(id)) {
        return getOverallProgress();
      }
      return 0;
    };

    window.calculateCourseProgress = async (courseId, userId) => {
      try {
        const token = localStorage.getItem('jwtToken');
        if (!token) return 0;

        // Дополнительная проверка валидности данных
        if (!courseId || isNaN(Number(courseId))) {
          console.error('Недопустимый ID курса:', courseId);
          return 0;
        }
        
        if (!userId || isNaN(Number(userId))) {
          console.error('Недопустимый ID пользователя:', userId);
          return 0;
        }
        
        const validCourseId = Number(courseId);
        const validUserId = Number(userId);
        
        console.log(`Загружаем прогресс для курса ${validCourseId}, пользователя ${validUserId}`);

        // Загружаем прогресс пользователя
        const progressResponse = await axios.get(`/course/${validCourseId}/progress/${validUserId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Загружаем полный syllabus
        const fullSyllabusResponse = await axios.get(`/course/${validCourseId}/full-syllabus`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const { stepCompletions, testAttempts } = progressResponse.data;
        const modules = fullSyllabusResponse.data.modules || [];

        if (!Array.isArray(modules) || modules.length === 0) return 100;

        console.log(`\n=== РАСЧЕТ ОБЩЕГО ПРОГРЕССА КУРСА ${validCourseId} ===`);
        console.log(`Найдено модулей: ${modules.length}`);
        console.log(`Данные о шагах: ${stepCompletions?.length || 0} завершенных шагов`);
        console.log(`Данные о тестах: ${testAttempts?.length || 0} попыток тестов`);

        let totalModuleProgress = 0;
        let moduleCount = 0;

        for (const module of modules) {
          let moduleProgress = 0;
          let lessonCount = 0;

          if (Array.isArray(module.lessons)) {
            for (const lesson of module.lessons) {
              let lessonProgress = 0;
              let stepCount = 0;

              if (Array.isArray(lesson.steps)) {
                for (let i = 0; i < lesson.steps.length; i++) {
                  const step = lesson.steps[i];
                  const stepCompletion = stepCompletions?.find(sc => 
                    sc.lessonId === lesson.id && sc.stepIndex === i
                  );
                  const testAttempt = testAttempts?.find(ta => 
                    ta.lessonId === lesson.id && ta.stepIndex === i
                  );

                  if (step.type === 'test' || step.type === 'quiz') {
                    if (testAttempt) {
                      const score = testAttempt.lastScore || 0;
                      // Добавляем к прогрессу только если результат больше 0%
                      if (score > 0) {
                        lessonProgress += score;
                        console.log(`    Урок ${lesson.id}, шаг ${i} (${step.type}): ${score}%`);
                      } else {
                        console.log(`    Урок ${lesson.id}, шаг ${i} (${step.type}): ${score}% - не учитываем в прогрессе`);
                      }
                    } else {
                      console.log(`    Урок ${lesson.id}, шаг ${i} (${step.type}): нет попыток`);
                    }
                  } else {
                    if (stepCompletion) {
                      lessonProgress += 100;
                      console.log(`    Урок ${lesson.id}, шаг ${i} (${step.type || 'text'}): завершен`);
                    } else {
                      console.log(`    Урок ${lesson.id}, шаг ${i} (${step.type || 'text'}): не завершен`);
                    }
                  }
                  stepCount++;
                }
              }

              if (stepCount > 0) {
                const lessonAvg = Math.round(lessonProgress / stepCount);
                moduleProgress += lessonAvg;
                console.log(`  Урок ${lesson.id} (${lesson.name}): ${lessonAvg}% (${lessonProgress}/${stepCount} шагов)`);
              }
              lessonCount++;
            }
          }

          if (lessonCount > 0) {
            const moduleAvg = Math.round(moduleProgress / lessonCount);
            totalModuleProgress += moduleAvg;
            console.log(`Модуль ${module.id} (${module.title}): ${moduleAvg}% (${moduleProgress}/${lessonCount} уроков)`);
          }
          moduleCount++;
        }

        if (moduleCount > 0) {
          const averageProgress = Math.round(totalModuleProgress / moduleCount);
          console.log(`Общий прогресс курса ${validCourseId}: ${averageProgress}% (${totalModuleProgress}/${moduleCount} модулей)`);
          console.log(`=== КОНЕЦ РАСЧЕТА ОБЩЕГО ПРОГРЕССА КУРСА ${validCourseId} ===\n`);
          return Math.max(0, Math.min(100, averageProgress));
        }

        return 0;
      } catch (error) {
        console.error(`Ошибка при расчете прогресса курса ${courseId}:`, error);
        return 0;
      }
    };

    window.getCurrentCourseProgress = (courseId) => {
      if (Number(courseId) === Number(id)) {
        return getOverallProgress();
      }
      return null; 
    };

    const currentProgress = getOverallProgress();
    if (window.saveCourseProgress) {
      window.saveCourseProgress(Number(id), currentProgress);
    }

    window.updateUserProgress = () => {
      console.log('Обновляем userProgress из window.updateUserProgress');
      loadUserProgress();
    };

    return () => {
      delete window.updateCourseProgress;
      delete window.getCourseProgress;
      delete window.calculateCourseProgress;
      delete window.getCurrentCourseProgress;
      delete window.saveCourseProgress;
    };
  }, [id]);

  useEffect(() => {
    loadCourseData();
    // Загружаем прогресс пользователя
    loadUserProgress();
  }, [id]);

  const loadUserProgress = useCallback(async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        console.error('Нет токена для загрузки прогресса');
        return;
      }

      const decoded = JSON.parse(atob(token.split('.')[1]));
      console.log('=== ЗАГРУЗКА ПРОГРЕССА ПОЛЬЗОВАТЕЛЯ ===');
      console.log('Загружаем прогресс для пользователя:', decoded.id);
      console.log('ID курса:', id);
      
      if (!decoded.id || isNaN(Number(decoded.id))) {
        console.error('Недопустимый ID пользователя:', decoded.id);
        return;
      }
      
      if (!id || isNaN(Number(id))) {
        console.error('Недопустимый ID курса:', id);
        return;
      }
      
      const validCourseId = Number(id);
      const validUserId = Number(decoded.id);
      
      console.log(`Загружаем прогресс для курса ${validCourseId}, пользователя ${validUserId}`);
      
      const progressResponse = await axios.get(`/course/${validCourseId}/progress/${validUserId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Прогресс с сервера:', progressResponse.data);
      console.log('testAttempts из сервера:', progressResponse.data.testAttempts?.length || 0);
      
      setUserProgress(progressResponse.data);
      console.log('userProgress установлен в состояние');
      console.log('=== КОНЕЦ ЗАГРУЗКИ ПРОГРЕССА ===');
      
    } catch (error) {
      console.error('Ошибка при загрузке прогресса:', error);
      console.error('Детали ошибки:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
    }
  }, [id]);

  const loadCourseData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        setError('Пользователь не авторизован');
        return;
      }

      const courseResponse = await axios.get(`/course/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCourse(courseResponse.data);

      let modulesWithLessons = [];
      let allLessons = [];
      
      try {
        const fullSyllabusResponse = await axios.get(`/course/${id}/full-syllabus`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('Full syllabus API response:', fullSyllabusResponse);
        const syllabusData = fullSyllabusResponse.data;
        modulesWithLessons = syllabusData.modules || [];
        allLessons = syllabusData.modules?.flatMap(m => m.lessons || []) || [];
        
        console.log('Syllabus data:', syllabusData);
        console.log('Modules from full syllabus:', modulesWithLessons);
        console.log('All lessons from full syllabus:', allLessons);
        
        if (allLessons.length > 0) {
          console.log('=== ДАННЫЕ УРОКОВ ИЗ FULL-SYLLABUS ===');
          allLessons.forEach((lesson, index) => {
            console.log(`Урок ${index} (ID: ${lesson.id}):`, {
              name: lesson.name,
              title: lesson.title,
              videoUrl: lesson.videoUrl,
              steps: lesson.steps ? lesson.steps.map((step, stepIndex) => ({
                stepIndex,
                id: step.id,
                type: step.type,
                title: step.title,
                videoUrl: step.videoUrl,
                video: step.video,
                content: step.content,
                description: step.description,
                fullStep: step
              })) : []
            });
          });
          console.log('=== КОНЕЦ ДАННЫХ УРОКОВ ===');
        }
        
        // Если full-syllabus не содержит уроков, загружаем их отдельно
        if (allLessons.length === 0) {
          console.log('No lessons in full-syllabus, loading lessons separately...');
          
          // Load lessons from database
          let lessons = [];
          
          try {
            const lessonsResponse = await axios.get(`/course/${id}/lessons`, {
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
          const modulesResponse = await axios.get(`/course/${id}/modules`, {
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
          const lessonsResponse = await axios.get(`/course/${id}/lessons`, {
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

      // Устанавливаем данные
      setModules(modulesWithLessons);
      setLessons(allLessons);

      // Отладочная информация
      console.log('Загруженные модули:', modulesWithLessons);
      console.log('Загруженные уроки:', allLessons);
      if (allLessons && allLessons.length > 0) {
        console.log('Первый урок:', allLessons[0]);
        console.log('Шаги первого урока:', allLessons[0].steps);
      }
      
      // Дополнительная отладочная информация для модулей
      modulesWithLessons.forEach((module, index) => {
        console.log(`Module ${index + 1} (${module.id}): "${module.title}" - ${module.lessons?.length || 0} lessons`);
        if (module.lessons && module.lessons.length > 0) {
          module.lessons.forEach((lesson, lessonIndex) => {
            console.log(`  Lesson ${lessonIndex + 1}: ${lesson.title || lesson.name} (ID: ${lesson.id})`);
          });
        }
      });

      // Загружаем прогресс пользователя
      await loadUserProgress();

      // Устанавливаем первый модуль как выбранный по умолчанию
      if (modulesWithLessons && modulesWithLessons.length > 0) {
        setSelectedModule(modulesWithLessons[0]);
      }

      // Синхронизируем прогресс с MyTraining после загрузки данных
      setTimeout(() => {
        const overallProgress = getOverallProgress();
        console.log(`Синхронизируем прогресс с MyTraining: ${overallProgress}%`);
        if (window.updateMyTrainingProgress) {
          window.updateMyTrainingProgress(Number(id), overallProgress);
        } else {
          console.log('Функция updateMyTrainingProgress не найдена');
          // localStorage.setItem('courseProgressUpdate', JSON.stringify({ 
          //   courseId: Number(id), 
          //   progress: overallProgress, 
          //   ts: Date.now() 
          // }));
        }
      }, 500);

    } catch (error) {
      console.error('Error loading course data:', error);
      if (error.response?.status === 403) {
        setError('Доступ запрещен. Возможно, вы не записаны на этот курс.');
      } else if (error.response?.status === 404) {
        setError('Курс не найден.');
      } else {
        setError('Не удалось загрузить курс. Попробуйте позже.');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  const handleLessonClick = async (lesson) => {
    try {
      console.log(`=== ОТКРЫТИЕ УРОКА ${lesson.id} ===`);
      console.log(`Урок: ${lesson.title}`);
      console.log(`Текущий userProgress:`, userProgress);
      console.log(`userProgress.stepCompletions:`, userProgress?.stepCompletions?.length || 0);
      console.log(`userProgress.testAttempts:`, userProgress?.testAttempts?.length || 0);
      console.log(`userProgress.lessonProgresses:`, userProgress?.lessonProgresses?.length || 0);
      
      // Пытаемся найти урок с шагами в уже загруженном списке /course/:id/lessons
      const prev = selectedLesson;
      if (prev && prev.id === lesson.id) {
        // Уже выбран этот же урок — не перезагружаем
        console.log('Уже выбран этот же урок, пропускаем');
        return;
      }
      let fromList = lessons.find(l => l.id === lesson.id);
      if (fromList && Array.isArray(fromList.steps) && fromList.steps.length > 0) {
        console.log('Найден урок в списке, устанавливаем');
        setSelectedLesson({ ...fromList, ...lesson });
        return;
      }
      // Фоллбек: попробовать найти по названию/видео
      const lname = (lesson.title || lesson.name || '').trim().toLowerCase();
      if (!fromList && lname) {
        fromList = lessons.find(l => (l.title || l.name || '').trim().toLowerCase() === lname);
        if (fromList && Array.isArray(fromList.steps) && fromList.steps.length > 0) {
          console.log('Найден урок по названию, устанавливаем');
          setSelectedLesson({ ...fromList, ...lesson });
          return;
        }
      }
      if (!fromList && lesson.videoUrl) {
        fromList = lessons.find(l => (l.videoUrl || l.videoLink) && (l.videoUrl || l.videoLink) === lesson.videoUrl);
        if (fromList && Array.isArray(fromList.steps) && fromList.steps.length > 0) {
          console.log('Найден урок по видео, устанавливаем');
          setSelectedLesson({ ...fromList, ...lesson });
          return;
        }
      }
      // Обновим список /course/:id/lessons и попробуем снова (без обращения к /lessons/:id)
      console.log('Обновляем список уроков...');
      const token = localStorage.getItem('jwtToken');
      const refreshed = await axios.get(`/course/${id}/lessons`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const list = refreshed.data || [];
      setLessons(list);
      let found = list.find(l => l.id === lesson.id) || null;
      if (!found && lname) {
        found = list.find(l => (l.title || l.name || '').trim().toLowerCase() === lname) || null;
      }
      if (!found && lesson.videoUrl) {
        found = list.find(l => (l.videoUrl || l.videoLink) && (l.videoUrl || l.videoLink) === lesson.videoUrl) || null;
      }
      if (found) {
        console.log('Найден урок после обновления списка, устанавливаем');
        setSelectedLesson({ ...found, ...lesson });
      } else {
        // Фоллбек: показываем базовую информацию
        console.log('Урок не найден, устанавливаем базовую информацию');
        setSelectedLesson(lesson);
      }
      console.log(`=== КОНЕЦ ОТКРЫТИЯ УРОКА ${lesson.id} ===`);
    } catch (error) {
      console.error('Error loading lesson details:', error);
      setSelectedLesson(lesson);
    }
  };

  const handleLessonComplete = async (lessonId) => {
    try {
      console.log(`Завершаем урок ${lessonId}`);
      
      const token = localStorage.getItem('jwtToken');
      // Не трогаем бэкенд, если ID урока невалиден для БД (например, временный front-only)
      const numericId = Number(lessonId);
      const isValidDbId = Number.isFinite(numericId) && numericId > 0 && numericId <= 2147483647; // INT4 guard

      // Подсчитаем прогресс текущего модуля
      let moduleKey = null;
      let moduleProgress = null;
      const currentModule = modules.find(m => m.id === selectedLesson?.moduleId);
      if (currentModule) {
        const currentLessons = getLessonsForModule(currentModule.id);
        const completed = currentLessons.filter(l => isLessonCompleted(l.id)).length + (isValidDbId ? (isLessonCompleted(numericId) ? 0 : 1) : 0);
        moduleKey = String(currentModule.id);
        moduleProgress = currentLessons.length > 0 ? Math.round((completed / currentLessons.length) * 100) : 100;
        console.log(`Прогресс модуля ${currentModule.id}: ${completed}/${currentLessons.length} = ${moduleProgress}%`);
      }

      // Рассчитываем локальный прогресс курса
      const overallProgress = getOverallProgress();
      console.log(`Локальный прогресс курса: ${overallProgress}%`);
      
      if (isValidDbId) {
        const resp = await axios.post(`/course/${id}/lesson/${numericId}/complete`, { moduleKey, moduleProgress }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (typeof resp.data?.totalProgress === 'number') {
          console.log(`Получен новый прогресс с сервера: ${resp.data.totalProgress}%`);
          setUserProgress(prev => ({ ...prev, totalProgress: resp.data.totalProgress }));
          
          // Обновляем прогресс в MyTraining
          if (window.updateMyTrainingProgress) {
            const overallProgress = getOverallProgress();
            console.log(`Вызываем updateMyTrainingProgress для курса ${id} с прогрессом ${overallProgress}%`);
            window.updateMyTrainingProgress(Number(id), overallProgress);
          } else {
            console.log('Функция updateMyTrainingProgress не найдена');
            // localStorage.setItem('courseProgressUpdate', JSON.stringify({ 
            //   courseId: Number(id), 
            //   progress: resp.data.totalProgress, 
            //   ts: Date.now() 
            // }));
          }
        } else {
          // Если сервер не вернул прогресс, используем локальный расчет
          console.log(`Сервер не вернул прогресс, используем локальный: ${overallProgress}%`);
          if (window.updateMyTrainingProgress) {
            window.updateMyTrainingProgress(Number(id), overallProgress);
          } else {
            console.log('Функция updateMyTrainingProgress не найдена');
            // localStorage.setItem('courseProgressUpdate', JSON.stringify({ 
            //   courseId: Number(id), 
            //   progress: overallProgress, 
            //   ts: Date.now() 
            // }));
          }
        }
      } else {
        // Если ID невалиден, используем локальный прогресс
        console.log(`ID урока невалиден, используем локальный прогресс: ${overallProgress}%`);
        if (window.updateMyTrainingProgress) {
          window.updateMyTrainingProgress(Number(id), overallProgress);
        } else {
          console.log('Функция updateMyTrainingProgress не найдена');
          // localStorage.setItem('courseProgressUpdate', JSON.stringify({ 
          //   courseId: Number(id), 
          //   progress: overallProgress, 
          //   ts: Date.now() 
          // }));
        }
      }
      
      // Обновляем прогресс
      // Мгновенно обновляем локально и затем пытаемся перезагрузить с сервера
      setUserProgress(prev => ({
        ...prev,
        completedLessonIds: Array.from(new Set([...(prev?.completedLessonIds || []).map(normalizeLessonId), normalizeLessonId(lessonId)]))
      }));
      
      // Принудительно обновляем состояние для немедленного отображения прогресса
      setTimeout(() => {
        setUserProgress(prev => ({ ...prev }));
      }, 100);

      broadcastCourseProgress(getOverallProgress());

    } catch (error) {
      console.error('Error completing lesson:', error);
      // Даже при ошибке бэкенда фиксируем локальный прогресс для визуального отклика
      setUserProgress(prev => ({
        ...prev,
        completedLessonIds: Array.from(new Set([...(prev?.completedLessonIds || []).map(normalizeLessonId), normalizeLessonId(lessonId)]))
      }));
      
      // Обновляем MyTraining с локальным прогрессом даже при ошибке
      const overallProgress = getOverallProgress();
      console.log(`Ошибка при завершении урока, используем локальный прогресс: ${overallProgress}%`);
      if (window.updateMyTrainingProgress) {
        window.updateMyTrainingProgress(Number(id), overallProgress);
      } else {
        console.log('Функция updateMyTrainingProgress не найдена');
        // localStorage.setItem('courseProgressUpdate', JSON.stringify({ 
        //   courseId: Number(id), 
        //   progress: overallProgress, 
        //   ts: Date.now() 
        // }));
      }
    }
  };

  // Функция для сброса всего прогресса курса
  const resetCourseProgress = async () => {
    try {
      console.log(`=== СБРОС ПРОГРЕССА КУРСА ${id} ===`);
      
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        console.error('Нет токена для сброса прогресса');
        return;
      }

      // Запрашиваем подтверждение у пользователя
      const confirmed = window.confirm(t('course.reset_progress_confirm', { defaultValue: 'Вы уверены, что хотите сбросить весь прогресс этого курса? Это действие нельзя отменить.' }));
      if (!confirmed) {
        console.log('Сброс прогресса отменен пользователем');
        return;
      }

      const response = await axios.delete(`/course/${id}/reset-progress`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Прогресс курса сброшен:', response.data);
      
      // Обновляем прогресс
      await loadUserProgress();
      
      // Обновляем общий прогресс курса
      if (window.updateMyTrainingProgress) {
        window.updateMyTrainingProgress(Number(id), 0);
      }
      
      // Показываем уведомление
      alert(t('course.reset_progress_success', { defaultValue: 'Прогресс курса успешно сброшен!' }));
      
    } catch (error) {
      console.error('Ошибка при сбросе прогресса курса:', error);
      alert('Ошибка при сбросе прогресса курса: ' + (error.response?.data?.message || error.message));
    }
  };

  // Функция для принудительной очистки тестовых записей
  const forceCleanTestCompletions = async () => {
    try {
      console.log(`=== ПРИНУДИТЕЛЬНАЯ ОЧИСТКА ТЕСТОВЫХ ЗАПИСЕЙ ===`);
      
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        console.error('Нет токена для очистки тестовых записей');
        return;
      }

      // Запрашиваем подтверждение у пользователя
      const confirmed = window.confirm('ПРИНУДИТЕЛЬНАЯ ОЧИСТКА: Удалить все stepCompletion записи для тестовых шагов? Это исправит прогресс 388%.');
      if (!confirmed) {
        console.log('Принудительная очистка отменена пользователем');
        return;
      }

      // Принудительно удаляем ВСЕ записи stepCompletion
      const response = await axios.delete(`/course/${id}/force-clean-all`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Принудительная очистка завершена:', response.data);
      
      // Теперь восстанавливаем только нетекстовые шаги
      const steps = selectedLesson?.steps || [];
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        if (step.type !== 'test' && step.type !== 'quiz') {
          console.log(`Восстанавливаем шаг ${i} (тип: ${step.type})`);
          await axios.post(`/course/${id}/lesson/${selectedLesson.id}/step/${i}/complete`, 
            { lessonProgress: 0 }, 
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }
      }
      
      // Обновляем прогресс
      await loadUserProgress();
      
      // Показываем уведомление
      alert('Принудительная очистка завершена! Прогресс должен быть исправлен.');
      
    } catch (error) {
      console.error('Ошибка при принудительной очистке:', error);
      alert('Ошибка при принудительной очистке: ' + (error.response?.data?.message || error.message));
    }
  };

  // Функция для завершения шага урока
  const handleStepComplete = async (lessonId, stepIndex, payload) => {
    try {
      console.log(`=== ЗАВЕРШЕНИЕ ШАГА ===`);
      console.log(`Завершаем шаг ${stepIndex} урока ${lessonId}`);
      console.log('Payload:', payload);
      console.log('Текущий userProgress:', userProgress);
      console.log('Текущий selectedLesson:', selectedLesson);
      
      const token = localStorage.getItem('jwtToken');
      const numericId = Number(lessonId);
      const isValidDbId = Number.isFinite(numericId) && numericId > 0 && numericId <= 2147483647;

      console.log(`ID урока: ${lessonId}, numericId: ${numericId}, isValidDbId: ${isValidDbId}`);

      if (isValidDbId) {
        // Проверяем, не был ли шаг уже завершен
        const existingStepCompletion = userProgress.stepCompletions?.find(sc => 
          sc.lessonId === numericId && sc.stepIndex === stepIndex
        );
        
        if (existingStepCompletion) {
          console.log(`Шаг ${stepIndex} урока ${lessonId} уже завершен, пропускаем повторное сохранение`);
          return;
        }

        // Передаем прогресс урока в процентах, если есть шаги
        const steps = (selectedLesson?.steps || []);
        const totalSteps = steps.length;
        
        // Рассчитываем прогресс урока с учетом результатов тестов
        let completedCount = (userProgress.stepCompletions || []).filter(sc => sc.lessonId === numericId).length;
        
        // Добавляем текущий шаг, который только что завершается
        completedCount += 1;
        
        // Если это тест, используем простую формулу: результат теста / количество шагов
        if (payload && payload.testResult) {
          const testProgress = payload.testResult.score / totalSteps;
          completedCount = completedCount - 1 + testProgress; // Заменяем 1 на прогресс теста
          console.log(`Тест пройден на ${payload.testResult.score}%, прогресс: ${testProgress.toFixed(2)} (${payload.testResult.score}% / ${totalSteps} шагов)`);
        }
        
        const lessonProgress = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

        // Всегда завершаем шаг, но с правильным прогрессом
        // Если тест не пройден на 100%, шаг все равно считается завершенным, но с частичным прогрессом

        console.log(`Отправляем запрос на /course/${id}/lesson/${numericId}/step/${stepIndex}/complete`);
        console.log(`Данные запроса:`, { lessonProgress, ...(payload || {}) });

        const resp = await axios.post(`/course/${id}/lesson/${numericId}/step/${stepIndex}/complete`, { lessonProgress, ...(payload || {}) }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('Ответ сервера:', resp.data);
        
        if (typeof resp.data?.lessonProgress === 'number') {
          console.log(`Шаг ${stepIndex} урока ${lessonId} завершен. Прогресс урока: ${resp.data.lessonProgress}%`);
          
          // Обновляем локальное состояние шагов
          setSelectedLesson(prev => {
            if (!prev || !Array.isArray(prev.steps)) return prev;
            
            const updatedSteps = [...prev.steps];
            if (updatedSteps[stepIndex]) {
              updatedSteps[stepIndex] = { ...updatedSteps[stepIndex], completed: true };
            }
            
            return { ...prev, steps: updatedSteps };
          });
          
          // Обновляем прогресс в userProgress
          // Добавляем шаг в stepCompletions только если это не тест с 0% результатом
          let newStepCompletions = [...(userProgress.stepCompletions || [])];
          
          if (payload && payload.testResult && payload.testResult.score === 0) {
            // Если тест пройден на 0%, НЕ добавляем шаг в stepCompletions
            console.log(`Тест пройден на 0%, НЕ добавляем шаг ${stepIndex} в stepCompletions`);
          } else {
            // Для всех остальных случаев добавляем шаг
            newStepCompletions.push({ lessonId: numericId, stepIndex });
            console.log(`Добавляем шаг ${stepIndex} в stepCompletions`);
          }
          
          console.log('Новые stepCompletions:', newStepCompletions);
          console.log('Обновляем userProgress с новыми stepCompletions');
          
          setUserProgress(prev => {
            const updated = {
              ...prev,
              stepCompletions: newStepCompletions
            };
            console.log('Обновленный userProgress:', updated);
            return updated;
          });
          
          // Принудительно обновляем состояние для немедленного отображения прогресса
          setTimeout(() => {
            setUserProgress(prev => ({ ...prev }));
          }, 100);
          
          // Обновляем userProgress из сервера для актуальности данных
          await loadUserProgress();
          
          // Если урок полностью завершен, обновляем общий прогресс
          if (resp.data.lessonCompleted) {
            console.log(`Урок ${lessonId} полностью завершен!`);
            // Вызываем handleLessonComplete для обновления общего прогресса
            await handleLessonComplete(lessonId);
          } else {
            // Если урок не завершен, но прогресс изменился, обновляем MyTraining
            const overallProgress = getOverallProgress();
            if (window.updateMyTrainingProgress) {
              window.updateMyTrainingProgress(Number(id), overallProgress);
            } else {
              console.log('Функция updateMyTrainingProgress не найдена');
            }
          }
        }
      }
      
      console.log(`=== КОНЕЦ ЗАВЕРШЕНИЯ ШАГА ===`);
      console.log('Обновленный userProgress:', userProgress);
    } catch (error) {
      console.error('Error completing lesson step:', error);
      console.error('Детали ошибки:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
    }
  };

  const getLessonsForModule = (moduleId) => {
    // Просто возвращаем уроки из модуля
    const mod = modules.find(m => m.id === moduleId);
    if (!mod || !Array.isArray(mod.lessons)) {
      return [];
    }
    
    return mod.lessons.map((lesson, idx) => ({
      id: lesson.id,
      moduleId: moduleId,
      title: lesson.title || lesson.name || t('course.lesson_untitled') || 'Untitled',
      description: lesson.description || '',
      duration: lesson.duration || (lesson.steps ? lesson.steps.length * 5 : 0) || 0,
      videoUrl: lesson.videoUrl || lesson.videoLink || null,
      order: lesson.order || idx + 1,
      steps: Array.isArray(lesson.steps) ? lesson.steps : [],
      content: lesson.content,
    }));
  };

  const getModuleProgressPercent = (moduleId) => {
    const moduleLessons = getLessonsForModule(moduleId);
    if (!Array.isArray(moduleLessons) || moduleLessons.length === 0) return 100;
    
    console.log(`\n=== РАСЧЕТ ПРОГРЕССА МОДУЛЯ ${moduleId} ===`);
    console.log(`Уроки в модуле:`, moduleLessons.map(l => ({ id: l.id, title: l.title })));
    
    // Считаем общий прогресс по урокам модуля
    let totalProgress = 0;
    for (const lesson of moduleLessons) {
      const lessonProgress = getLessonProgress(lesson.id);
      totalProgress += lessonProgress;
      console.log(`Урок ${lesson.id} (${lesson.title}) в модуле ${moduleId}: ${lessonProgress}%`);
    }
    
    const averageProgress = Math.round(totalProgress / moduleLessons.length);
    console.log(`Модуль ${moduleId}: общий прогресс ${averageProgress}% (${totalProgress}/${moduleLessons.length})`);
    console.log(`=== КОНЕЦ РАСЧЕТА ПРОГРЕССА МОДУЛЯ ${moduleId} ===\n`);
    
    return averageProgress;
  };

  const getServerCompletedStepIndices = (lessonId) => {
    const stepCompletions = Array.isArray(userProgress.stepCompletions) ? userProgress.stepCompletions : [];
    return stepCompletions
      .filter(sc => sc && Number(sc.lessonId) === Number(lessonId))
      .map(sc => sc.stepIndex)
      .filter(si => Number.isInteger(si));
  };

  const getLessonStepsCount = (lessonId) => {
    const lesson = findLessonById(lessonId);
    if (lesson && Array.isArray(lesson.steps)) return lesson.steps.length;
    return 0;
  };

  // Функция для получения прогресса конкретного урока из базы данных
  const getLessonProgress = (lid) => {
    const lesson = lessons.find(l => l.id === lid);
    if (!lesson) {
      return 0;
    }
    
    const totalSteps = lesson.steps.length;
    
    if (totalSteps === 0) {
      return 0;
    }
    
    // Получаем завершенные шаги и попытки тестов для этого урока
    const lessonStepCompletions = userProgress?.stepCompletions?.filter(sc => sc.lessonId === lid) || [];
    const lessonTestAttempts = userProgress?.testAttempts?.filter(ta => ta.lessonId === lid) || [];
    
    // Считаем завершенные шаги (исключая тестовые шаги)
    const completedStepIndices = new Set();
    console.log(`=== АНАЛИЗ STEP COMPLETIONS ДЛЯ УРОКА ${lid} ===`);
    console.log('lessonStepCompletions:', lessonStepCompletions);
    lessonStepCompletions.forEach(sc => {
      // Проверяем, является ли шаг тестовым
      const step = lesson.steps[sc.stepIndex];
      console.log(`Шаг ${sc.stepIndex}:`, step);
      if (step && step.type !== 'test' && step.type !== 'quiz') {
        // Добавляем только нетекстовые шаги (исключаем 'test' и 'quiz')
        completedStepIndices.add(sc.stepIndex);
        console.log(`✅ Добавляем нетекстовый шаг ${sc.stepIndex}`);
      } else {
        console.log(`❌ Исключаем тестовый шаг ${sc.stepIndex} (тип: ${step?.type})`);
      }
    });
    console.log(`Итоговые завершенные шаги:`, Array.from(completedStepIndices));
    console.log(`=== КОНЕЦ АНАЛИЗА ===`);
    
    // Добавляем прогресс от тестов (для всех тестов, включая 0%)
    let totalTestProgress = 0;
    lessonTestAttempts.forEach(ta => {
      // Для тестовых шагов прогресс = (результат теста / 100) / общее количество шагов
      // Например: тест 50% = (50/100) / 4 = 0.5 / 4 = 0.125
      const testProgress = (ta.lastScore / 100) / totalSteps;
      totalTestProgress += testProgress;
    });
    
    const completedCount = completedStepIndices.size + totalTestProgress;
    const progress = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;
    
    console.log(`getLessonProgress ${lid}: ${completedStepIndices.size} завершенных шагов + ${totalTestProgress.toFixed(2)} от тестов = ${completedCount.toFixed(2)}/${totalSteps} = ${progress}%`);
    

    
    return progress;
  };

  // Функция для определения цвета прогресса
  const getProgressColor = (percent) => {
    if (percent >= 90) return '#28a745'; // Зеленый для высокого прогресса
    if (percent >= 70) return '#17a2b8'; // Синий для хорошего прогресса
    if (percent >= 50) return '#ffc107'; // Желтый для среднего прогресса
    if (percent >= 25) return '#fd7e14'; // Оранжевый для низкого прогресса
    return '#dc3545'; // Красный для очень низкого прогресса
  };

  const isLessonCompleted = (lessonId) => {
    const progress = getLessonProgress(lessonId);
    return progress >= 100;
  };

  const isLessonAccessible = (lesson, moduleIndex, lessonIndex) => {
    return true;
  };

  const getOverallProgress = () => {
    if (!modules || modules.length === 0) return 0;
    
    let totalSteps = 0;
    let completedSteps = 0;
    
    for (const module of modules) {
      const moduleLessons = getLessonsForModule(module.id);
      
      for (const lesson of moduleLessons) {
        // Получаем количество шагов в уроке
        const lessonSteps = lesson.steps || [];
        totalSteps += lessonSteps.length;
        
        // Используем getLessonProgress для правильного расчета прогресса урока
        const lessonProgress = getLessonProgress(lesson.id);
        const lessonCompletedSteps = (lessonProgress / 100) * lessonSteps.length;
        completedSteps += lessonCompletedSteps;
        
        console.log(`Урок ${lesson.id}: ${lessonProgress}% прогресс, ${lessonCompletedSteps.toFixed(2)}/${lessonSteps.length} шагов`);
        

      }
    }
    
    const overallProgress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
    console.log(`Общий прогресс: ${completedSteps.toFixed(2)}/${totalSteps} шагов = ${overallProgress}%`);
    return overallProgress;
  };

  const broadcastCourseProgress = (progressValue) => {
    try {
      // localStorage.setItem('courseProgressUpdate', JSON.stringify({ courseId: Number(id), progress: progressValue, ts: Date.now() }));
    } catch {}
  };

  // Автоматическое сохранение прогресса курса при каждом изменении
  useEffect(() => {
    if (id && userProgress && Object.keys(userProgress).length > 0) {
      const overallProgress = getOverallProgress();
      console.log(`Автоматическое сохранение прогресса курса ${id}: ${overallProgress}%`);
      
      // Сохраняем общий прогресс курса в БД
      saveCourseProgressToDB(overallProgress);
      
      // Сохраняем общий прогресс курса
      if (window.saveCourseProgress) {
        window.saveCourseProgress(Number(id), overallProgress);
      }
      
      // Синхронизируем с MyTraining
      if (window.updateMyTrainingProgress) {
        window.updateMyTrainingProgress(Number(id), overallProgress);
      }
    }
  }, [userProgress, id]);

  const saveCourseProgressToDB = async (progress) => {
    try {
      const token = localStorage.getItem('jwtToken');
      if (!token || !id) {
        console.log('Пропускаем сохранение прогресса курса - нет токена или ID курса');
        return;
      }

      console.log(`=== СОХРАНЕНИЕ ПРОГРЕССА КУРСА ===`);
      console.log(`Курс ID: ${id}`);
      console.log(`Прогресс: ${progress}%`);
      
      const response = await axios.post(`/course/${id}/progress`, 
        { progress }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log(`Прогресс курса ${id} сохранен в БД:`, response.data);
      console.log(`=== КОНЕЦ СОХРАНЕНИЯ ПРОГРЕССА КУРСА ===`);
    } catch (error) {
      console.error('Ошибка при сохранении прогресса курса в БД:', error);
      console.error('Детали ошибки:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
    }
  };

  // Принудительная загрузка данных при изменении selectedLesson
  useEffect(() => {
    if (selectedLesson === null && id) {
      console.log('Возврат к модулям - загружаем данные');
      setTimeout(() => {
        loadUserProgress();
      }, 100);
    }
  }, [selectedLesson, id]);

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: theme === 'dark' ? '#1a1a1a' : '#f8f9fa',
        color: theme === 'dark' ? '#ffffff' : '#333333'
      }}>
        <NavBar />
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '60vh',
          fontSize: '18px'
        }}>
          {t('course.loading') || 'Загрузка курса...'}
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: theme === 'dark' ? '#1a1a1a' : '#f8f9fa',
        color: theme === 'dark' ? '#ffffff' : '#333333'
      }}>
        <NavBar />
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '60vh',
          fontSize: '18px',
          color: '#dc3545'
        }}>
          {error}
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: theme === 'dark' ? '#1a1a1a' : '#f8f9fa',
      color: theme === 'dark' ? '#ffffff' : '#333333'
    }}>
              <NavBar />
        <ProgressDebugger courseId={id} userProgress={userProgress} modules={modules} getLessonsForModule={getLessonsForModule} getLessonProgress={getLessonProgress} getModuleProgressPercent={getModuleProgressPercent} />
        <AdminCleanup courseId={id} />
        <AuthDebugger />
      
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto', 
        padding: '20px',
        minHeight: 'calc(100vh - 200px)'
      }}>
        {/* Заголовок курса */}
        <div style={{ 
          background: theme === 'dark' ? '#2d2d2d' : '#ffffff',
          borderRadius: '12px',
          padding: '30px',
          marginBottom: '30px',
          border: `1px solid ${theme === 'dark' ? '#404040' : '#e9ecef'}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <button
                onClick={() => history.goBack()}
                style={{
                  background: 'none',
                  border: 'none',
                  color: theme === 'dark' ? '#ffffff' : '#333333',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  padding: '8px',
                  borderRadius: '6px',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.target.style.background = theme === 'dark' ? '#404040' : '#f8f9fa'}
                onMouseOut={(e) => e.target.style.background = 'transparent'}
              >
                <FontAwesomeIcon icon={faArrowLeft} />
              </button>
              <h1 style={{ 
                fontSize: '2rem', 
                fontWeight: '700',
                margin: 0,
                color: theme === 'dark' ? '#ffffff' : '#333333'
              }}>
                {course?.name || course?.title}
              </h1>
            </div>
            
            {/* Кнопка сброса прогресса */}
            <button
              onClick={resetCourseProgress}
              style={{
                background: '#dc3545',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                fontSize: '0.9rem',
                padding: '8px 16px',
                borderRadius: '6px',
                transition: 'background 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseOver={(e) => e.target.style.background = '#c82333'}
              onMouseOut={(e) => e.target.style.background = '#dc3545'}
              title="Сбросить весь прогресс курса"
            >
              <FontAwesomeIcon icon={faTrash} />
              {t('course.reset_progress')}
            </button>
            <button
              onClick={forceCleanTestCompletions}
              style={{
                background: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseOver={(e) => e.target.style.background = '#c82333'}
              onMouseOut={(e) => e.target.style.background = '#dc3545'}
              title="Принудительно исправить прогресс 388%"
            >
              <FontAwesomeIcon icon={faExclamationTriangle} />
              Исправить прогресс
            </button>

          </div>

          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '30px',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FontAwesomeIcon icon={faBook} style={{ color: '#007bff' }} />
              <span>{modules.length} {t('course.modules') || 'модулей'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FontAwesomeIcon icon={faList} style={{ color: '#28a745' }} />
              <span>{(() => {
                const hasModules = Array.isArray(modules) && modules.length > 0;
                if (!hasModules) return 0;
                const count = modules.reduce((sum, m) => sum + (Array.isArray(m?.lessons) ? m.lessons.length : 0), 0);
                return count;
              })()} {t('course.lessons') || 'уроков'}</span>
            </div>
            {course?.duration > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FontAwesomeIcon icon={faClock} style={{ color: '#ffc107' }} />
                <span>{course.duration} {t('course.hours') || 'часов'}</span>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FontAwesomeIcon icon={faGraduationCap} style={{ color: '#17a2b8' }} />
              <span>{getOverallProgress()}% {t('course.completed')}</span>
            </div>
          </div>

          {/* Прогресс-бар */}
          <div style={{ marginTop: '20px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <span style={{ fontSize: '0.9rem', color: theme === 'dark' ? '#cccccc' : '#666666' }}>
                {t('course.progress') || 'Прогресс'}
              </span>
              <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>
                {getOverallProgress()}%
              </span>
            </div>
            <div style={{ 
              width: '100%', 
              height: '8px', 
              background: theme === 'dark' ? '#404040' : '#e9ecef',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{ 
                width: `${getOverallProgress()}%`, 
                height: '100%', 
                background: '#28a745',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        </div>

        {selectedLesson ? (
          /* Отображение выбранного урока */
          <div style={{ 
            background: theme === 'dark' ? '#2d2d2d' : '#ffffff',
            borderRadius: '12px',
            padding: '20px',
            border: `1px solid ${theme === 'dark' ? '#404040' : '#e9ecef'}`
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <button
                  onClick={() => {
                    console.log('Возврат к модулям');
                    setSelectedLesson(null);
                  }}
                  style={{
                    background: 'transparent',
                    border: `1px solid ${theme === 'dark' ? '#404040' : '#e9ecef'}`,
                    color: theme === 'dark' ? '#eaf4fd' : '#333',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    transition: 'background 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.background = theme === 'dark' ? '#404040' : '#f8f9fa'}
                  onMouseOut={(e) => e.target.style.background = 'transparent'}
                >
                  {t('course.back_to_module', { defaultValue: 'Вернуться к модулям' })}
                </button>
              </div>
            </div>
            {(() => {
              console.log('Rendering LessonViewer with:', {
                selectedLessonId: selectedLesson?.id,
                testAttempts,
                testAttemptsLength: testAttempts?.length,
                selectedLessonSteps: selectedLesson?.steps?.length,
                userProgress: userProgress,
                userProgressTestAttempts: userProgress?.testAttempts?.length || 0,
                serverCompletedSteps: (userProgress.stepCompletions || []).filter(sc => sc.lessonId === selectedLesson?.id).map(sc => sc.stepIndex)
              });
              return null;
            })()}
            <LessonViewer 
              lesson={{...selectedLesson, courseId: Number(id)}}
              onComplete={handleLessonComplete}
              onStepComplete={handleStepComplete}
              serverCompletedSteps={(userProgress.stepCompletions || []).filter(sc => sc.lessonId === selectedLesson?.id).map(sc => sc.stepIndex)}
              testAttempts={userProgress?.testAttempts || []}
              userProgress={userProgress}
              onNext={async () => {
                // Логика для перехода к следующему уроку
                const currentModule = modules.find(m => m.id === selectedLesson.moduleId);
                const currentLessons = getLessonsForModule(currentModule?.id);
                const currentIndex = currentLessons.findIndex(l => l.id === selectedLesson.id);
                
                if (currentIndex < currentLessons.length - 1) {
                  // Следующий урок в том же модуле
                  await handleLessonClick(currentLessons[currentIndex + 1]);
                } else {
                  // Переход к первому уроку следующего модуля
                  const currentModuleIndex = modules.findIndex(m => m.id === currentModule?.id);
                  if (currentModuleIndex < modules.length - 1) {
                    const nextModule = modules[currentModuleIndex + 1];
                    const nextModuleLessons = getLessonsForModule(nextModule.id);
                    if (nextModuleLessons.length > 0) {
                      await handleLessonClick(nextModuleLessons[0]);
                    }
                  }
                }
              }}
              onPrevious={async () => {
                // Логика для перехода к предыдущему уроку
                const currentModule = modules.find(m => m.id === selectedLesson.moduleId);
                const currentLessons = getLessonsForModule(currentModule?.id);
                const currentIndex = currentLessons.findIndex(l => l.id === selectedLesson.id);
                
                if (currentIndex > 0) {
                  // Предыдущий урок в том же модуле
                  await handleLessonClick(currentLessons[currentIndex - 1]);
                } else {
                  // Переход к последнему уроку предыдущего модуля
                  const currentModuleIndex = modules.findIndex(m => m.id === currentModule?.id);
                  if (currentModuleIndex > 0) {
                    const prevModule = modules[currentModuleIndex - 1];
                    const prevModuleLessons = getLessonsForModule(prevModule.id);
                    if (prevModuleLessons.length > 0) {
                      await handleLessonClick(prevModuleLessons[prevModuleLessons.length - 1]);
                    }
                  }
                }
              }}
            />

          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
            {/* Боковая панель с модулями */}
            <div style={{ 
              background: theme === 'dark' ? '#2d2d2d' : '#ffffff',
              borderRadius: '12px',
              padding: '20px',
              border: `1px solid ${theme === 'dark' ? '#404040' : '#e9ecef'}`,
              height: 'fit-content'
            }}>
            <h2 style={{ 
              fontSize: '1.3rem', 
              fontWeight: '600', 
              marginBottom: '20px',
              color: theme === 'dark' ? '#ffffff' : '#333333'
            }}>
              {t('course.modules') || 'Модули'}
            </h2>

            {modules.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '24px',
                border: `1px dashed ${theme === 'dark' ? '#404040' : '#e9ecef'}`,
                borderRadius: '8px',
                color: theme === 'dark' ? '#cccccc' : '#666666'
              }}>
                {t('course.no_modules', { defaultValue: 'В курсе пока нет модулей.' })}
              </div>
            ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {modules.map((module, moduleIndex) => {
                const moduleLessons = getLessonsForModule(module.id);
                const moduleProgress = getModuleProgressPercent(module.id);

                return (
                  <div
                    key={module.id}
                    style={{
                      border: `1px solid ${selectedModule?.id === module.id ? '#007bff' : theme === 'dark' ? '#404040' : '#e9ecef'}`,
                      borderRadius: '8px',
                      padding: '15px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      background: selectedModule?.id === module.id ? (theme === 'dark' ? '#1a1a1a' : '#f8f9fa') : 'transparent'
                    }}
                    onClick={() => setSelectedModule(module)}
                    onMouseOver={(e) => {
                      if (selectedModule?.id !== module.id) {
                        e.target.style.borderColor = '#007bff';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (selectedModule?.id !== module.id) {
                        e.target.style.borderColor = theme === 'dark' ? '#404040' : '#e9ecef';
                      }
                    }}
                  >
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '10px'
                    }}>
                      <h3 style={{ 
                        fontSize: '1.1rem', 
                        fontWeight: '600',
                        margin: 0,
                        color: theme === 'dark' ? '#ffffff' : '#333333'
                      }}>
                        {module.title}
                      </h3>
                      <span style={{ 
                        fontSize: '0.8rem',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        background: getProgressColor(moduleProgress),
                        color: 'white',
                        fontWeight: '500'
                      }}>
                        {moduleProgress}%
                      </span>
                    </div>

                    <p style={{ 
                      fontSize: '0.9rem',
                      color: theme === 'dark' ? '#cccccc' : '#666666',
                      marginBottom: '10px',
                      lineHeight: '1.4'
                    }}>
                      {module.description}
                    </p>

                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      fontSize: '0.8rem',
                      color: theme === 'dark' ? '#999999' : '#888888'
                    }}>
                      <span>{moduleLessons.length} {t('course.lessons') || 'уроков'}</span>
                      <span>{moduleLessons.filter(lesson => isLessonCompleted(lesson.id)).length} {t('course.completed')}</span>
                    </div>

                    {/* Прогресс модуля */}
                    <div style={{ 
                      width: '100%', 
                      height: '4px', 
                      background: theme === 'dark' ? '#404040' : '#e9ecef',
                      borderRadius: '2px',
                      marginTop: '8px',
                      overflow: 'hidden'
                    }}>
                      <div style={{ 
                        width: `${moduleProgress}%`, 
                        height: '100%', 
                        background: getProgressColor(moduleProgress),
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </div>

          {/* Основная область с уроками */}
          <div style={{ 
            background: theme === 'dark' ? '#2d2d2d' : '#ffffff',
            borderRadius: '12px',
            padding: '20px',
            border: `1px solid ${theme === 'dark' ? '#404040' : '#e9ecef'}`
          }}>
            {selectedModule ? (
              <>
                <h2 style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: '600', 
                  marginBottom: '20px',
                  color: theme === 'dark' ? '#ffffff' : '#333333'
                }}>
                  {selectedModule.title}
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {getLessonsForModule(selectedModule.id).length === 0 && (
                    <div style={{
                      textAlign: 'center',
                      padding: '24px',
                      border: `1px dashed ${theme === 'dark' ? '#404040' : '#e9ecef'}`,
                      borderRadius: '8px',
                      color: theme === 'dark' ? '#cccccc' : '#666666'
                    }}>
                      {t('course.no_lessons_in_module', { defaultValue: 'В этом модуле пока нет уроков.' })}
                    </div>
                  )}
                  {getLessonsForModule(selectedModule.id).map((lesson, lessonIndex) => {
                    const moduleIndex = modules.findIndex(m => m.id === selectedModule.id);
                    const isCompleted = isLessonCompleted(lesson.id);
                    const isAccessible = isLessonAccessible(lesson, moduleIndex, lessonIndex);
                    const lessonProgress = getLessonProgress(lesson.id);

                    return (
                      <div
                        key={lesson.id}
                        style={{
                          border: `1px solid ${theme === 'dark' ? '#404040' : '#e9ecef'}`,
                          borderRadius: '8px',
                          padding: '20px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          opacity: 1,
                          background: isCompleted ? (theme === 'dark' ? '#1a1a1a' : '#f8f9fa') : 'transparent'
                        }}
                        onClick={() => handleLessonClick(lesson)}
                        onMouseOver={(e) => {
                          e.target.style.borderColor = '#007bff';
                          e.target.style.transform = 'translateY(-2px)';
                        }}
                        onMouseOut={(e) => {
                          e.target.style.borderColor = theme === 'dark' ? '#404040' : '#e9ecef';
                          e.target.style.transform = 'translateY(0)';
                        }}
                      >
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'flex-start',
                          marginBottom: '10px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {isCompleted ? (
                              <FontAwesomeIcon 
                                icon={faCheck} 
                                style={{ 
                                  color: '#28a745',
                                  fontSize: '1.2rem'
                                }} 
                              />
                            ) : (
                              <FontAwesomeIcon 
                                icon={lesson.videoUrl ? faPlay : (Array.isArray(lesson.steps) && lesson.steps.some(s=>s.questions) ? faList : faBook)} 
                                style={{ 
                                  color: '#007bff',
                                  fontSize: '1.2rem'
                                }} 
                              />
                            )}
                            <h3 style={{ 
                              fontSize: '1.1rem', 
                              fontWeight: '600',
                              margin: 0,
                              color: theme === 'dark' ? '#ffffff' : '#333333'
                            }}>
                              {lesson.title}
                            </h3>
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ 
                              fontSize: '0.8rem',
                              color: theme === 'dark' ? '#cccccc' : '#666666'
                            }}>
                              {lesson.duration || 0} {t('course.minutes')}
                            </span>
                          </div>
                        </div>

                        {/* Описание урока: для видео показываем описание; для тестов можно отображать краткий текст */}
                        {(lesson.description || (lesson.videoUrl && lesson.description)) && (
                          <div style={{ 
                            fontSize: '0.9rem',
                            color: theme === 'dark' ? '#cccccc' : '#666666',
                            lineHeight: '1.4',
                            marginBottom: '10px'
                          }}
                          className="promo-html"
                          dangerouslySetInnerHTML={{ __html: lesson.description || '' }}
                          />
                        )}

                        {/* Прогресс-бар урока и шагов (по данным сервера) */}
                        <div style={{ marginBottom: '10px' }}>
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            marginBottom: '5px'
                          }}>
                            <span style={{ 
                              fontSize: '0.8rem',
                              color: theme === 'dark' ? '#cccccc' : '#666666'
                            }}>
                              {t('course.progress')}
                            </span>
                            <span style={{ 
                              fontSize: '0.8rem',
                              fontWeight: '600',
                              color: getProgressColor(lessonProgress)
                            }}>
                              {lessonProgress}%
                            </span>
                          </div>
                          <div style={{ 
                            width: '100%', 
                            height: '6px', 
                            background: theme === 'dark' ? '#404040' : '#e9ecef',
                            borderRadius: '3px',
                            overflow: 'hidden'
                          }}>
                            <div style={{ 
                              width: `${lessonProgress}%`, 
                              height: '100%', 
                              background: getProgressColor(lessonProgress),
                              transition: 'width 0.3s ease'
                            }} />
                          </div>
                        </div>

                        {/* Gating message removed: all lessons are accessible */}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: '60px 20px',
                color: theme === 'dark' ? '#cccccc' : '#666666'
              }}>
                <FontAwesomeIcon 
                  icon={faBook} 
                  style={{ 
                    fontSize: '3rem', 
                    color: '#6c757d', 
                    marginBottom: '20px' 
                  }} 
                />
                <h3 style={{ 
                  fontSize: '1.3rem', 
                  fontWeight: '600', 
                  marginBottom: '10px',
                  color: theme === 'dark' ? '#ffffff' : '#333333'
                }}>
                  {t('course.select_module') || 'Выберите модуль'}
                </h3>
                <p>
                  {t('course.select_module_description') || 'Выберите модуль из списка слева, чтобы просмотреть уроки'}
                </p>
              </div>
            )}
          </div>
        </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Course; 