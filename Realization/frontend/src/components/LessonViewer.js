import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlay, 
  faPause, 
  faVolumeUp, 
  faVolumeMute,
  faExpand,
  faCompress,
  
  faArrowLeft,
  faArrowRight,
  faVideo,
  faFileAlt,
  faQuestionCircle,
  faEye,
  faEyeSlash,
     faTimes
 } from '@fortawesome/free-solid-svg-icons';
import useTheme from '../hooks/useTheme';
import axios from '../utils/axios';
import jwt_decode from 'jwt-decode';

const LessonViewer = ({ lesson, onComplete, onNext, onPrevious, onStepComplete, serverCompletedSteps = [], testAttempts: initialTestAttempts = [], userProgress = {} }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [testAnswers, setTestAnswers] = useState({});
  const [showTestResults, setShowTestResults] = useState(false);
  const [testAttempts, setTestAttempts] = useState(initialTestAttempts);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(false);
  const [isResetting, setIsResetting] = useState(false); 
  const [resetCounter, setResetCounter] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({}); 

  // Функция инициализации прогресса
  const initializeProgress = async () => {
    try {
      console.log('=== ИНИЦИАЛИЗАЦИЯ ПРОГРЕССА ===');
      console.log('lesson?.id:', lesson?.id);
      console.log('lesson?.courseId:', lesson?.courseId);
      console.log('userProgress:', userProgress);
      console.log('userProgress.stepCompletions:', userProgress?.stepCompletions);
      console.log('userProgress.testAttempts:', userProgress?.testAttempts);
      console.log('userProgress.lessonProgresses:', userProgress?.lessonProgresses);
      
      if (!lesson?.id || !userProgress) {
        console.log('Нет данных для инициализации');
        setIsInitialized(true);
        return;
      }
      
      console.log(`Инициализация Steps для урока ${lesson.id}`);
      
      // Загружаем прогресс из БД
      const dbCompletedSteps = await loadLessonProgress();
      console.log('Загруженные завершенные шаги из БД:', dbCompletedSteps);
      
      // Создаем новый Set с загруженными шагами
      const completedStepsSet = new Set(dbCompletedSteps);
      
      // Добавляем уже завершенные шаги из локального состояния
      completedSteps.forEach(stepIndex => completedStepsSet.add(stepIndex));
      
      console.log('Итоговые завершенные шаги:', Array.from(completedStepsSet));
      console.log('Текущие completedSteps до установки:', Array.from(completedSteps));
      setCompletedSteps(completedStepsSet);
      console.log('completedSteps установлены');
      setIsInitialized(true);
      console.log(`Урок ${lesson.id} инициализирован`);
      console.log('=== КОНЕЦ ИНИЦИАЛИЗАЦИИ ПРОГРЕССА ===');
      
    } catch (error) { 
      console.error('Ошибка при инициализации completedSteps:', error);
      setIsInitialized(true);
    }
  };

  // Сохраняем прогресс при изменении страницы
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (lesson?.id && completedSteps.size > 0 && lesson.courseId && lesson.courseId !== 'unknown') {
        const lessonProgress = getLessonProgressPercent();
        console.log(`Сохранение прогресса при изменении страницы: урок ${lesson.id}, прогресс ${lessonProgress}%`);
        saveLessonProgressToDB(lessonProgress);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [lesson?.id, completedSteps, lesson?.courseId]);

  // Сохраняем прогресс перед выходом из компонента
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (lesson?.id && lesson.courseId && lesson.courseId !== 'unknown') {
        const lessonProgress = getLessonProgressPercent();
        saveLessonProgressToDB(lessonProgress);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Сохраняем при размонтировании компонента только если есть токен
      const token = localStorage.getItem('jwtToken');
      if (token) {
        handleBeforeUnload();
      }
    };
  }, [lesson?.id, completedSteps]);

  // Получаем шаги урока из данных урока
  let lessonSteps = lesson?.steps || lesson?.content?.steps || [];
  
  // Отладочная информация о шагах
  console.log('LessonViewer - данные урока:', {
    lessonId: lesson?.id,
    courseId: lesson?.courseId,
    lessonSteps: lessonSteps,
    lessonStepsLength: lessonSteps.length,
    firstStep: lessonSteps[0]
  });
  
  // Детальная информация о каждом шаге (всегда показываем для отладки)
  console.log('=== ДЕТАЛЬНАЯ ИНФОРМАЦИЯ О ШАГАХ ===');
  lessonSteps.forEach((step, index) => {
    console.log(`Шаг ${index}:`, {
      id: step.id,
      type: step.type,
      title: step.title,
      videoUrl: step.videoUrl,
      video: step.video,
      content: step.content,
      description: step.description,
      fullStep: step
    });
  });
  console.log('=== КОНЕЦ ИНФОРМАЦИИ О ШАГАХ ===');

  const saveStepProgress = async (stepIndex, isCompleted, testResult = null) => {
    try {
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        console.warn('Токен не найден при сохранении прогресса шага');
        return;
      }

      const decoded = jwt_decode(token);
      const courseId = lesson?.courseId;
      const lessonId = lesson?.id;

      if (!courseId || !lessonId || courseId === 'unknown') {
        console.error('Неверные данные урока:', { courseId, lessonId });
        return;
      }

      // Проверяем, не был ли шаг уже завершен
      const existingStepCompletion = (userProgress.stepCompletions || []).find(
        sc => sc.lessonId === Number(lessonId) && sc.stepIndex === stepIndex
      );

      if (existingStepCompletion && isCompleted) {
        console.log(`Шаг ${stepIndex} уже завершен на сервере`);
        return;
      }

      // Отправляем запрос на завершение шага только если шаг действительно завершен
      if (isCompleted) {
        console.log(`=== ЗАВЕРШЕНИЕ ШАГА ===`);
        console.log(`Шаг ${stepIndex} завершается с результатом:`, testResult);
        const response = await axios.post(
          `/course/${courseId}/lesson/${lessonId}/step/${stepIndex}/complete`,
          { testResult },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        console.log(`Шаг ${stepIndex} сохранен:`, response.data);
      } else {
        console.log(`=== СОХРАНЕНИЕ РЕЗУЛЬТАТА ТЕСТА БЕЗ ЗАВЕРШЕНИЯ ШАГА ===`);
        console.log(`Шаг ${stepIndex} НЕ завершается (isCompleted: ${isCompleted}), только сохраняем результат теста`);
        // Для тестов с 0% результатом отправляем запрос на /complete, но бэкенд не завершит шаг
        if (testResult) {
          console.log(`Отправляем результат теста на /course/${courseId}/lesson/${lessonId}/step/${stepIndex}/complete`);
          const response = await axios.post(
            `/course/${courseId}/lesson/${lessonId}/step/${stepIndex}/complete`,
            { testResult },
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );
          console.log(`Результат теста для шага ${stepIndex} сохранен:`, response.data);
        }
      }
    } catch (error) {
      console.error('Ошибка при сохранении шага:', error);
    }
  };

  const loadLessonProgress = () => {
    try {
      console.log('=== ЗАГРУЗКА ПРОГРЕССА УРОКА ===');
      console.log('lesson?.id:', lesson?.id);
      console.log('lesson?.courseId:', lesson?.courseId);
      console.log('userProgress:', userProgress);
      
      if (!lesson?.id || !userProgress) {
        console.log('Нет данных для загрузки прогресса');
        return [];
      }

      // Получаем завершенные шаги из userProgress
      const stepCompletions = userProgress.stepCompletions || [];
      const lessonStepCompletions = stepCompletions.filter(sc => {
        if (!sc || typeof sc !== 'object') return false;
        return sc.lessonId === lesson.id;
      });
      
      console.log('Step completions для урока:', lessonStepCompletions);
      
      // Получаем попытки тестов из userProgress
      const testAttempts = userProgress.testAttempts || [];
      const lessonTestAttempts = testAttempts.filter(ta => {
        if (!ta || typeof ta !== 'object') return false;
        return ta.lessonId === lesson.id;
      });
      
      console.log('Test attempts для урока:', lessonTestAttempts);
      
      // Создаем список завершенных шагов
      const completedSteps = new Set();
      
      // Сначала добавляем все завершенные шаги из stepCompletions
      lessonStepCompletions.forEach(sc => {
        if (typeof sc.stepIndex === 'number') {
          completedSteps.add(sc.stepIndex);
          console.log(`Добавляем завершенный шаг ${sc.stepIndex} из stepCompletions`);
        }
      });
      
      // Затем добавляем шаги с тестами (если они еще не добавлены)
      lessonTestAttempts.forEach(ta => {
        if (ta.attempts > 0 && typeof ta.stepIndex === 'number') {
          // НЕ добавляем шаги с тестами в loadLessonProgress
          // Шаги с тестами должны добавляться только если они уже есть в stepCompletions
          console.log(`НЕ добавляем шаг с тестом ${ta.stepIndex} (попыток: ${ta.attempts}, результат: ${ta.lastScore}%) - тесты не добавляются в loadLessonProgress`);
        }
      });
      
      // Сортируем результат для стабильности
      const result = Array.from(completedSteps).sort((a, b) => a - b);
      console.log('Итоговые завершенные шаги (отсортированные):', result);
      console.log('=== КОНЕЦ ЗАГРУЗКИ ПРОГРЕССА УРОКА ===');
      
      // Дополнительная проверка - убеждаемся, что возвращаем массив
      if (!Array.isArray(result)) {
        console.error('loadLessonProgress: результат не является массивом, возвращаем пустой массив');
        return [];
      }
      
      return result;
      
    } catch (error) {
      console.error('Ошибка при загрузке прогресса урока:', error);
      return [];
    }
  };

  // Инициализация при загрузке урока
  useEffect(() => {
    console.log('=== USEFFECT ИНИЦИАЛИЗАЦИИ ===');
    console.log('lesson?.id:', lesson?.id);
    console.log('userProgress:', userProgress);
    console.log('userProgress существует:', !!userProgress);
    console.log('userProgress.stepCompletions:', userProgress?.stepCompletions?.length || 0);
    console.log('userProgress.testAttempts:', userProgress?.testAttempts?.length || 0);
    
    if (lesson?.id && userProgress) {
      console.log(`Инициализация урока ${lesson.id}`);
      
      // Загружаем завершенные шаги
      const completedStepsList = loadLessonProgress();
      console.log('Результат loadLessonProgress:', completedStepsList, 'тип:', typeof completedStepsList);
      
      if (Array.isArray(completedStepsList)) {
        console.log('Создаем Set из массива:', completedStepsList);
        try {
          setCompletedSteps(new Set(completedStepsList));
        } catch (error) {
          console.error('Ошибка при создании Set:', error);
          setCompletedSteps(new Set());
        }
      } else {
        console.error('loadLessonProgress вернул не массив:', completedStepsList);
        setCompletedSteps(new Set());
      }
      
      // Загружаем попытки тестов из userProgress
      console.log('=== ЗАГРУЗКА ПОПЫТОК ТЕСТОВ ===');
      console.log('userProgress.testAttempts:', userProgress.testAttempts);
      console.log('userProgress.testAttempts.length:', userProgress.testAttempts?.length || 0);
      
      if (userProgress.testAttempts && Array.isArray(userProgress.testAttempts)) {
        const lessonTestAttempts = userProgress.testAttempts.filter(ta => {
          const attemptLessonId = Number(ta.lessonId);
          const currentLessonId = Number(lesson.id);
          console.log(`Сравнение попыток: ${attemptLessonId} === ${currentLessonId}`);
          return attemptLessonId === currentLessonId;
        });
        console.log(`Загружены попытки тестов для урока ${lesson.id}:`, lessonTestAttempts);
        console.log(`Количество попыток для урока ${lesson.id}:`, lessonTestAttempts.length);
        setTestAttempts(lessonTestAttempts);
      } else {
        console.log('Нет попыток тестов в userProgress');
        setTestAttempts([]);
      }
      console.log('=== КОНЕЦ ЗАГРУЗКИ ПОПЫТОК ТЕСТОВ ===');
      
      // Загружаем ответы на тесты
      if (userProgress.testAttempts && Array.isArray(userProgress.testAttempts)) {
        const lessonTestAttempts = userProgress.testAttempts.filter(ta => {
          const attemptLessonId = Number(ta.lessonId);
          const currentLessonId = Number(lesson.id);
          return attemptLessonId === currentLessonId;
        });
        const answers = {};
        lessonTestAttempts.forEach(ta => {
          if (ta.lastAnswers && typeof ta.lastAnswers === 'object') {
            answers[ta.stepIndex] = ta.lastAnswers;
          }
        });
        console.log(`Загружены ответы на тесты для урока ${lesson.id}:`, answers);
        setTestAnswers(answers);
      }
    } else {
      console.log('Пропускаем инициализацию - нет lesson.id или userProgress');
      // Инициализируем пустые состояния
      setCompletedSteps(new Set());
      setTestAttempts([]);
      setTestAnswers({});
    }
  }, [lesson?.id, userProgress]);

  // Сохранение прогресса при изменении completedSteps
  useEffect(() => {
    if (lesson?.id && completedSteps.size > 0 && lesson.courseId && lesson.courseId !== 'unknown') {
      const lessonProgress = getLessonProgressPercent();
      saveLessonProgressToDB(lessonProgress);
    }
  }, [completedSteps, lesson?.id]);

  const getLessonProgressPercent = () => {
    if (!lessonSteps || lessonSteps.length === 0) return 0;
    

    
    // Проверяем сохраненный прогресс урока
    const lessonProgresses = userProgress?.lessonProgresses || [];
    const savedProgress = lessonProgresses.find(lp => lp.lessonId === Number(lesson?.id));
    
    // Используем ту же логику, что и в Course.js - берем данные из userProgress
    const stepCompletions = userProgress?.stepCompletions || [];
    const testAttempts = userProgress?.testAttempts || [];
    
    const lessonStepCompletions = stepCompletions.filter(sc => sc.lessonId === Number(lesson?.id));
    const lessonTestAttempts = testAttempts.filter(ta => ta.lessonId === Number(lesson?.id));
    
    // Считаем завершенные шаги (исключая тестовые шаги)
    const completedStepIndices = new Set();
    lessonStepCompletions.forEach(sc => {
      // Проверяем, является ли шаг тестовым
      const step = lessonSteps[sc.stepIndex];
      if (step && step.type !== 'test' && step.type !== 'quiz') {
        // Добавляем только нетекстовые шаги (исключаем 'test' и 'quiz')
        completedStepIndices.add(sc.stepIndex);
      }
    });
    
    // Добавляем прогресс от тестов (для всех тестов, включая 0%)
    let totalTestProgress = 0;
    lessonTestAttempts.forEach(ta => {
      // Для тестовых шагов прогресс = (результат теста / 100) / общее количество шагов
      // Например: тест 50% = (50/100) / 4 = 0.5 / 4 = 0.125
      const testProgress = (ta.lastScore / 100) / lessonSteps.length;
      totalTestProgress += testProgress;
    });
    
    const completedCount = completedStepIndices.size + totalTestProgress;
    const calculatedProgress = lessonSteps.length > 0 ? Math.round((completedCount / lessonSteps.length) * 100) : 0;
    
    // Всегда используем рассчитанный прогресс, а не сохраненный
    const finalProgress = calculatedProgress;
    
    return finalProgress;
  };

  const getProgressColor = (percent) => {
    if (percent >= 90) return '#28a745'; 
    if (percent >= 70) return '#17a2b8'; 
    if (percent >= 50) return '#ffc107';
    if (percent >= 25) return '#fd7e14';
    return '#dc3545';
  };

  // Функция для проверки завершения урока
  const isLessonCompleted = () => {
    if (!lessonSteps || lessonSteps.length === 0) return false;
    
    for (let i = 0; i < lessonSteps.length; i++) {
      const step = lessonSteps[i];
      const stepType = step.type || 'text';
      const isCompleted = completedSteps.has(i);
      
      if (stepType === 'test') {
        // Для тестовых шагов проверяем попытки
        if (testAttempts && testAttempts.length > 0 && lesson?.id) {
          const attempt = testAttempts.find(a => 
            Number(a.lessonId) === Number(lesson.id) && 
            Number(a.stepIndex) === i
          );
          if (!attempt || attempt.attempts === 0) {
            return false; // Нет попыток теста
          }
          // Если есть попытки, считаем шаг завершенным (даже если не 100%)
        } else if (!isCompleted) {
          return false; // Нет попыток и шаг не завершен
        }
      } else if (!isCompleted) {
        return false; // Нетекстовый шаг не завершен
      }
    }
    
    return true; // Все шаги завершены
  };
  
  // Отладочная информация
  console.log('Lesson data received:', {
    lesson,
    hasSteps: !!lesson?.steps,
    hasContent: !!lesson?.content,
    hasText: !!lesson?.text,
    hasDescription: !!lesson?.description,
    contentType: typeof lesson?.content,
    textType: typeof lesson?.text,
    descriptionType: typeof lesson?.description
  });
  
  if (lesson?.content) {
    console.log('Lesson content:', lesson.content);
  }
  if (lesson?.text) {
    console.log('Lesson text:', lesson.text);
  }
  if (lesson?.description) {
    console.log('Lesson description:', lesson.description);
  }
  
  // Обрабатываем шаги, если они есть
  if (lessonSteps.length > 0) {
    console.log('Processing lesson steps:', lessonSteps);
    
    lessonSteps = lessonSteps.map((step, index) => {
      console.log(`Processing step ${index}:`, step);
      
      // Проверяем, не является ли шаг JSON строкой с тестом
      if (typeof step === 'string') {
        try {
          const parsedStep = JSON.parse(step);
          if (parsedStep && typeof parsedStep === 'object' && parsedStep.questions) {
            console.log('Detected test JSON in step string:', parsedStep);
            return {
              type: 'test',
              title: `Тест ${index + 1}`,
              questions: parsedStep.questions,
              description: 'Тест по материалу урока'
            };
          }
        } catch (e) {
          console.log('Step is not JSON:', e);
        }
      }
      
      // Проверяем содержимое шага
      if (step && typeof step === 'object') {
        // Если в шаге есть JSON с вопросами
        if (step.content && typeof step.content === 'string') {
          try {
            const parsedContent = JSON.parse(step.content);
            if (parsedContent && typeof parsedContent === 'object' && parsedContent.questions) {
              console.log('Detected test JSON in step content:', parsedContent);
              return {
                type: 'test',
                title: step.title || `Тест ${index + 1}`,
                questions: parsedContent.questions,
                description: step.description || 'Тест по материалу урока'
              };
            }
          } catch (e) {
            console.log('Step content is not JSON:', e);
          }
        }
        
        // Если в шаге есть JSON с вопросами в поле text
        if (step.text && typeof step.text === 'string') {
          try {
            const parsedText = JSON.parse(step.text);
            if (parsedText && typeof parsedText === 'object' && parsedText.questions) {
              console.log('Detected test JSON in step text:', parsedText);
              return {
                type: 'test',
                title: step.title || `Тест ${index + 1}`,
                questions: parsedText.questions,
                description: step.description || 'Тест по материалу урока'
              };
            }
          } catch (e) {
            console.log('Step text is not JSON:', e);
          }
        }
        
        // Если в шаге есть JSON с videoUrl в поле content
        if (step.content && typeof step.content === 'string') {
          try {
            const parsedContent = JSON.parse(step.content);
            console.log(`Step ${index} parsed content:`, parsedContent);
            if (parsedContent && typeof parsedContent === 'object' && parsedContent.videoUrl) {
              console.log('Detected video JSON in step content:', parsedContent);
              return {
                type: 'video',
                title: step.title || `Видео ${index + 1}`,
                videoUrl: parsedContent.videoUrl,
                description: step.description || ''
              };
            }
            // Проверяем на код
            if (parsedContent && typeof parsedContent === 'object' && parsedContent.code) {
              console.log('Detected code JSON in step content:', parsedContent);
              return {
                type: 'code',
                title: step.title || `Код ${index + 1}`,
                code: parsedContent.code,
                language: parsedContent.language || 'javascript',
                description: parsedContent.description || parsedContent.text || step.description || ''
              };
            }
            // Проверяем на видео файл
            if (parsedContent && typeof parsedContent === 'object' && (parsedContent.video || parsedContent.file)) {
              console.log('Detected video file JSON in step content:', parsedContent);
              return {
                type: 'video',
                title: step.title || `Видео ${index + 1}`,
                videoUrl: parsedContent.video || parsedContent.file,
                description: step.description || ''
              };
            }
          } catch (e) {
            console.log('Step content is not video/code JSON:', e);
          }
        }
        
        // Обычная обработка шага
        if (step.type === 'test' || step.questions) {
          return {
            type: 'test',
            title: step.title || `Тест ${index + 1}`,
            questions: step.questions,
            description: step.description
          };
        } else if (step.type === 'video' || step.videoUrl || step.videoFile) {
          // Проверяем, есть ли видео в JSON content
          let videoUrl = step.videoUrl || step.videoFile;
          if (!videoUrl && step.content && typeof step.content === 'string') {
            try {
              const parsedContent = JSON.parse(step.content);
              if (parsedContent && typeof parsedContent === 'object') {
                videoUrl = parsedContent.videoUrl || parsedContent.video || parsedContent.file;
              }
            } catch (e) {
              console.log('Не удалось распарсить video content как JSON:', e);
            }
          }
          
          return {
            type: 'video',
            title: step.title || `Видео ${index + 1}`,
            videoUrl: videoUrl,
            description: step.description
          };
        } else if (step.type === 'code' || step.code) {
          // Проверяем, есть ли код в JSON content
          let code = step.code;
          let language = step.language || 'javascript';
          let description = step.description || '';
          
          if (!code && step.content && typeof step.content === 'string') {
            try {
              const parsedContent = JSON.parse(step.content);
              if (parsedContent && typeof parsedContent === 'object') {
                code = parsedContent.code;
                language = parsedContent.language || 'javascript';
                description = parsedContent.description || parsedContent.text || step.description || '';
              }
            } catch (e) {
              console.log('Не удалось распарсить code content как JSON:', e);
            }
          }
          
          return {
            type: 'code',
            title: step.title || `Код ${index + 1}`,
            code: code,
            language: language,
            description: description
          };
        } else {
          return {
            type: 'text',
            title: step.title || `Шаг ${index + 1}`,
            content: step.content || step.text || JSON.stringify(step),
            description: step.description
          };
        }
      }
      
      // Если шаг - это просто строка
      return {
        type: 'text',
        title: `Шаг ${index + 1}`,
        content: step,
        description: ''
      };
    });
  }
  
  // Если шагов нет, но есть контент урока, создаем один шаг
  if (lessonSteps.length === 0 && lesson) {
    if (lesson.videoUrl || lesson.videoLink) {
      lessonSteps = [{
        type: 'video',
        title: lesson.title,
        videoUrl: lesson.videoUrl || lesson.videoLink,
        description: lesson.description
      }];
    } else if (lesson.content || lesson.text) {
      // Проверяем, не является ли контент JSON с тестом
      let contentToCheck = lesson.content || lesson.text;
      
      if (typeof contentToCheck === 'string') {
        try {
          // Убираем лишние кавычки и экранирование
          let cleanContent = contentToCheck.replace(/\\"/g, '"').replace(/^"|"$/g, '');
          const parsed = JSON.parse(cleanContent);
          
          // Если это JSON с вопросами, создаем тестовый шаг
          if (parsed && typeof parsed === 'object' && parsed.questions) {
            console.log('Detected test JSON in lesson content:', parsed);
            lessonSteps = [{
              type: 'test',
              title: lesson.title || 'Тест',
              questions: parsed.questions,
              description: lesson.description
            }];
          } else {
            // Обычный текстовый шаг
            lessonSteps = [{
              type: 'text',
              title: lesson.title,
              content: lesson.content || lesson.text,
              description: lesson.description
            }];
          }
        } catch (e) {
          console.log('Content is not JSON, treating as text:', e);
          // Обычный текстовый шаг
          lessonSteps = [{
            type: 'text',
            title: lesson.title,
            content: lesson.content || lesson.text,
            description: lesson.description
          }];
        }
      } else {
        // Обычный текстовый шаг
        lessonSteps = [{
          type: 'text',
          title: lesson.title,
          content: lesson.content || lesson.text,
          description: lesson.description
        }];
      }
    }
  }
  
  // Отладочная информация о результатах обработки
  console.log('Final lesson steps after processing:', lessonSteps);
  lessonSteps.forEach((step, index) => {
    console.log(`Step ${index + 1}:`, {
      type: step.type,
      title: step.title,
      hasQuestions: !!step.questions,
      questionsCount: step.questions?.length || 0,
      content: step.content,
      description: step.description
    });
  });
  
  // Отладочная информация
  console.log('Lesson data:', lesson);
  console.log('Lesson steps:', lessonSteps);
  
  // Дополнительная отладка для каждого шага
  lessonSteps.forEach((step, index) => {
    console.log(`Step ${index + 1}:`, {
      type: step?.type,
      title: step?.title,
      hasContent: !!step?.content,
      hasText: !!step?.text,
      hasQuestions: !!step?.questions,
      hasCode: !!step?.code,
      hasVideo: !!(step?.videoUrl || step?.video)
    });
  });

  useEffect(() => {
    if (lesson?.id && Array.isArray(lessonSteps) && lessonSteps.length > 0) {
      const step = lessonSteps[0] || {};
      const type = step?.type || (typeof step === 'object' ? step.type : 'text') || 'text';
      // Для неинтерактивных шагов (text/code) полагаться на их собственный useEffect,
      // который вызовет onComplete. Здесь дополнительной логики не требуется.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson?.id]);

  // Всегда переходим на первый шаг при открытии урока
  useEffect(() => {
    if (lesson?.id) {
      setCurrentStepIndex(0);
    }
  }, [lesson?.id]);

  useEffect(() => {
    // Сброс состояния при смене урока
    setCurrentStepIndex(0);
    setCompletedSteps(new Set());
    setTestAnswers({});
    setShowTestResults(false);
    setIsInitialized(false);
    console.log(`Сброс состояния для урока ${lesson?.id}`);
  }, [lesson?.id]);

  // Если первый шаг текст/код и ещё не завершён, отметим его после инициализации состояния
  useEffect(() => {
    if (!lesson?.id) return;
    const idx = 0;
    const steps = Array.isArray(lessonSteps) ? lessonSteps : [];
    if (steps.length === 0) return;
    if (completedSteps.has(idx)) return;
    const step = steps[idx] || {};
    const type = (step?.type || '').toLowerCase();
    
    // Автоматически завершаем только текстовые и кодовые шаги, НЕ тесты
    if (type === 'text' || type === 'code') {
      console.log(`Автоматически завершаем ${type} шаг ${idx}`);
      const t = setTimeout(() => {
        handleStepComplete(idx);
      }, 50);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson?.id]); // Убираем completedSteps.size из зависимостей

  const handleStepComplete = (stepIndex) => {
    console.log(`Завершаем шаг ${stepIndex} урока ${lesson?.id}`);
    
    // Проверяем, не был ли шаг уже завершен
    if (completedSteps.has(stepIndex)) {
      console.log(`Шаг ${stepIndex} уже завершен, пропускаем`);
      return;
    }

    // Добавляем шаг в локальное состояние
    const newCompletedSteps = new Set(completedSteps);
    newCompletedSteps.add(stepIndex);
    setCompletedSteps(newCompletedSteps);

    // НЕМЕДЛЕННО сохраняем шаг в БД
    const currentStep = lessonSteps[stepIndex];
    const isTestStep = currentStep && (currentStep.type === 'test' || currentStep.type === 'quiz');

    if (!isTestStep) {
      console.log(`Сохраняем шаг ${stepIndex} в БД`);
      saveStepProgress(stepIndex, true);
    }

    // Уведомляем родительский компонент
    if (onStepComplete && lesson?.id) {
      onStepComplete(lesson.id, stepIndex);
    }
    
    // Проверяем, завершен ли урок
    if (isLessonCompleted()) {
      console.log(`Урок ${lesson?.id} завершен`);
      if (onComplete) {
        onComplete(lesson.id);
      }
    }
  };

  const handleTestSubmit = (stepIndex, result) => {
    console.log(`=== HANDLE TEST SUBMIT ===`);
    console.log(`Шаг ${stepIndex}, результат:`, result);
    console.log(`Урок ID: ${lesson?.id}`);
    console.log(`Курс ID: ${lesson?.courseId}`);
    
    setTestAnswers(prev => ({ ...prev, [stepIndex]: (result && result.answers) ? result.answers : result }))
    setShowTestResults(true);
    
    // НЕМЕДЛЕННО сохраняем попытку на сервере и в БД
    try {
      if (onStepComplete && lesson?.id) {
        const score = result && typeof result.score === 'number' ? result.score : 0;
        const isPassed = !!(result && result.isPassed === true);
        console.log(`НЕМЕДЛЕННО вызываем onStepComplete с результатом теста: score=${score}, isPassed=${isPassed}`);
        onStepComplete(lesson.id, stepIndex, { testResult: { score, isPassed, answers: (result && result.answers) ? result.answers : {} } });
      }
      
      // НЕМЕДЛЕННО сохраняем результат теста в БД
      const score = result && typeof result.score === 'number' ? result.score : 0;
      const isPassed = !!(result && result.isPassed === true);
      console.log(`НЕМЕДЛЕННО сохраняем результат теста в БД: score=${score}, isPassed=${isPassed}`);
      saveStepProgress(stepIndex, false, { // Не завершаем шаг автоматически
        score: score,
        isPassed: isPassed,
        answers: (result && result.answers) ? result.answers : {}
      });
    } catch (error) {
      console.error('Ошибка при сохранении результата теста:', error);
    }
    
    // Обновляем локальное состояние testAttempts
    const newAttempt = {
      lessonId: lesson?.id,
      stepIndex: stepIndex,
      attempts: 1,
      lastScore: result && typeof result.score === 'number' ? result.score : 0,
      lastPassed: !!(result && result.isPassed === true),
      lastAnswers: (result && result.answers) ? result.answers : {}
    };
    
    setTestAttempts(prev => {
      const existingIndex = prev.findIndex(a => {
        const attemptLessonId = Number(a.lessonId);
        const currentLessonId = Number(lesson?.id);
        const attemptStepIndex = Number(a.stepIndex);
        const currentStepIndex = Number(stepIndex);
        return attemptLessonId === currentLessonId && attemptStepIndex === currentStepIndex;
      });
      
      if (existingIndex >= 0) {
        console.log(`Обновляем существующую попытку для шага ${stepIndex}`);
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          attempts: (updated[existingIndex].attempts || 0) + 1,
          lastScore: newAttempt.lastScore,
          lastPassed: newAttempt.lastPassed,
          lastAnswers: newAttempt.lastAnswers
        };
        return updated;
      } else {
        console.log(`Создаем новую попытку для шага ${stepIndex}`);
        return [...prev, newAttempt];
      }
    });
    
    const score = result && typeof result.score === 'number' ? result.score : 0;
    console.log(`Тест завершен на ${score}%, шаг ${stepIndex}`);
    
    // Принудительно обновляем userProgress для получения актуальных testAttempts
    if (window.updateUserProgress) {
      console.log('Принудительно обновляем userProgress для синхронизации попыток');
      window.updateUserProgress();
    }
    
    // Завершаем шаг только если результат больше 0%
    if (score > 0) {
      console.log(`Тест завершен на ${score}%, завершаем шаг ${stepIndex} с прогрессом ${score}%`);
      
      // Проверяем, не был ли шаг уже завершен
      if (!completedSteps.has(stepIndex)) {
        // Добавляем шаг в локальное состояние
        const newCompletedSteps = new Set(completedSteps);
        newCompletedSteps.add(stepIndex);
        setCompletedSteps(newCompletedSteps);
        
        // НЕМЕДЛЕННО сохраняем прогресс на сервере
        saveStepProgress(stepIndex, true);
        
        // Уведомляем родительский компонент
        if (onStepComplete && lesson?.id) {
          onStepComplete(lesson.id, stepIndex);
        }
        
        // Обновляем прогресс урока и курса
        updateProgressAfterTest(stepIndex, score, true);
      } else {
        console.log(`Шаг ${stepIndex} уже завершен, пропускаем повторное завершение`);
      }
    } else {
      console.log(`Тест завершен на ${score}%, шаг НЕ завершается (0% результат)`);
      console.log('=== ПРОВЕРКА: НЕ добавляем шаг в completedSteps ===');
      console.log('=== ПРОВЕРКА: НЕ вызываем onStepComplete ===');
      console.log('=== ПРОВЕРКА: Только сохраняем результат теста ===');
      
      // НЕ добавляем шаг в completedSteps
      // НЕ вызываем onStepComplete
      // Только сохраняем результат теста
      saveStepProgress(stepIndex, false, { 
        score: score,
        isPassed: false,
        answers: (result && result.answers) ? result.answers : {}
      });
    }
  };

  const updateProgressAfterTest = (stepIndex, score, isCompleted) => {
    console.log(`=== ОБНОВЛЕНИЕ ПРОГРЕССА ПОСЛЕ ТЕСТА ===`);
    console.log(`Шаг ${stepIndex}, результат: ${score}%, завершен: ${isCompleted}`);
    
    // Получаем актуальные шаги урока
    const currentLessonSteps = lesson?.steps || lesson?.content?.steps || [];
    
    // Проверяем, что currentLessonSteps существует и является массивом
    if (!Array.isArray(currentLessonSteps)) {
      console.error('currentLessonSteps не является массивом:', currentLessonSteps);
      return;
    }
    
    // Проверяем, что completedSteps является Set
    if (!(completedSteps instanceof Set)) {
      console.error('completedSteps не является Set:', completedSteps);
      return;
    }
    
    // Обновляем прогресс урока с учетом частичного прохождения
    const totalSteps = currentLessonSteps.length;
    
    // Считаем завершенные шаги (100% результат)
    const fullyCompletedSteps = Array.from(completedSteps).length;
    
    // Простая формула: результат теста / количество шагов
    const testProgress = score / totalSteps;
    const totalProgress = fullyCompletedSteps + testProgress;
    const lessonProgress = totalSteps > 0 ? Math.round((totalProgress / totalSteps) * 100) : 0;
    
    console.log(`Прогресс урока: ${fullyCompletedSteps} завершенных шагов + ${testProgress.toFixed(2)} от теста (${score}% / ${totalSteps}) = ${totalProgress.toFixed(2)}/${totalSteps} = ${lessonProgress}%`);
    
    // Обновляем userProgress для урока
    if (window.updateUserProgress) {
      window.updateUserProgress();
    }
    
    // Обновляем прогресс курса через родительский компонент только если тест завершен
    if (onStepComplete && lesson?.id && isCompleted) {
      // Передаем информацию о прогрессе урока
      const lessonProgressData = {
        lessonId: lesson.id,
        lessonProgress: lessonProgress,
        stepIndex: stepIndex,
        score: score,
        isCompleted: isCompleted,
        testProgress: testProgress
      };
      
      console.log('Отправляем данные о прогрессе урока:', lessonProgressData);
      onStepComplete(lesson.id, stepIndex, { 
        testResult: { score, isPassed: isCompleted, answers: {} },
        lessonProgress: lessonProgressData
      });
    } else if (!isCompleted) {
      console.log('Тест не завершен (0% результат), НЕ вызываем onStepComplete');
    }
    
    console.log(`=== КОНЕЦ ОБНОВЛЕНИЯ ПРОГРЕССА ===`);
  };

  const handleNextStep = () => {
    console.log(`handleNextStep: текущий шаг ${currentStepIndex}, всего шагов ${lessonSteps.length}`);
    if (currentStepIndex < lessonSteps.length - 1) {
      const nextStepIndex = currentStepIndex + 1;
      console.log(`Переходим к следующему шагу: ${nextStepIndex}`);
      setCurrentStepIndex(nextStepIndex);
      
      // Сбрасываем состояние теста для нового шага
      setShowTestResults(false);
      setIsSubmitted(false);
      setTestResults(null);
      setSelectedAnswers({});
      
      // Проверяем, есть ли попытки для следующего шага
      const hasAttempts = testAttempts.some(a => 
        Number(a.lessonId) === Number(lesson?.id) && 
        Number(a.stepIndex) === nextStepIndex
      );
      
      // Показываем результаты только если есть попытки И мы явно хотим их показать
      if (hasAttempts) {
        console.log(`Найдены попытки для шага ${nextStepIndex}, но НЕ показываем результаты автоматически`);
        // setShowTestResults(true); // Закомментировано - не показываем автоматически
      }
    } else {
      console.log('Уже на последнем шаге, переход невозможен');
    }
  };

  const handlePreviousStep = () => {
    console.log(`handlePreviousStep: текущий шаг ${currentStepIndex}, всего шагов ${lessonSteps.length}`);
    if (currentStepIndex > 0) {
      const prevStepIndex = currentStepIndex - 1;
      console.log(`Переходим к предыдущему шагу: ${prevStepIndex}`);
      setCurrentStepIndex(prevStepIndex);
      
      // Сбрасываем состояние теста для нового шага
      setShowTestResults(false);
      setIsSubmitted(false);
      setTestResults(null);
      setSelectedAnswers({});
      
      // Проверяем, есть ли попытки для предыдущего шага
      const hasAttempts = testAttempts.some(a => 
        Number(a.lessonId) === Number(lesson?.id) && 
        Number(a.stepIndex) === prevStepIndex
      );
      
      // Показываем результаты только если есть попытки И мы явно хотим их показать
      if (hasAttempts) {
        console.log(`Найдены попытки для шага ${prevStepIndex}, но НЕ показываем результаты автоматически`);
        // setShowTestResults(true); // Закомментировано - не показываем автоматически
      }
    } else {
      console.log('Уже на первом шаге, переход невозможен');
    }
  };

  // Функция для проверки наличия попыток для конкретного шага
  const hasTestAttempts = (stepIndex) => {
    console.log('=== hasTestAttempts ===');
    console.log('hasTestAttempts called with:', { stepIndex, testAttempts, lessonId: lesson?.id });
    console.log('testAttempts array:', testAttempts);
    console.log('testAttempts length:', testAttempts?.length || 0);
    
    if (!testAttempts || !lesson?.id) {
      console.log('No testAttempts or lessonId, returning false');
      return false;
    }
    
    const hasAttempts = testAttempts.some(a => {
      const attemptLessonId = Number(a.lessonId);
      const currentLessonId = Number(lesson.id);
      const attemptStepIndex = Number(a.stepIndex);
      const currentStepIndex = Number(stepIndex);
      
      console.log('Checking attempt:', { 
        attemptLessonId, 
        currentLessonId, 
        attemptStepIndex, 
        currentStepIndex,
        lessonIdMatch: attemptLessonId === currentLessonId,
        stepIndexMatch: attemptStepIndex === currentStepIndex
      });
      
      return attemptLessonId === currentLessonId && attemptStepIndex === currentStepIndex;
    });
    console.log('hasTestAttempts result:', hasAttempts);
    console.log('=== КОНЕЦ hasTestAttempts ===');
    return hasAttempts;
  };

  const renderStep = (step, index) => {
    const isActive = index === currentStepIndex;
    const isCompleted = completedSteps.has(index);

    console.log(`renderStep: шаг ${index}, активен: ${isActive}, завершен: ${isCompleted}, currentStepIndex: ${currentStepIndex}`);

    if (!isActive) return null;

    // Автоматически определяем тип шага на основе содержимого
    const determineStepType = (step) => {
      if (!step || typeof step !== 'object') return 'text';
      // ВАЖНО: Если тип уже установлен как 'test', ВСЕГДА используем его
      if (step.type === 'test') {
        console.log('Step explicitly marked as test:', step);
        return 'test';
      }
      
      // Если тип уже установлен как другой (кроме 'text'), используем его
      if (step.type && step.type !== 'text') {
        return step.type;
      }
      
      // Проверяем содержимое на наличие вопросов
      const content = (step && (step.content || step.text || step.questions || step.description)) || '';
      
      // Проверяем строку на наличие вопросов
      if (typeof content === 'string') {
        const rawStr = content;
        if (rawStr.includes('"questions"') || rawStr.includes('"question"')) {
          console.log('Auto-detected test from string content:', content);
          return 'test';
        }
        // Попытаться распарсить JSON-строку
        try {
          let clean = rawStr.replace(/\\\"/g, '"').replace(/^"|"$/g, '');
          const parsed = JSON.parse(clean);
          if (parsed && typeof parsed === 'object') {
            if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.question) return 'test';
            if (parsed.questions && Array.isArray(parsed.questions)) return 'test';
          }
        } catch {}
        
        // Попробуем найти JSON в строке
        try {
          const jsonMatch = rawStr.match(/\{.*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed && typeof parsed === 'object' && parsed.questions) {
              console.log('Auto-detected test from JSON match in string:', parsed);
              return 'test';
            }
          }
        } catch {}
      }
      
      // Проверяем объект на наличие вопросов
      if (typeof content === 'object' && content !== null) {
        if (content.questions || (Array.isArray(content) && content.length > 0 && content[0]?.question)) {
          console.log('Auto-detected test from object content:', content);
          return 'test';
        }
      }
      
      // Проверяем на наличие видео
      if (step.videoUrl || step.video || (typeof content === 'string' && content.toLowerCase().includes('video'))) {
        return 'video';
      }
      
      // Проверяем на наличие кода
      if (step.code || step.language || (typeof content === 'string' && content.includes('"code"'))) {
        return 'code';
      }
      
      // По умолчанию текст
      return 'text';
    };

    // Нормализуем step чтобы избежать чтения свойств undefined
    const safeStep = step || { type: 'text', content: '' };
    const stepType = determineStepType(safeStep);
    console.log('Step type determined:', { 
      originalType: safeStep.type, 
      determinedType: stepType, 
      step: safeStep,
      hasVideoUrl: !!safeStep.videoUrl,
      hasVideo: !!safeStep.video,
      hasVideoInContent: typeof safeStep.content === 'string' && safeStep.content.toLowerCase().includes('video')
    });

    switch (stepType) {
      case 'video':
        return <VideoStep step={safeStep} onComplete={() => handleStepComplete(index)} />;
      case 'text':
        return <TextStep step={safeStep} onComplete={() => handleStepComplete(index)} />;
      case 'test':
        // Проверяем, есть ли попытки для этого теста
        const hasAttempts = hasTestAttempts(index);
        console.log(`Test step ${index}: hasAttempts = ${hasAttempts}, testAttempts =`, testAttempts);
        console.log(`Test step ${index}: lesson.id = ${lesson?.id}, showTestResults = ${showTestResults}`);
        
        return (
          <TestStep 
            step={safeStep} 
            onComplete={(result) => handleTestSubmit(index, result)}
            showResults={hasAttempts || showTestResults} // Показываем результаты если есть попытки
            userAnswers={testAnswers[index]}
            testAttempts={testAttempts}
            stepIndex={index}
            lessonId={lesson?.id}
          />
        );
      case 'code':
        return <CodeStep step={safeStep} onComplete={() => handleStepComplete(index)} />;
      default:
        return <TextStep step={safeStep} onComplete={() => handleStepComplete(index)} />;
    }
  };

  const saveLessonProgressToDB = async (progress) => {
    try {
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        console.warn('Токен не найден при сохранении прогресса урока - это нормально при размонтировании компонента');
        return;
      }

      const decoded = jwt_decode(token);
      const lessonId = lesson?.id;
      const courseId = lesson?.courseId;

      if (!lessonId || !courseId || courseId === 'unknown') {
        console.error('Неверные данные урока:', { lessonId, courseId });
        return;
      }

      const response = await axios.post(
        `/course/${courseId}/lesson/${lessonId}/progress`,
        { progress },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      console.log(`Прогресс урока ${lessonId} сохранен: ${progress}%`);
    } catch (error) {
      console.error('Ошибка при сохранении прогресса урока:', error);
    }
  };

  if (!lesson) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '60px 20px',
        color: theme === 'dark' ? '#cccccc' : '#666666'
      }}>
        <h3>{t('lesson.no_lesson_selected') || 'Урок не выбран'}</h3>
        <p>{t('lesson.select_lesson_to_view') || 'Выберите урок для просмотра'}</p>
      </div>
    );
  }

  return (
    <div style={{ 
      background: theme === 'dark' ? '#1a1a1a' : '#ffffff',
      borderRadius: '12px',
      border: `1px solid ${theme === 'dark' ? '#404040' : '#e9ecef'}`,
      overflow: 'hidden'
    }}>
      {/* Заголовок урока */}
      <div style={{ 
        padding: '20px',
        borderBottom: `1px solid ${theme === 'dark' ? '#404040' : '#e9ecef'}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h2 style={{ 
            fontSize: '1.3rem', 
            fontWeight: '600',
            marginBottom: '5px',
            color: theme === 'dark' ? '#ffffff' : '#333333'
          }}>
            {lesson.title}
          </h2>
          <p style={{ 
            fontSize: '0.9rem',
            color: theme === 'dark' ? '#cccccc' : '#666666'
          }}>
            {lesson.description}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          {onPrevious && (
            <button
              onClick={onPrevious}
              style={{
                padding: '8px 12px',
                background: 'none',
                border: `1px solid ${theme === 'dark' ? '#404040' : '#e9ecef'}`,
                borderRadius: '6px',
                color: theme === 'dark' ? '#ffffff' : '#333333',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.target.style.background = theme === 'dark' ? '#404040' : '#f8f9fa'}
              onMouseOut={(e) => e.target.style.background = 'transparent'}
            >
              <FontAwesomeIcon icon={faArrowLeft} />
            </button>
          )}
          
          {onNext && (
            <button
              onClick={onNext}
              style={{
                padding: '8px 12px',
                background: 'none',
                border: `1px solid ${theme === 'dark' ? '#404040' : '#e9ecef'}`,
                borderRadius: '6px',
                color: theme === 'dark' ? '#ffffff' : '#333333',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.target.style.background = theme === 'dark' ? '#404040' : '#f8f9fa'}
              onMouseOut={(e) => e.target.style.background = 'transparent'}
            >
              <FontAwesomeIcon icon={faArrowRight} />
            </button>
          )}
        </div>
      </div>

      {/* Прогресс урока */}
      {lessonSteps.length > 0 && (
        <div style={{ 
          padding: '15px 20px',
          borderBottom: `1px solid ${theme === 'dark' ? '#404040' : '#e9ecef'}`
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <span style={{ 
              fontSize: '0.9rem', 
              color: theme === 'dark' ? '#cccccc' : '#666666' 
            }}>
              {t('lesson.lesson_progress')}
            </span>
            <span style={{ 
              fontSize: '0.9rem', 
              fontWeight: '600',
              color: getProgressColor(getLessonProgressPercent())
            }}>
              {getLessonProgressPercent()}%
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
              width: `${getLessonProgressPercent()}%`, 
              height: '100%', 
              background: getProgressColor(getLessonProgressPercent()),
              transition: 'width 0.3s'
            }} />
          </div>
        </div>
      )}

      {/* Навигация по шагам */}
      {lessonSteps.length > 1 && (
        <div style={{ 
          padding: '15px 20px',
          borderBottom: `1px solid ${theme === 'dark' ? '#404040' : '#e9ecef'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button
            onClick={handlePreviousStep}
            disabled={currentStepIndex === 0}
            style={{
              padding: '8px 16px',
              background: currentStepIndex === 0 ? '#6c757d' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: currentStepIndex === 0 ? 'not-allowed' : 'pointer',
              opacity: currentStepIndex === 0 ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            {t('lesson.previous_step')}
          </button>
          

          
          <button
            onClick={handleNextStep}
            disabled={currentStepIndex === lessonSteps.length - 1}
            style={{
              padding: '8px 16px',
              background: currentStepIndex === lessonSteps.length - 1 ? '#6c757d' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: currentStepIndex === lessonSteps.length - 1 ? 'not-allowed' : 'pointer',
              opacity: currentStepIndex === lessonSteps.length - 1 ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {t('lesson.next_step')}
            <FontAwesomeIcon icon={faArrowRight} />
          </button>
        </div>
      )}

      {/* Контент текущего шага */}
      <div style={{ padding: '20px' }}>
        {lessonSteps.length > 0 && currentStepIndex < lessonSteps.length ? (
          <>
            {/* Счетчик шагов */}
            <div style={{ 
              marginBottom: '20px',
              padding: '10px 15px',
              background: theme === 'dark' ? '#2d2d2d' : '#f8f9fa',
              borderRadius: '8px',
              border: `1px solid ${theme === 'dark' ? '#404040' : '#e9ecef'}`
            }}>
              <span style={{ 
                fontSize: '0.9rem',
                fontWeight: '600',
                color: theme === 'dark' ? '#ffffff' : '#333333'
              }}>
                {t('lesson.step_of', { current: currentStepIndex + 1, total: lessonSteps.length })}
              </span>
            </div>
            {renderStep(lessonSteps[currentStepIndex], currentStepIndex)}
          </>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px 20px',
            color: theme === 'dark' ? '#cccccc' : '#666666'
          }}>
            <FontAwesomeIcon 
              icon={faFileAlt} 
              style={{ 
                fontSize: '3rem', 
                color: '#6c757d', 
                marginBottom: '20px' 
              }} 
            />
            <h3>{t('lesson.no_steps_in_lesson')}</h3>
            <p>{t('lesson.no_steps_in_lesson_desc')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Компонент для отображения видео шага
const VideoStep = ({ step, onComplete }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [youtubePlayer, setYoutubePlayer] = useState(null);
  const [youtubeProgress, setYoutubeProgress] = useState(0);

  // Загружаем YouTube API
  React.useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      
      window.onYouTubeIframeAPIReady = () => {
        console.log('YouTube API загружен');
      };
    }
  }, []);

  const handleTimeUpdate = (e) => {
    setCurrentTime(e.target.currentTime);
    // Помечаем как завершенный, если видео просмотрено полностью (100%)
    if (e.target.duration > 0 && e.target.currentTime / e.target.duration >= 1.0 && !isCompleted) {
      console.log('Видео просмотрено полностью (100%), отмечаем как завершенное');
      setIsCompleted(true);
      onComplete();
    }
  };

  // Функции для работы с YouTube API
  const onYouTubeReady = (event) => {
    console.log('YouTube API готов');
    setYoutubePlayer(event.target);
  };

  const onYouTubeStateChange = (event) => {
    const state = event.data;
    console.log('YouTube состояние изменилось:', state);
    
    // YouTube API states: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (video cued)
    if (state === 1) { // playing
      setIsPlaying(true);
    } else if (state === 2) { // paused
      setIsPlaying(false);
    } else if (state === 0) { // ended
      console.log('YouTube видео завершено, отмечаем как завершенное');
      setIsCompleted(true);
      onComplete();
    }
  };

  const onYouTubeProgress = (event) => {
    if (youtubePlayer && !isCompleted) {
      const currentTime = youtubePlayer.getCurrentTime();
      const duration = youtubePlayer.getDuration();
      
      if (duration > 0) {
        const progress = (currentTime / duration) * 100;
        setYoutubeProgress(progress);
        setCurrentTime(currentTime);
        setDuration(duration);
        
        // Помечаем как завершенный, если видео просмотрено на 90% или больше
        if (progress >= 90 && !isCompleted) {
          console.log('YouTube видео просмотрено на 90%+, отмечаем как завершенное');
          setIsCompleted(true);
          onComplete();
        }
      }
    }
  };

  const handleLoadedMetadata = (e) => {
    setDuration(e.target.duration || 0);
    setVideoError(false);
  };

  const handleVideoError = (e) => {
    console.error('Video loading error:', e);
    console.error('Video error details:', {
      error: e,
      target: e.target,
      currentSrc: e.target?.currentSrc,
      networkState: e.target?.networkState,
      readyState: e.target?.readyState,
      error: e.target?.error
    });
    setVideoError(true);
    
    // Если видео недоступно, автоматически завершаем шаг через 3 секунды
    setTimeout(() => {
      if (!isCompleted) {
        console.log('Видео недоступно, автоматически завершаем шаг');
        setIsCompleted(true);
        onComplete();
      }
    }, 3000);
  };

  const formatTime = (time) => {
    if (isNaN(time) || time === 0) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    if (duration === 0 || isNaN(duration)) return 0;
    return Math.round((currentTime / duration) * 100);
  };

  // Очищаем URL видео от лишних символов
  const getCleanVideoUrl = () => {
    let videoUrl = step.videoUrl || step.video || step.content;
    
    // Отладочная информация (всегда показываем для отладки)
    console.log('getCleanVideoUrl - отладка:', {
      stepId: step.id,
      stepType: step.type,
      stepVideoUrl: step.videoUrl,
      stepVideo: step.video,
      stepContent: step.content,
      finalVideoUrl: videoUrl,
      fullStep: step
    });
    
    if (!videoUrl) {
      return null;
    }
    
    // Если videoUrl пустой, но есть content с JSON, попробуем извлечь videoUrl
    if (!step.videoUrl && step.content && typeof step.content === 'string') {
      try {
        const parsedContent = JSON.parse(step.content);
        if (parsedContent && typeof parsedContent === 'object') {
          if (parsedContent.videoUrl) {
            videoUrl = parsedContent.videoUrl;
            console.log('Извлечен videoUrl из JSON content:', videoUrl);
          } else if (parsedContent.video) {
            videoUrl = parsedContent.video;
            console.log('Извлечен video из JSON content:', videoUrl);
          } else if (parsedContent.file) {
            videoUrl = parsedContent.file;
            console.log('Извлечен file из JSON content:', videoUrl);
          }
        }
      } catch (e) {
        console.log('Не удалось распарсить content как JSON:', e);
      }
    }
    
    return videoUrl;
  };

  // Функция для определения типа видео (поддержка множественных платформ)
  const getVideoType = (url) => {
    if (!url) return 'unknown';
    
    // YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return 'youtube';
    }
    // Vimeo
    else if (url.includes('vimeo.com')) {
      return 'vimeo';
    }
    // Dailymotion
    else if (url.includes('dailymotion.com')) {
      return 'dailymotion';
    }
    // Twitch
    else if (url.includes('twitch.tv')) {
      return 'twitch';
    }
    // Facebook
    else if (url.includes('facebook.com') || url.includes('fb.watch')) {
      return 'facebook';
    }
    // Instagram
    else if (url.includes('instagram.com')) {
      return 'instagram';
    }
    // TikTok
    else if (url.includes('tiktok.com')) {
      return 'tiktok';
    }
    // Rutube (российская платформа)
    else if (url.includes('rutube.ru')) {
      return 'rutube';
    }
    // Яндекс.Видео
    else if (url.includes('yandex.ru/video') || url.includes('yandex.com/video')) {
      return 'yandex';
    }
    // Прямые ссылки на видео файлы
    else if (url.includes('.mp4') || url.includes('.webm') || url.includes('.ogg') || 
             url.includes('.avi') || url.includes('.mov') || url.includes('.mkv') || 
             url.includes('.flv') || url.includes('.wmv') || url.includes('.m4v')) {
      return 'direct';
    }
    // Если это HTTP/HTTPS ссылка, но не распознана как известная платформа
    else if (url.startsWith('http://') || url.startsWith('https://')) {
      return 'external';
    }
    else {
      return 'unknown';
    }
  };

  // Функция для извлечения YouTube ID
  const getYouTubeId = (url) => {
    if (!url) return null;
    
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Функция для извлечения Vimeo ID
  const getVimeoId = (url) => {
    if (!url) return null;
    
    const regExp = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  // Функция для извлечения Dailymotion ID
  const getDailymotionId = (url) => {
    if (!url) return null;
    
    const regExp = /dailymotion\.com\/(?:video\/|embed\/video\/)([a-zA-Z0-9]+)/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  // Функция для извлечения Rutube ID
  const getRutubeId = (url) => {
    if (!url) return null;
    
    const regExp = /rutube\.ru\/video\/([a-zA-Z0-9]+)/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  const cleanVideoUrl = getCleanVideoUrl();

  // Если видео URL пустой, автоматически завершаем шаг
  React.useEffect(() => {
    if (!cleanVideoUrl && !isCompleted) {
      console.log('Видео URL пустой, автоматически завершаем шаг');
      setIsCompleted(true);
      setTimeout(() => onComplete(), 1000);
    }
  }, [cleanVideoUrl, isCompleted, onComplete]);

  // Автоматическое завершение для внешних ссылок через 10 секунд
  React.useEffect(() => {
    if (cleanVideoUrl && !isCompleted) {
      const videoType = getVideoType(cleanVideoUrl);
      if (videoType === 'external' || videoType === 'facebook' || videoType === 'instagram' || 
          videoType === 'tiktok' || videoType === 'twitch' || videoType === 'yandex') {
        const timer = setTimeout(() => {
          if (!isCompleted) {
            console.log(`Внешнее видео (${videoType}) показано 10 секунд, автоматически завершаем шаг`);
            setIsCompleted(true);
            onComplete();
          }
        }, 10000); // 10 секунд

        return () => clearTimeout(timer);
      }
    }
  }, [cleanVideoUrl, isCompleted, onComplete]);

  // Интервал для отслеживания прогресса YouTube видео
  React.useEffect(() => {
    let interval;
    if (youtubePlayer && !isCompleted && getVideoType(cleanVideoUrl) === 'youtube') {
      interval = setInterval(() => {
        onYouTubeProgress();
      }, 2000); // Проверяем каждые 2 секунды
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [youtubePlayer, isCompleted, cleanVideoUrl]);

  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px',
        marginBottom: '15px'
      }}>
        <FontAwesomeIcon icon={faVideo} style={{ color: '#007bff' }} />
        <h3 style={{ 
          fontSize: '1.1rem', 
          fontWeight: '600',
          color: theme === 'dark' ? '#ffffff' : '#333333'
        }}>
          {step.title || 'Видео'}
        </h3>
      </div>
      
      <div style={{ position: 'relative', marginBottom: '15px', zIndex: 1 }}>
        {videoError || !cleanVideoUrl ? (
          <div style={{
            width: '100%',
            height: '300px',
            background: theme === 'dark' ? '#2d2d2d' : '#f8f9fa',
            border: `1px solid ${theme === 'dark' ? '#404040' : '#e9ecef'}`,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            color: theme === 'dark' ? '#cccccc' : '#666666'
          }}>
            <FontAwesomeIcon icon={faVideo} style={{ fontSize: '3rem', marginBottom: '15px', opacity: 0.5 }} />
            <p>{!cleanVideoUrl ? t('lesson.video_not_found') : t('lesson.video_load_error')}</p>
            {cleanVideoUrl && (
              <p style={{ fontSize: '0.8rem', marginTop: '5px' }}>URL: {cleanVideoUrl}</p>
            )}
            <p style={{ fontSize: '0.8rem', marginTop: '5px', color: theme === 'dark' ? '#999999' : '#aaaaaa' }}>
              {!cleanVideoUrl ? t('lesson.video_not_specified') : t('lesson.check_video_link')}
            </p>
          </div>
        ) : (
          (() => {
            const videoType = getVideoType(cleanVideoUrl);
            console.log('Video type:', videoType, 'URL:', cleanVideoUrl);
            
            if (videoType === 'youtube') {
              const youtubeId = getYouTubeId(cleanVideoUrl);
              if (youtubeId) {
                return (
                  <div>
                    <iframe
                      style={{
                        width: '100%',
                        height: '400px',
                        border: 'none',
                        borderRadius: '8px'
                      }}
                      src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1&enablejsapi=1&origin=${window.location.origin}`}
                      title="YouTube video player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      onLoad={() => {
                        console.log('YouTube iframe загружен');
                      }}
                    />
                    
                    {/* Прогресс-бар для YouTube видео */}
                    {youtubeProgress > 0 && (
                      <div style={{
                        width: '100%',
                        height: '4px',
                        background: theme === 'dark' ? '#404040' : '#e9ecef',
                        borderRadius: '2px',
                        marginTop: '10px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${youtubeProgress}%`,
                          height: '100%',
                          background: youtubeProgress >= 90 ? '#28a745' : '#007bff',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    )}
                    
                    {/* Индикатор завершения */}
                    {isCompleted && (
                      <div style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: '#28a745',
                        color: 'white',
                        padding: '5px 10px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        ✓ Завершено
                      </div>
                    )}
                  </div>
                );
              }
            } else if (videoType === 'dailymotion') {
              const dailymotionId = getDailymotionId(cleanVideoUrl);
              if (dailymotionId) {
                return (
                  <div>
                    <iframe
                      style={{
                        width: '100%',
                        height: '400px',
                        border: 'none',
                        borderRadius: '8px'
                      }}
                      src={`https://www.dailymotion.com/embed/video/${dailymotionId}`}
                      title="Dailymotion video player"
                      frameBorder="0"
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                      onLoad={() => {
                        console.log('Dailymotion iframe загружен');
                        // Автоматически завершаем через 5 секунд после загрузки
                        setTimeout(() => {
                          if (!isCompleted) {
                            console.log('Dailymotion видео загружено, автоматически завершаем шаг');
                            setIsCompleted(true);
                            onComplete();
                          }
                        }, 5000);
                      }}
                    />
                    
                    {/* Индикатор завершения */}
                    {isCompleted && (
                      <div style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: '#28a745',
                        color: 'white',
                        padding: '5px 10px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        ✓ Завершено
                      </div>
                    )}
                  </div>
                );
              }
            } else if (videoType === 'rutube') {
              const rutubeId = getRutubeId(cleanVideoUrl);
              if (rutubeId) {
                return (
                  <div>
                    <iframe
                      style={{
                        width: '100%',
                        height: '400px',
                        border: 'none',
                        borderRadius: '8px'
                      }}
                      src={`https://rutube.ru/play/embed/${rutubeId}`}
                      title="Rutube video player"
                      frameBorder="0"
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                      onLoad={() => {
                        console.log('Rutube iframe загружен');
                        // Автоматически завершаем через 5 секунд после загрузки
                        setTimeout(() => {
                          if (!isCompleted) {
                            console.log('Rutube видео загружено, автоматически завершаем шаг');
                            setIsCompleted(true);
                            onComplete();
                          }
                        }, 5000);
                      }}
                    />
                    
                    {/* Индикатор завершения */}
                    {isCompleted && (
                      <div style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: '#28a745',
                        color: 'white',
                        padding: '5px 10px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        ✓ Завершено
                      </div>
                    )}
                  </div>
                );
              }
            } else if (videoType === 'vimeo') {
              const vimeoId = getVimeoId(cleanVideoUrl);
              if (vimeoId) {
                return (
                  <div>
                    <iframe
                      style={{
                        width: '100%',
                        height: '400px',
                        border: 'none',
                        borderRadius: '8px'
                      }}
                      src={`https://player.vimeo.com/video/${vimeoId}?h=hash&dnt=1`}
                      title="Vimeo video player"
                      frameBorder="0"
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                      onLoad={() => {
                        console.log('Vimeo iframe загружен');
                        // Для Vimeo пока что автоматически завершаем через 5 секунд после загрузки
                        setTimeout(() => {
                          if (!isCompleted) {
                            console.log('Vimeo видео загружено, автоматически завершаем шаг');
                            setIsCompleted(true);
                            onComplete();
                          }
                        }, 5000);
                      }}
                    />
                    
                    {/* Индикатор завершения */}
                    {isCompleted && (
                      <div style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: '#28a745',
                        color: 'white',
                        padding: '5px 10px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        ✓ Завершено
                      </div>
                    )}
                  </div>
                );
              }
            } else if (videoType === 'facebook' || videoType === 'instagram' || videoType === 'tiktok' || 
                       videoType === 'twitch' || videoType === 'yandex') {
              // Для социальных платформ и других сервисов показываем ссылку и кнопку завершения
              return (
                <div style={{
                  width: '100%',
                  height: '300px',
                  background: theme === 'dark' ? '#2d2d2d' : '#f8f9fa',
                  border: `1px solid ${theme === 'dark' ? '#404040' : '#e9ecef'}`,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  color: theme === 'dark' ? '#cccccc' : '#666666',
                  position: 'relative'
                }}>
                  <FontAwesomeIcon icon={faVideo} style={{ fontSize: '3rem', marginBottom: '15px', opacity: 0.5 }} />
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>
                    Видео с {videoType === 'facebook' ? 'Facebook' : 
                              videoType === 'instagram' ? 'Instagram' : 
                              videoType === 'tiktok' ? 'TikTok' : 
                              videoType === 'twitch' ? 'Twitch' : 
                              videoType === 'yandex' ? 'Яндекс.Видео' : 'внешней платформы'}
                  </h4>
                  <p style={{ fontSize: '14px', margin: '0 0 15px 0', textAlign: 'center' }}>
                    Для просмотра видео перейдите по ссылке ниже
                  </p>
                  <a 
                    href={cleanVideoUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{
                      padding: '10px 20px',
                      background: '#007bff',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      marginBottom: '15px'
                    }}
                  >
                    Открыть видео в новой вкладке
                  </a>
                  
                  {/* Индикатор завершения */}
                  {isCompleted && (
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: '#28a745',
                      color: 'white',
                      padding: '5px 10px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      ✓ Завершено
                    </div>
                  )}
                </div>
              );
            } else if (videoType === 'external') {
              // Для внешних ссылок, которые не распознаны как известные платформы
              return (
                <div style={{
                  width: '100%',
                  height: '300px',
                  background: theme === 'dark' ? '#2d2d2d' : '#f8f9fa',
                  border: `1px solid ${theme === 'dark' ? '#404040' : '#e9ecef'}`,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  color: theme === 'dark' ? '#cccccc' : '#666666',
                  position: 'relative'
                }}>
                  <FontAwesomeIcon icon={faVideo} style={{ fontSize: '3rem', marginBottom: '15px', opacity: 0.5 }} />
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>
                    Внешнее видео
                  </h4>
                  <p style={{ fontSize: '14px', margin: '0 0 15px 0', textAlign: 'center' }}>
                    Видео размещено на внешней платформе
                  </p>
                  <a 
                    href={cleanVideoUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{
                      padding: '10px 20px',
                      background: '#007bff',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      marginBottom: '15px'
                    }}
                  >
                    Открыть видео
                  </a>
                  
                  {/* Индикатор завершения */}
                  {isCompleted && (
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: '#28a745',
                      color: 'white',
                      padding: '5px 10px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      ✓ Завершено
                    </div>
                  )}
                </div>
              );
            } else if (videoType === 'unknown') {
              // Для неизвестных типов видео (прямые ссылки и т.д.)
              return (
                <div style={{ position: 'relative' }}>
                  <video
                    style={{
                      width: '100%',
                      height: 'auto',
                      maxHeight: '400px',
                      background: '#000',
                      borderRadius: '8px'
                    }}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onError={handleVideoError}
                    controls
                  >
                    <source src={cleanVideoUrl} type="video/mp4" />
                    <source src={cleanVideoUrl} type="video/webm" />
                    <source src={cleanVideoUrl} type="video/ogg" />
                    Ваш браузер не поддерживает видео
                  </video>
                  
                  {/* Индикатор завершения */}
                  {isCompleted && (
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: '#28a745',
                      color: 'white',
                      padding: '5px 10px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      ✓ Завершено
                    </div>
                  )}
                </div>
              );
            }
            
            // Для обычных видео файлов
            return (
              <div style={{ position: 'relative' }}>
                <video
                  style={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: '400px',
                    background: '#000',
                    borderRadius: '8px'
                  }}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onError={handleVideoError}
                  controls
                >
                  <source src={cleanVideoUrl} type="video/mp4" />
                  Ваш браузер не поддерживает видео
                </video>
                
                {/* Индикатор завершения */}
                {isCompleted && (
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: '#28a745',
                    color: 'white',
                    padding: '5px 10px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    ✓ Завершено
                  </div>
                )}
              </div>
            );
          })()
        )}
      </div>
      
      {step.description && (
        <div style={{ 
          padding: '15px',
          background: theme === 'dark' ? '#2d2d2d' : '#f8f9fa',
          borderRadius: '8px',
          marginBottom: '15px',
          border: `1px solid ${theme === 'dark' ? '#404040' : '#e9ecef'}`
        }}>
          <p style={{ 
            fontSize: '0.9rem',
            color: theme === 'dark' ? '#cccccc' : '#666666',
            lineHeight: '1.5',
            margin: 0
          }}>
            {step.description}
          </p>
        </div>
      )}
    </div>
  );
};

// Компонент для отображения текстового шага
const TextStep = ({ step, onComplete }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [isCompleted, setIsCompleted] = useState(false);

  const handleComplete = () => {
    setIsCompleted(true);
    onComplete();
  };

  // Автоматически отмечаем текстовый шаг завершенным при отображении
  React.useEffect(() => {
    if (!isCompleted) {
      console.log('=== ТЕКСТОВЫЙ ШАГ ===');
      console.log('Текстовый шаг отображен, отмечаем как завершенный');
      console.log('onComplete функция:', onComplete);
      setIsCompleted(true);
      // Добавляем небольшую задержку, чтобы избежать конфликтов с навигацией
      setTimeout(() => {
        console.log('Вызываем onComplete для текстового шага');
        if (onComplete && typeof onComplete === 'function') {
          onComplete();
          console.log('onComplete вызван успешно');
        } else {
          console.error('onComplete не является функцией:', onComplete);
        }
      }, 500); // Увеличиваем задержку
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Функция для безопасного рендеринга HTML
  const renderContent = (content) => {
    if (!content) return 'Нет содержимого';
    
    // Если контент содержит HTML теги, рендерим как HTML
    if (content.includes('<') && content.includes('>')) {
      return <div dangerouslySetInnerHTML={{ __html: content }} />;
    }
    
    // Иначе рендерим как обычный текст с переносами строк
    return content.split('\n').map((line, index) => (
      <div key={index} style={{ marginBottom: line ? '8px' : '4px' }}>
        {line || '\u00A0'}
      </div>
    ));
  };

  // Получаем текст из разных возможных полей
  const getTextContent = () => {
    let text = step.content || step.text || 'Нет содержимого';
    
    // Если текст - это JSON строка, парсим её
    if (typeof text === 'string') {
      try {
        const parsed = JSON.parse(text);
        if (parsed.text) {
          return parsed.text;
        }
      } catch (e) {
        // Если не JSON, возвращаем как есть
      }
    } else if (typeof text === 'object' && text !== null) {
      // Если это объект, извлекаем текст
      return text.text || text.content || 'Нет содержимого';
    }
    
    return text;
  };

  const textContent = getTextContent();

  console.log('TextStep render:', { 
    step, 
    textContent,
    originalContent: step.content || step.text 
  });

  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px',
        marginBottom: '15px'
      }}>
        <FontAwesomeIcon icon={faFileAlt} style={{ color: '#28a745' }} />
        <h3 style={{ 
          fontSize: '1.1rem', 
          fontWeight: '600',
          color: theme === 'dark' ? '#ffffff' : '#333333'
        }}>
          {step.title || 'Текст'}
        </h3>
      </div>
      
      <div style={{ 
        padding: '20px',
        background: theme === 'dark' ? '#2d2d2d' : '#f8f9fa',
        borderRadius: '8px',
        marginBottom: '15px',
        lineHeight: '1.6'
      }}>
        <div 
          style={{ 
            fontSize: '0.95rem',
            color: theme === 'dark' ? '#eaf4fd' : '#333333'
          }}
        >
          {renderContent(textContent)}
        </div>
      </div>
      
      {/* Removed: manual mark-as-read button */}
    </div>
  );
};

// Компонент для отображения тестового шага
const TestStep = ({ step, onComplete, showResults, userAnswers, testAttempts = [], stepIndex, lessonId }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(false);
  const [isResetting, setIsResetting] = useState(false); // Добавляем состояние для отслеживания сброса
  const [resetCounter, setResetCounter] = useState(0); // Добавляем счетчик сбросов
  const [showTestResults, setShowTestResults] = useState(false);

  // Инициализируем ответы, если ранее уже отвечали
  React.useEffect(() => {
    if (userAnswers && typeof userAnswers === 'object' && Object.keys(userAnswers).length > 0) {
      const normalized = {};
      Object.keys(userAnswers).forEach((key) => {
        const value = userAnswers[key];
        normalized[key] = Array.isArray(value) ? value : (value !== undefined ? [value] : []);
      });
      setSelectedAnswers(normalized);
    }
  }, [userAnswers]);

  // Показываем результаты теста, если есть попытки
  React.useEffect(() => {
    // Не показываем результаты если тест в процессе сброса или если был недавний сброс
    if (isResetting || resetCounter > 0) {
      console.log('Пропскаем показ результатов - тест в процессе сброса или был недавний сброс');
      return;
    }
    
    // Показываем результаты, если есть попытки теста для этого шага
    if (testAttempts && testAttempts.length > 0 && lessonId && stepIndex !== undefined) {
      const attempt = testAttempts.find(a => 
        Number(a.lessonId) === Number(lessonId) && 
        Number(a.stepIndex) === stepIndex
      );
      if (attempt) {
        console.log('Найдена попытка теста, показываем результаты:', attempt);
        setIsSubmitted(true);
        const questions = getQuestions();
        const totalQuestions = questions.length || 1;
        const correctAnswers = Math.round((attempt.lastScore / 100) * totalQuestions);
        
        // Создаем результаты на основе сохраненных ответов
        const results = questions.map((question, questionIndex) => {
          const savedAnswers = attempt.lastAnswers && attempt.lastAnswers[questionIndex];
          const selectedIndices = Array.isArray(savedAnswers) ? savedAnswers : (savedAnswers !== undefined ? [savedAnswers] : []);
          const options = (question.options || question.answers || []);
          const correctIndices = options
            .map((opt, idx) => (opt && opt.correct ? idx : -1))
            .filter(idx => idx !== -1);
          const isCorrect = selectedIndices.length > 0 &&
            [...selectedIndices].sort().join(',') === [...correctIndices].sort().join(',');
          
          return {
            questionIndex,
            selectedAnswerIndices: selectedIndices,
            isCorrect,
            correctAnswerIndices: correctIndices
          };
        });
        
        setTestResults({
          score: attempt.lastScore,
          correctAnswers,
          totalQuestions,
          attempts: attempt.attempts,
          lastPassed: attempt.lastPassed,
          results
        });
        
        // Если есть сохраненные ответы, загружаем их
        if (attempt.lastAnswers && typeof attempt.lastAnswers === 'object') {
          console.log('Загружаем сохраненные ответы:', attempt.lastAnswers);
          const normalized = {};
          Object.keys(attempt.lastAnswers).forEach((key) => {
            const value = attempt.lastAnswers[key];
            normalized[key] = Array.isArray(value) ? value : (value !== undefined ? [value] : []);
          });
          setSelectedAnswers(normalized);
        }
      }
    }
  }, [testAttempts, lessonId, stepIndex, isResetting, resetCounter]);

  // Дополнительная проверка попыток (fallback логика)
  React.useEffect(() => {
    // Не показываем результаты если тест в процессе сброса или если был недавний сброс
    if (isResetting || resetCounter > 0) {
      console.log('Fallback: Пропускаем показ результатов - тест в процессе сброса или был недавний сброс');
      return;
    }
    
    // Эта логика выполняется только если showResults = false, но есть попытки
    if (!showResults && testAttempts && testAttempts.length > 0 && lessonId && stepIndex !== undefined) {
      const attempt = testAttempts.find(a => 
        Number(a.lessonId) === Number(lessonId) && 
        Number(a.stepIndex) === stepIndex
      );
      
      if (attempt) {
        console.log('Fallback: Found attempt but showResults = false, setting up results');
        setIsSubmitted(true);
        const questions = getQuestions();
        const totalQuestions = questions.length || 1;
        const correctAnswers = Math.round((attempt.lastScore / 100) * totalQuestions);
        
        // Создаем результаты на основе сохраненных ответов
        const results = questions.map((question, questionIndex) => {
          const savedAnswers = attempt.lastAnswers && attempt.lastAnswers[questionIndex];
          const selectedIndices = Array.isArray(savedAnswers) ? savedAnswers : (savedAnswers !== undefined ? [savedAnswers] : []);
          const options = (question.options || question.answers || []);
          const correctIndices = options
            .map((opt, idx) => (opt && opt.correct ? idx : -1))
            .filter(idx => idx !== -1);
          const isCorrect = selectedIndices.length > 0 &&
            [...selectedIndices].sort().join(',') === [...correctIndices].sort().join(',');
          
          return {
            questionIndex,
            selectedAnswerIndices: selectedIndices,
            isCorrect,
            correctAnswerIndices: correctIndices
          };
        });
        
        setTestResults({
          score: attempt.lastScore,
          correctAnswers,
          totalQuestions,
          attempts: attempt.attempts,
          lastPassed: attempt.lastPassed,
          results
        });
        // Не сбрасываем showCorrectAnswers, чтобы пользователь мог видеть правильные ответы
        
        if (attempt.lastAnswers && typeof attempt.lastAnswers === 'object') {
          const normalized = {};
          Object.keys(attempt.lastAnswers).forEach((key) => {
            const value = attempt.lastAnswers[key];
            normalized[key] = Array.isArray(value) ? value : (value !== undefined ? [value] : []);
          });
          setSelectedAnswers(normalized);
        }
      }
    }
  }, [showResults, isResetting, testAttempts, lessonId, stepIndex, resetCounter]);

  const handleAnswerSelect = (questionIndex, answerIndex) => {
    if (isSubmitted) return;
    
    setSelectedAnswers(prev => {
      const prevForQuestion = Array.isArray(prev[questionIndex])
        ? prev[questionIndex]
        : (prev[questionIndex] !== undefined ? [prev[questionIndex]] : []);
      const isSelected = prevForQuestion.includes(answerIndex);
      const nextForQuestion = isSelected
        ? prevForQuestion.filter(idx => idx !== answerIndex)
        : [...prevForQuestion, answerIndex];
      return {
        ...prev,
        [questionIndex]: nextForQuestion
      };
    });
  };

  const handleSubmit = () => {
    console.log('Тест отправлен, отмечаем как завершенный');
    setIsSubmitted(true);
    
    // Подсчитываем результаты
    const questions = getQuestions();
    let correctAnswers = 0;
    const results = questions.map((question, questionIndex) => {
      const selectedIndicesRaw = selectedAnswers[questionIndex];
      const selectedIndices = Array.isArray(selectedIndicesRaw)
        ? selectedIndicesRaw
        : (selectedIndicesRaw !== undefined ? [selectedIndicesRaw] : []);
      const options = (question.options || question.answers || []);
      const correctIndices = options
        .map((opt, idx) => (opt && opt.correct ? idx : -1))
        .filter(idx => idx !== -1);
      const isCorrect = selectedIndices.length > 0 &&
        [...selectedIndices].sort().join(',') === [...correctIndices].sort().join(',');
      
      if (isCorrect) {
        correctAnswers++;
      }
      
      return {
        questionIndex,
        selectedAnswerIndices: selectedIndices,
        isCorrect,
        correctAnswerIndices: correctIndices
      };
    });
    
    const score = Math.round((correctAnswers / questions.length) * 100);
    
    // Получаем количество попыток из testAttempts
    let attempts = 1; // По умолчанию 1 попытка
    console.log('=== ОТЛАДКА ПОПЫТОК ТЕСТА ===');
    console.log('testAttempts:', testAttempts);
    console.log('lessonId:', lessonId);
    console.log('stepIndex:', stepIndex);
    
    if (testAttempts && testAttempts.length > 0 && lessonId && stepIndex !== undefined) {
      const attempt = testAttempts.find(a => {
        const attemptLessonId = Number(a.lessonId);
        const currentLessonId = Number(lessonId);
        const attemptStepIndex = Number(a.stepIndex);
        const currentStepIndex = Number(stepIndex);
        console.log(`Сравнение: ${attemptLessonId} === ${currentLessonId} && ${attemptStepIndex} === ${currentStepIndex}`);
        return attemptLessonId === currentLessonId && attemptStepIndex === currentStepIndex;
      });
      if (attempt) {
        attempts = (attempt.attempts || 0) + 1; // Увеличиваем на 1 для текущей попытки
        console.log(`Найдена попытка: ${attempt.attempts || 0} + 1 = ${attempts}`);
      } else {
        console.log('Попытка не найдена, используем 1');
      }
    } else {
      console.log('testAttempts пуст или нет lessonId/stepIndex');
    }
    console.log('=== КОНЕЦ ОТЛАДКИ ПОПЫТОК ТЕСТА ===');
    
    setTestResults({
      score,
      correctAnswers,
      totalQuestions: questions.length,
      attempts,
      results
    });
    
    onComplete({ answers: selectedAnswers, score, isPassed: score === 100 });
  };

  // Получаем вопросы из разных возможных полей
  const getQuestions = () => {
    // Приоритет: сначала questions, потом content, потом text
    let questions = step.questions || step.content || step.text || step.description || [];
    
    console.log('getQuestions input:', { 
      stepQuestions: step.questions, 
      stepContent: step.content, 
      stepText: step.text,
      questions,
      stepType: step.type,
      questionsType: typeof questions
    });
    
    // Если вопросы - это JSON строка, парсим её
    if (typeof questions === 'string') {
      try {
        // Убираем лишние кавычки и экранирование
        let cleanQuestions = questions.replace(/\\"/g, '"').replace(/^"|"$/g, '');
        
        console.log('Cleaned questions string:', cleanQuestions);
        
        // Пробуем парсить как JSON
        const parsed = JSON.parse(cleanQuestions);
        
        console.log('Parsed JSON:', parsed);
        
        // Если это объект с полем questions, извлекаем его
        if (parsed && typeof parsed === 'object' && parsed.questions) {
          console.log('Found questions in parsed.questions:', parsed.questions);
          return parsed.questions;
        }
        
        // Если это массив вопросов напрямую
        if (Array.isArray(parsed)) {
          console.log('Found questions as array:', parsed);
          return parsed;
        }
        
        // Если это объект, но не массив
        if (parsed && typeof parsed === 'object') {
          console.log('Found questions as object:', parsed);
          return [parsed];
        }
        
        console.log('No questions found in parsed data');
        return [];
      } catch (e) {
        console.log('Error parsing questions JSON:', e);
        console.log('Raw questions string:', questions);
        
        // Попробуем найти JSON в строке
        try {
          const jsonMatch = questions.match(/\{.*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed && typeof parsed === 'object' && parsed.questions) {
              console.log('Found questions in JSON match:', parsed.questions);
              return parsed.questions;
            }
          }
        } catch (e2) {
          console.log('Error parsing JSON match:', e2);
        }
        
        return [];
      }
    } else if (typeof questions === 'object' && questions !== null) {
      // Если это объект, извлекаем вопросы
      if (questions.questions) {
        console.log('Found questions in object.questions:', questions.questions);
        return questions.questions;
      }
      if (Array.isArray(questions)) {
        console.log('Found questions as object array:', questions);
        return questions;
      }
      console.log('Found questions as object:', questions);
      return [questions];
    }
    
    console.log('No questions found');
    return [];
  };

  const questions = getQuestions();

  console.log('TestStep render:', { 
    step, 
    stepType: step.type,
    stepContent: step.content,
    stepQuestions: step.questions,
    stepText: step.text,
    questions, 
    questionsCount: questions.length,
    isSubmitted,
    selectedAnswers,
    testResults
  });

  // Получаем карту правильных ответов { questionIndex: number[] }
  const getCorrectAnswersMap = () => {
    const map = {};
    questions.forEach((question, qi) => {
      const options = (question.options || question.answers || []);
      map[qi] = options
        .map((opt, idx) => (opt && opt.correct ? idx : -1))
        .filter(idx => idx !== -1);
    });
    return map;
  };

  const fillCorrectAnswers = () => {
    const map = getCorrectAnswersMap();
    setSelectedAnswers(map);
    setIsSubmitted(false);
    setTestResults(null);
    setShowCorrectAnswers(false);
  };

  const resetTest = () => {
    setIsSubmitted(false);
    setTestResults(null);
    setSelectedAnswers({});
    setShowCorrectAnswers(false);
  };

  const answeredCount = questions.reduce((acc, _, qi) => {
    const v = selectedAnswers[qi];
    const arr = Array.isArray(v) ? v : (v !== undefined ? [v] : []);
    return acc + (arr.length > 0 ? 1 : 0);
  }, 0);

  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px',
        marginBottom: '15px'
      }}>
        <FontAwesomeIcon icon={faQuestionCircle} style={{ color: '#ffc107' }} />
        <h3 style={{ 
          fontSize: '1.1rem', 
          fontWeight: '600',
          color: theme === 'dark' ? '#ffffff' : '#333333'
        }}>
          {step.title || 'Тест'}
        </h3>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        {step.description && (
          <p style={{ 
            fontSize: '0.9rem',
            color: theme === 'dark' ? '#cccccc' : '#666666',
            marginBottom: '15px'
          }}>
            {step.description}
          </p>
        )}
        
        {questions.length === 0 ? (
          <div style={{
            padding: '20px',
            background: theme === 'dark' ? '#2d2d2d' : '#f8f9fa',
            borderRadius: '8px',
            textAlign: 'center',
            color: theme === 'dark' ? '#cccccc' : '#666666'
          }}>
            <p>Вопросы не найдены</p>
            <p style={{ fontSize: '0.8rem', marginTop: '10px' }}>
              Тип шага: {step.type}
            </p>
            <p style={{ fontSize: '0.8rem', marginTop: '5px' }}>
              Raw data: {JSON.stringify(step.questions || step.content || step.text)}
            </p>
            <details style={{ marginTop: '10px', textAlign: 'left' }}>
              <summary style={{ cursor: 'pointer', fontSize: '0.8rem' }}>Отладочная информация</summary>
              <pre style={{ 
                fontSize: '0.7rem', 
                background: theme === 'dark' ? '#1a1a1a' : '#ffffff',
                padding: '10px',
                borderRadius: '4px',
                marginTop: '5px',
                overflow: 'auto',
                maxHeight: '200px'
              }}>
                {JSON.stringify(step, null, 2)}
              </pre>
            </details>
          </div>
        ) : (!isSubmitted && !testResults) ? (
          questions.map((question, questionIndex) => (
            <div
              key={questionIndex}
              style={{
                marginBottom: '20px',
                padding: '15px',
                background: theme === 'dark' ? '#2d2d2d' : '#f8f9fa',
                borderRadius: '8px',
                border: `1px solid ${theme === 'dark' ? '#404040' : '#e9ecef'}`
              }}
            >
              <h4 style={{ 
                fontSize: '1rem', 
                fontWeight: '500',
                marginBottom: '10px',
                color: theme === 'dark' ? '#ffffff' : '#333333'
              }}>
                {questionIndex + 1}. {question.question || question.text}
              </h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(question.options || question.answers || []).map((answer, answerIndex) => {
                  const selectedForQuestion = Array.isArray(selectedAnswers[questionIndex])
                    ? selectedAnswers[questionIndex]
                    : (selectedAnswers[questionIndex] !== undefined ? [selectedAnswers[questionIndex]] : []);
                  const isSelected = selectedForQuestion.includes(answerIndex);
                  
                  return (
                    <label
                      key={answerIndex}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        background: isSelected 
                          ? theme === 'dark' ? '#404040' : '#e9ecef'
                          : 'transparent',
                        border: `1px solid ${
                          isSelected 
                            ? '#007bff' 
                            : theme === 'dark' ? '#404040' : '#e9ecef'
                        }`,
                        color: theme === 'dark' ? '#eaf4fd' : '#333333',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <input
                        type="checkbox"
                        name={`question-${questionIndex}`}
                        checked={isSelected}
                        onChange={() => handleAnswerSelect(questionIndex, answerIndex)}
                        style={{ margin: 0 }}
                        disabled={isSubmitted}
                      />
                      <span>{answer.text || answer}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div style={{
            padding: '20px',
            background: theme === 'dark' ? '#2d2d2d' : '#f8f9fa',
            borderRadius: '8px',
            textAlign: 'center',
            color: theme === 'dark' ? '#cccccc' : '#666666'
          }}>
            {testResults && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ 
                  fontSize: '1.2rem', 
                  fontWeight: '600',
                  color: testResults.score >= 70 ? '#28a745' : testResults.score >= 50 ? '#ffc107' : '#dc3545',
                  marginBottom: '10px'
                }}>
                  {t('lesson.test_result')}: {testResults.score}%
                </h4>
                <p style={{ fontSize: '0.9rem', marginBottom: '5px' }}>
                  {t('lesson.correct_answers_count', { correct: testResults.correctAnswers, total: testResults.totalQuestions })}
                </p>
                <p style={{ fontSize: '0.9rem', marginBottom: '5px', color: theme === 'dark' ? '#cccccc' : '#666666' }}>
                  {t('lesson.attempts_count', { count: testResults.attempts || 1 })}
                </p>
                <div style={{
                  width: '100%',
                  height: '8px',
                  background: theme === 'dark' ? '#404040' : '#e9ecef',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  marginTop: '10px'
                }}>
                  <div style={{
                    width: `${testResults.score}%`,
                    height: '100%',
                    background: testResults.score >= 70 ? '#28a745' : testResults.score >= 50 ? '#ffc107' : '#dc3545',
                    transition: 'width 0.5s ease'
                  }} />
                </div>
              </div>
            )}

            {/* Правильные ответы (по кнопке) */}
            {testResults && showCorrectAnswers && (
              <div style={{ textAlign: 'left' }}>
                <h5 style={{ 
                  fontSize: '1rem', 
                  fontWeight: '500',
                  marginBottom: '15px',
                  color: theme === 'dark' ? '#ffffff' : '#333333'
                }}>
                  {t('lesson.correct_answers')}
                </h5>
                {questions.map((question, questionIndex) => {
                  const result = testResults.results && testResults.results[questionIndex];
                  const options = (question.options || question.answers || []);
                  const correctOptions = (result && result.correctAnswerIndices ? result.correctAnswerIndices : [])
                    .map((idx) => options[idx])
                    .filter(Boolean);
                  
                  return (
                    <div
                      key={questionIndex}
                      style={{
                        marginBottom: '15px',
                        padding: '12px',
                        background: (result && result.isCorrect) ? '#d4edda' : '#f8d7da',
                        border: `1px solid ${(result && result.isCorrect) ? '#c3e6cb' : '#f5c6cb'}`,
                        borderRadius: '6px'
                      }}
                    >
                      <p style={{ 
                        fontSize: '0.9rem',
                        fontWeight: '500',
                        marginBottom: '5px',
                        color: (result && result.isCorrect) ? '#155724' : '#721c24'
                      }}>
                        {questionIndex + 1}. {question.question || question.text}
                      </p>
                      <p style={{ 
                        fontSize: '0.8rem',
                        color: (result && result.isCorrect) ? '#155724' : '#721c24'
                      }}>
                        {t('lesson.correct_answers')} {correctOptions.length > 0
                          ? correctOptions.map(opt => (opt?.text ?? String(opt))).join(', ')
                          : t('lesson.correct_answers_not_specified')}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Сообщение о завершении теста */}
            <div style={{ 
              marginTop: '20px',
              marginBottom: '16px',
              padding: '8px 16px',
              background: testResults && testResults.score >= 100 ? '#d4edda' : '#fff3cd',
              border: `1px solid ${testResults && testResults.score >= 100 ? '#c3e6cb' : '#ffeaa7'}`,
              borderRadius: '6px',
              textAlign: 'center'
            }}>
              <p style={{ 
                fontSize: '0.9rem', 
                margin: '0',
                color: testResults && testResults.score >= 100 ? '#155724' : '#856404',
                fontWeight: '500'
              }}>
                {testResults && testResults.score >= 100 
                  ? t('lesson.test_completed_100')
                  : t('lesson.test_completed_partial', { score: testResults?.score || 0 })
                }
              </p>
            </div>
            
            {/* Кнопки рядом */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', alignItems: 'center' }}>
              {/* Кнопка показа правильных ответов */}
              <button
                onClick={() => setShowCorrectAnswers(prev => !prev)}
                style={{
                  padding: '10px 16px',
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}
              >
                {showCorrectAnswers ? t('lesson.hide_correct_answers') : t('lesson.show_correct_answers')}
              </button>
              
              <button
                onClick={() => {
                  console.log('Решить еще раз - сбрасываем состояние теста');
                  setIsResetting(true); // Устанавливаем флаг сброса
                  setResetCounter(prev => prev + 1); // Увеличиваем счетчик сбросов
                  setIsSubmitted(false);
                  setTestResults(null);
                  setSelectedAnswers({});
                  setShowCorrectAnswers(false); // Сбрасываем показ правильных ответов
                  
                  // Сбрасываем флаг сброса через небольшую задержку
                  setTimeout(() => {
                    console.log('Сброс завершен, убираем флаг isResetting');
                    setIsResetting(false);
                  }, 100);
                }}
                style={{
                  padding: '10px 20px',
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}
              >
                {t('lesson.solve_again')} {testResults && testResults.attempts > 1 ? `(попытка ${testResults.attempts})` : ''}
              </button>
            </div>
          </div>
        )}
      </div>
      
      {questions.length > 0 && !isSubmitted && !testResults ? (
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button
            onClick={handleSubmit}
            disabled={answeredCount < questions.length}
            style={{
              padding: '12px 24px',
              background: answeredCount < questions.length ? '#6c757d' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: answeredCount < questions.length ? 'not-allowed' : 'pointer',
              opacity: answeredCount < questions.length ? 0.6 : 1,
              fontSize: '1rem',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
          >
            {answeredCount < questions.length 
              ? `Ответить на все вопросы (${answeredCount}/${questions.length})`
              : 'Отправить ответы'
            }
          </button>
        </div>
      ) : null}
    </div>
  );
};

// Компонент для отображения кода с подсветкой синтаксиса
const CodeStep = ({ step, onComplete }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [isCompleted, setIsCompleted] = useState(false);

  const handleComplete = () => {
    console.log('Код просмотрен, отмечаем как завершенный');
    setIsCompleted(true);
    onComplete();
  };

  // Автоматически отмечаем код как просмотренный при отображении
  React.useEffect(() => {
    console.log('CodeStep: useEffect запущен, isCompleted:', isCompleted);
    
    if (!isCompleted) {
      console.log('CodeStep: Код отображен, отмечаем как завершенный');
      setIsCompleted(true);
      
      // Используем несколько попыток для надежности
      const completeStep = () => {
        console.log('CodeStep: Вызываем onComplete()');
        onComplete();
      };
      
      // Первая попытка сразу
      completeStep();
      
      // Вторая попытка через небольшую задержку
      setTimeout(completeStep, 100);
      
      // Третья попытка через еще большую задержку
      setTimeout(completeStep, 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getLanguageColor = (language) => {
    const colors = {
      'javascript': '#f7df1e',
      'js': '#f7df1e',
      'python': '#3776ab',
      'py': '#3776ab',
      'java': '#ed8b00',
      'cpp': '#00599c',
      'c': '#00599c',
      'csharp': '#178600',
      'cs': '#178600',
      'php': '#777bb4',
      'ruby': '#cc342d',
      'go': '#00add8',
      'rust': '#ce422b',
      'swift': '#ffac45',
      'kotlin': '#f18e33',
      'typescript': '#3178c6',
      'ts': '#3178c6',
      'html': '#e34f26',
      'css': '#1572b6',
      'sql': '#336791'
    };
    return colors[language?.toLowerCase()] || '#6c757d';
  };

  // Получаем код из разных возможных полей
  const getCode = () => {
    let code = step.code || step.content || step.text || `// ${t('lesson.code_not_found')}`;
    
    // Если код - это JSON строка, парсим её
    if (typeof code === 'string') {
      try {
        const parsed = JSON.parse(code);
        if (parsed.code) {
          return parsed.code;
        }
      } catch (e) {
        // Если не JSON, возвращаем как есть
      }
    } else if (typeof code === 'object' && code !== null) {
      // Если это объект, извлекаем код
      return code.code || code.content || code.text || `// ${t('lesson.code_not_found')}`;
    }
    
    return code;
  };

  const getLanguage = () => {
    let language = step.language || 'javascript';
    
    // Если язык - это JSON строка, парсим её
    if (typeof language === 'string') {
      try {
        // Убираем лишние кавычки и экранирование
        let cleanLanguage = language.replace(/\\"/g, '"').replace(/^"|"$/g, '');
        const parsed = JSON.parse(cleanLanguage);
        if (parsed.language) {
          return parsed.language;
        }
      } catch (e) {
        // Если не JSON, возвращаем как есть
      }
    } else if (typeof language === 'object' && language !== null) {
      // Если это объект, извлекаем язык
      return language.language || 'javascript';
    }
    
    return language;
  };

  // Получаем описание из разных возможных полей
  const getDescription = () => {
    let description = step.description || step.text || '';
    
    console.log('getDescription - исходные данные:', {
      stepDescription: step.description,
      stepText: step.text,
      initialDescription: description
    });
    
    // Если описание - это JSON строка, парсим её
    if (typeof description === 'string') {
      try {
        const parsed = JSON.parse(description);
        console.log('getDescription - распарсенный JSON:', parsed);
        if (parsed.description) {
          console.log('getDescription - найдено описание в JSON:', parsed.description);
          return parsed.description;
        }
      } catch (e) {
        console.log('getDescription - не удалось распарсить как JSON:', e);
        // Если не JSON, возвращаем как есть
      }
    } else if (typeof description === 'object' && description !== null) {
      console.log('getDescription - описание является объектом:', description);
      // Если это объект, извлекаем описание
      return description.description || description.text || '';
    }
    
    console.log('getDescription - финальное описание:', description);
    return description;
  };

  const code = getCode();
  const language = getLanguage();
  const description = getDescription();

  console.log('CodeStep render:', { code, language, description, step });

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px',
        marginBottom: '15px',
        marginTop: '50px', // Увеличиваем отступ сверху для языка программирования
        justifyContent: 'center' // Центрируем заголовок
      }}>
        <h3 style={{ 
          fontSize: '1.1rem', 
          fontWeight: '600',
          color: theme === 'dark' ? '#ffffff' : '#333333',
          margin: 0,
          textAlign: 'center' // Центрируем текст заголовка
        }}>
          {step.title || 'Код'}
        </h3>
      </div>
      
      <div style={{ 
        position: 'relative',
        marginBottom: '15px'
      }}>
        <div style={{
          padding: '10px 15px',
          background: theme === 'dark' ? '#1e1e1e' : '#f8f9fa',
          border: `1px solid ${theme === 'dark' ? '#404040' : '#e9ecef'}`,
          borderRadius: '8px',
          borderTopLeftRadius: '0',
          borderTopRightRadius: '0',
          fontSize: '12px',
          color: theme === 'dark' ? '#ffffff !important' : '#333333 !important',
          fontFamily: 'Consolas, Monaco, "Courier New", monospace',
          lineHeight: '1.4'
        }}>
          {language && (
            <div style={{
              position: 'absolute',
              top: '-30px',
              left: '0',
              padding: '5px 10px',
              background: getLanguageColor(language),
              color: 'white',
              fontSize: '11px',
              fontWeight: 'bold',
              borderRadius: '4px 4px 0 0',
              textTransform: 'uppercase'
            }}>
              {language}
            </div>
          )}
          <pre style={{
            margin: 0,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            overflowX: 'auto',
            color: theme === 'dark' ? '#ffffff' : '#333333',
            fontFamily: 'Consolas, Monaco, "Courier New", monospace'
          }}>
            <code style={{
              color: theme === 'dark' ? '#ffffff' : '#333333',
              fontFamily: 'Consolas, Monaco, "Courier New", monospace',
              backgroundColor: 'transparent'
            }}>{code}</code>
          </pre>
        </div>
      </div>
      
      {description && (
        <div style={{ 
          padding: '15px',
          background: theme === 'dark' ? '#2d2d2d' : '#f8f9fa',
          borderRadius: '8px',
          marginBottom: '15px',
          border: `1px solid ${theme === 'dark' ? '#404040' : '#e9ecef'}`
        }}>
          <p style={{ 
            fontSize: '0.95rem',
            color: theme === 'dark' ? '#cccccc' : '#666666',
            lineHeight: '1.6',
            margin: 0,
            textAlign: 'left'
          }}>
            {description}
          </p>
        </div>
      )}
    </div>
  );
};

export default LessonViewer; 