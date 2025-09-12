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
  faList,
  faEye
} from '@fortawesome/free-solid-svg-icons';
import axios from '../utils/axios';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import LessonViewer from '../components/LessonViewer';

import useTheme from '../hooks/useTheme';
import '../admin/admin.css';
import { useTranslation } from 'react-i18next';
import { getAvatarUrl, getVideoUrl } from '../utils/minioUtils';

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

          const response = await axios.post(`https://localhost:9000/course/${courseId}/lesson/${lessonId}/progress`, 
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
          console.log(`Прогресс будет обновлен автоматически через useEffect`);
        }, 100);
      });
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
        const progressResponse = await axios.get(`https://localhost:9000/course/${validCourseId}/progress/${validUserId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Загружаем полный syllabus
        const fullSyllabusResponse = await axios.get(`https://localhost:9000/course/${validCourseId}/full-syllabus`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const { stepCompletions, testAttempts } = progressResponse.data;
        const fullSyllabusModules = fullSyllabusResponse.data.modules || [];

        // Если нет модулей, возвращаем 0% (нечего проходить)
        if (!Array.isArray(fullSyllabusModules) || fullSyllabusModules.length === 0) {
          console.log(`Нет модулей, возвращаем 0% (нечего проходить)`);
          return 0;
        }
        
        console.log(`\n=== РАСЧЕТ ОБЩЕГО ПРОГРЕССА КУРСА ${validCourseId} ===`);
        console.log(`Найдено модулей: ${fullSyllabusModules.length}`);
        console.log(`Данные о шагах: ${stepCompletions?.length || 0} завершенных шагов`);
        console.log(`Данные о тестах: ${testAttempts?.length || 0} попыток тестов`);

        let totalModuleProgress = 0;
        let moduleCount = 0;

        for (const module of fullSyllabusModules) {
          let moduleProgress = 0;
          let lessonCount = 0;
          let lessonsWithSteps = 0;

          if (Array.isArray(module.lessons)) {
            // Если в модуле нет уроков, пропускаем модуль
            if (module.lessons.length === 0) {
              console.log(`Модуль ${module.id} (${module.title}): НЕТ УРОКОВ - пропускаем в расчете`);
              continue; // Пропускаем этот модуль
            } else {
              for (const lesson of module.lessons) {
                let lessonProgress = 0;
                let stepCount = 0;

                if (Array.isArray(lesson.steps) && lesson.steps.length > 0) {
                  lessonsWithSteps++;
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
                } else {
                  console.log(`  Урок ${lesson.id} (${lesson.name}): НЕТ ШАГОВ - пропускаем в расчете`);
                }

                if (stepCount > 0) {
                  const lessonAvg = Math.round(lessonProgress / stepCount);
                  moduleProgress += lessonAvg;
                  console.log(`  Урок ${lesson.id} (${lesson.name}): ${lessonAvg}% (${lessonProgress}/${stepCount} шагов)`);
                }
                lessonCount++;
              }
            }
          }

          // Учитываем модуль только если у него есть уроки с шагами
          if (lessonsWithSteps > 0) {
            const moduleAvg = Math.round(moduleProgress / lessonsWithSteps);
            totalModuleProgress += moduleAvg;
            console.log(`Модуль ${module.id} (${module.title}): ${moduleAvg}% (${moduleProgress}/${lessonsWithSteps} уроков с шагами)`);
            moduleCount++;
          } else {
            console.log(`Модуль ${module.id} (${module.title}): НЕТ УРОКОВ С ШАГАМИ - пропускаем в расчете`);
          }
        }

        if (moduleCount > 0) {
          const averageProgress = Math.round(totalModuleProgress / moduleCount);
          console.log(`Общий прогресс курса ${validCourseId}: ${averageProgress}% (${totalModuleProgress}/${moduleCount} модулей)`);
          console.log(`=== КОНЕЦ РАСЧЕТА ОБЩЕГО ПРОГРЕССА КУРСА ${validCourseId} ===\n`);
          return Math.max(0, Math.min(100, averageProgress));
        }

        // Если нет модулей с уроками, возвращаем 0% (нечего проходить)
        console.log(`Нет модулей с уроками, возвращаем 0% (нечего проходить)`);
        return 0;
      } catch (error) {
        console.error(`Ошибка при расчете прогресса курса ${courseId}:`, error);
        return 0;
      }
    };



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
      
      const progressResponse = await axios.get(`https://localhost:9000/course/${validCourseId}/progress/${validUserId}`, {
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

      const courseResponse = await axios.get(`https://localhost:9000/course/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCourse(courseResponse.data);

      let modulesWithLessons = [];
      let allLessons = [];
      
      try {
        const fullSyllabusResponse = await axios.get(`https://localhost:9000/course/${id}/full-syllabus`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('Full syllabus API response:', fullSyllabusResponse);
        const syllabusData = fullSyllabusResponse.data;
        modulesWithLessons = syllabusData.modules || [];
        allLessons = syllabusData.modules?.flatMap(m => m.lessons || []) || [];
        
        console.log('=== FULL SYLLABUS ДАННЫЕ ===');
        console.log('Syllabus data:', syllabusData);
        console.log('Modules from full syllabus:', modulesWithLessons);
        console.log('All lessons from full syllabus:', allLessons);
        
        // Проверяем названия модулей из full-syllabus
        if (modulesWithLessons.length > 0) {
          console.log('=== ПРОВЕРКА НАЗВАНИЙ МОДУЛЕЙ ИЗ FULL-SYLLABUS ===');
          modulesWithLessons.forEach((module, index) => {
            console.log(`Модуль ${index + 1} из full-syllabus:`, {
              id: module.id,
              title: module.title,
              description: module.description,
              order: module.order,
              lessonsCount: module.lessons?.length || 0
            });
            
            // Проверяем, есть ли проблемы с названием модуля
            if (module.title && (module.title.startsWith('Модуль ') || module.title.includes('Модуль с ID'))) {
              console.log(`⚠️ Модуль ${module.id} из full-syllabus имеет временное название: "${module.title}"`);
            } else if (module.title) {
              console.log(`✅ Модуль ${module.id} из full-syllabus имеет правильное название: "${module.title}"`);
            } else {
              console.log(`❌ Модуль ${module.id} из full-syllabus не имеет названия`);
            }
          });
          console.log('=== КОНЕЦ ПРОВЕРКИ НАЗВАНИЙ МОДУЛЕЙ ===');
        }
        
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
          
          // Load lessons from database using correct endpoint
          let lessons = [];
          
          try {
            // Используем правильный endpoint /lessons с фильтрацией по курсу (как в SyllabusEditor)
            const lessonsResponse = await axios.get(`https://localhost:9000/lessons?course=${id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            console.log('Lessons API response:', lessonsResponse);
            lessons = lessonsResponse.data || [];
            console.log('Loaded lessons from /lessons?course=:', lessons.length);
            
            // Convert lessons to proper format with real moduleId
            lessons = lessons.map(lesson => ({
              id: lesson.id,
              name: lesson.name || lesson.title || `Lesson ${lesson.id}`,
              title: lesson.name || lesson.title || `Lesson ${lesson.id}`,
              content: lesson.content || '',
              videoLink: lesson.videoLink || null,
              videoUrl: lesson.videoLink ? getVideoUrl(lesson.videoLink) : null,
              type: 'video',
              steps: lesson.steps || [],
              moduleId: lesson.moduleId || null, // Используем реальный moduleId из базы данных
              order: lesson.order || 0
            }));
            
            console.log('Converted lessons with real moduleId:', lessons.length);
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
          
          console.log('Final lessons loaded:', lessons);
          console.log('Lessons count:', lessons.length);
          
          // --- Раскладываем уроки по модулям ---
          if (modulesWithLessons.length === 0) {
            modulesWithLessons = [];
            console.log('No modules found - admin should create them manually');
          } else if (modulesWithLessons.length > 0) {
            console.log('=== ПРИВЯЗКА УРОКОВ К МОДУЛЯМ ===');
            modulesWithLessons = modulesWithLessons.map(module => {
              // Находим уроки для этого модуля по реальному moduleId
              const moduleLessons = lessons.filter(lesson => {
                const lessonModuleId = lesson.moduleId;
                const matches = lessonModuleId && Number(lessonModuleId) === Number(module.id);
                if (matches) {
                  console.log(`✅ Урок "${lesson.title || lesson.name}" (ID: ${lesson.id}) привязан к модулю ${module.id}`);
                }
                return matches;
              });
              
              console.log(`Модуль ${module.id} (${module.title}): найдено ${moduleLessons.length} уроков`);
              
              return {
                ...module,
                lessons: moduleLessons
              };
            });
            console.log('=== КОНЕЦ ПРИВЯЗКИ УРОКОВ ===');
          }
          
          allLessons = lessons || [];
        }
        
      } catch (fullSyllabusError) {
        console.warn('Failed to load full syllabus, trying fallback approach');
        
        // Fallback: загружаем модули и уроки отдельно
        let modules = [];
        try {
          const modulesResponse = await axios.get(`https://localhost:9000/course/${id}/modules`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          console.log('=== МОДУЛИ ИЗ /course/:id/modules ===');
          console.log('Modules API response:', modulesResponse);
          modules = modulesResponse.data || [];
          console.log('Loaded modules:', modules);
          console.log('Modules count:', modules.length);
          
          // Дополнительная отладочная информация для модулей
          if (modules.length > 0) {
            console.log('=== ДЕТАЛЬНАЯ ИНФОРМАЦИЯ О МОДУЛЯХ ИЗ API ===');
            modules.forEach((module, index) => {
              console.log(`Module ${index + 1}:`, {
                id: module.id,
                title: module.title,
                description: module.description,
                order: module.order,
                lessons: module.lessons || []
              });
              
              // Проверяем, есть ли проблемы с названием модуля
              if (module.title && (module.title.startsWith('Модуль ') || module.title.includes('Модуль с ID'))) {
                console.log(`⚠️ Модуль ${module.id} имеет временное название: "${module.title}"`);
              } else if (module.title) {
                console.log(`✅ Модуль ${module.id} имеет правильное название: "${module.title}"`);
              } else {
                console.log(`❌ Модуль ${module.id} не имеет названия`);
              }
            });
            console.log('=== КОНЕЦ ИНФОРМАЦИИ О МОДУЛЯХ ===');
          }
        } catch (modulesError) {
          console.warn('Failed to load modules, using empty array');
          modules = [];
        }
        
        // Load lessons from database
        let lessons = [];
        
        try {
          const lessonsResponse = await axios.get(`https://localhost:9000/course/${id}/lessons`, {
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
            videoUrl: (lesson.videoUrl || lesson.videoLink) ? getVideoUrl(lesson.videoUrl || lesson.videoLink) : null,
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
        console.log('Lessons without moduleId:', lessons.filter(l => !(l.moduleId || l.module_id)).length);
        
        // Дополнительная отладочная информация
        if (lessons.length > 0) {
          console.log('Sample lesson structure:', lessons[0]);
          console.log('Lesson IDs:', lessons.map(l => l.id));
          console.log('Lesson names:', lessons.map(l => l.title || l.name));
          console.log('Lesson moduleIds:', lessons.map(l => l.moduleId || l.module_id));
          
          // Показываем уроки без moduleId
          const orphanedLessons = lessons.filter(l => !(l.moduleId || l.module_id));
          if (orphanedLessons.length > 0) {
            console.log('⚠️ Уроки без привязки к модулям:', orphanedLessons.map(l => ({ id: l.id, title: l.title || l.name })));
          }
        }
        
        // --- Раскладываем уроки по модулям ---
        if (modules.length === 0 && lessons.length > 0) {
          // Создаем модули автоматически только если их действительно нет в API
          const lessonsPerModule = 3;
          const numberOfModules = Math.ceil(lessons.length / lessonsPerModule);
          
          modulesWithLessons = [];
          for (let i = 0; i < numberOfModules; i++) {
            const moduleLessons = lessons.slice(i * lessonsPerModule, (i + 1) * lessonsPerModule);
            modulesWithLessons.push({
              id: `temp_module_${i + 1}`,
              title: `Модуль ${i + 1}`,
              description: `Автоматически созданный модуль ${i + 1}`,
              order: i + 1,
              lessons: moduleLessons
            });
          }
        } else if (modulesWithLessons.length > 0) {
          // Используем существующие модули из API (даже если они пустые)
          console.log('=== ПРИВЯЗКА УРОКОВ К МОДУЛЯМ ===');
          modulesWithLessons = modulesWithLessons.map(module => {
            // Находим уроки для этого модуля
            const moduleLessons = lessons.filter(lesson => {
              const lessonModuleId = lesson.moduleId || lesson.module_id;
              const matches = lessonModuleId && Number(lessonModuleId) === Number(module.id);
              if (matches) {
                console.log(`✅ Урок "${lesson.title || lesson.name}" (ID: ${lesson.id}) привязан к модулю ${module.id}`);
              }
              return matches;
            });
            
            console.log(`Модуль ${module.id} (${module.title}): найдено ${moduleLessons.length} уроков`);
            
            // Возвращаем модуль с его реальным названием, даже если уроков нет
            return {
              ...module,
              lessons: moduleLessons
            };
          });
          console.log('=== КОНЕЦ ПРИВЯЗКИ УРОКОВ ===');
          
          console.log('Using existing modules from API with lessons assigned by moduleId');
        } else {
          modulesWithLessons = [];
        }
        
        allLessons = lessons || [];
      }

      // Устанавливаем данные
      console.log('=== ПЕРЕД setModules ===');
      console.log('modulesWithLessons перед setModules:', modulesWithLessons);
      console.log('Проверяем названия модулей:');
      modulesWithLessons.forEach((module, index) => {
        console.log(`  Модуль ${index + 1}: ID=${module.id}, Title="${module.title}", Description="${module.description}"`);
      });
      console.log('=== КОНЕЦ ПРОВЕРКИ ===');
      
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
      console.log('=== ДЕТАЛЬНАЯ ИНФОРМАЦИЯ О МОДУЛЯХ ===');
      modulesWithLessons.forEach((module, index) => {
        console.log(`Module ${index + 1} (${module.id}): "${module.title}" - ${module.lessons?.length || 0} lessons`);
        if (module.lessons && module.lessons.length > 0) {
          module.lessons.forEach((lesson, lessonIndex) => {
            console.log(`  Lesson ${lessonIndex + 1}: ${lesson.title || lesson.name} (ID: ${lesson.id})`);
            console.log(`    Steps: ${lesson.steps?.length || 0}`);
            console.log(`    ModuleId: ${lesson.moduleId || lesson.module_id || 'НЕ ПРИВЯЗАН'}`);
          });
        } else {
          console.log(`  ⚠️ Модуль ${module.id} не имеет уроков!`);
        }
      });
      console.log('=== КОНЕЦ ИНФОРМАЦИИ О МОДУЛЯХ ===');

      // Загружаем прогресс пользователя
      await loadUserProgress();

      // Устанавливаем первый модуль как выбранный по умолчанию
      if (modulesWithLessons && modulesWithLessons.length > 0) {
        setSelectedModule(modulesWithLessons[0]);
      }

      // Синхронизируем прогресс с MyTraining после загрузки данных
      setTimeout(() => {
        console.log(`Прогресс будет обновлен автоматически через useEffect`);
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
      const refreshed = await axios.get(`https://localhost:9000/course/${id}/lessons`, {
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
        const completed = 0;
        moduleKey = String(currentModule.id);
        moduleProgress = 0;
        console.log(`Прогресс модуля ${currentModule.id}: ${completed}/${currentLessons.length} = ${moduleProgress}%`);
      }

      if (isValidDbId) {
        const resp = await axios.post(`https://localhost:9000/course/${id}/lesson/${numericId}/complete`, { moduleKey, moduleProgress }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (typeof resp.data?.totalProgress === 'number') {
          console.log(`Получен новый прогресс с сервера: ${resp.data.totalProgress}%`);
          setUserProgress(prev => ({ ...prev, totalProgress: resp.data.totalProgress }));
          
          // Прогресс обновится автоматически через useEffect
          console.log(`Прогресс будет обновлен автоматически через useEffect`);
        } else {
          // Прогресс обновится автоматически через useEffect
          console.log(`Прогресс будет обновлен автоматически через useEffect`);
        }
      } else {
        // Прогресс обновится автоматически через useEffect
        console.log(`Прогресс будет обновлен автоматически через useEffect`);
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



    } catch (error) {
      console.error('Error completing lesson:', error);
      // Даже при ошибке бэкенда фиксируем локальный прогресс для визуального отклика
      setUserProgress(prev => ({
        ...prev,
        completedLessonIds: Array.from(new Set([...(prev?.completedLessonIds || []).map(normalizeLessonId), normalizeLessonId(lessonId)]))
      }));
      
      // Прогресс обновится автоматически через useEffect
      console.log(`Прогресс будет обновлен автоматически через useEffect`);
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

      const response = await axios.delete(`https://localhost:9000/course/${id}/reset-progress`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Прогресс курса сброшен:', response.data);
      
      // Обновляем прогресс
      await loadUserProgress();
      
      // Прогресс обновится автоматически через useEffect
      console.log(`Прогресс будет обновлен автоматически через useEffect`);
      
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
      const response = await axios.delete(`https://localhost:9000/course/${id}/force-clean-all`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Принудительная очистка завершена:', response.data);
      
      // Теперь восстанавливаем только нетекстовые шаги
      const steps = selectedLesson?.steps || [];
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        if (step.type !== 'test' && step.type !== 'quiz') {
          console.log(`Восстанавливаем шаг ${i} (тип: ${step.type})`);
          await axios.post(`https://localhost:9000/course/${id}/lesson/${selectedLesson.id}/step/${i}/complete`, 
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

        const resp = await axios.post(`https://localhost:9000/course/${id}/lesson/${numericId}/step/${stepIndex}/complete`, { lessonProgress, ...(payload || {}) }, {
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
            // Прогресс обновится автоматически через useEffect
            console.log(`Прогресс будет обновлен автоматически через useEffect`);
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
      console.log(`getLessonsForModule: модуль ${moduleId} не найден или не имеет уроков`);
      return [];
    }
    
    console.log(`getLessonsForModule: модуль ${moduleId} имеет ${mod.lessons.length} уроков`);
    
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







  const isLessonAccessible = (lesson, moduleIndex, lessonIndex) => {
    return true;
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

  // Отслеживаем изменения в modules
  useEffect(() => {
    console.log('=== STATE MODULES ИЗМЕНИЛСЯ ===');
    console.log('Новые modules:', modules);
    if (modules.length > 0) {
      console.log('Проверяем названия модулей в state:');
      modules.forEach((module, index) => {
        console.log(`  State Модуль ${index + 1}: ID=${module.id}, Title="${module.title}", Description="${module.description}"`);
      });
    }
    console.log('=== КОНЕЦ ПРОВЕРКИ STATE ===');
  }, [modules]);

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
                  {t('course.back_to_module')}
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
              {t('course.modules')}
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
                    </div>

                    {/* Отображение порядка модуля */}
                    <div style={{ 
                      fontSize: '0.85rem',
                      color: theme === 'dark' ? '#999999' : '#666666',
                      marginBottom: '8px',
                      fontStyle: 'italic'
                    }}>
                      Модуль {module.order || (moduleIndex + 1)}
                    </div>

                    {/* Убираем описание модуля */}
                    {/* <p style={{ 
                      fontSize: '0.9rem',
                      color: theme === 'dark' ? '#cccccc' : '#666666',
                      marginBottom: '10px',
                      lineHeight: '1.4'
                    }}>
                      {module.description}
                    </p> */}

                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      fontSize: '0.8rem',
                      color: theme === 'dark' ? '#999999' : '#888888'
                    }}>
                      <span>{moduleLessons.length} {t('course.lessons') || 'уроков'}</span>
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

                {/* Отображение порядка модуля */}
                <div style={{ 
                  fontSize: '1rem',
                  color: theme === 'dark' ? '#999999' : '#666666',
                  marginBottom: '20px',
                  fontStyle: 'italic'
                }}>
                  Модуль {selectedModule.order || 'N/A'}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {getLessonsForModule(selectedModule.id).length === 0 && (
                    <div style={{
                      textAlign: 'center',
                      padding: '24px',
                      border: `1px dashed ${theme === 'dark' ? '#404040' : '#e9ecef'}`,
                      borderRadius: '8px',
                      color: theme === 'dark' ? '#cccccc' : '#666666'
                    }}>
                      {t('lessons.no_lessons_in_module')}
                    </div>
                  )}
                  {getLessonsForModule(selectedModule.id).map((lesson, lessonIndex) => {
                    const moduleIndex = modules.findIndex(m => m.id === selectedModule.id);
                    const isCompleted = false;
                    const isAccessible = true;

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
                  {t('course.select_module') }
                </h3>
                <p>
                  {t('course.select_module_description')}
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