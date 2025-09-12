import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import axios from '../utils/axios';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faClock, 
  faUsers, 
  faChartLine, 
  faSearch,
  faArrowRight,
  faGraduationCap,
  faSync,
  faBook,
  faPlay,
  faFilter,
  faTimes,
  faFolder,
  faFolderOpen,
  faChevronDown,
  faChevronRight,
  faGlobe
} from '@fortawesome/free-solid-svg-icons';
import useTheme from '../hooks/useTheme';
import i18n from '../i18n';
import { getCourseFileUrl, getVideoUrl } from '../utils/minioUtils';
import { getLanguageName } from '../utils/languageOptions';

const MyTraining = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const { theme } = useTheme();
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredVideo, setHoveredVideo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryTree, setCategoryTree] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});

  // Функция для получения названия категории на правильном языке
  const getCategoryName = (category) => {
    const currentLanguage = i18n.language;
    
    switch (currentLanguage) {
      case 'ru':
        return category.nameRu || category.nameEn || category.name || 'Unnamed';
      case 'be':
        return category.nameBe || category.nameRu || category.nameEn || category.name || 'Unnamed';
      case 'de':
        return category.nameDe || category.nameEn || category.name || 'Unnamed';
      case 'es':
        return category.nameEs || category.nameEn || category.name || 'Unnamed';
      case 'pt':
        return category.namePt || category.nameEn || category.name || 'Unnamed';
      case 'uk':
        return category.nameUk || category.nameRu || category.nameEn || category.name || 'Unnamed';
      case 'zh':
        return category.nameZh || category.nameEn || category.name || 'Unnamed';
      default:
        return category.nameEn || category.name || category.nameRu || 'Unnamed';
    }
  };

  // Функция для построения дерева категорий
  const buildCategoryTree = (flatList) => {
    const idToNode = {};
    const roots = [];
    
    // Создаем узлы
    (flatList || []).forEach(cat => {
      const rawId = cat.id ?? cat.ID ?? cat.categoryId ?? cat.category_id;
      if (rawId === undefined || rawId === null) return;
      const key = String(rawId);
      idToNode[key] = { ...cat, id: rawId, children: [] };
    });
    
    // Строим связи
    (flatList || []).forEach(cat => {
      const rawId = cat.id ?? cat.ID ?? cat.categoryId ?? cat.category_id;
      if (rawId === undefined || rawId === null) return;
      const selfKey = String(rawId);
      const rawParent = cat.parentId ?? cat.parent_id ?? cat.parent ?? cat.ParentId;
      const parentKey = rawParent === null || rawParent === undefined || rawParent === '-' || rawParent === '' ? null : String(rawParent);
      
      if (!parentKey || !idToNode[parentKey]) {
        if (idToNode[selfKey]) {
          roots.push(idToNode[selfKey]);
        }
      } else {
        idToNode[parentKey].children.push(idToNode[selfKey]);
      }
    });
    
    return roots;
  };

  // Функции для работы с категориями
  const openCategoryModal = () => setShowCategoryModal(true);
  const closeCategoryModal = () => setShowCategoryModal(false);
  
  const toggleCategorySelect = (id, event) => {
    // Добавляем анимацию при клике
    if (event && event.currentTarget) {
      const element = event.currentTarget;
      element.style.transform = 'scale(0.95)';
      element.style.transition = 'transform 0.1s ease';
      
      setTimeout(() => {
        element.style.transform = 'scale(1)';
        setTimeout(() => {
          element.style.transition = 'all 0.2s';
        }, 100);
      }, 100);
    }
    
    if (selectedCategories.includes(id)) {
      setSelectedCategories(selectedCategories.filter(x => x !== id));
    } else {
      setSelectedCategories([...selectedCategories, id]);
    }
  };

  const clearCategorySelection = () => {
    setSelectedCategories([]);
  };

  const confirmCategorySelection = () => {
    closeCategoryModal();
  };

  const toggleCategoryExpand = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const renderCategoryTree = (nodes, level = 0) => {
    return nodes.map(node => {
      const hasChildren = node.children && node.children.length > 0;
      const isExpanded = expandedCategories[node.id];
      const isSelected = selectedCategories.includes(node.id.toString());
      const canExpand = hasChildren && level < 1; // Ограничиваем 2 уровнями

      return (
        <div key={node.id} style={{ marginBottom: '4px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px 12px',
            borderRadius: '6px',
            background: isSelected ? 'var(--primary-color, #007bff)' : 'transparent',
            color: isSelected ? 'white' : 'var(--text-color)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            border: isSelected ? '1px solid var(--primary-color, #007bff)' : '1px solid transparent',
            marginLeft: level * 20
          }}
          onClick={(e) => toggleCategorySelect(node.id.toString(), e)}
          onMouseEnter={(e) => {
            if (!isSelected) {
              if (theme === 'dark') {
                e.currentTarget.style.transform = 'translateX(4px)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(255, 255, 255, 0.1)';
              } else {
                e.currentTarget.style.background = 'var(--hover-bg, #f8f9fa)';
              }
            }
          }}
          onMouseLeave={(e) => {
            if (!isSelected) {
              if (theme === 'dark') {
                e.currentTarget.style.transform = 'translateX(0)';
                e.currentTarget.style.boxShadow = 'none';
              } else {
                e.currentTarget.style.background = 'transparent';
              }
            }
          }}
          >
            <FontAwesomeIcon
              icon={hasChildren ? (isExpanded ? faFolderOpen : faFolder) : faFolder}
              style={{
                fontSize: '14px',
                color: hasChildren ? '#ff9800' : '#4caf50',
                marginRight: '8px',
                width: '16px'
              }}
            />
            <span style={{
              flex: 1,
              fontWeight: level === 0 ? '600' : '400',
              fontSize: level === 0 ? '15px' : '14px',
              color: isSelected ? 'white' : 'var(--text-color)'
            }}>
              {getCategoryName(node)}
            </span>
            {hasChildren && (
              <span style={{
                fontSize: '12px',
                color: isSelected ? 'rgba(255,255,255,0.8)' : (theme === 'dark' ? '#ffffff' : '#666'),
                marginLeft: '8px'
              }}>
                {node.children.length} {t('categorySelector.subcategories')}
              </span>
            )}
            {canExpand && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCategoryExpand(node.id);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: isSelected ? 'white' : 'var(--text-color)',
                  cursor: 'pointer',
                  padding: '4px',
                  marginLeft: '8px',
                  borderRadius: '3px',
                  transition: theme === 'dark' ? 'transform 0.2s, color 0.2s' : 'background 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (theme === 'dark') {
                    e.target.style.transform = 'scale(1.2)';
                    e.target.style.color = isSelected ? 'white' : '#ffd700';
                  } else {
                    e.target.style.background = 'var(--hover-bg)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (theme === 'dark') {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.color = isSelected ? 'white' : 'var(--text-color)';
                  } else {
                    e.target.style.background = 'transparent';
                  }
                }}
              >
                <FontAwesomeIcon
                  icon={isExpanded ? faChevronDown : faChevronRight}
                  style={{ fontSize: '12px' }}
                />
              </button>
            )}
          </div>
          {hasChildren && isExpanded && (
            <div style={{ marginLeft: '20px' }}>
              {renderCategoryTree(node.children, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  // Функция для расчета прогресса курса (та же логика, что и в Course.js)
  const calculateCourseProgress = async (courseId, userId) => {
    try {
      const token = localStorage.getItem('jwtToken');
      if (!token) return 0;

      // Загружаем прогресс пользователя
      const progressResponse = await axios.get(`/course/${courseId}/progress/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Загружаем полный syllabus
      const fullSyllabusResponse = await axios.get(`/course/${courseId}/full-syllabus`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const { stepCompletions, testAttempts } = progressResponse.data;
      const modules = fullSyllabusResponse.data.modules || [];

      // Если нет модулей — возвращаем 0% (нечего проходить)
      if (!Array.isArray(modules) || modules.length === 0) {
        console.log(`Курс ${courseId}: нет модулей, возвращаем 0% (нечего проходить)`);
        return 0;
      }

      console.log(`\n=== РАСЧЕТ ОБЩЕГО ПРОГРЕССА КУРСА ${courseId} ===`);
      console.log(`Найдено модулей: ${modules.length}`);
      console.log(`Данные о шагах: ${stepCompletions?.length || 0} завершенных шагов`);
      console.log(`Данные о тестах: ${testAttempts?.length || 0} попыток тестов`);
      console.log(`Модули:`, modules.map(m => ({ id: m.id, title: m.title, lessonsCount: m.lessons?.length || 0 })));

      // Считаем прогресс как отношение завершенных шагов к общему количеству шагов
      let totalSteps = 0;
      let completedSteps = 0;

      for (const module of modules) {
        if (Array.isArray(module.lessons)) {
          for (const lesson of module.lessons) {
            console.log(`\n--- Обрабатываем урок ${lesson.id} (${lesson.name}) в модуле ${module.id} ---`);
            
            const lessonSteps = lesson.steps || [];
            totalSteps += lessonSteps.length;
            
            console.log(`Урок ${lesson.id}: найдено ${lessonSteps.length} шагов`);

            if (Array.isArray(lessonSteps)) {
              for (let i = 0; i < lessonSteps.length; i++) {
                const step = lessonSteps[i];
                const stepCompletion = stepCompletions?.find(sc => 
                  sc.lessonId === lesson.id && sc.stepIndex === i
                );
                const testAttempt = testAttempts?.find(ta => 
                  ta.lessonId === lesson.id && ta.stepIndex === i
                );

                console.log(`  Шаг ${i}: тип=${step.type}, завершен=${!!stepCompletion}, попытка=${!!testAttempt}`);

                if (step.type === 'test' || step.type === 'quiz') {
                  // Для тестовых шагов используем результат последней попытки
                  if (testAttempt) {
                    const score = testAttempt.lastScore || 0;
                    // Добавляем к прогрессу только если результат больше 0%
                    if (score > 0) {
                      if (score >= 100) {
                        completedSteps += 1; // Полностью завершенный шаг
                        console.log(`    Урок ${lesson.id}, шаг ${i} (${step.type}): ${score}% - полностью завершен`);
                      } else {
                        completedSteps += score / 100; // Частичный прогресс
                        console.log(`    Урок ${lesson.id}, шаг ${i} (${step.type}): ${score}% - частичный прогресс`);
                      }
                    } else {
                      console.log(`    Урок ${lesson.id}, шаг ${i} (${step.type}): ${score}% - не учитываем в прогрессе`);
                    }
                  } else {
                    console.log(`    Урок ${lesson.id}, шаг ${i} (${step.type}): нет попыток`);
                  }
                } else {
                  // Для других шагов считаем как завершенные если есть в stepCompletions
                  if (stepCompletion) {
                    completedSteps += 1;
                    console.log(`    Урок ${lesson.id}, шаг ${i} (${step.type || 'text'}): завершен`);
                  } else {
                    console.log(`    Урок ${lesson.id}, шаг ${i} (${step.type || 'text'}): не завершен`);
                  }
                }
              }
            } else {
              console.log(`Урок ${lesson.id}: нет шагов в массиве steps`);
            }
          }
        } else {
          console.log(`Модуль ${module.id}: нет уроков в массиве lessons`);
        }
      }

      if (totalSteps > 0) {
        const overallProgress = Math.round((completedSteps / totalSteps) * 100);
        console.log(`Общий прогресс курса ${courseId}: ${completedSteps.toFixed(2)}/${totalSteps} шагов = ${overallProgress}%`);
        console.log(`=== КОНЕЦ РАСЧЕТА ОБЩЕГО ПРОГРЕССА КУРСА ${courseId} ===\n`);
        return Math.max(0, Math.min(100, overallProgress));
      }

      // Если нет шагов, возвращаем 0% (нечего проходить)
      console.log(`Курс ${courseId}: нет шагов, возвращаем 0% (нечего проходить)`);
      return 0;
    } catch (error) {
      console.error(`Ошибка при расчете прогресса курса ${courseId}:`, error);
      return 0;
    }
  };
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const getLocalCompletedLessonIds = (courseId) => {
    try {
      const raw = localStorage.getItem(`courseProgress:${courseId}`);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed?.completedLessonIds) ? parsed.completedLessonIds : [];
    } catch {
      return [];
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        setIsAuthenticated(true);
        setIsAdmin(decoded.roles && decoded.roles.includes('ADMIN'));
        // Загружаем курсы сразу после проверки токена
        loadEnrolledCourses();
        
        // Проверяем, нужно ли принудительно обновить прогресс
        const lastCourseVisit = localStorage.getItem('lastCourseVisit');
        const now = Date.now();
        if (lastCourseVisit && (now - parseInt(lastCourseVisit)) < 30000) { // 30 секунд
          console.log('Недавно посещали курс, принудительно обновляем прогресс');
          setTimeout(() => {
            loadEnrolledCourses();
          }, 1000);
        }
      } catch (error) {
        console.error('Error decoding token:', error);
        setIsAuthenticated(false);
        setIsAdmin(false);
        setLoading(false);
      }
    } else {
      setIsAuthenticated(false);
      setIsAdmin(false);
      setLoading(false);
    }
  }, []);

  const loadEnrolledCourses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        setError('Пользователь не авторизован');
        return;
      }

      const decoded = JSON.parse(atob(token.split('.')[1]));
      if (!decoded || !decoded.id) {
        setError('Неверный токен авторизации');
        return;
      }

      // Загружаем категории
      try {
        const categoriesResponse = await axios.get('/categories/public');
        const categories = categoriesResponse.data || [];
        setCategories(categories);
        setCategoryTree(buildCategoryTree(categories));
      } catch (error) {
        console.warn('Failed to load categories:', error);
      }

      const response = await axios.get(`/enrollmentbystudent?id=${decoded.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const enrollments = response.data || [];
      

      
      // Filter only approved enrollments
      // ВРЕМЕННО: показываем все записи для диагностики
      const approvedEnrollments = enrollments; // enrollments.filter(enrollment => enrollment.approved === true);
      // Подгружаем для каждого курса количество уроков для точного процента
      const coursesWithProgress = await Promise.all(approvedEnrollments.map(async (enrollment) => {
        const course = enrollment.Course;
        if (!course) return enrollment;
        
        // Отладочная информация о курсе
        console.log(`Курс ${course.id} (${course.name}):`, {
          logoUrl: course.logoUrl,
          introUrl: course.introUrl,
          level: course.level,
          categories: course.categories,
          category: course.Category
        });
        
        // Загружаем актуальный прогресс с сервера
        let actualProgress = enrollment.progress || 0;
        console.log(`Начальный прогресс для курса ${course.id} (${course.name}):`, actualProgress);
        
        // Загружаем full-syllabus для локального расчета прогресса
        let syllabusData = null;
        try {
          const syllabusResponse = await axios.get(`/course/${course.id}/full-syllabus`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          syllabusData = syllabusResponse.data;
          console.log(`Full-syllabus для курса ${course.id}:`, syllabusData);
        } catch (error) {
          console.warn(`Failed to load full-syllabus for course ${course.id}:`, error);
        }
        
        try {
          const progressResponse = await axios.get(`/course/${course.id}/progress/${decoded.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log(`Прогресс курса ${course.id} (${course.name}) с сервера:`, progressResponse.data);
          
          // Используем данные о шагах и тестах для локального расчета прогресса
          if (progressResponse.data) {
            const { stepCompletions, testAttempts } = progressResponse.data;
            
            // Пытаемся получить прогресс из Course.js, если он открыт
            if (window.getCurrentCourseProgress) {
              const courseProgress = window.getCurrentCourseProgress(course.id);
              console.log(`Попытка получить прогресс для курса ${course.id} из Course.js:`, courseProgress);
              if (courseProgress !== null) {
                actualProgress = courseProgress;
                console.log(`Получен прогресс для курса ${course.id} из Course.js: ${actualProgress}%`);
              } else {
                console.log(`Курс ${course.id} не открыт в Course.js, проверяем localStorage`);
                // Если курс не открыт в Course.js, проверяем localStorage
                try {
                  const courseProgresses = JSON.parse(localStorage.getItem('courseProgresses') || '{}');
                  const savedProgress = courseProgresses[course.id];
                  if (savedProgress && savedProgress.progress !== undefined) {
                    // Проверяем, что данные не устарели (не старше 1 часа)
                    const isRecent = (Date.now() - savedProgress.timestamp) < 3600000; // 1 час
                    if (isRecent) {
                      actualProgress = savedProgress.progress;
                      console.log(`Получен сохраненный прогресс для курса ${course.id} из localStorage: ${actualProgress}%`);
                    } else {
                      console.log(`Сохраненный прогресс для курса ${course.id} устарел, используем локальный расчет`);
                      actualProgress = await calculateCourseProgress(course.id, decoded.id);
                    }
                  } else {
                    console.log(`Сохраненный прогресс для курса ${course.id} не найден, используем локальный расчет`);
                    actualProgress = await calculateCourseProgress(course.id, decoded.id);
                  }
                } catch (error) {
                  console.warn(`Ошибка при получении прогресса для курса ${course.id}:`, error);
                  actualProgress = await calculateCourseProgress(course.id, decoded.id);
                }
              }
            } else {
              console.log(`Функция getCurrentCourseProgress не найдена, проверяем localStorage`);
              // Если функция не найдена, проверяем localStorage
              try {
                const courseProgresses = JSON.parse(localStorage.getItem('courseProgresses') || '{}');
                const savedProgress = courseProgresses[course.id];
                if (savedProgress && savedProgress.progress !== undefined) {
                  // Проверяем, что данные не устарели (не старше 1 часа)
                  const isRecent = (Date.now() - savedProgress.timestamp) < 3600000; // 1 час
                  if (isRecent) {
                    actualProgress = savedProgress.progress;
                    console.log(`Получен сохраненный прогресс для курса ${course.id} из localStorage: ${actualProgress}%`);
                  } else {
                    console.log(`Сохраненный прогресс для курса ${course.id} устарел, используем локальный расчет`);
                    actualProgress = await calculateCourseProgress(course.id, decoded.id);
                  }
                } else {
                  console.log(`Сохраненный прогресс для курса ${course.id} не найден, используем локальный расчет`);
                  actualProgress = await calculateCourseProgress(course.id, decoded.id);
                }
              } catch (error) {
                console.warn(`Ошибка при получении прогресса для курса ${course.id}:`, error);
                actualProgress = await calculateCourseProgress(course.id, decoded.id);
              }
            }
          }
        } catch (error) {
          console.warn(`Failed to load progress for course ${course.id}:`, error);
        }
        
        
        const clamped = Math.max(0, Math.min(100, Math.round(actualProgress * 10) / 10));
        
        let finalProgress = clamped;
        console.log(`Курс ${course.id}: finalProgress=${finalProgress}`);
        if (finalProgress >= 100 && !enrollment.approved) {
          try {
            await axios.put(`/enrollment/${enrollment.id}/approve`, {}, {
                headers: { Authorization: `Bearer ${token}` }
              });
            console.log(`Запись ${enrollment.id} автоматически одобрена (прогресс 100%)`);
            enrollment.approved = true;
          } 
          catch (error) {
            console.log('Ошибка при автоматическом одобрении записи:', error);
          }
        }
        
        return { ...enrollment, computedProgress: finalProgress };
      }));

      setEnrolledCourses(coursesWithProgress);

      // Отладочная информация
      console.log('=== ОТЛАДКА ПРОГРЕССА КУРСОВ ===');
      coursesWithProgress.forEach(course => {
        console.log(`Курс ${course.Course?.id} (${course.Course?.name}):`, {
          computedProgress: course.computedProgress,
          progress: course.progress,
          hasProgress: course.computedProgress !== undefined,
          progressValue: course.computedProgress
        });
      });
      console.log('=== КОНЕЦ ОТЛАДКИ ===');

      const totalCourses = coursesWithProgress.length;
      const completedCourses = coursesWithProgress.filter(e => (e.computedProgress || 0) >= 100).length;
      const totalHours = 0; 

      // setStats({
      //   totalCourses,
      //   completedCourses,
      //   totalHours,
      //   averageProgress: 0
      // });

    } catch (error) {
      console.error('Error loading enrolled courses:', error);
      if (error.response?.status === 403) {
        setError('Доступ запрещен. Обратитесь к администратору.');
      } else if (error.response?.status === 404) {
        setError('Курсы не найдены.');
      } else {
        setError('Не удалось загрузить курсы. Попробуйте позже.');
      }
    } finally {
      setLoading(false);
    }
  };



  const handleUpdateEmptyCoursesProgress = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        alert('Необходимо авторизоваться');
        return;
      }

      const response = await axios.post('/courses/update-empty-progress', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Результат обновления прогресса:', response.data);
      alert(`Обновлен прогресс для ${response.data.enrollmentsUpdated} записей в ${response.data.coursesUpdated} курсах`);
      
      loadEnrolledCourses();
    } 
    catch (error) {
      console.error('Ошибка при обновлении прогресса:', error);
      if (error.response?.status === 403) {
        alert('Недостаточно прав для выполнения этой операции');
      } 
      else {
        alert('Ошибка при обновлении прогресса: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleCourseClick = (courseId) => {
    history.push(`/course/${courseId}`);
  };

  const updateCourseProgress = (courseId, newProgress) => {
    console.log(`Обновляем прогресс курса ${courseId} на ${newProgress}%`);
    setEnrolledCourses(prev => {
      const updated = prev.map(enrollment => {
        if (enrollment.Course && enrollment.Course.id === courseId) {
          console.log(`Найден курс ${courseId}, обновляем прогресс с ${enrollment.computedProgress}% на ${newProgress}%`);
          return {
            ...enrollment,
            computedProgress: Math.max(0, Math.min(100, Math.round(newProgress)))
          };
        }
        return enrollment;
      });
      
      // const totalCourses = updated.length;
      // const completedCourses = updated.filter(e => (e.computedProgress || 0) >= 100).length;

      // setStats({
      //   totalCourses,
      //   completedCourses,
      //   totalHours: 0,
      //   averageProgress: 0
      // });
      
      return updated;
    });
  };

  useEffect(() => {
    window.updateMyTrainingProgress = updateCourseProgress;
    return () => {
      delete window.updateMyTrainingProgress;
    };
  }, []);

  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'courseProgressUpdate' && e.newValue) {
        try {
          const { courseId, progress } = JSON.parse(e.newValue);
          if (typeof courseId === 'number' && typeof progress === 'number') {
            updateCourseProgress(courseId, progress);
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);



  const getLevelColor = (level) => {
    switch (level) {
      case 'Beginner': return '#28a745';
      case 'Intermediate': return '#ffc107';
      case 'Advanced': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const normalizeLevel = (level) => {
    if (!level) return 'Beginner';
    
    const normalized = level.toLowerCase();
    
    switch (normalized) {
      case 'beginner':
        return 'Beginner';
      case 'intermediate':
        return 'Intermediate';
      case 'advanced':
        return 'Advanced';
      default:
        return 'Beginner';
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 90) return '#28a745'; // Green for high progress
    if (progress >= 70) return '#ffc107'; // Yellow for medium progress
    if (progress >= 50) return '#007bff'; // Blue for low progress
    return '#dc3545'; // Red for very low progress
  };





  const filteredCourses = enrolledCourses.filter(enrollment => {
    const course = enrollment.Course;
    if (!course) return false;
    
    const matchesSearch = course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (course.description && course.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesLevel = selectedLevel === 'all' || normalizeLevel(course.level) === selectedLevel;
    const matchesCategory = selectedCategories.length === 0 ||
      (course.categories && course.categories.some(cat => selectedCategories.includes(cat.id.toString())));
    const matchesLanguage = selectedLanguage === 'all' || course.language === selectedLanguage;
    
    return matchesSearch && matchesLevel && matchesCategory && matchesLanguage;
  });

  console.log(`Сортировка курсов: тип = ${sortBy}, количество курсов = ${filteredCourses.length}`);
  
  const sortedCourses = [...filteredCourses].sort((a, b) => {
    const courseA = a.Course;
    const courseB = b.Course;
    
    switch (sortBy) {
      case 'name':
        return courseA.name.localeCompare(courseB.name);
      case 'newest':
        return courseB.id - courseA.id;
      case 'oldest':
        return courseA.id - courseB.id;
      case 'popular':
        return (courseB._count?.enrollments || 0) - (courseA._count?.enrollments || 0);
      default:
        return 0;
    }
  });

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
          {t('my_training.loading')}
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

  if (!isAuthenticated) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: theme === 'dark' ? '#1a1a1a' : '#f8f9fa',
        color: theme === 'dark' ? '#ffffff' : '#333333'
      }}>
        <NavBar />
        
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          padding: '40px 20px',
          minHeight: 'calc(100vh - 200px)'
        }}>
          {/* Заголовок */}
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '40px' 
          }}>
            <h1 style={{ 
              fontSize: '2.5rem', 
              fontWeight: '700', 
              marginBottom: '10px',
              color: theme === 'dark' ? '#ffffff' : '#333333'
            }}>
              {t('my_training.title')}
            </h1>
          </div>

          {/* Карточка для входа */}
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 20px',
            background: theme === 'dark' ? '#2d2d2d' : '#ffffff',
            borderRadius: '12px',
            border: `1px solid ${theme === 'dark' ? '#404040' : '#e9ecef'}`
          }}>
            <FontAwesomeIcon 
              icon={faGraduationCap} 
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
              {t('my_training.login_to_system')}
            </h3>
            <p style={{ 
              color: theme === 'dark' ? '#cccccc' : '#666666',
              marginBottom: '30px'
            }}>
              {t('my_training.login_description')}
            </p>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: '15px',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => history.push('/login')}
                style={{
                  padding: '12px 24px',
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.target.style.background = '#0056b3'}
                onMouseOut={(e) => e.target.style.background = '#007bff'}
              >
                {t('auth.login')}
              </button>
              <button
                onClick={() => history.push('/register')}
                style={{
                  padding: '12px 24px',
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.target.style.background = '#218838'}
                onMouseOut={(e) => e.target.style.background = '#28a745'}
              >
                {t('auth.register')}
              </button>
            </div>
          </div>
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
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '40px 20px',
        minHeight: 'calc(100vh - 200px)'
      }}>
        {/* Заголовок */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '40px' 
        }}>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: '700', 
            marginBottom: '10px',
            color: theme === 'dark' ? '#ffffff' : '#333333'
          }}>
            {t('my_training.title')}
          </h1>
          <p style={{ 
            fontSize: '1.1rem', 
            color: theme === 'dark' ? '#cccccc' : '#666666',
            marginBottom: '30px'
          }}>
            {t('my_training.subtitle')}
          </p>
        </div>

        {isAdmin && (
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'center',
            gap: '15px',
            flexWrap: 'wrap'
          }}>            
          </div>
        )}

        {/* Фильтры и поиск */}
        <div style={{ 
          marginBottom: '40px',
          padding: '25px',
          background: 'var(--teach-tile-bg)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '20px',
            alignItems: 'end'
          }}>
            {/* Поиск */}
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px', 
                fontWeight: '600', 
                color: 'var(--text-color)'
              }}>
                <FontAwesomeIcon icon={faSearch} style={{ marginRight: '8px' }} />
                {t('course_catalog.search')}
              </label>
              <input 
                type="text" 
                placeholder={t('course_catalog.search_placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--teach-bg)',
                  color: 'var(--teach-fg)',
                  fontSize: '16px'
                }}
              />
            </div>

            {/* Категория */}
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px', 
                fontWeight: '600',
                color: 'var(--text-color)'
              }}>
                <FontAwesomeIcon icon={faFilter} style={{ marginRight: '8px' }} />
                {t('course_catalog.category')}
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={openCategoryModal}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--teach-bg)',
                    color: 'var(--teach-fg)',
                    fontSize: '16px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span>
                    {selectedCategories.length === 0 
                      ? t('course_catalog.all_categories') 
                      : `${selectedCategories.length} ${t('course_catalog.categories_selected')}`
                    }
                  </span>
                  <FontAwesomeIcon icon={faFilter} />
                </button>
                {selectedCategories.length > 0 && (
                  <button
                    onClick={clearCategorySelection}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--teach-bg)',
                      color: 'var(--teach-fg)',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                    title={t('course_catalog.clear_selection')}
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                )}
              </div>
            </div>

            {/* Уровень */}
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px', 
                fontWeight: '600', 
                color: 'var(--text-color)'
              }}>
                {t('course_catalog.level')}
              </label>
              <select 
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--teach-bg)',
                  color: 'var(--teach-fg)',
                  fontSize: '16px'
                }}
              >
                <option value="all">{t('course_catalog.all_levels')}</option>
                <option value="Beginner">{t('course.beginner_level')}</option>
                <option value="Intermediate">{t('course.intermediate_level')}</option>
                <option value="Advanced">{t('course.advanced_level')}</option>
              </select>
            </div>

            {/* Язык */}
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px', 
                fontWeight: '600', 
                color: 'var(--text-color)'
              }}>
                {t('course_catalog.language')}
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--teach-bg)',
                  color: 'var(--teach-fg)',
                  fontSize: '16px'
                }}
              >
                <option value="all">{t('course_catalog.all_languages')}</option>
                <option value="be">беларуская</option>
                <option value="de">Deutsch</option>
                <option value="en">English</option>
                <option value="es">español</option>
                <option value="pt">Português</option>
                <option value="ru">Русский</option>
                <option value="uk">Українська</option>
                <option value="zh">简体中文</option>
                <option value="af">Afrikaans</option>
                <option value="ar">العربيّة</option>
                <option value="ast">asturianu</option>
                <option value="az">Azərbaycanca</option>
                <option value="bg">български</option>
                <option value="bn">বাংলা</option>
                <option value="br">brezhoneg</option>
                <option value="bs">bosanski</option>
                <option value="ca">català</option>
                <option value="cs">česky</option>
                <option value="cy">Cymraeg</option>
                <option value="da">dansk</option>
                <option value="el">Ελληνικά</option>
                <option value="en-AU">Australian English</option>
                <option value="en-GB">British English</option>
                <option value="eo">Esperanto</option>
                <option value="es-AR">español de Argentina</option>
                <option value="es-CO">español de Colombia</option>
                <option value="es-MX">español de Mexico</option>
                <option value="es-NI">español de Nicaragua</option>
                <option value="es-VE">español de Venezuela</option>
                <option value="et">eesti</option>
                <option value="eu">Basque</option>
                <option value="fa">فارسی</option>
                <option value="fi">suomi</option>
                <option value="fr">français</option>
                <option value="fy">frysk</option>
                <option value="ga">Gaeilge</option>
                <option value="gd">Gàidhlig</option>
                <option value="gl">galego</option>
                <option value="he">עברית</option>
                <option value="hi">Hindi</option>
                <option value="hr">Hrvatski</option>
                <option value="hu">Magyar</option>
                <option value="ia">Interlingua</option>
                <option value="id">Bahasa Indonesia</option>
                <option value="io">ido</option>
                <option value="is">Íslenska</option>
                <option value="it">italiano</option>
                <option value="ja">日本語</option>
                <option value="ka">ქართული</option>
                <option value="kk">Қазақ</option>
              </select>
            </div>

            {/* Сортировка */}
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px', 
                fontWeight: '600', 
                color: 'var(--text-color)'
              }}>
                {t('course_catalog.sort_by')}
              </label>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--teach-bg)',
                  color: 'var(--teach-fg)',
                  fontSize: '16px'
                }}
              >
                <option value="newest">{t('course_catalog.sort_newest')}</option>
                <option value="oldest">{t('course_catalog.sort_oldest')}</option>
                <option value="popular">{t('course_catalog.sort_popular')}</option>
              </select>
            </div>
          </div>
          
          <div style={{ 
            marginTop: '20px', 
            padding: '15px', 
            background: 'var(--teach-bg)', 
            borderRadius: '8px', 
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ 
              fontSize: '16px', 
              color: 'var(--text-color)', 
              fontWeight: '500' 
            }}>
              {t('course_catalog.found_courses', { count: sortedCourses.length })}
            </div>
          </div>
        </div>

        

        {/* Список курсов */}
        <div>
          <h2 style={{ 
            fontSize: '1.8rem', 
            fontWeight: '600', 
            marginBottom: '20px',
            color: theme === 'dark' ? '#ffffff' : '#333333'
          }}>
            {t('my_training.enrolled_courses')}
          </h2>

          {enrolledCourses.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 20px',
              background: theme === 'dark' ? '#2d2d2d' : '#ffffff',
              borderRadius: '12px',
              border: `1px solid ${theme === 'dark' ? '#404040' : '#e9ecef'}`
            }}>
              <FontAwesomeIcon 
                icon={faGraduationCap} 
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
                {t('my_training.no_courses')}
              </h3>
              <p style={{ 
                color: theme === 'dark' ? '#cccccc' : '#666666',
                marginBottom: '20px'
              }}>
                {t('my_training.no_courses_description')}
              </p>

            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
              gap: '20px' 
            }}>
              {sortedCourses.map((enrollment) => {
                const course = enrollment.Course;
                
                if (!course) return null; 
                const categories = course.categories || [];
                
                return (
                  <div
                    key={enrollment.id}
                    onClick={() => handleCourseClick(course.id)}
                    style={{
                      background: theme === 'dark' ? '#2d2d2d' : '#ffffff',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      border: `1px solid ${theme === 'dark' ? '#404040' : '#e9ecef'}`,
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                      overflow: 'hidden'
                    }}
                    onMouseOver={(e) => {
                      const card = e.currentTarget;
                      card.style.transform = 'translateY(-2px)';
                      card.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.15)';
                    }}
                    onMouseOut={(e) => {
                      const card = e.currentTarget;
                      card.style.transform = 'translateY(0)';
                      card.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                    }}
                  >
                    {/* Изображение/видео курса */}
                    <div style={{ 
                      height: '200px', 
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      background: 'linear-gradient(135deg, #4485ed, #6f42c1)'
                    }}
                    onMouseEnter={() => course.introUrl && setHoveredVideo(course.id)}
                    onMouseLeave={() => setHoveredVideo(null)}
                    >
                      {course.logoUrl && (
                        <img
                          src={getCourseFileUrl(course.logoUrl)}
                          alt={course.name}
                          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { 
                            console.log(`Ошибка загрузки изображения для курса ${course.id}:`, course.logoUrl);
                            e.currentTarget.style.display = 'none'; 
                          }}
                          onLoad={() => console.log(`Изображение загружено для курса ${course.id}:`, course.logoUrl)}
                          loading="lazy"
                        />
                      )}
                      {hoveredVideo === course.id && course.introUrl ? (
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          background: 'rgba(0,0,0,0.8)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 2
                        }}>
                          <video
                            src={getVideoUrl(course.introUrl)}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                            muted
                            autoPlay
                            loop
                            onError={(e) => {
                              console.error('Video error in MyTraining:', e);
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      ) : (
                        <>
                          {!course.logoUrl && (
                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '10px',
                              color: 'white',
                              textAlign: 'center'
                            }}>
                              <FontAwesomeIcon 
                                icon={faBook} 
                                size="3x" 
                                style={{ opacity: 0.8 }}
                              />
                              <span style={{ fontSize: '14px', opacity: 0.8 }}>
                                {course.name}
                              </span>
                            </div>
                          )}
                          {course.introUrl && (
                            <div style={{
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)',
                              background: 'rgba(0,0,0,0.7)',
                              color: 'white',
                              padding: '8px 12px',
                              borderRadius: '50%',
                              fontSize: '16px',
                              zIndex: 1,
                              display: 'none'
                            }}>
                              <FontAwesomeIcon icon={faPlay} />
                            </div>
                          )}
                        </>
                      )}
                      {/* Язык курса - левый верхний угол */}
                      {course.language && (
                        <div style={{
                          position: 'absolute',
                          top: '15px',
                          left: '15px',
                          background: '#17a2b8',
                          color: '#fff',
                          padding: '5px 10px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600',
                          zIndex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <FontAwesomeIcon icon={faGlobe} style={{ fontSize: '10px' }} />
                          {getLanguageName(course.language)}
                        </div>
                      )}
                      
                      {/* Уровень курса - правый верхний угол */}
                      <div style={{
                        position: 'absolute',
                        top: '15px',
                        right: '15px',
                        background: getLevelColor(normalizeLevel(course.level)),
                        color: '#fff',
                        padding: '5px 10px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        zIndex: 1
                      }}>
                        {t(`course.${normalizeLevel(course.level).toLowerCase()}_level`)}
                      </div>

                    </div>

                    {/* Контент карточки */}
                    <div style={{ padding: '25px' }}>
                      <h3 style={{
                        fontSize: '20px',
                        fontWeight: '600',
                        color: theme === 'dark' ? '#ffffff' : '#333333',
                        marginBottom: '10px',
                        lineHeight: '1.4'
                      }}>
                        {course.name}
                      </h3>
                      
                      {course.categories && course.categories.length > 0 && (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                          {course.categories.map((cat) => (
                            <span key={cat.id} style={{
                              padding: '4px 8px',
                              background: theme === 'dark' ? '#ffffff' : '#f1f3f5',
                              borderRadius: '12px',
                              fontSize: '12px',
                              color: theme === 'dark' ? '#000000' : '#333333',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <FontAwesomeIcon 
                                icon={faFolder} 
                                style={{ 
                                  fontSize: '10px',
                                  color: '#4caf50'
                                }} 
                              />
                              {getCategoryName(cat)}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <p style={{
                        fontSize: '14px',
                        color: theme === 'dark' ? '#cccccc' : '#666666',
                        marginBottom: '20px',
                        lineHeight: '1.5',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                      dangerouslySetInnerHTML={{ __html: course.description }}
                      />



                      {/* Информация о курсе */}
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '20px',
                        fontSize: '12px',
                        color: theme === 'dark' ? '#cccccc' : '#666666'
                      }}>
                        {course.workload > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <FontAwesomeIcon icon={faClock} />
                            <span>{course.workload} {t('my_training.hours')}</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <FontAwesomeIcon icon={faUsers} />
                          <span>{(course._count?.enrollments ?? course.studentsCount ?? 0)} {t('my_training.students')}</span>
                        </div>

                      </div>

                      {/* Кнопка перехода к курсу */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          history.push(`/course/${course.id}`);
                        }}
                        style={{
                          width: '100%',
                          padding: '12px 20px',
                          background: '#4485ed',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '16px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'background 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                        onMouseOver={(e) => e.target.style.background = '#3371d6'}
                        onMouseOut={(e) => e.target.style.background = '#4485ed'}
                      >
                        <FontAwesomeIcon icon={faPlay} />
                        {t('my_training.start_learning')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Модальное окно для выбора категорий */}
      {showCategoryModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1050
        }}>
          <div style={{
            background: theme === 'dark' ? '#23272f' : '#fff',
            borderRadius: '12px',
            padding: '24px',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            color: theme === 'dark' ? '#eaf4fd' : '#000',
            border: `1px solid ${theme === 'dark' ? '#3c4250' : '#e9ecef'}`
          }}>
            {/* Заголовок */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              borderBottom: `1px solid ${theme === 'dark' ? '#3c4250' : '#e9ecef'}`,
              paddingBottom: '15px'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: '600',
                color: theme === 'dark' ? '#eaf4fd' : '#000'
              }}>
                {t('categorySelector.title')}
              </h3>
              <button
                onClick={closeCategoryModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: 'var(--text-color)',
                  padding: '4px',
                  borderRadius: '4px',
                  transition: theme === 'dark' ? 'transform 0.2s, color 0.2s' : 'background 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (theme === 'dark') {
                    e.target.style.transform = 'rotate(90deg)';
                    e.target.style.color = '#ff6b6b';
                  } else {
                    e.target.style.background = 'var(--hover-bg)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (theme === 'dark') {
                    e.target.style.transform = 'rotate(0deg)';
                    e.target.style.color = 'var(--text-color)';
                  } else {
                    e.target.style.background = 'transparent';
                  }
                }}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            {/* Описание */}
            <p style={{
              margin: '0 0 20px 0',
              fontSize: '14px',
              color: 'var(--text-color)',
              opacity: 0.8
            }}>
              {t('my_training.select_categories_description')}
            </p>

            {/* Счетчик выбранных */}
            <div style={{
              marginBottom: '15px',
              padding: '10px 15px',
              background: 'var(--teach-bg)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              fontSize: '14px',
              color: 'var(--text-color)'
            }}>
              {t('my_training.selected_categories_count', { count: selectedCategories.length })}
            </div>

            {/* Дерево категорий */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '10px',
              background: 'var(--teach-bg)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              marginBottom: '20px'
            }}>
              {categoryTree.length > 0 ? (
                renderCategoryTree(categoryTree)
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '20px',
                  color: 'var(--text-color)',
                  opacity: 0.6
                }}>
                  {t('course_catalog.loading_categories')}
                </div>
              )}
            </div>

            {/* Кнопки действий */}
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={closeCategoryModal}
                style={{
                  padding: '10px 20px',
                  background: 'transparent',
                  color: 'var(--text-color)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: theme === 'dark' ? 'transform 0.2s, box-shadow 0.2s' : 'background 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (theme === 'dark') {
                    e.target.style.transform = 'scale(1.05)';
                    e.target.style.boxShadow = '0 4px 12px rgba(255, 255, 255, 0.15)';
                  } else {
                    e.target.style.background = 'var(--hover-bg)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (theme === 'dark') {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = 'none';
                  } else {
                    e.target.style.background = 'transparent';
                  }
                }}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={confirmCategorySelection}
                style={{
                  padding: '10px 20px',
                  background: 'var(--primary-color, #007bff)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: theme === 'dark' ? 'transform 0.2s, box-shadow 0.2s' : 'background 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (theme === 'dark') {
                    e.target.style.transform = 'scale(1.05)';
                    e.target.style.boxShadow = '0 4px 12px rgba(0, 123, 255, 0.4)';
                  } else {
                    e.target.style.background = '#0056b3';
                  }
                }}
                onMouseLeave={(e) => {
                  if (theme === 'dark') {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = 'none';
                  } else {
                    e.target.style.background = 'var(--primary-color, #007bff)';
                  }
                }}
              >
                {t('editor.apply')}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default MyTraining; 