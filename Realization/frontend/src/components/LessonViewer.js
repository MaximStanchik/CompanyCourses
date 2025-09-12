import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './LessonViewer.css';
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
  faTimes,
  faCheck,
  faTrophy,
  faStar,
  faRocket,
  faLightbulb,
  faInfoCircle,
  faExclamationTriangle,
  faCode,
  faFile,
  faFilePdf,
  faFileWord,
  faFileExcel,
  faFilePowerpoint,
  faFileArchive,
  faFileImage,
  faFileVideo,
  faFileAudio,
  faDownload,
  faCheckCircle,
  faExternalLinkAlt
 } from '@fortawesome/free-solid-svg-icons';
import useTheme from '../hooks/useTheme';
import axios from '../utils/axios';
import jwt_decode from 'jwt-decode';
import { getVideoUrl, getMinioDownloadUrl } from '../utils/minioUtils';

// CSS стили для анимаций теста
const testStyles = `
  @keyframes testFadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes testPulse {
    0% {
      transform: scale(1);
      box-shadow: 0 0 0 0 rgba(68, 133, 237, 0.7);
    }
    70% {
      transform: scale(1.05);
      box-shadow: 0 0 0 10px rgba(68, 133, 237, 0);
    }
    100% {
      transform: scale(1);
      box-shadow: 0 0 0 0 rgba(68, 133, 237, 0);
    }
  }

  @keyframes testShake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
  }

  @keyframes testBounce {
    0%, 20%, 53%, 80%, 100% { transform: translate3d(0,0,0); }
    40%, 43% { transform: translate3d(0,-30px,0); }
    70% { transform: translate3d(0,-15px,0); }
    90% { transform: translate3d(0,-4px,0); }
  }

  @keyframes testGlow {
    0% { box-shadow: 0 0 5px rgba(68, 133, 237, 0.5); }
    50% { box-shadow: 0 0 20px rgba(68, 133, 237, 0.8), 0 0 30px rgba(68, 133, 237, 0.6); }
    100% { box-shadow: 0 0 5px rgba(68, 133, 237, 0.5); }
  }

  @keyframes testSuccess {
    0% { transform: scale(0.8); opacity: 0; }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); opacity: 1; }
  }

  @keyframes testError {
    0% { transform: scale(1); }
    10%, 90% { transform: scale(1.1); }
    20%, 80% { transform: scale(0.9); }
    30%, 50%, 70% { transform: scale(1.05); }
    40%, 60% { transform: scale(0.95); }
    100% { transform: scale(1); }
  }

  @keyframes testProgress {
    0% { width: 0%; }
    100% { width: var(--progress-width, 0%); }
  }

  @keyframes testSparkle {
    0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
    50% { opacity: 1; transform: scale(1) rotate(180deg); }
  }

  @keyframes gradientShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  .test-container {
    animation: testFadeIn 0.6s ease-out;
  }

  .test-question {
    animation: testFadeIn 0.4s ease-out;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
  }

  .test-question::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(68, 133, 237, 0.1), transparent);
    transition: left 0.5s ease;
  }

  .test-question:hover::before {
    left: 100%;
  }

  .test-answer-option {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
  }

  .test-answer-option:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }

  .test-answer-option.selected {
    animation: testPulse 0.6s ease-in-out;
  }

  .test-answer-option.correct {
    animation: testSuccess 0.5s ease-out;
  }

  .test-answer-option.incorrect {
    animation: testError 0.6s ease-in-out;
  }

  .test-submit-btn {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
  }

  .test-submit-btn::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    transition: width 0.6s ease, height 0.6s ease;
  }

  .test-submit-btn:hover::before {
    width: 300px;
    height: 300px;
  }

  .test-results {
    animation: testFadeIn 0.8s ease-out;
  }

  .test-progress-bar {
    animation: testProgress 1s ease-out;
  }

  .test-sparkle {
    position: absolute;
    width: 4px;
    height: 4px;
    background: #ffd700;
    border-radius: 50%;
    animation: testSparkle 1.5s ease-in-out infinite;
  }

  .test-sparkle:nth-child(1) { top: 10%; left: 10%; animation-delay: 0s; }
  .test-sparkle:nth-child(2) { top: 20%; right: 15%; animation-delay: 0.3s; }
  .test-sparkle:nth-child(3) { bottom: 30%; left: 20%; animation-delay: 0.6s; }
  .test-sparkle:nth-child(4) { bottom: 10%; right: 10%; animation-delay: 0.9s; }

  .test-gradient-bg {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    background-size: 200% 200%;
    animation: gradientShift 3s ease infinite;
  }
`;

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
  
      // Если это результат теста, используем новый endpoint
      if (testResult && !isCompleted) {
        console.log(`=== СОХРАНЕНИЕ РЕЗУЛЬТАТА ТЕСТА ===`);
        console.log(`Шаг ${stepIndex}, результат:`, testResult);
        
        const response = await axios.post(
          `/course/${courseId}/lesson/${lessonId}/step/${stepIndex}/test-result`,
          { testResult },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        console.log(`Результат теста для шага ${stepIndex} сохранен:`, response.data);
        return;
      }
  
      // Для обычных шагов (не тестов) - ничего не делаем
      console.log(`Шаг ${stepIndex} не является тестом, пропускаем сохранение`);
      
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
        // Добавляем детальное логирование структуры
        console.log('Детальная структура testAttempts:');
        userProgress.testAttempts.forEach((ta, index) => {
          console.log(`Попытка ${index}:`, ta);
          console.log(`  - ta.lessonId:`, ta.lessonId, typeof ta.lessonId);
          console.log(`  - ta.lesson_id:`, ta.lesson_id, typeof ta.lesson_id);
          console.log(`  - ta.stepIndex:`, ta.stepIndex, typeof ta.stepIndex);
          console.log(`  - ta.step_index:`, ta.step_index, typeof ta.step_index);
        });
        
        const lessonTestAttempts = userProgress.testAttempts.filter(ta => {
          // Пробуем разные варианты названий полей
          const attemptLessonId = Number(ta.lessonId || ta.lesson_id);
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
      // Для тестовых шагов:
      // - 100% результат = 1 полный шаг
      // - <100% результат = частичный прогресс
      if (ta.lastScore >= 100) {
        totalTestProgress += 1; // Полный шаг
      } else {
        // Исправляем: прогресс теста должен быть пропорциональным
        // Если тест на 50%, то это 0.5 шага
        const testProgress = ta.lastScore / 100;
        totalTestProgress += testProgress;
      }
    });
    
    const completedCount = completedStepIndices.size + totalTestProgress;
    const calculatedProgress = lessonSteps.length > 0 ? Math.round((completedCount / lessonSteps.length) * 1000) / 10 : 0;
    
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
      
      if (typeof step === 'string') {
        try {
          const parsedStep = JSON.parse(step);
          if (parsedStep && typeof parsedStep === 'object' && parsedStep.questions) {
            console.log('Detected test JSON in step string:', parsedStep);
            return {
              type: 'test',
              title: `Тест ${index + 1}`,
              questions: parsedStep.questions,
              description: t('lesson.test_description')
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
                description: t('lesson.test_description')
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
                description: t('lesson.test_description')
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
            description: t('lesson.test_description')
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
        videoUrl: (lesson.videoUrl || lesson.videoLink) ? getVideoUrl(lesson.videoUrl || lesson.videoLink) : null,
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
    console.log(`onStepComplete функция:`, typeof onStepComplete);
    console.log(`lesson?.id:`, lesson?.id);
    
    setTestAnswers(prev => ({ ...prev, [stepIndex]: (result && result.answers) ? result.answers : result }))
    setShowTestResults(true);
    
    // НЕМЕДЛЕННО сохраняем попытку на сервере и в БД
    try {
      if (onStepComplete && lesson?.id) {
        const score = result && typeof result.score === 'number' ? result.score : 0;
        const isPassed = !!(result && result.isPassed === true);
        console.log(`НЕМЕДЛЕННО вызываем onStepComplete с результатом теста: score=${score}, isPassed=${isPassed}`);
        onStepComplete(lesson.id, stepIndex, { testResult: { score, isPassed, answers: (result && result.answers) ? result.answers : {} } });
      } else {
        console.log(`НЕ вызываем onStepComplete: onStepComplete=${!!onStepComplete}, lesson?.id=${lesson?.id}`);
      }
      
      // НЕМЕДЛЕННО сохраняем результат теста в БД
      const score = result && typeof result.score === 'number' ? result.score : 0;
      const isPassed = !!(result && result.isPassed === true);
      console.log(`НЕМЕДЛЕННО сохраняем результат теста в БД: score=${score}, isPassed=${isPassed}`);
      console.log(`Вызываем saveStepProgress с параметрами: stepIndex=${stepIndex}, isCompleted=false, testResult=`, { score, isPassed, answers: (result && result.answers) ? result.answers : {} });
      
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
      console.log('🔍 Determining step type for:', step);
      
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
      
      // Проверяем на наличие файлов
      if (step.fileUrl || step.fileUpload || (typeof content === 'string' && content.includes('"fileUrl"'))) {
        console.log('File step detected by direct fields or string content');
        return 'file';
      }
      
      // Дополнительная проверка для JSON строк с файлами
      if (typeof content === 'string') {
        try {
          const parsed = JSON.parse(content);
          if (parsed && typeof parsed === 'object' && (parsed.fileUrl || parsed.filename)) {
            console.log('Auto-detected file step from JSON content:', parsed);
            return 'file';
          }
        } catch (e) {
          // Если не JSON, продолжаем проверку
        }
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
      case 'file':
        console.log('🎯 Rendering FileStep component for step:', safeStep);
        return <FileStep step={safeStep} onComplete={() => handleStepComplete(index)} />;
      default:
        return <TextStep step={safeStep} onComplete={() => handleStepComplete(index)} />;
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
            color: theme === 'dark' ? '#ffffff' : '#666666'
          }}>
            <FontAwesomeIcon 
              icon={faFileAlt} 
              style={{ 
                fontSize: '3rem', 
                color: '#6c757d', 
                marginBottom: '20px' 
              }} 
            />
            <p style={{ 
              fontSize: '1.75rem', 
              fontWeight: 'bold',  
              margin: '0'          
            }}>
              {t('lesson.no_steps_in_lesson')}
            </p>
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
    
    // Преобразуем старые URL в MinIO URL
    if (videoUrl && (videoUrl.includes('static/uploads/') || videoUrl.includes('localhost:9000'))) {
      console.log('🔄 Преобразуем старый URL в MinIO URL:', videoUrl);
      const minioUrl = getVideoUrl(videoUrl);
      console.log('✅ Новый MinIO URL:', minioUrl);
      return minioUrl;
    }
    
    // Исправляем URL, которые начинаются с имени бакета без префикса
    if (videoUrl && (videoUrl.startsWith('course-files/') || videoUrl.startsWith('uploads/') || videoUrl.startsWith('avatars/'))) {
      console.log('🔄 Исправляем URL без префикса:', videoUrl);
      const minioUrl = getVideoUrl(videoUrl);
      console.log('✅ Исправленный MinIO URL:', minioUrl);
      return minioUrl;
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

  // Функция для проверки файла в MinIO
  const checkFileInMinio = async (filename) => {
    try {
      const response = await fetch(`/api/minio/check-file/${filename}`);
      const data = await response.json();
      console.log('🔍 Результат проверки файла:', data);
      return data;
    } catch (error) {
      console.error('❌ Ошибка при проверке файла:', error);
      return null;
    }
  };

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
            console.log('🎬 Используемый URL в source:', cleanVideoUrl);
            
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
                        ✓ {t('lesson.completed') || 'Завершено'}
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
                        ✓ {t('lesson.completed') || 'Завершено'}
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
                        ✓ {t('lesson.completed') || 'Завершено'}
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
                  color: theme === 'dark' ? '#ffffff' : '#666666',
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
                      ✓ {t('lesson.completed') || 'Завершено'}
                    </div>
                  )}
                </div>
              );
            } else if (videoType === 'external') {
              // Для внешних ссылок, которые не распознаны как известные платформы
              console.log('🎨 External video theme:', theme, 'color:', theme === 'dark' ? '#ffffff' : '#666666');
              return (
                <div 
                  className="external-video-container"
                  style={{
                    width: '100%',
                    height: '300px',
                    background: theme === 'dark' ? '#2d2d2d' : '#f8f9fa',
                    border: `1px solid ${theme === 'dark' ? '#404040' : '#e9ecef'}`,
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    position: 'relative',
                    boxShadow: theme === 'dark' ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 2px 4px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <FontAwesomeIcon 
                    icon={faVideo} 
                    className="video-icon"
                    style={{ 
                      fontSize: '3rem', 
                      marginBottom: '15px', 
                      opacity: 0.5
                    }} 
                  />
                  <h4 style={{ 
                    margin: '0 0 10px 0', 
                    fontSize: '16px',
                    fontWeight: '600'
                  }}>
                    {(() => {
                      const text = t('lesson.external_video');
                      console.log('🎨 External video text:', text, 'theme:', theme);
                      return text;
                    })()}
                  </h4>
                  <p style={{ 
                    fontSize: '14px', 
                    margin: '0 0 15px 0', 
                    textAlign: 'center'
                  }}>
                    {t('lesson.video_external_platform')}
                  </p>
                  <a 
                    href={cleanVideoUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="video-link-btn"
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
                    {t('lesson.go_to_video')}
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
                      ✓ {t('lesson.completed') || 'Завершено'}
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
                      ✓ {t('lesson.completed') || 'Завершено'}
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
                    ✓ {t('lesson.completed') || 'Завершено'}
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
  };

  // Автоматически отмечаем текстовый шаг завершенным при отображении
  React.useEffect(() => {
    if (!isCompleted) {
      handleComplete();
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
  const [animationState, setAnimationState] = useState('idle'); // Состояние для анимаций

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
    console.log('=== TEST STEP HANDLE SUBMIT ===');
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
      <style>{testStyles}</style>
      
      {/* Sparkle эффекты */}
      <div className="test-sparkle"></div>
      <div className="test-sparkle"></div>
      <div className="test-sparkle"></div>
      <div className="test-sparkle"></div>
      
      <div className="test-container" style={{ 
        background: theme === 'dark' 
          ? 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)' 
          : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        borderRadius: '16px',
        padding: '24px',
        border: `2px solid ${theme === 'dark' ? '#404040' : '#e9ecef'}`,
        boxShadow: theme === 'dark' 
          ? '0 8px 32px rgba(0, 0, 0, 0.3)' 
          : '0 8px 32px rgba(0, 0, 0, 0.1)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Градиентный фон */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, #667eea, #764ba2, #f093fb, #f5576c)',
          backgroundSize: '200% 200%',
          animation: 'gradientShift 3s ease infinite'
        }}></div>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '15px',
          marginBottom: '20px',
          padding: '16px',
          background: theme === 'dark' 
            ? 'linear-gradient(135deg, rgba(68, 133, 237, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)' 
            : 'linear-gradient(135deg, rgba(68, 133, 237, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
          borderRadius: '12px',
          border: `1px solid ${theme === 'dark' ? '#404040' : '#e9ecef'}`
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
            animation: 'testPulse 2s ease-in-out infinite'
          }}>
            <FontAwesomeIcon 
              icon={faQuestionCircle} 
              style={{ 
                color: '#ffffff', 
                fontSize: '20px',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
              }} 
            />
          </div>
          <div>
            <h3 style={{ 
              fontSize: '1.4rem', 
              fontWeight: '700',
              color: theme === 'dark' ? '#ffffff' : '#333333',
              margin: '0 0 4px 0',
              textShadow: theme === 'dark' ? '0 2px 4px rgba(0,0,0,0.5)' : 'none'
            }}>
              {step.title || 'Тест'}
            </h3>
            <p style={{
              fontSize: '0.9rem',
              color: theme === 'dark' ? '#cccccc' : '#666666',
              margin: 0,
              fontWeight: '500'
            }}>
              {t('lesson.test_description')}
            </p>
          </div>
        </div>
      
              <div style={{ marginBottom: '20px' }}>
          
          {step.description && (
            <p style={{ 
              fontSize: '0.9rem',
              color: theme === 'dark' ? '#cccccc' : '#666666',
              marginBottom: '15px',
              padding: '12px 16px',
              background: theme === 'dark' 
                ? 'linear-gradient(135deg, rgba(255, 193, 7, 0.1) 0%, rgba(253, 126, 20, 0.1) 100%)' 
                : 'linear-gradient(135deg, rgba(255, 193, 7, 0.05) 0%, rgba(253, 126, 20, 0.05) 100%)',
              borderRadius: '8px',
              border: `1px solid ${theme === 'dark' ? '#404040' : '#e9ecef'}`
            }}>
              <FontAwesomeIcon 
                icon={faInfoCircle} 
                style={{ 
                  color: '#ffc107', 
                  marginRight: '8px',
                  fontSize: '14px'
                }} 
              />
              {step.description}
            </p>
          )}
        
        {questions.length === 0 ? (
          <div style={{
            padding: '24px',
            background: theme === 'dark' 
              ? 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)' 
              : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            borderRadius: '16px',
            textAlign: 'center',
            color: theme === 'dark' ? '#cccccc' : '#666666',
            border: `2px solid ${theme === 'dark' ? '#404040' : '#e9ecef'}`,
            boxShadow: theme === 'dark' 
              ? '0 8px 32px rgba(0, 0, 0, 0.3)' 
              : '0 8px 32px rgba(0, 0, 0, 0.1)',
            animation: 'testFadeIn 0.6s ease-out'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 6px 20px rgba(255, 193, 7, 0.3)',
              animation: 'testPulse 2s ease-in-out infinite'
            }}>
              <FontAwesomeIcon 
                icon={faExclamationTriangle} 
                style={{ 
                  color: '#ffffff', 
                  fontSize: '24px',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                }} 
              />
            </div>
            
            <h4 style={{
              fontSize: '1.2rem',
              fontWeight: '600',
              color: theme === 'dark' ? '#ffffff' : '#333333',
              margin: '0 0 8px 0'
            }}>
              Вопросы не найдены
            </h4>
            
            <p style={{ 
              fontSize: '0.9rem', 
              margin: '0 0 16px 0',
              color: theme === 'dark' ? '#cccccc' : '#666666'
            }}>
              Тип шага: {step.type}
            </p>
            
            <details style={{ 
              marginTop: '16px', 
              textAlign: 'left',
              background: theme === 'dark' ? '#1a1a1a' : '#ffffff',
              borderRadius: '8px',
              border: `1px solid ${theme === 'dark' ? '#404040' : '#e9ecef'}`,
              display: process.env.NODE_ENV === 'development' ? 'block' : 'none' // Скрываем в продакшене
            }}>
              <summary style={{ 
                cursor: 'pointer', 
                fontSize: '0.9rem',
                padding: '12px 16px',
                fontWeight: '600',
                color: theme === 'dark' ? '#ffffff' : '#333333',
                borderBottom: `1px solid ${theme === 'dark' ? '#404040' : '#e9ecef'}`
              }}>
                <FontAwesomeIcon 
                  icon={faInfoCircle} 
                  style={{ 
                    marginRight: '8px',
                    color: '#667eea'
                  }} 
                />
                Отладочная информация
              </summary>
              <pre style={{ 
                fontSize: '0.8rem', 
                background: 'transparent',
                padding: '16px',
                margin: 0,
                overflow: 'auto',
                maxHeight: '200px',
                color: theme === 'dark' ? '#cccccc' : '#666666',
                borderTop: `1px solid ${theme === 'dark' ? '#404040' : '#e9ecef'}`
              }}>
                {JSON.stringify(step, null, 2)}
              </pre>
            </details>
          </div>
        ) : (!isSubmitted && !testResults) ? (
          questions.map((question, questionIndex) => (
            <div
              key={questionIndex}
              className="test-question"
              style={{
                marginBottom: '24px',
                padding: '20px',
                background: theme === 'dark' 
                  ? 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)' 
                  : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                borderRadius: '12px',
                border: `2px solid ${theme === 'dark' ? '#404040' : '#e9ecef'}`,
                boxShadow: theme === 'dark' 
                  ? '0 4px 20px rgba(0, 0, 0, 0.3)' 
                  : '0 4px 20px rgba(0, 0, 0, 0.1)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Номер вопроса с иконкой */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px',
                padding: '8px 16px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '20px',
                width: 'fit-content'
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: '#ffffff'
                }}>
                  {questionIndex + 1}
                </div>
                <FontAwesomeIcon 
                  icon={faQuestionCircle} 
                  style={{ 
                    color: '#ffffff', 
                    fontSize: '14px' 
                  }} 
                />
              </div>
              
              <h4 style={{ 
                fontSize: '1.1rem', 
                fontWeight: '600',
                marginBottom: '16px',
                color: theme === 'dark' ? '#ffffff' : '#333333',
                lineHeight: '1.5'
              }}>
                {question.question || question.text}
              </h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {(question.options || question.answers || []).map((answer, answerIndex) => {
                  const selectedForQuestion = Array.isArray(selectedAnswers[questionIndex])
                    ? selectedAnswers[questionIndex]
                    : (selectedAnswers[questionIndex] !== undefined ? [selectedAnswers[questionIndex]] : []);
                  const isSelected = selectedForQuestion.includes(answerIndex);
                  
                  return (
                    <label
                      key={answerIndex}
                      className={`test-answer-option ${isSelected ? 'selected' : ''}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '16px',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        background: isSelected 
                          ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)'
                          : theme === 'dark' 
                            ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)'
                            : 'linear-gradient(135deg, rgba(0, 0, 0, 0.02) 0%, rgba(0, 0, 0, 0.01) 100%)',
                        border: `2px solid ${
                          isSelected 
                            ? '#667eea' 
                            : theme === 'dark' ? '#404040' : '#e9ecef'
                        }`,
                        color: theme === 'dark' ? '#eaf4fd' : '#333333',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      {/* Кастомный чекбокс */}
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '4px',
                        border: `2px solid ${isSelected ? '#667eea' : theme === 'dark' ? '#666666' : '#cccccc'}`,
                        background: isSelected ? '#667eea' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s ease'
                      }}>
                        {isSelected && (
                          <FontAwesomeIcon 
                            icon={faCheck} 
                            style={{ 
                              color: '#ffffff', 
                              fontSize: '12px',
                              animation: 'testSuccess 0.3s ease-out'
                            }} 
                          />
                        )}
                      </div>
                      
                      <input
                        type="checkbox"
                        name={`question-${questionIndex}`}
                        checked={isSelected}
                        onChange={() => handleAnswerSelect(questionIndex, answerIndex)}
                        style={{ 
                          position: 'absolute',
                          opacity: 0,
                          pointerEvents: 'none'
                        }}
                        disabled={isSubmitted}
                      />
                      
                      <span style={{
                        fontSize: '1rem',
                        fontWeight: '500',
                        flex: 1
                      }}>
                        {answer.text || answer}
                      </span>
                      
                      {/* Индикатор выбора */}
                      {isSelected && (
                        <div style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: '#667eea',
                          animation: 'testPulse 1s ease-in-out infinite'
                        }}></div>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="test-results" style={{
            padding: '24px',
            background: theme === 'dark' 
              ? 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)' 
              : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            borderRadius: '16px',
            textAlign: 'center',
            color: theme === 'dark' ? '#cccccc' : '#666666',
            border: `2px solid ${theme === 'dark' ? '#404040' : '#e9ecef'}`,
            boxShadow: theme === 'dark' 
              ? '0 8px 32px rgba(0, 0, 0, 0.3)' 
              : '0 8px 32px rgba(0, 0, 0, 0.1)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Градиентная полоса сверху */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: testResults && testResults.score >= 70 
                ? 'linear-gradient(90deg, #28a745, #20c997, #17a2b8)' 
                : testResults && testResults.score >= 50 
                  ? 'linear-gradient(90deg, #ffc107, #fd7e14, #e83e8c)' 
                  : 'linear-gradient(90deg, #dc3545, #fd7e14, #ffc107)',
              backgroundSize: '200% 200%',
              animation: 'gradientShift 3s ease infinite'
            }}></div>
            
            {testResults && (
              <div style={{ marginBottom: '24px' }}>
                {/* Иконка результата */}
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: testResults.score >= 70 
                    ? 'linear-gradient(135deg, #28a745 0%, #20c997 100%)' 
                    : testResults.score >= 50 
                      ? 'linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)' 
                      : 'linear-gradient(135deg, #dc3545 0%, #e83e8c 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  boxShadow: testResults.score >= 70 
                    ? '0 8px 25px rgba(40, 167, 69, 0.4)' 
                    : testResults.score >= 50 
                      ? '0 8px 25px rgba(255, 193, 7, 0.4)' 
                      : '0 8px 25px rgba(220, 53, 69, 0.4)',
                  animation: 'testBounce 1s ease-out'
                }}>
                  <FontAwesomeIcon 
                    icon={testResults.score >= 70 ? faTrophy : testResults.score >= 50 ? faStar : faTimes} 
                    style={{ 
                      color: '#ffffff', 
                      fontSize: '32px',
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                    }} 
                  />
                </div>
                
                <h4 style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: '700',
                  color: testResults.score >= 70 ? '#28a745' : testResults.score >= 50 ? '#ffc107' : '#dc3545',
                  marginBottom: '12px',
                  textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  {testResults.score}%
                </h4>
                
                <p style={{ 
                  fontSize: '1rem', 
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: theme === 'dark' ? '#ffffff' : '#333333'
                }}>
                  {t('lesson.correct_answers_count', { correct: testResults.correctAnswers, total: testResults.totalQuestions })}
                </p>
                
                <p style={{ 
                  fontSize: '0.9rem', 
                  marginBottom: '16px', 
                  color: theme === 'dark' ? '#ffffff' : '#666666',
                  fontWeight: '500'
                }}>
                  {t('lesson.attempts_count', { count: (testResults.attempts || 1) + 1 })}
                </p>
                
                {/* Прогресс бар */}
                <div style={{
                  width: '100%',
                  height: '12px',
                  background: theme === 'dark' ? '#404040' : '#e9ecef',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  marginTop: '16px',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <div 
                    className="test-progress-bar"
                    style={{
                      width: `${testResults.score}%`,
                      height: '100%',
                      background: testResults.score >= 70 
                        ? 'linear-gradient(90deg, #28a745 0%, #20c997 100%)' 
                        : testResults.score >= 50 
                          ? 'linear-gradient(90deg, #ffc107 0%, #fd7e14 100%)' 
                          : 'linear-gradient(90deg, #dc3545 0%, #e83e8c 100%)',
                      borderRadius: '6px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      '--progress-width': `${testResults.score}%`
                    }} 
                  />
                </div>
              </div>
            )}

            {/* Правильные ответы (по кнопке) */}
            {testResults && showCorrectAnswers && (
              <div style={{ 
                textAlign: 'left',
                animation: 'testFadeIn 0.6s ease-out'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '20px',
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '12px',
                  width: 'fit-content'
                }}>
                  <FontAwesomeIcon 
                    icon={faLightbulb} 
                    style={{ 
                      color: '#ffffff', 
                      fontSize: '16px' 
                    }} 
                  />
                  <h5 style={{ 
                    fontSize: '1.1rem', 
                    fontWeight: '600',
                    margin: 0,
                    color: '#ffffff'
                  }}>
                    {t('lesson.correct_answers')}
                  </h5>
                </div>
                
                {questions.map((question, questionIndex) => {
                  const result = testResults.results && testResults.results[questionIndex];
                  const options = (question.options || question.answers || []);
                  const correctOptions = (result && result.correctAnswerIndices ? result.correctAnswerIndices : [])
                    .map((idx) => options[idx])
                    .filter(Boolean);
                  
                  return (
                    <div
                      key={questionIndex}
                      className={`test-answer-option ${(result && result.isCorrect) ? 'correct' : 'incorrect'}`}
                      style={{
                        marginBottom: '16px',
                        padding: '16px',
                        background: (result && result.isCorrect) 
                          ? 'linear-gradient(135deg, rgba(40, 167, 69, 0.1) 0%, rgba(32, 201, 151, 0.1) 100%)' 
                          : 'linear-gradient(135deg, rgba(220, 53, 69, 0.1) 0%, rgba(232, 62, 140, 0.1) 100%)',
                        border: `2px solid ${(result && result.isCorrect) ? '#28a745' : '#dc3545'}`,
                        borderRadius: '12px',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      {/* Иконка результата */}
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: (result && result.isCorrect) 
                          ? 'linear-gradient(135deg, #28a745 0%, #20c997 100%)' 
                          : 'linear-gradient(135deg, #dc3545 0%, #e83e8c 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <FontAwesomeIcon 
                          icon={(result && result.isCorrect) ? faCheck : faTimes} 
                          style={{ 
                            color: '#ffffff', 
                            fontSize: '12px' 
                          }} 
                        />
                      </div>
                      
                      <p style={{ 
                        fontSize: '1rem',
                        fontWeight: '600',
                        marginBottom: '8px',
                        color: (result && result.isCorrect) ? '#155724' : '#721c24',
                        paddingRight: '40px'
                      }}>
                        {questionIndex + 1}. {question.question || question.text}
                      </p>
                      <p style={{ 
                        fontSize: '0.9rem',
                        color: (result && result.isCorrect) ? '#155724' : '#721c24',
                        fontWeight: '500'
                      }}>
                        <strong>{t('lesson.correct_answers')}:</strong> {correctOptions.length > 0
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
              marginTop: '24px',
              marginBottom: '20px',
              padding: '16px 24px',
              background: testResults && testResults.score >= 100 
                ? 'linear-gradient(135deg, rgba(40, 167, 69, 0.1) 0%, rgba(32, 201, 151, 0.1) 100%)' 
                : 'linear-gradient(135deg, rgba(255, 193, 7, 0.1) 0%, rgba(253, 126, 20, 0.1) 100%)',
              border: `2px solid ${testResults && testResults.score >= 100 ? '#28a745' : '#ffc107'}`,
              borderRadius: '12px',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Анимированная иконка */}
              <div style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: testResults && testResults.score >= 100 
                  ? 'linear-gradient(135deg, #28a745 0%, #20c997 100%)' 
                  : 'linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'testPulse 2s ease-in-out infinite'
              }}>
                <FontAwesomeIcon 
                  icon={testResults && testResults.score >= 100 ? faTrophy : faStar} 
                  style={{ 
                    color: '#ffffff', 
                    fontSize: '12px' 
                  }} 
                />
              </div>
              
              <p style={{ 
                fontSize: '1rem', 
                margin: '0',
                color: testResults && testResults.score >= 100 ? '#155724' : '#856404',
                fontWeight: '600',
                textShadow: '0 1px 2px rgba(0,0,0,0.1)'
              }}>
                {testResults && testResults.score >= 100 
                  ? t('lesson.test_completed_100')
                  : t('lesson.test_completed_partial', { score: testResults?.score || 0 })
                }
              </p>
            </div>
            
            {/* Кнопки рядом */}
            <div style={{ 
              display: 'flex', 
              gap: '16px', 
              justifyContent: 'center', 
              alignItems: 'center',
              marginTop: '24px'
            }}>
              {/* Кнопка показа правильных ответов */}
              <button
                onClick={() => setShowCorrectAnswers(prev => !prev)}
                className="test-submit-btn"
                style={{
                  padding: '14px 24px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                  boxShadow: '0 6px 20px rgba(102, 126, 234, 0.3)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.3)';
                }}
              >
                <FontAwesomeIcon 
                  icon={showCorrectAnswers ? faEyeSlash : faEye} 
                  style={{ fontSize: '14px' }} 
                />
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
                className="test-submit-btn"
                style={{
                  padding: '14px 24px',
                  background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                  boxShadow: '0 6px 20px rgba(40, 167, 69, 0.3)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 25px rgba(40, 167, 69, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 6px 20px rgba(40, 167, 69, 0.3)';
                }}
              >
                <FontAwesomeIcon 
                  icon={faRocket} 
                  style={{ fontSize: '14px' }} 
                />
                 {t('lesson.solve_again')}
              </button>
            </div>
          </div>
        )}
      </div>
      
      {questions.length > 0 && !isSubmitted && !testResults ? (
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
          <button
            onClick={handleSubmit}
            disabled={answeredCount < questions.length}
            className="test-submit-btn"
            style={{
              padding: '16px 32px',
              background: answeredCount < questions.length 
                ? 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)' 
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: answeredCount < questions.length ? 'not-allowed' : 'pointer',
              opacity: answeredCount < questions.length ? 0.6 : 1,
              fontSize: '1.1rem',
              fontWeight: '600',
              boxShadow: answeredCount < questions.length 
                ? '0 4px 15px rgba(108, 117, 125, 0.3)' 
                : '0 8px 25px rgba(102, 126, 234, 0.4)',
              transform: answeredCount < questions.length ? 'none' : 'translateY(0)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onMouseEnter={(e) => {
              if (answeredCount >= questions.length) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 12px 35px rgba(102, 126, 234, 0.6)';
              }
            }}
            onMouseLeave={(e) => {
              if (answeredCount >= questions.length) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.4)';
              }
            }}
          >
            <FontAwesomeIcon 
              icon={answeredCount < questions.length ? faTimes : faCheck} 
              style={{ marginRight: '8px' }} 
            />
            {answeredCount < questions.length 
              ? t('lesson.answer_all_questions', { answered: answeredCount, total: questions.length })
              : t('lesson.send_answers')
            }
          </button>
        </div>
      ) : null}
      </div> {/* Закрывающий div для test-container */}
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

  // Стили для разных языков программирования (как в популярных IDE)
  const getLanguageStyles = (language) => {
    const lang = language?.toLowerCase();
    
    const styles = {
      // Visual Studio (C++, C#, C)
      'cpp': {
        background: '#1e1e1e',
        color: '#d4d4d4',
        fontFamily: 'Consolas, "Courier New", monospace',
        borderColor: '#007acc',
        headerBg: '#007acc',
        headerColor: '#ffffff',
        keywordColor: '#569cd6',
        stringColor: '#ce9178',
        commentColor: '#6a9955',
        numberColor: '#b5cea8',
        functionColor: '#dcdcaa'
      },
      'c': {
        background: '#1e1e1e',
        color: '#d4d4d4',
        fontFamily: 'Consolas, "Courier New", monospace',
        borderColor: '#007acc',
        headerBg: '#007acc',
        headerColor: '#ffffff',
        keywordColor: '#569cd6',
        stringColor: '#ce9178',
        commentColor: '#6a9955',
        numberColor: '#b5cea8',
        functionColor: '#dcdcaa'
      },
      'csharp': {
        background: '#1e1e1e',
        color: '#d4d4d4',
        fontFamily: 'Consolas, "Courier New", monospace',
        borderColor: '#68217a',
        headerBg: '#68217a',
        headerColor: '#ffffff',
        keywordColor: '#569cd6',
        stringColor: '#ce9178',
        commentColor: '#6a9955',
        numberColor: '#b5cea8',
        functionColor: '#dcdcaa'
      },
      'cs': {
        background: '#1e1e1e',
        color: '#d4d4d4',
        fontFamily: 'Consolas, "Courier New", monospace',
        borderColor: '#68217a',
        headerBg: '#68217a',
        headerColor: '#ffffff',
        keywordColor: '#569cd6',
        stringColor: '#ce9178',
        commentColor: '#6a9955',
        numberColor: '#b5cea8',
        functionColor: '#dcdcaa'
      },
      
      // IntelliJ IDEA (Java, Kotlin)
      'java': {
        background: '#2b2b2b',
        color: '#a9b7c6',
        fontFamily: 'JetBrains Mono, Consolas, monospace',
        borderColor: '#f36522',
        headerBg: '#f36522',
        headerColor: '#ffffff',
        keywordColor: '#cc7832',
        stringColor: '#6a8759',
        commentColor: '#808080',
        numberColor: '#6897bb',
        functionColor: '#ffc66d'
      },
      'kotlin': {
        background: '#2b2b2b',
        color: '#a9b7c6',
        fontFamily: 'JetBrains Mono, Consolas, monospace',
        borderColor: '#f18e33',
        headerBg: '#f18e33',
        headerColor: '#ffffff',
        keywordColor: '#cc7832',
        stringColor: '#6a8759',
        commentColor: '#808080',
        numberColor: '#6897bb',
        functionColor: '#ffc66d'
      },
      
      // VS Code (JavaScript, TypeScript)
      'javascript': {
        background: '#1e1e1e',
        color: '#d4d4d4',
        fontFamily: 'Consolas, "Courier New", monospace',
        borderColor: '#f7df1e',
        headerBg: '#f7df1e',
        headerColor: '#000000',
        keywordColor: '#569cd6',
        stringColor: '#ce9178',
        commentColor: '#6a9955',
        numberColor: '#b5cea8',
        functionColor: '#dcdcaa'
      },
      'js': {
        background: '#1e1e1e',
        color: '#d4d4d4',
        fontFamily: 'Consolas, "Courier New", monospace',
        borderColor: '#f7df1e',
        headerBg: '#f7df1e',
        headerColor: '#000000',
        keywordColor: '#569cd6',
        stringColor: '#ce9178',
        commentColor: '#6a9955',
        numberColor: '#b5cea8',
        functionColor: '#dcdcaa'
      },
      'typescript': {
        background: '#1e1e1e',
        color: '#d4d4d4',
        fontFamily: 'Consolas, "Courier New", monospace',
        borderColor: '#3178c6',
        headerBg: '#3178c6',
        headerColor: '#ffffff',
        keywordColor: '#569cd6',
        stringColor: '#ce9178',
        commentColor: '#6a9955',
        numberColor: '#b5cea8',
        functionColor: '#dcdcaa'
      },
      'ts': {
        background: '#1e1e1e',
        color: '#d4d4d4',
        fontFamily: 'Consolas, "Courier New", monospace',
        borderColor: '#3178c6',
        headerBg: '#3178c6',
        headerColor: '#ffffff',
        keywordColor: '#569cd6',
        stringColor: '#ce9178',
        commentColor: '#6a9955',
        numberColor: '#b5cea8',
        functionColor: '#dcdcaa'
      },
      
      // PyCharm (Python)
      'python': {
        background: '#2b2b2b',
        color: '#a9b7c6',
        fontFamily: 'JetBrains Mono, Consolas, monospace',
        borderColor: '#3776ab',
        headerBg: '#3776ab',
        headerColor: '#ffffff',
        keywordColor: '#cc7832',
        stringColor: '#6a8759',
        commentColor: '#808080',
        numberColor: '#6897bb',
        functionColor: '#ffc66d'
      },
      'py': {
        background: '#2b2b2b',
        color: '#a9b7c6',
        fontFamily: 'JetBrains Mono, Consolas, monospace',
        borderColor: '#3776ab',
        headerBg: '#3776ab',
        headerColor: '#ffffff',
        keywordColor: '#cc7832',
        stringColor: '#6a8759',
        commentColor: '#808080',
        numberColor: '#6897bb',
        functionColor: '#ffc66d'
      },
      
      // GoLand (Go)
      'go': {
        background: '#2b2b2b',
        color: '#a9b7c6',
        fontFamily: 'JetBrains Mono, Consolas, monospace',
        borderColor: '#00add8',
        headerBg: '#00add8',
        headerColor: '#ffffff',
        keywordColor: '#cc7832',
        stringColor: '#6a8759',
        commentColor: '#808080',
        numberColor: '#6897bb',
        functionColor: '#ffc66d'
      },
      
      // Rust (Rust Analyzer)
      'rust': {
        background: '#1e1e1e',
        color: '#d4d4d4',
        fontFamily: 'Consolas, "Courier New", monospace',
        borderColor: '#ce422b',
        headerBg: '#ce422b',
        headerColor: '#ffffff',
        keywordColor: '#569cd6',
        stringColor: '#ce9178',
        commentColor: '#6a9955',
        numberColor: '#b5cea8',
        functionColor: '#dcdcaa'
      },
      
      // Swift (Xcode)
      'swift': {
        background: '#1e1e1e',
        color: '#d4d4d4',
        fontFamily: 'SF Mono, Consolas, monospace',
        borderColor: '#ffac45',
        headerBg: '#ffac45',
        headerColor: '#000000',
        keywordColor: '#569cd6',
        stringColor: '#ce9178',
        commentColor: '#6a9955',
        numberColor: '#b5cea8',
        functionColor: '#dcdcaa'
      },
      
      // PHP (PhpStorm)
      'php': {
        background: '#2b2b2b',
        color: '#a9b7c6',
        fontFamily: 'JetBrains Mono, Consolas, monospace',
        borderColor: '#777bb4',
        headerBg: '#777bb4',
        headerColor: '#ffffff',
        keywordColor: '#cc7832',
        stringColor: '#6a8759',
        commentColor: '#808080',
        numberColor: '#6897bb',
        functionColor: '#ffc66d'
      },
      
      // Ruby (RubyMine)
      'ruby': {
        background: '#2b2b2b',
        color: '#a9b7c6',
        fontFamily: 'JetBrains Mono, Consolas, monospace',
        borderColor: '#cc342d',
        headerBg: '#cc342d',
        headerColor: '#ffffff',
        keywordColor: '#cc7832',
        stringColor: '#6a8759',
        commentColor: '#808080',
        numberColor: '#6897bb',
        functionColor: '#ffc66d'
      },
      
      // HTML/CSS
      'html': {
        background: '#1e1e1e',
        color: '#d4d4d4',
        fontFamily: 'Consolas, "Courier New", monospace',
        borderColor: '#e34f26',
        headerBg: '#e34f26',
        headerColor: '#ffffff',
        keywordColor: '#569cd6',
        stringColor: '#ce9178',
        commentColor: '#6a9955',
        numberColor: '#b5cea8',
        functionColor: '#dcdcaa'
      },
      'css': {
        background: '#1e1e1e',
        color: '#d4d4d4',
        fontFamily: 'Consolas, "Courier New", monospace',
        borderColor: '#1572b6',
        headerBg: '#1572b6',
        headerColor: '#ffffff',
        keywordColor: '#569cd6',
        stringColor: '#ce9178',
        commentColor: '#6a9955',
        numberColor: '#b5cea8',
        functionColor: '#dcdcaa'
      },
      
      // SQL
      'sql': {
        background: '#1e1e1e',
        color: '#d4d4d4',
        fontFamily: 'Consolas, "Courier New", monospace',
        borderColor: '#336791',
        headerBg: '#336791',
        headerColor: '#ffffff',
        keywordColor: '#569cd6',
        stringColor: '#ce9178',
        commentColor: '#6a9955',
        numberColor: '#b5cea8',
        functionColor: '#dcdcaa'
      }
    };
    
    return styles[lang] || styles['javascript']; // Fallback к JavaScript стилю
  };

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

  const languageStyles = getLanguageStyles(language);
  
  // Функция для базовой подсветки синтаксиса
  const highlightSyntax = (code, language) => {
    const lang = language?.toLowerCase();
    const styles = getLanguageStyles(language);
    
    // Ключевые слова для разных языков
    const keywords = {
      'javascript': ['function', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'return', 'class', 'import', 'export', 'default', 'async', 'await'],
      'js': ['function', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'return', 'class', 'import', 'export', 'default', 'async', 'await'],
      'typescript': ['function', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'return', 'class', 'import', 'export', 'default', 'async', 'await', 'interface', 'type', 'enum'],
      'ts': ['function', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'return', 'class', 'import', 'export', 'default', 'async', 'await', 'interface', 'type', 'enum'],
      'java': ['public', 'private', 'protected', 'class', 'interface', 'extends', 'implements', 'static', 'final', 'void', 'int', 'String', 'boolean', 'if', 'else', 'for', 'while', 'return', 'new'],
      'python': ['def', 'class', 'if', 'else', 'elif', 'for', 'while', 'return', 'import', 'from', 'as', 'True', 'False', 'None', 'self', 'lambda'],
      'py': ['def', 'class', 'if', 'else', 'elif', 'for', 'while', 'return', 'import', 'from', 'as', 'True', 'False', 'None', 'self', 'lambda'],
      'cpp': ['int', 'float', 'double', 'char', 'bool', 'string', 'vector', 'class', 'public', 'private', 'protected', 'if', 'else', 'for', 'while', 'return', 'new', 'delete'],
      'c': ['int', 'float', 'double', 'char', 'if', 'else', 'for', 'while', 'return', 'struct', 'typedef', 'include', 'define'],
      'csharp': ['public', 'private', 'protected', 'class', 'interface', 'namespace', 'using', 'static', 'void', 'int', 'string', 'bool', 'if', 'else', 'for', 'while', 'return', 'new'],
      'cs': ['public', 'private', 'protected', 'class', 'interface', 'namespace', 'using', 'static', 'void', 'int', 'string', 'bool', 'if', 'else', 'for', 'while', 'return', 'new']
    };
    
    const langKeywords = keywords[lang] || [];
    
    // Простая подсветка ключевых слов
    let highlightedCode = code;
    
    // Подсветка ключевых слов
    langKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      highlightedCode = highlightedCode.replace(regex, `<span style="color: ${styles.keywordColor}; font-weight: 600;">${keyword}</span>`);
    });
    
    // Подсветка строк (в кавычках)
    highlightedCode = highlightedCode.replace(/"([^"]*)"/g, `<span style="color: ${styles.stringColor};">"$1"</span>`);
    highlightedCode = highlightedCode.replace(/'([^']*)'/g, `<span style="color: ${styles.stringColor};">'$1'</span>`);
    
    // Подсветка комментариев
    if (['javascript', 'js', 'typescript', 'ts', 'java', 'cpp', 'c', 'csharp', 'cs'].includes(lang)) {
      // Однострочные комментарии //
      highlightedCode = highlightedCode.replace(/\/\/.*$/gm, `<span style="color: ${styles.commentColor}; font-style: italic;">$&</span>`);
      // Многострочные комментарии /* */
      highlightedCode = highlightedCode.replace(/\/\*[\s\S]*?\*\//g, `<span style="color: ${styles.commentColor}; font-style: italic;">$&</span>`);
    } else if (['python', 'py'].includes(lang)) {
      // Python комментарии #
      highlightedCode = highlightedCode.replace(/#.*$/gm, `<span style="color: ${styles.commentColor}; font-style: italic;">$&</span>`);
    }
    
    // Подсветка чисел
    highlightedCode = highlightedCode.replace(/\b\d+\.?\d*\b/g, `<span style="color: ${styles.numberColor};">$&</span>`);
    
    return highlightedCode;
  };

  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      {/* Заголовок с иконкой */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '15px',
        marginBottom: '20px',
        padding: '16px',
        background: theme === 'dark' 
          ? 'linear-gradient(135deg, rgba(68, 133, 237, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)' 
          : 'linear-gradient(135deg, rgba(68, 133, 237, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
        borderRadius: '12px',
        border: `1px solid ${theme === 'dark' ? '#404040' : '#e9ecef'}`
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
          animation: 'testPulse 2s ease-in-out infinite'
        }}>
          <FontAwesomeIcon 
            icon={faCode} 
            style={{ 
              color: '#ffffff', 
              fontSize: '20px',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
            }} 
          />
        </div>
        <div>
          <h3 style={{ 
            fontSize: '1.4rem', 
            fontWeight: '700',
            color: theme === 'dark' ? '#ffffff' : '#333333',
            margin: '0 0 4px 0',
            textShadow: theme === 'dark' ? '0 2px 4px rgba(0,0,0,0.5)' : 'none'
          }}>
            {step.title || t('lesson.code')}
          </h3>
          <p style={{
            fontSize: '0.9rem',
            color: theme === 'dark' ? '#cccccc' : '#666666',
            margin: 0,
            fontWeight: '500'
          }}>
            {language ? `${language.toUpperCase()} ${t('lesson.code_example')}` : t('lesson.code_example')}
          </p>
        </div>
      </div>
      
      {/* Контейнер кода */}
      <div style={{ 
        position: 'relative',
        marginBottom: '20px',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
        border: `2px solid ${languageStyles.borderColor}`
      }}>
        {/* Заголовок с языком программирования */}
        <div style={{
          padding: '12px 20px',
          background: languageStyles.headerBg,
          color: languageStyles.headerColor,
          fontSize: '14px',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          borderBottom: `1px solid ${languageStyles.borderColor}`
        }}>
          <FontAwesomeIcon 
            icon={faCode} 
            style={{ fontSize: '16px' }} 
          />
          {language || 'Code'}
        </div>
        
        {/* Код */}
        <div style={{
          padding: '20px',
          background: languageStyles.background,
          color: languageStyles.color,
          fontFamily: languageStyles.fontFamily,
          fontSize: '14px',
          lineHeight: '1.6',
          overflowX: 'auto',
          position: 'relative'
        }}>
          {/* Код без нумерации строк */}
          <pre style={{
            margin: 0,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontFamily: languageStyles.fontFamily,
            fontSize: '14px',
            lineHeight: '1.6',
            padding: '20px'
          }}>
            <code style={{
              color: languageStyles.color,
              fontFamily: languageStyles.fontFamily,
              backgroundColor: 'transparent'
            }}>
              {code.split('\n').map((line, lineIndex) => {
                const isNotEmpty = line.trim().length > 0;
                return (
                  <div key={lineIndex} style={{ 
                    height: '1.6em',
                    lineHeight: '1.6em',
                    padding: '0 10px',
                    paddingTop: '0',
                    paddingBottom: '0',
                    borderLeft: isNotEmpty ? `3px solid ${languageStyles.borderColor}` : '3px solid transparent',
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: isNotEmpty ? 'rgba(255, 255, 255, 0.02)' : 'transparent'
                  }}>
                    <span 
                      style={{ 
                        whiteSpace: 'pre',
                        fontFamily: languageStyles.fontFamily,
                        color: isNotEmpty ? languageStyles.color : theme === 'dark' ? '#666666' : '#999999'
                      }}
                    >
                      {line || '\u00A0'}
                    </span>
                  </div>
                );
              })}
            </code>
          </pre>
        </div>
      </div>
      
      {/* Описание */}
      {description && (
        <div style={{ 
          padding: '20px',
          background: theme === 'dark' 
            ? 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)' 
            : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
          borderRadius: '12px',
          marginBottom: '20px',
          border: `2px solid ${theme === 'dark' ? '#404040' : '#e9ecef'}`,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Градиентная полоса сверху */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #667eea, #764ba2, #f093fb, #f5576c)',
            backgroundSize: '200% 200%',
            animation: 'gradientShift 3s ease infinite'
          }}></div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '12px'
          }}>
            <FontAwesomeIcon 
              icon={faInfoCircle} 
              style={{ 
                color: '#667eea',
                fontSize: '16px'
              }} 
            />
            <h4 style={{
              fontSize: '1.1rem',
              fontWeight: '600',
              color: theme === 'dark' ? '#ffffff' : '#333333',
              margin: 0
            }}>
              {t('lesson.code_description')}
            </h4>
          </div>
          
          <p style={{ 
            fontSize: '1rem',
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

// Компонент для отображения файловых шагов
const FileStep = ({ step, onComplete }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [isCompleted, setIsCompleted] = useState(false);

  console.log('🚀 FileStep component rendered with step:', step);

  const handleComplete = () => {
    console.log('Файл скачан или переход по ссылке, отмечаем как завершенный');
    setIsCompleted(true);
    onComplete();
  };

  // Извлекаем данные из шага, учитывая возможные форматы
  const getStepData = () => {
    let data = {
      fileUrl: null,
      filename: null,
      description: '',
      title: step.title || 'Файл для скачивания'
    };

    // Сначала проверяем content как JSON строку (высший приоритет)
    if (step.content && typeof step.content === 'string') {
      try {
        const parsed = JSON.parse(step.content);
        console.log('✅ Successfully parsed JSON content:', parsed);
        
        if (parsed.fileUrl) data.fileUrl = parsed.fileUrl;
        if (parsed.filename) data.filename = parsed.filename;
        if (parsed.description) data.description = parsed.description;
        if (parsed.title) data.title = parsed.title;
      } catch (e) {
        console.log('❌ Failed to parse JSON content:', e.message);
        // Если не JSON, используем как есть
      }
    }

    // Затем проверяем content как объект
    if (step.content && typeof step.content === 'object') {
      console.log('📋 Content is object:', step.content);
      
      if (step.content.fileUrl && !data.fileUrl) data.fileUrl = step.content.fileUrl;
      if (step.content.filename && !data.filename) data.filename = step.content.filename;
      if (step.content.description && !data.description) data.description = step.content.description;
      if (step.content.title && !data.title) data.title = step.content.title;
    }

    // В последнюю очередь проверяем прямые поля (низший приоритет)
    if (step.fileUrl && !data.fileUrl) data.fileUrl = step.fileUrl;
    if (step.filename && !data.filename) data.filename = step.filename;
    if (step.description && !data.description) data.description = step.description;
    if (step.title && !data.title) data.title = step.title;

    // Если название файла не найдено, но есть URL, извлекаем из URL
    if (!data.filename && data.fileUrl) {
      const urlParts = data.fileUrl.split('/');
      const lastPart = urlParts[urlParts.length - 1];
      if (lastPart && lastPart.includes('.')) {
        // Убираем timestamp из имени файла для лучшего отображения
        const cleanName = lastPart.replace(/^\d{4}-\d{2}-\d{2}\s+at\s+\d{2}\.\d{2}\.\d{2}\s*/, '');
        data.filename = cleanName || lastPart;
      }
    }

    console.log('🔍 Extracted step data:', data);
    return data;
  };

  const { fileUrl: originalFileUrl, filename, description, title } = getStepData();
  
  // Преобразуем fileUrl в URL для скачивания через наш backend
  const fileUrl = (() => {
    if (!originalFileUrl) return null;
    
    // Проверяем, что это не внешняя ссылка (Google, YouTube и т.д.)
    if (originalFileUrl.includes('google.com') || originalFileUrl.includes('youtube.com') || 
        originalFileUrl.includes('youtu.be') || originalFileUrl.includes('facebook.com')) {
      console.log('⚠️ fileUrl содержит внешнюю ссылку, пропускаем:', originalFileUrl);
      return null;
    }
    
    // Преобразуем старые URL в MinIO URL
    if (originalFileUrl.includes('static/uploads/') || originalFileUrl.includes('localhost:9000')) {
      console.log('🔄 Преобразуем старый URL в MinIO URL:', originalFileUrl);
      const minioUrl = getVideoUrl(originalFileUrl);
      console.log('✅ Новый MinIO URL:', minioUrl);
      return minioUrl;
    }
    
    // Для остальных возвращаем оригинальный URL - формирование download URL будет в handleDownload
    return originalFileUrl;
  })();

  console.log('FileStep data:', { 
    step, 
    extractedData: { fileUrl, filename, description, title },
    originalContent: step.content,
    stepKeys: Object.keys(step),
    contentType: typeof step.content,
    hasFileUrl: !!step.fileUrl,
    hasFilename: !!step.filename,
    hasDescription: !!step.description,
    filenameEncoding: filename ? {
      original: filename,
      encoded: encodeURIComponent(filename),
      decoded: decodeURIComponent(encodeURIComponent(filename))
    } : null
  });

  const handleDownload = async () => {
    if (fileUrl) {
      // Отмечаем шаг как завершенный при скачивания файла
      handleComplete();
      
      console.log('📥 Starting file download from:', fileUrl);
      
      // Получаем оригинальное расширение из URL файла (реальный файл)
      const urlParts = fileUrl.split('/');
      const originalFileName = urlParts[urlParts.length - 1];
      const originalExtension = originalFileName.includes('.') ? originalFileName.split('.').pop() : '';
      
      // Формируем имя для скачивания
      let downloadFilename;
      
      if (filename && filename !== 'Файл' && filename !== '') {
        // Если есть пользовательское название, добавляем к нему оригинальное расширение
        if (originalExtension && !filename.toLowerCase().endsWith(`.${originalExtension.toLowerCase()}`)) {
          downloadFilename = `${filename}.${originalExtension}`;
        } else {
          downloadFilename = filename;
        }
      } else {
        // Если нет пользовательского названия, используем оригинальное имя файла
        downloadFilename = originalFileName;
      }
      
      console.log('Download filename calculation:', {
        originalFileName,
        originalExtension,
        userFilename: filename,
        finalDownloadFilename: downloadFilename
      });
      
      // Формируем правильный download URL с downloadName параметром
      let downloadUrl = fileUrl;
      
      // Используем frontend URL для скачивания, а не backend API
      if (originalFileUrl.startsWith('course-files/')) {
        const fileName = originalFileUrl.split('/').pop();
        downloadUrl = `https://localhost:3000/api/minio/download/course-files/${fileName}?downloadName=${encodeURIComponent(downloadFilename)}`;
        console.log('✅ Frontend download URL для файла курса:', downloadUrl);
      } else if (originalFileUrl.startsWith('uploads/')) {
        const fileName = originalFileUrl.split('/').pop();
        downloadUrl = `https://localhost:3000/api/files/download-direct/${fileName}?downloadName=${encodeURIComponent(downloadFilename)}`;
        console.log('✅ Frontend download URL для загруженного файла:', downloadUrl);
      }
      
      try {
        // Скачиваем файл через fetch
        console.log('🔄 Fetching file from:', downloadUrl);
        console.log('🔍 Request details:', {
          url: downloadUrl,
          method: 'GET',
          headers: {
            'Accept': '*/*',
            'Cache-Control': 'no-cache'
          }
        });
        
        const response = await fetch(downloadUrl, {
          method: 'GET',
          headers: {
            'Accept': '*/*',
            'Cache-Control': 'no-cache'
          }
        });
        
        console.log('📥 Response received:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Получаем blob из ответа
        const blob = await response.blob();
        console.log('✅ File blob received, size:', blob.size);
        
        // Создаем URL для blob
        const blobUrl = window.URL.createObjectURL(blob);
        
        // Создаем временную ссылку для скачивания
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = downloadFilename;
        link.style.display = 'none';
        
        // Добавляем ссылку в DOM, кликаем по ней и удаляем
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Освобождаем память
        window.URL.revokeObjectURL(blobUrl);
        
        console.log('✅ File download initiated:', downloadFilename);
        
      } catch (error) {
        console.error('❌ Error downloading file:', error);
        // Fallback к старому способу если fetch не сработал
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = downloadFilename;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log('🔄 Fallback download initiated');
      }
    }
  };

  const handleExternalLink = () => {
    if (fileUrl) {
      // Отмечаем шаг как завершенный при переходе по внешней ссылке
      handleComplete();
      
      // Открываем внешнюю ссылку в новой вкладке
      window.open(fileUrl, '_blank');
    }
  };

  const getFileIcon = (filename, fileUrl) => {
    // Сначала пытаемся определить расширение из реального файла (fileUrl)
    let ext = '';
    
    if (fileUrl) {
      const urlParts = fileUrl.split('/');
      const originalFileName = urlParts[urlParts.length - 1];
      ext = originalFileName.includes('.') ? originalFileName.split('.').pop()?.toLowerCase() : '';
    }
    
    // Если не удалось определить из URL, используем filename
    if (!ext && filename) {
      ext = filename.split('.').pop()?.toLowerCase();
    }
    
    console.log('File icon determination:', { filename, fileUrl, ext });
    
    switch (ext) {
      case 'pdf':
        return faFilePdf;
      case 'doc':
      case 'docx':
        return faFileWord;
      case 'xls':
      case 'xlsx':
        return faFileExcel;
      case 'ppt':
      case 'pptx':
        return faFilePowerpoint;
      case 'zip':
      case 'rar':
      case '7z':
      case 'tar':
      case 'gz':
        return faFileArchive;
      case 'txt':
      case 'md':
      case 'log':
        return faFileAlt;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
      case 'svg':
      case 'webp':
        return faFileImage;
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'wmv':
      case 'flv':
      case 'webm':
      case 'mkv':
        return faFileVideo;
      case 'mp3':
      case 'wav':
      case 'ogg':
      case 'flac':
      case 'aac':
        return faFileAudio;
      default:
        return faFile;
    }
  };

  const getFileTypeColor = (filename, fileUrl) => {
    // Сначала пытаемся определить расширение из реального файла (fileUrl)
    let ext = '';
    
    if (fileUrl) {
      const urlParts = fileUrl.split('/');
      const originalFileName = urlParts[urlParts.length - 1];
      ext = originalFileName.includes('.') ? originalFileName.split('.').pop()?.toLowerCase() : '';
    }
    
    // Если не удалось определить из URL, используем filename
    if (!ext && filename) {
      ext = filename.split('.').pop()?.toLowerCase();
    }
    
    switch (ext) {
      case 'pdf':
        return '#ff4444';
      case 'doc':
      case 'docx':
        return '#4285f4';
      case 'xls':
      case 'xlsx':
        return '#0f9d58';
      case 'ppt':
      case 'pptx':
        return '#ff6b35';
      case 'zip':
      case 'rar':
      case '7z':
      case 'tar':
      case 'gz':
        return '#ffc107';
      case 'txt':
      case 'md':
      case 'log':
        return '#9e9e9e';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
      case 'svg':
      case 'webp':
        return '#e91e63';
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'wmv':
      case 'flv':
      case 'webm':
      case 'mkv':
        return '#9c27b0';
      case 'mp3':
      case 'wav':
      case 'ogg':
      case 'flac':
      case 'aac':
        return '#3f51b5';
      default:
        return '#607d8b';
    }
  };

  // Функция для определения, является ли файл изображением
  const isImageFile = (filename, fileUrl) => {
    // Сначала пытаемся определить расширение из реального файла (fileUrl)
    let ext = '';
    
    if (fileUrl) {
      const urlParts = fileUrl.split('/');
      const originalFileName = urlParts[urlParts.length - 1];
      ext = originalFileName.includes('.') ? originalFileName.split('.').pop()?.toLowerCase() : '';
    }
    
    // Если не удалось определить из URL, используем filename
    if (!ext && filename) {
      ext = filename.split('.').pop()?.toLowerCase();
    }
    
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];
    return imageExtensions.includes(ext);
  };

  return (
    <div style={{ 
      padding: '20px',
      background: theme === 'dark' 
        ? 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)' 
        : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
      borderRadius: '12px',
      border: `2px solid ${theme === 'dark' ? '#404040' : '#e9ecef'}`,
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Градиентная полоса сверху */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: 'linear-gradient(90deg, #667eea, #764ba2, #f093fb, #f5576c)',
        backgroundSize: '200% 200%',
        animation: 'gradientShift 3s ease infinite'
      }}></div>

      {/* Заголовок */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <FontAwesomeIcon 
          icon={getFileIcon(filename, fileUrl)} 
          style={{ 
            color: getFileTypeColor(filename, fileUrl),
            fontSize: '20px'
          }} 
        />
        <h3 style={{
          fontSize: '1.3rem',
          fontWeight: '600',
          color: theme === 'dark' ? '#ffffff' : '#333333',
          margin: 0
        }}>
          {filename && filename !== 'Файл' ? filename : 'Файл для скачивания'}
        </h3>
      </div>

      {/* Файл для скачивания */}
      <div style={{ 
        padding: '20px',
        background: theme === 'dark' ? '#2a2a2a' : '#f8f9fa',
        borderRadius: '8px',
        border: `1px solid ${theme === 'dark' ? '#404040' : '#e9ecef'}`,
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <FontAwesomeIcon 
            icon={getFileIcon(filename)} 
            style={{ 
              color: getFileTypeColor(filename),
              fontSize: '20px'
            }} 
          />
          <div>
            <div style={{
              fontSize: '1rem',
              fontWeight: '500',
              color: theme === 'dark' ? '#ffffff' : '#333333',
              marginBottom: '4px'
            }}>
              {filename && filename !== 'Файл' ? filename : (fileUrl ? fileUrl.split('/').pop() : 'Файл не загружен')}
            </div>
            <div style={{
              fontSize: '0.9rem',
              color: theme === 'dark' ? '#999999' : '#666666'
            }}>
              {fileUrl ? 'Файл доступен для скачивания' : 'Файл недоступен'}
            </div>
          </div>
        </div>
        
        {fileUrl ? (
          <div style={{ display: 'flex', gap: '8px' }}>
            {/* Кнопка скачивания для всех файлов */}
            <button
              onClick={handleDownload}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 10px rgba(102, 126, 234, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 10px rgba(102, 126, 234, 0.3)';
              }}
            >
              <FontAwesomeIcon icon={faDownload} />
              {t('lesson.download_file') || 'Скачать файл'}
            </button>
          </div>
        ) : (
          <div style={{
            padding: '10px 20px',
            background: theme === 'dark' ? '#404040' : '#e9ecef',
            color: theme === 'dark' ? '#999999' : '#666666',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.9rem',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <FontAwesomeIcon icon={faExclamationTriangle} />
            {filename && filename !== 'Файл' ? `Файл "${filename}" недоступен` : 'Файл не загружен'}
          </div>
        )}
      </div>

      {/* Описание */}
      {description && (
        <div style={{ 
          padding: '16px',
          background: theme === 'dark' ? '#2a2a2a' : '#f8f9fa',
          borderRadius: '8px',
          border: `1px solid ${theme === 'dark' ? '#404040' : '#e9ecef'}`
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px'
          }}>
            <FontAwesomeIcon 
              icon={faInfoCircle} 
              style={{ 
                color: '#667eea',
                fontSize: '14px'
              }} 
            />
            <h4 style={{
              fontSize: '1rem',
              fontWeight: '500',
              color: theme === 'dark' ? '#ffffff' : '#333333',
              margin: 0
            }}>
              {t('lesson.file_description') || 'Описание файла'}
            </h4>
          </div>
          
          <p style={{ 
            fontSize: '0.95rem',
            color: theme === 'dark' ? '#cccccc' : '#666666',
            lineHeight: '1.6',
            margin: 0
          }}>
            {description}
          </p>
        </div>
      )}

      {/* Информация о завершении */}
      <div style={{
        marginTop: '20px',
        padding: '12px',
        background: theme === 'dark' ? '#1a1a1a' : '#e8f5e8',
        borderRadius: '8px',
        border: `1px solid ${theme === 'dark' ? '#404040' : '#4caf50'}`,
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <FontAwesomeIcon 
          icon={faCheckCircle} 
          style={{ 
            color: '#4caf50',
            fontSize: '14px'
          }} 
        />
        <span style={{
          fontSize: '0.9rem',
          color: theme === 'dark' ? '#cccccc' : '#2e7d32'
        }}>
          {t('lesson.file_step_completed') }
        </span>
      </div>

      {/* Превью изображения для файлов типа изображение */}
      {fileUrl && isImageFile(filename, fileUrl) && (
        <div style={{ 
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <img 
            src={fileUrl} 
            alt={filename || 'Превью файла'}
            style={{
              maxWidth: '100%',
              maxHeight: '300px',
              borderRadius: '8px',
              border: `1px solid ${theme === 'dark' ? '#404040' : '#e9ecef'}`,
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
            }}
            onError={(e) => {
              console.log('Image preview failed to load');
              e.target.style.display = 'none';
            }}
          />
        </div>
      )}
    </div>
  );
};

export default LessonViewer; 