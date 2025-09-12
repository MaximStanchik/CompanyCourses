import React, { useState, useEffect, useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import axios from '../utils/axios';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faFilter, 
  faBook, 
  faClock, 
  faUserGraduate,
  faStar,
  faPlay,
  faSignInAlt,
  faCheck,
  faComment,
  faTimes,
  faFolder,
  faFolderOpen,
  faChevronRight,
  faChevronDown,
  faGlobe
} from '@fortawesome/free-solid-svg-icons';
import useTheme from '../hooks/useTheme';
import '../admin/admin.css';
import { toast } from 'react-toastify';
import CourseRating from '../components/CourseRating';
import CourseComments from '../components/CourseComments';
import i18n from '../i18n';
import { getCourseFileUrl, getVideoUrl } from '../utils/minioUtils';
import { getLanguageName } from '../utils/languageOptions';

const CourseCatalog = () => {
  const { t, i18n, currentLanguage } = useLanguage();
  const { theme } = useTheme();
  const history = useHistory();
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]); // Изменено на массив
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [enrolling, setEnrolling] = useState({});
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showRatings, setShowRatings] = useState({});
  const [showComments, setShowComments] = useState({});
  const [hoveredVideo, setHoveredVideo] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryTree, setCategoryTree] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});

  // Функция для нормализации уровня курса
  const normalizeLevel = (level) => {
    if (!level) return 'Beginner';
    
    const normalized = level.toLowerCase();
    console.log(`Normalizing level: "${level}" -> "${normalized}"`);
    
    switch (normalized) {
      case 'beginner':
        return 'Beginner';
      case 'intermediate':
        return 'Intermediate';
      case 'advanced':
        return 'Advanced';
      default:
        console.log(`Unknown level: "${level}", defaulting to Beginner`);
        return 'Beginner';
    }
  };

  // Функция для получения прогресса курса
  const getCourseProgress = (courseId) => {
    const enrolledCourse = enrolledCourses.find(ec => ec.courseId === courseId);
    return enrolledCourse ? enrolledCourse.progress || 0 : 0;
  };

  // Функция для определения цвета прогресса
  const getProgressColor = (progress) => {
    if (progress >= 90) return '#28a745'; // Green for high progress
    if (progress >= 70) return '#ffc107'; // Yellow for medium progress
    if (progress >= 50) return '#007bff'; // Blue for low progress
    return '#dc3545'; // Red for very low progress
  };

  // Функция для получения названия категории на правильном языке
  const getCategoryName = (category) => {
    const currentLanguage = i18n.language;
    
    switch (currentLanguage) {
      case 'ru':
        return category.nameRu || category.nameEn || category.name || t('course_catalog.unnamed');
      case 'be':
        return category.nameBe || category.nameRu || category.nameEn || category.name || t('course_catalog.unnamed');
      case 'de':
        return category.nameDe || category.nameEn || category.name || t('course_catalog.unnamed');
      case 'es':
        return category.nameEs || category.nameEn || category.name || t('course_catalog.unnamed');
      case 'pt':
        return category.namePt || category.nameEn || category.name || t('course_catalog.unnamed');
      case 'uk':
        return category.nameUk || category.nameRu || category.nameEn || category.name || t('course_catalog.unnamed');
      case 'zh':
        return category.nameZh || category.nameEn || category.name || t('course_catalog.unnamed');
      default:
        return category.nameEn || category.name || category.nameRu || t('course_catalog.unnamed');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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

  const loadData = async () => {
    try {
      setLoading(true);
      
      const coursesResponse = await axios.get('/courses/public');
      let courses = coursesResponse.data || [];
      setCourses(courses);
      const categoriesResponse = await axios.get('/categories/public');
      const categories = categoriesResponse.data || [];
      setCategories(categories);
      
      const tree = buildCategoryTree(categories);
      setCategoryTree(tree);
      
      const token = localStorage.getItem('jwtToken');
      if (token) {
        try {
          const decoded = JSON.parse(atob(token.split('.')[1]));
          if (decoded && decoded.id) {
            const enrolledResponse = await axios.get(`/enrollmentbystudent?id=${decoded.id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const enrolled = enrolledResponse.data || [];
            
            setEnrolledCourses(enrolled.map(e => e.Course.id));
          }
        } catch (error) {
          console.warn('Error loading user enrollments:', error);
        }
      }

    } catch (error) {
      console.error('Error loading data:', error);
      if (error.response?.status === 403) {
        setError('Access denied. Please contact administrator.');
      } else if (error.response?.status === 404) {
        setError('Courses not found.');
      } else {
        setError('Failed to load courses. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleCategoryExpand = (id) => {
    setExpandedCategories(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleCategorySelect = (id) => {
    if (selectedCategories.includes(id)) {
      setSelectedCategories(selectedCategories.filter(x => x !== id));
    } else {
      setSelectedCategories([...selectedCategories, id]);
    }
  };

  const openCategoryModal = () => {
    setShowCategoryModal(true);
  };

  const closeCategoryModal = () => {
    setShowCategoryModal(false);
  };

  const confirmCategorySelection = () => {
    setShowCategoryModal(false);
  };

  const clearCategorySelection = () => {
    setSelectedCategories([]);
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
          onClick={() => toggleCategorySelect(node.id.toString())}
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
              fontSize: level === 0 ? '15px' : '14px'
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
          {canExpand && isExpanded && (
            <div style={{
              marginTop: '4px',
              paddingTop: '4px',
              borderTop: '1px solid var(--border-color)',
              marginLeft: '20px'
            }}>
              {renderCategoryTree(node.children, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const handleEnroll = async (courseId) => {
    try {
      setEnrolling(prev => ({ ...prev, [courseId]: true }));
      
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        toast.error(t('course_catalog.please_login_enroll'));
        history.push('/login');
        return;
      }

      const decoded = JSON.parse(atob(token.split('.')[1]));
      if (!decoded || !decoded.id) {
        toast.error(t('course_catalog.user_not_authenticated'));
        history.push('/login');
        return;
      }

      const response = await axios.post('/enrollment', {
        courseId: courseId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setEnrolledCourses(prev => [...prev, courseId]);
      
      // Show appropriate message based on response
      if (response.data.message) {
        toast.success(response.data.message);
      } else {
        toast.success(t('course_catalog.successfully_enrolled'));
      }
      
    } catch (error) {
      console.error('Error enrolling in course:', error);
      if (error.response?.status === 409) {
        toast.error(t('course_catalog.already_enrolled'));
      } else if (error.response?.status === 401) {
        toast.error(t('course_catalog.please_login_enroll'));
        history.push('/login');
      } else if (error.response?.status === 403) {
        toast.error(error.response.data.error || 'Course is not available for enrollment');
      } else if (error.response?.status === 404) {
        toast.error(error.response.data.error || 'Course not found');
      } else {
        toast.error('Failed to enroll in course');
      }
    } finally {
      setEnrolling(prev => ({ ...prev, [courseId]: false }));
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategories.length === 0 ||
    (course.categories && course.categories.some(cat => selectedCategories.includes(cat.id.toString())));
    const matchesLevel = selectedLevel === 'all' || normalizeLevel(course.level) === selectedLevel;
    const matchesLanguage = selectedLanguage === 'all' || course.language === selectedLanguage;
    
    return matchesSearch && matchesCategory && matchesLevel && matchesLanguage;
  });

  const sortedCourses = [...filteredCourses].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'newest':
        return b.id - a.id;
      case 'oldest':
        return a.id - b.id;
      case 'popular':
        return (b.enrollmentCount || 0) - (a.enrollmentCount || 0);
      default:
        return 0;
    }
  });

  const getLevelColor = (level) => {
    switch (level) {
      case 'Beginner': return '#28a745';
      case 'Intermediate': return '#ffc107';
      case 'Advanced': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  const isEnrolled = (courseId) => {
    return enrolledCourses.includes(courseId);
  };

  if (loading) {
    return (
      <div className="page-flex-wrapper">
        <NavBar />
        <div className="main-content-flex page-wrapper section-space--inner--120">
          <div className="container">
            <div style={{ textAlign: 'center', padding: '50px 0' }}>
              <div style={{ fontSize: '24px', color: 'var(--text-color)' }}>
                {t('course_catalog.loading')}
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-flex-wrapper">
        <NavBar />
        <div className="main-content-flex page-wrapper section-space--inner--120">
          <div className="container">
            <div style={{ textAlign: 'center', padding: '50px 0' }}>
              <div style={{ fontSize: '24px', color: '#dc3545' }}>
                {error}
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="page-flex-wrapper">
      <NavBar />
      <div className="main-content-flex page-wrapper section-space--inner--120" style={{ background: theme === 'dark' ? '#1a1a1a' : '#ffffff' }}>
        <div className="container">
          {/* Заголовок страницы */}
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '50px',
            padding: '30px 0',
            background: 'var(--teach-tile-bg)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)'
          }}>
            <FontAwesomeIcon 
              icon={faBook} 
              size="3x" 
              style={{ color: '#4485ed', marginBottom: '20px' }}
            />
            <h1 style={{ 
              fontSize: '36px', 
              fontWeight: '700', 
              color: 'var(--text-color)',
              marginBottom: '10px'
            }}>
              {t('course_catalog.title')}
            </h1>
            <p style={{ 
              fontSize: '18px', 
              color: 'var(--text-color)', 
              opacity: 0.8 
            }}>
              {t('course_catalog.subtitle')}
            </p>
          </div>

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
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t('course_catalog.search_placeholder')}
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
                        : `${selectedCategories.length} ${t('course_catalog.categories_selected', 'категорий выбрано')}`
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

            {/* Результаты поиска */}
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
          {sortedCourses.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 20px',
              background: 'var(--teach-tile-bg)',
              borderRadius: '12px',
              border: '2px dashed var(--border-color)'
            }}>
              <FontAwesomeIcon 
                icon={faBook} 
                size="4x" 
                style={{ color: 'var(--text-color)', opacity: 0.5, marginBottom: '20px' }}
              />
              <h3 style={{ 
                fontSize: '24px', 
                fontWeight: '600', 
                color: 'var(--text-color)',
                marginBottom: '15px'
              }}>
                {t('course_catalog.no_courses_found')}
              </h3>
              <p style={{ 
                fontSize: '16px', 
                color: 'var(--text-color)', 
                opacity: 0.7
              }}>
                {t('course_catalog.no_courses_found_description')}
              </p>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: '24px',
              padding: '24px 0'
            }}
            className="course-grid">
              {sortedCourses.map((course, index) => (
                <div 
                key={course.id} 
                style={{
                  background: 'var(--teach-tile-bg)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '1px solid var(--border-color)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  height: '100%', // Обеспечиваем одинаковую высоту
                  display: 'flex',
                  flexDirection: 'column'
                }}
                className="course-card"
                onClick={() => history.push(`/course-promo/${course.id}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                >
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
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
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
                            console.error('Video error in CourseCatalog:', e);
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
                            display: 'none' // Скрываем значок видео
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

                    {isEnrolled(course.id) && (
                      <div style={{
                        position: 'absolute',
                        bottom: '15px',
                        right: '15px',
                        background: '#28a745',
                        color: 'white',
                        padding: '5px 10px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        zIndex: 1
                      }}>
                        <FontAwesomeIcon icon={faCheck} />
                        {t('course_catalog.enrolled')}
                      </div>
                    )}
                  </div>

                  <div style={{ padding: '25px' }}>
                    <h3 style={{
                      fontSize: '20px',
                      fontWeight: '600',
                      color: 'var(--text-color)',
                      marginBottom: '10px',
                      lineHeight: '1.4'
                    }}
                    className="course-title">
                      {course.name}
                    </h3>
                    {(course.categories && course.categories.length > 0) && (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                        {course.categories.map((cat) => (
                          <span key={cat.id || cat.name} style={{
                            padding: '4px 8px',
                            background: 'var(--hover-bg, #f1f3f5)',
                            borderRadius: '12px',
                            fontSize: '12px',
                            color: theme === 'dark' ? '#000000' : 'var(--text-color)',
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
                      color: 'var(--text-color)', 
                      opacity: 0.7,
                      marginBottom: '20px',
                      lineHeight: '1.5',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                    className="course-description"
                    dangerouslySetInnerHTML={{ __html: course.description }}
                    />



                    {/* Информация о курсе */}
                    <div style={{ 
                      padding: '25px',
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                    className="course-card-content">
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '20px',
                        fontSize: '12px',
                        color: 'var(--text-color)',
                        opacity: 0.7
                      }}
                      className="course-info">
                        {course.workload > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <FontAwesomeIcon icon={faClock} />
                            <span>{course.workload} {t('course_catalog.hours')}</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <FontAwesomeIcon icon={faUserGraduate} />
                          <span>{course.enrollmentCount || 0} {t('course_catalog.students')}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <FontAwesomeIcon icon={faStar} style={{ color: '#ffc107' }} />
                          <span>{course.averageRating ? course.averageRating.toFixed(1) : '0.0'}</span>
                          {course.totalRatings > 0 && (
                            <span style={{ fontSize: '10px', opacity: 0.8 }}>
                              ({course.totalRatings})
                            </span>
                          )}
                        </div>

                      </div>

                      {/* Кнопки действий */}
                      <div style={{ 
                        display: 'flex', 
                        gap: '10px',
                        marginTop: 'auto' // Прижимаем кнопки к низу карточки
                      }}
                      className="course-card-buttons">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            history.push(`/course-promo/${course.id}`);
                          }}
                          style={{
                            flex: 1,
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
                            gap: '8px',
                            minHeight: '48px' // Обеспечиваем одинаковую высоту кнопок
                          }}
                          onMouseOver={(e) => e.target.style.background = '#3371d6'}
                          onMouseOut={(e) => e.target.style.background = '#4485ed'}
                        >
                          <FontAwesomeIcon icon={faPlay} />
                          {t('course_catalog.view_course')}
                        </button>

                        {!isEnrolled(course.id) ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEnroll(course.id);
                            }}
                            disabled={enrolling[course.id]}
                            style={{
                              padding: '12px 20px',
                              background: enrolling[course.id] ? '#6c757d' : '#28a745',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              fontSize: '16px',
                              fontWeight: '600',
                              cursor: enrolling[course.id] ? 'not-allowed' : 'pointer',
                              transition: 'background 0.2s',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              minWidth: '120px',
                              justifyContent: 'center',
                              minHeight: '48px' // Обеспечиваем одинаковую высоту кнопок
                            }}
                            onMouseOver={(e) => {
                              if (!enrolling[course.id]) {
                                e.target.style.background = '#218838';
                              }
                            }}
                            onMouseOut={(e) => {
                              if (!enrolling[course.id]) {
                                e.target.style.background = '#28a745';
                              }
                            }}
                          >
                            <FontAwesomeIcon icon={enrolling[course.id] ? faClock : faSignInAlt} />
                            {enrolling[course.id] ? t('course_catalog.enrolling') : t('course_catalog.enroll')}
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              history.push(`/course/${course.id}`);
                            }}
                            style={{
                              padding: '12px 20px',
                              background: '#6f42c1',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              fontSize: '16px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'background 0.2s',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              minWidth: '120px',
                              justifyContent: 'center',
                              minHeight: '48px' // Обеспечиваем одинаковую высоту кнопок
                            }}
                            onMouseOver={(e) => e.target.style.background = '#5a32a3'}
                            onMouseOut={(e) => e.target.style.background = '#6f42c1'}
                          >
                            <FontAwesomeIcon icon={faCheck} />
                            {t('course_catalog.go_to_course')}
                          </button>
                        )}
                      </div>

                      {/* Buttons */}
                      <div style={{ 
                        display: 'flex', 
                        gap: '8px', 
                        marginTop: '15px',
                        borderTop: '1px solid var(--border-color)',
                        paddingTop: '15px'
                      }}
                      className="bottom-buttons">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowRatings(prev => ({ ...prev, [course.id]: !prev[course.id] }));
                          }}
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            background: 'transparent',
                            color: 'var(--text-color)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            fontSize: '14px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            minHeight: '48px',
                            minWidth: '120px'
                          }}
                          onMouseOver={(e) => e.target.style.background = 'var(--hover-bg)'}
                          onMouseOut={(e) => e.target.style.background = 'transparent'}
                        >
                          <FontAwesomeIcon icon={faStar} style={{ color: '#ffc107' }} />
                          {showRatings[course.id] ? (t('course.hide_rating') || 'Hide rating') : (t('course.show_rating') || 'Show rating')}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowComments(prev => ({ ...prev, [course.id]: !prev[course.id] }));
                          }}
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            background: 'transparent',
                            color: 'var(--text-color)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            fontSize: '14px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            minHeight: '48px', // равна кнопкам выше
                            minWidth: '120px'
                          }}
                          onMouseOver={(e) => e.target.style.background = 'var(--hover-bg)'}
                          onMouseOut={(e) => e.target.style.background = 'transparent'}
                        >
                          <FontAwesomeIcon icon={faComment} />
                          {showComments[course.id] ? t('course.hide_comments') : t('course.show_comments')}
                        </button>
                      </div>

                      {/* Rating Component */}
                      {showRatings[course.id] && (
                        <div style={{ marginTop: '15px' }}>
                          <CourseRating 
                            courseId={course.id} 
                            onRatingChange={() => {
                              loadData();
                            }}
                          />
                        </div>
                      )}

                      {/* Comments Component */}
                      {showComments[course.id] && (
                        <div style={{ marginTop: '15px' }}>
                          <CourseComments 
                            courseId={course.id} 
                            onRatingChange={() => {
                              // Refresh course data to update rating and comment count
                              loadData();
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
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
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1050
        }}>
          <div style={{
            background: 'var(--teach-tile-bg)',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
          }}>
            {/* Заголовок */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              paddingBottom: '15px',
              borderBottom: '1px solid var(--border-color)'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: '600',
                color: 'var(--text-color)'
              }}>
                Выберите категории
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
              {t('course_catalog.select_categories_description')}
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
              Выбрано: {selectedCategories.length} из 5
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

export default CourseCatalog; 