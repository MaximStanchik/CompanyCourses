import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useHistory } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faBook, faGraduationCap, faCheckCircle, faPlay, faComment, faStar, faThumbsUp, faThumbsDown, faClock } from '@fortawesome/free-solid-svg-icons';
import axios from '../utils/axios';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import useTheme from '../hooks/useTheme';
import '../admin/admin.css';
import { useTranslation } from 'react-i18next'; // Import useTranslation
import CourseComments from '../components/CourseComments';
import CourseRating from '../components/CourseRating';
import { getCourseFileUrl, getVideoUrl } from '../utils/minioUtils';
import { toast } from 'react-toastify';

const CoursePromo = () => {
    const { id } = useParams();
    const location = useLocation();
    const history = useHistory();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userRating, setUserRating] = useState(0);
    const [averageRating, setAverageRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [showRating, setShowRating] = useState(true);
    const [showComments, setShowComments] = useState(true);
    const [likePending, setLikePending] = useState(false);
    const [dislikePending, setDislikePending] = useState(false);
    const [courseReactions, setCourseReactions] = useState({ likes: 0, dislikes: 0 });
    const [videoError, setVideoError] = useState(false);
    const [isEnrolling, setIsEnrolling] = useState(false);
    const { theme } = useTheme();
    const dark = theme === 'dark';
    const { t } = useTranslation(); // Use the useTranslation hook

    // Функция для обработки HTML-контента и сохранения пробелов
    const processHtmlContent = (htmlContent) => {
        if (!htmlContent) return '';
        
        // Добавляем невидимые пробелы перед и после изображений
        let processed = htmlContent;
        
        // Добавляем пробелы перед изображениями
        processed = processed.replace(/<img/g, '<span style="display:inline-block; width:1em; height:1em; opacity:0;"></span><img');
        
        // Добавляем пробелы после изображений
        processed = processed.replace(/<\/img>/g, '</img><span style="display:inline-block; width:1em; height:1em; opacity:0;"></span>');
        
        // Добавляем пробелы перед div-обертками
        processed = processed.replace(/<div[^>]*contenteditable="false"[^>]*>/g, '<span style="display:inline-block; width:1em; height:1em; opacity:0;"></span>$&');
        
        // Добавляем пробелы после div-оберток
        processed = processed.replace(/<\/div>/g, '</div><span style="display:inline-block; width:1em; height:1em; opacity:0;"></span>');
        
        return processed;
    };

    // CSS стили для правильного отображения пробелов и переносов строк
    const promoHtmlStyles = `
        .promo-html {
            white-space: pre-wrap !important;
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
            font-family: inherit;
            font-size: 16px !important;
            line-height: 1.6 !important;
        }
        
        .promo-html p {
            margin: 0 0 1em 0;
            white-space: pre-wrap !important;
            font-size: 16px !important;
            line-height: 1.6 !important;
        }
        
        .promo-html div {
            white-space: pre-wrap !important;
            font-size: 16px !important;
            line-height: 1.6 !important;
        }
        
        .promo-html img {
            display: block;
            margin: 1em 0;
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .promo-html br {
            display: block;
            content: "";
            margin: 0.5em 0;
        }
        
        .promo-html * {
            white-space: inherit;
            font-size: 16px !important;
        }
        
        /* Специальные стили для пробелов перед изображениями */
        .promo-html img:first-child {
            margin-top: 0;
        }
        
        .promo-html img:last-child {
            margin-bottom: 0;
        }
        
        /* Сохраняем пробелы в тексте */
        .promo-html span {
            white-space: pre-wrap !important;
            font-size: 16px !important;
        }
        
        /* Обработка множественных пробелов */
        .promo-html {
            white-space: pre-wrap !important;
        }
        
        /* Принудительное отображение пробелов перед изображениями */
        .promo-html img {
            margin-top: 1em !important;
            margin-bottom: 1em !important;
        }
        
        /* Специальные стили для всех текстовых элементов */
        .promo-html h1, .promo-html h2, .promo-html h3, .promo-html h4, .promo-html h5, .promo-html h6 {
            font-size: 16px !important;
            line-height: 1.6 !important;
        }
        
        .promo-html ul, .promo-html ol, .promo-html li {
            font-size: 16px !important;
            line-height: 1.6 !important;
        }
        
        .promo-html strong, .promo-html b {
            font-size: 16px !important;
        }
        
        .promo-html em, .promo-html i {
            font-size: 16px !important;
        }
        
        .promo-html a {
            font-size: 16px !important;
        }
        
        /* Обработка изображений внутри параграфов */
        .promo-html p:has(img) {
            margin: 2em 0 !important;
            padding: 1em 0 !important;
        }
        
        .promo-html p img {
            margin: 1em 0 !important;
        }
        
        /* Дополнительные стили для принудительного отображения пробелов */
        .promo-html {
            white-space: pre-wrap !important;
            word-spacing: normal !important;
            letter-spacing: normal !important;
        }
        
        /* Специальная обработка для изображений */
        .promo-html img {
            display: block !important;
            margin: 2em 0 !important;
            max-width: 100% !important;
            height: auto !important;
            border-radius: 8px !important;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
            clear: both !important;
        }
        
        /* Специальная обработка для div-оберток изображений */
        .promo-html div[contenteditable="false"] {
            display: block !important;
            margin: 2em 0 !important;
            padding: 1em 0 !important;
        }
        
        /* Стили для изображений */
        .promo-html img {
            margin: 0.5em 0 !important;
            display: inline-block !important;
        }
        
        .promo-html div[contenteditable="false"] {
            margin: 0.5em 0 !important;
            display: inline-block !important;
        }
        
        /* Стили для невидимых пробелов */
        .promo-html span[style*="opacity:0"] {
            display: inline-block !important;
            width: 1em !important;
            height: 1em !important;
            opacity: 0 !important;
            margin: 0 0.2em !important;
        }
        
        /* Базовые стили */
        .promo-html {
            white-space: normal !important;
            word-wrap: break-word !important;
        }
    `;

    // Function to refresh course data
    const refreshCourseData = async () => {
        try {
            const res = await axios.get(`/course?id=${id}`);
            setCourse(res.data);
            // Try to get average rating if backend provides it
            if (res.data && typeof res.data.averageRating === 'number') {
                setAverageRating(res.data.averageRating);
            } else {
                try {
                    const avgRes = await axios.get(`/course/${id}/rating/average`);
                    if (typeof avgRes.data?.average === 'number') setAverageRating(avgRes.data.average);
                } catch {}
            }
        } catch (error) {
            console.error('Error refreshing course data:', error);
        }
    };

    // Function to refresh user rating
    const refreshUserRating = async () => {
        const token = localStorage.getItem('jwtToken');
        if (token) {
            try {
                const ratingRes = await axios.get(`/course-rating/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const userRatingValue = ratingRes.data.rating || 0;
                setUserRating(userRatingValue);
            } catch (error) {
                console.log('Error refreshing user rating:', error);
            }
        }
    };

    useEffect(() => {
        const fetchCourse = async () => {
            setVideoError(false); // Сбрасываем ошибку видео при смене курса
            try {
                const res = await axios.get(`/course?id=${id}`);
                console.log('Course data loaded:', res.data);
                console.log('Course categories:', res.data?.categories);
                console.log('Course courseCategories:', res.data?.courseCategories);
                
                // Дополнительная отладка для категорий
                if (res.data?.categories) {
                    console.log('Categories details:', res.data.categories.map(cat => ({
                        id: cat.id,
                        name: cat.name,
                        nameRu: cat.nameRu,
                        nameEn: cat.nameEn
                    })));
                }
                
                setCourse(res.data);
                
                if (res.data && typeof res.data.averageRating === 'number') {
                    setAverageRating(res.data.averageRating);
                } else {
                    try {
                        const avgRes = await axios.get(`/course/${id}/rating/average`);
                        if (typeof avgRes.data?.average === 'number') setAverageRating(avgRes.data.average);
                    } catch {}
                }
                
                // Загружаем оценку пользователя
                const token = localStorage.getItem('jwtToken');
                if (token) {
                    try {
                        const ratingRes = await axios.get(`/course-rating/${id}`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        console.log('User rating response:', ratingRes.data);
                        const userRatingValue = ratingRes.data.rating || 0;
                        console.log('Setting initial user rating to:', userRatingValue);
                        setUserRating(userRatingValue);
                    } catch (error) {
                        console.log('User not rated this course yet');
                    }
                }
            } catch (e) {
                console.error('Failed to fetch course:', e);
                setError(e);
            } finally {
                setLoading(false);
            }
        };
        fetchCourse();
    }, [id, t]); // Add t to the dependency array

    // Periodically refresh user rating to keep it in sync
    useEffect(() => {
        const interval = setInterval(() => {
            refreshUserRating();
        }, 5000); // Refresh every 5 seconds

        // Refresh rating when window gains focus
        const handleFocus = () => {
            refreshUserRating();
        };

        // Refresh rating when page becomes visible
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                refreshUserRating();
            }
        };

        window.addEventListener('focus', handleFocus);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Refresh rating on mount
        refreshUserRating();

        // Refresh rating when user interacts with the page
        const handleClick = () => {
            refreshUserRating();
        };

        // Refresh rating when user scrolls
        const handleScroll = () => {
            refreshUserRating();
        };

        // Refresh rating when user moves mouse
        const handleMouseMove = () => {
            refreshUserRating();
        };

        // Refresh rating when user presses a key
        const handleKeyPress = () => {
            refreshUserRating();
        };

        // Refresh rating when user touches screen (mobile)
        const handleTouch = () => {
            refreshUserRating();
        };

        // Refresh rating when user resizes window
        const handleResize = () => {
            refreshUserRating();
        };

        // Refresh rating when user moves mouse wheel
        const handleWheel = () => {
            refreshUserRating();
        };

        // Refresh rating when user drags something
        const handleDrag = () => {
            refreshUserRating();
        };

        // Refresh rating when user drops something
        const handleDrop = () => {
            refreshUserRating();
        };

        // Refresh rating when user selects text
        const handleSelection = () => {
            refreshUserRating();
        };

        // Refresh rating when user copies text
        const handleCopy = () => {
            refreshUserRating();
        };

        // Refresh rating when user cuts text
        const handleCut = () => {
            refreshUserRating();
        };

        // Refresh rating when user pastes text
        const handlePaste = () => {
            refreshUserRating();
        };

        // Refresh rating when user right-clicks
        const handleContextMenu = () => {
            refreshUserRating();
        };

        document.addEventListener('click', handleClick);
        window.addEventListener('scroll', handleScroll);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('keypress', handleKeyPress);
        document.addEventListener('touchstart', handleTouch);
        window.addEventListener('resize', handleResize);
        document.addEventListener('wheel', handleWheel);
        document.addEventListener('drag', handleDrag);
        document.addEventListener('drop', handleDrop);
        document.addEventListener('selectionchange', handleSelection);
        document.addEventListener('copy', handleCopy);
        document.addEventListener('cut', handleCut);
        document.addEventListener('paste', handlePaste);
        document.addEventListener('contextmenu', handleContextMenu);

        // Refresh rating when user double-clicks
        const handleDoubleClick = () => {
            refreshUserRating();
        };

        // Refresh rating when user presses Enter key
        const handleEnterKey = (e) => {
            if (e.key === 'Enter') {
                refreshUserRating();
            }
        };

        document.addEventListener('dblclick', handleDoubleClick);
        document.addEventListener('keydown', handleEnterKey);

        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            document.removeEventListener('click', handleClick);
            window.removeEventListener('scroll', handleScroll);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('keypress', handleKeyPress);
            document.removeEventListener('touchstart', handleTouch);
            window.removeEventListener('resize', handleResize);
            document.removeEventListener('wheel', handleWheel);
            document.removeEventListener('drag', handleDrag);
            document.removeEventListener('drop', handleDrop);
            document.removeEventListener('selectionchange', handleSelection);
            document.removeEventListener('copy', handleCopy);
            document.removeEventListener('cut', handleCut);
            document.removeEventListener('paste', handlePaste);
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('dblclick', handleDoubleClick);
            document.removeEventListener('keydown', handleEnterKey);
        };
    }, [id]);

    // Refresh rating when location changes (user navigates to this page)
    useEffect(() => {
        refreshUserRating();
    }, [location.pathname]);

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--teach-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-color)' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, marginBottom: 16 }}>{t('course.loading')}</div>
                    <div style={{ fontSize: 16, color: 'var(--text-secondary, #666)' }}>Пожалуйста, подождите</div>
                </div>
            </div>
        );
    }

    if (error || !course) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--teach-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-color)' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, marginBottom: 16 }}>{t('course.failed_to_load')}</div>
                    <div style={{ fontSize: 16, color: 'var(--text-secondary, #666)' }}>Курс не найден или произошла ошибка</div>
                </div>
            </div>
        );
    }

    const logoUrl = course.logoUrl ? getCourseFileUrl(course.logoUrl) : null;
    const title = course.name || course.title;
    const shortDescr = course.shortDescription || course.description || '';
    
    const handleRatingClick = async (rating) => {
        try {
            console.log('Rating clicked:', rating);
            const token = localStorage.getItem('jwtToken');
            if (!token) {
                return;
            }

            await axios.post('/course-rating', {
                courseId: id,
                rating: rating
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('Setting user rating to:', rating);
            setUserRating(rating);
            setHoverRating(0);
            
            await refreshCourseData();
            
            await refreshUserRating();
        } catch (error) {
            console.error('Error submitting rating:', error);
        }
    };

    const handleCourseReaction = async (isLike) => {
        try {
            if (isLike) setLikePending(true); else setDislikePending(true);
            const token = localStorage.getItem('jwtToken');
            if (!token) return;
            await axios.post('/course-rating', {
                courseId: id,
                rating: isLike ? 5 : 1
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await refreshCourseData();
            await refreshUserRating();
        } catch (e) {
            console.error('Course reaction error', e);
        } finally {
            if (isLike) setLikePending(false); else setDislikePending(false);
        }
    };
    
    // Отладочная информация
    console.log('Course data:', course);
    console.log('Video URL:', course.videoUrl);
    console.log('Intro URL:', course.introUrl);
    console.log('Lectures:', course.lectures);
    if (course.lectures && course.lectures.length > 0) {
        console.log('First lecture video:', course.lectures[0].videoLink);
    }

    // Функция для зачисления на курс и перехода к нему
    const handleEnrollAndStart = async () => {
        try {
            setIsEnrolling(true);
            
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

            // Зачисляем на курс
            const response = await axios.post('/enrollment', {
                courseId: id
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            // Показываем сообщение об успешном зачислении
            if (response.data.message) {
                toast.success(response.data.message);
            } else {
                toast.success(t('course_catalog.successfully_enrolled'));
            }
            
            // Переходим к курсу
            history.push(`/course/${id}`);
            
        } catch (error) {
            console.error('Error enrolling in course:', error);
            if (error.response?.status === 409) {
                // Пользователь уже зачислен, просто переходим к курсу
                toast.info(t('course_catalog.already_enrolled'));
                history.push(`/course/${id}`);
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
            setIsEnrolling(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--teach-bg)', display: 'flex', flexDirection: 'column' }}>
            <style>{promoHtmlStyles}</style>
            <NavBar />
            <header style={{ background: dark ? 'var(--teach-nav-bg)' : '#4485ed', color: '#fff', padding: '48px 0', borderBottom: dark ? '1px solid var(--border-color)' : 'none' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap', padding: '0 24px' }}>
                    {logoUrl && (
                        <div style={{
                            position: 'relative',
                            width: 180,
                            height: 180,
                            borderRadius: 20,
                            overflow: 'hidden',
                            boxShadow: dark 
                                ? '0 8px 32px rgba(0,0,0,0.4), 0 4px 16px rgba(68, 133, 237, 0.2)' 
                                : '0 8px 32px rgba(0,0,0,0.15), 0 4px 16px rgba(68, 133, 237, 0.1)',
                            border: dark 
                                ? '2px solid rgba(255,255,255,0.1)' 
                                : '2px solid rgba(68, 133, 237, 0.1)',
                            background: dark 
                                ? 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))' 
                                : 'linear-gradient(135deg, rgba(68, 133, 237, 0.1), rgba(111, 66, 193, 0.1))',
                            backdropFilter: 'blur(10px)',
                            transform: 'perspective(1000px) rotateY(-5deg)',
                            transition: 'all 0.3s ease'
                        }}>
                            <img 
                                src={logoUrl} 
                                style={{ 
                                    width: '100%', 
                                    height: '100%', 
                                    objectFit: 'cover',
                                    transition: 'transform 0.3s ease'
                                }} 
                                alt={title}
                                onMouseEnter={(e) => {
                                    e.target.style.transform = 'scale(1.05)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.transform = 'scale(1)';
                                }}
                            />
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: 'linear-gradient(135deg, rgba(68, 133, 237, 0.1), rgba(111, 66, 193, 0.1))',
                                opacity: 0,
                                transition: 'opacity 0.3s ease'
                            }}></div>
                        </div>
                    )}
                    <div style={{ flex: 1, minWidth: 300 }}>
                        <h1 style={{ 
                            fontSize: dark ? '42px' : '48px', 
                            marginBottom: 20, 
                            fontWeight: 800, 
                            lineHeight: 1.1, 
                            color: dark ? '#ffffff' : '#1a1a1a',
                            textShadow: dark ? '0 2px 4px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
                            background: dark 
                                ? 'linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%)' 
                                : 'linear-gradient(135deg, #1a1a1a 0%, #333333 100%)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            letterSpacing: '-0.02em',
                            position: 'relative',
                            paddingBottom: '8px'
                        }}>
                            {title}
                            <div style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                width: '60px',
                                height: '4px',
                                background: dark 
                                    ? 'linear-gradient(90deg, #4485ed, #6f42c1)' 
                                    : 'linear-gradient(90deg, #4485ed, #6f42c1)',
                                borderRadius: '2px',
                                boxShadow: '0 2px 8px rgba(68, 133, 237, 0.3)'
                            }}></div>
                        </h1>
                        
                        <p style={{ 
                            fontSize: 20, 
                            lineHeight: 1.7, 
                            marginBottom: 28, 
                            opacity: dark ? 0.95 : 0.9,
                            color: dark ? '#e0e0e0' : '#333333',
                            fontWeight: 400,
                            maxWidth: '90%',
                            textShadow: dark ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                            padding: '16px 20px',
                            background: dark 
                                ? 'rgba(255,255,255,0.05)' 
                                : 'rgba(68, 133, 237, 0.15)',
                            borderRadius: '12px',
                            border: dark 
                                ? '1px solid rgba(255,255,255,0.1)' 
                                : '1px solid rgba(68, 133, 237, 0.25)',
                            backdropFilter: 'blur(10px)',
                            boxShadow: dark 
                                ? '0 4px 20px rgba(0,0,0,0.2)' 
                                : '0 4px 20px rgba(68, 133, 237, 0.2)'
                        }}>
                            {shortDescr}
                        </p>
                                                    <div style={{ 
                                                        display: 'flex', 
                                                        gap: 20, 
                                                        marginBottom: 32, 
                                                        flexWrap: 'wrap',
                                                        alignItems: 'center'
                                                    }}>
                            {/* Отображение категорий */}
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 10,
                                padding: '8px 16px',
                                background: dark 
                                    ? 'rgba(255,255,255,0.1)' 
                                    : 'rgba(111, 66, 193, 0.2)',
                                borderRadius: '20px',
                                border: dark 
                                    ? '1px solid rgba(255,255,255,0.2)' 
                                    : '1px solid rgba(111, 66, 193, 0.35)',
                                backdropFilter: 'blur(10px)',
                                boxShadow: dark 
                                    ? '0 2px 8px rgba(0,0,0,0.2)' 
                                    : '0 2px 8px rgba(111, 66, 193, 0.25)',
                                transition: 'all 0.3s ease'
                            }}>
                                <FontAwesomeIcon 
                                    icon={faUser} 
                                    style={{ 
                                        color: dark ? '#6f42c1' : '#6f42c1',
                                        fontSize: '16px'
                                    }} 
                                />
                                <span style={{ 
                                    fontWeight: 600,
                                    color: dark ? '#ffffff' : '#333333',
                                    fontSize: '14px'
                                }}>
                                    ID: {course.id}
                                </span>
                            </div>
                            {/* Рейтинг курса */}
<div style={{ 
    display: 'flex', 
    alignItems: 'center', 
    gap: 10,
    padding: '8px 16px',
    background: dark 
        ? 'rgba(255,255,255,0.1)' 
        : 'rgba(255, 193, 7, 0.25)',
    borderRadius: '20px',
    border: dark 
        ? '1px solid rgba(255,255,255,0.2)' 
        : '1px solid rgba(255, 193, 7, 0.4)',
    backdropFilter: 'blur(10px)',
    boxShadow: dark 
        ? '0 2px 8px rgba(0,0,0,0.2)' 
        : '0 2px 8px rgba(255, 193, 7, 0.3)',
    transition: 'all 0.3s ease',
    animation: 'fadeIn 0.3s ease-in-out'
}}
className="rating-section"
>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {[0,1,2,3,4].map((i) => {
            const starValue = i + 1;
            const diff = (averageRating || 0) - i;
            const color = diff >= 1 ? '#ffc107' : diff >= 0.5 ? 'linear-gradient(90deg,#ffc107 50%, #e4e5e9 50%)' : '#e4e5e9';
            const style = { fontSize: '16px', color: diff >= 0.5 ? '#ffc107' : '#e4e5e9' };
            return (
                <span key={i} style={{ position: 'relative', width: 18, height: 18, display: 'inline-block' }}>
                    <FontAwesomeIcon icon={faStar} style={{ color: '#e4e5e9', fontSize: '18px', position: 'absolute', left:0, top:0 }} />
                    {diff > 0 && (
                      <span style={{ position: 'absolute', left:0, top:0, width: `${Math.max(0, Math.min(1, diff)) * 100}%`, height: '100%', overflow: 'hidden' }}>
                        <FontAwesomeIcon icon={faStar} style={{ color: '#ffc107', fontSize: '18px' }} />
                      </span>
                    )}
                </span>
            );
        })}
    </div>
    <span style={{ 
        fontWeight: 700,
        color: dark ? '#ffffff' : '#333333',
        fontSize: '14px',
        marginLeft: '4px'
    }}>
        {Number(averageRating || 0).toFixed(1)}/5
    </span>
</div>
                        </div>
                        <button
                            onClick={handleEnrollAndStart}
                            disabled={isEnrolling}
                            style={{ 
                                background: dark 
                                    ? 'linear-gradient(135deg, #54ad54, #45a045)' 
                                    : 'linear-gradient(135deg, #54ad54, #45a045)', 
                                padding: '16px 36px', 
                                borderRadius: '12px', 
                                fontSize: '18px', 
                                fontWeight: 700, 
                                color: '#fff', 
                                textDecoration: 'none', 
                                display: 'inline-block', 
                                transition: 'all 0.3s ease', 
                                boxShadow: dark 
                                    ? '0 6px 20px rgba(84, 173, 84, 0.4), 0 2px 8px rgba(0,0,0,0.2)' 
                                    : '0 6px 20px rgba(84, 173, 84, 0.3), 0 2px 8px rgba(0,0,0,0.1)',
                                border: 'none',
                                position: 'relative',
                                overflow: 'hidden',
                                letterSpacing: '0.5px',
                                textTransform: 'uppercase',
                                cursor: isEnrolling ? 'not-allowed' : 'pointer',
                                opacity: isEnrolling ? 0.7 : 1
                            }}
                            onMouseEnter={e => { 
                                if (!isEnrolling) {
                                    e.target.style.transform = 'translateY(-3px) scale(1.02)'; 
                                    e.target.style.boxShadow = dark 
                                        ? '0 8px 25px rgba(84, 173, 84, 0.5), 0 4px 12px rgba(0,0,0,0.3)' 
                                        : '0 8px 25px rgba(84, 173, 84, 0.4), 0 4px 12px rgba(0,0,0,0.15)'; 
                                    // Анимация блеска
                                    const shine = e.target.querySelector('div');
                                    if (shine) {
                                        shine.style.left = '100%';
                                    }
                                }
                            }}
                            onMouseLeave={e => { 
                                if (!isEnrolling) {
                                    e.target.style.transform = 'translateY(0) scale(1)'; 
                                    e.target.style.boxShadow = dark 
                                        ? '0 6px 20px rgba(84, 173, 84, 0.4), 0 2px 8px rgba(0,0,0,0.2)' 
                                        : '0 6px 20px rgba(84, 173, 84, 0.3), 0 2px 8px rgba(0,0,0,0.1)'; 
                                    // Сброс анимации блеска
                                    const shine = e.target.querySelector('div');
                                    if (shine) {
                                        shine.style.left = '-100%';
                                    }
                                }
                            }}
                        >
                            <FontAwesomeIcon icon={isEnrolling ? faClock : faPlay} />
                            {isEnrolling ? t('course_catalog.enrolling') : t('course.start_study')}
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: '-100%',
                                width: '100%',
                                height: '100%',
                                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                                transition: 'left 0.5s ease'
                            }}></div>
                        </button>
                    </div>
                </div>
            </header>
            <main style={{ flex: 1, padding: '48px 0' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
                    {/* Видео курса - перемещено в начало */}
                    {(course.introUrl || (course.lectures && course.lectures.length > 0 && course.lectures[0].videoLink)) && (
                        <section style={{ marginBottom: 48 }}>
                            <div style={{ 
                                background: dark ? 'var(--teach-tile-bg)' : 'rgba(255, 255, 255, 0.95)', 
                                padding: 24, 
                                borderRadius: 16, 
                                border: dark ? '1px solid var(--border-color)' : '1px solid rgba(68, 133, 237, 0.2)', 
                                overflow: 'hidden',
                                boxShadow: dark ? 'none' : '0 4px 20px rgba(68, 133, 237, 0.1)'
                            }}>
                                <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%' }}>
                                    {!videoError ? (
                                        <video
                                            src={(course.lectures && course.lectures.length > 0 && course.lectures[0].videoLink) ? getVideoUrl(course.lectures[0].videoLink) : getVideoUrl(course.introUrl)}
                                            onLoadStart={() => {
                                              const videoSrc = (course.lectures && course.lectures.length > 0 && course.lectures[0].videoLink) ? getVideoUrl(course.lectures[0].videoLink) : getVideoUrl(course.introUrl);
                                              console.log('🎬 CoursePromo video load started:', videoSrc);
                                            }}
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: '100%',
                                                height: '100%',
                                                border: 'none',
                                                borderRadius: 8
                                            }}
                                            controls
                                            muted
                                            onError={(e) => {
                                              const videoElement = e.target;
                                              console.error('❌ Video error in CoursePromo:', e);
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
                                              
                                              setVideoError(true);
                                            }}
                                        />
                                    ) : (
                                        <div style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            background: dark ? '#2d2d2d' : '#f8f9fa',
                                            border: `1px solid ${dark ? '#404040' : '#e9ecef'}`,
                                            borderRadius: 8,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexDirection: 'column',
                                            color: dark ? '#ffffff' : '#666666'
                                        }}>
                                            <FontAwesomeIcon 
                                                icon={faPlay} 
                                                style={{ 
                                                    fontSize: '3rem', 
                                                    marginBottom: '15px', 
                                                    opacity: 0.5 
                                                }} 
                                            />
                                            <h4 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>
                                                {t('course.video_not_available') || 'Видео недоступно'}
                                            </h4>
                                            <p style={{ fontSize: '14px', margin: '0', textAlign: 'center', opacity: 0.8 }}>
                                                {t('course.video_loading_error') || 'Не удалось загрузить видео'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>
                    )}
                    
                    {course.description && (
                        <section style={{ marginBottom: 48 }}>
                            <h2 style={{ fontSize: 28, marginBottom: 20, color: 'var(--text-color)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 12 }}>
                                <FontAwesomeIcon icon={faBook} style={{ color: 'var(--accent-color, #4485ed)' }} />
                                {t('course.about')}
                            </h2>
                            <div 
                                className="promo-html"
                                style={{ 
                                    background: dark ? 'var(--teach-tile-bg)' : 'rgba(255, 255, 255, 0.95)', 
                                    padding: 24, 
                                    borderRadius: 16, 
                                    border: dark ? '1px solid var(--border-color)' : '1px solid rgba(68, 133, 237, 0.2)',
                                    boxShadow: dark ? 'none' : '0 4px 20px rgba(68, 133, 237, 0.1)',
                                    color: 'var(--text-color)' 
                                }}
                                dangerouslySetInnerHTML={{ __html: processHtmlContent(course.description) }}
                            />
                        </section>
                    )}                    
                    {course.learningOutcomes && (
                        <section style={{ marginBottom: 48 }}>
                            <h2 style={{ fontSize: 28, marginBottom: 20, color: 'var(--text-color)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 12 }}>
                                <FontAwesomeIcon icon={faGraduationCap} style={{ color: 'var(--accent-color, #4485ed)' }} />
                                {t('course.what_u_will_learn')}
                            </h2>
                            <div 
                                className="promo-html"
                                style={{ 
                                    background: dark ? 'var(--teach-tile-bg)' : 'rgba(255, 255, 255, 0.95)', 
                                    padding: 24, 
                                    borderRadius: 16, 
                                    border: dark ? '1px solid var(--border-color)' : '1px solid rgba(68, 133, 237, 0.2)',
                                    boxShadow: dark ? 'none' : '0 4px 20px rgba(68, 133, 237, 0.1)'
                                }}
                                dangerouslySetInnerHTML={{ __html: processHtmlContent(course.learningOutcomes) }}
                            />
                        </section>
                    )}
                    {course.courseSections && course.courseSections.length > 0 && (
                        <section style={{ marginBottom: 48 }}>
                            <h2 style={{ fontSize: 28, marginBottom: 20, color: 'var(--text-color)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 12 }}>
                                <FontAwesomeIcon icon={faBook} style={{ color: 'var(--accent-color, #4485ed)' }} />
                                {t('course.content')}
                            </h2>
                            <div style={{ 
                                background: dark ? 'var(--teach-tile-bg)' : 'rgba(255, 255, 255, 0.95)', 
                                padding: 24, 
                                borderRadius: 16, 
                                border: dark ? '1px solid var(--border-color)' : '1px solid rgba(68, 133, 237, 0.2)',
                                boxShadow: dark ? 'none' : '0 4px 20px rgba(68, 133, 237, 0.1)'
                            }}>
                                <ol style={{ margin: 0, padding: 0, listStyle: 'none', counterReset: 'section-counter' }}>
                                    {course.courseSections.map((mod, idx) => (
                                        <li key={idx} style={{ marginBottom: 16, counterIncrement: 'section-counter', position: 'relative', paddingLeft: 40 }}>
                                            <div style={{ position: 'absolute', left: 0, top: 0, width: 28, height: 28, background: 'var(--accent-color, #4485ed)', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600 }}>
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <strong style={{ fontSize: 18, color: 'var(--text-color)', display: 'block', marginBottom: 4 }}>
                                                    {mod.title}
                                                </strong>
                                                {mod.summary && (
                                                    <span style={{ fontSize: 14, color: 'var(--text-secondary, #666)', lineHeight: 1.5 }}>
                                                        {mod.summary}
                                                    </span>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        </section>
                    )}
                    {course.requirements && (
                        <section style={{ marginBottom: 48 }}>
                            <h2 style={{ fontSize: 28, marginBottom: 20, color: 'var(--text-color)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 12 }}>
                                <FontAwesomeIcon icon={faBook} style={{ color: 'var(--accent-color, #4485ed)' }} />
                                {t('course.requirements')}
                            </h2>
                            <div 
                                className="promo-html"
                                style={{ 
                                    background: dark ? 'var(--teach-tile-bg)' : 'rgba(255, 255, 255, 0.95)', 
                                    padding: 24, 
                                    borderRadius: 16, 
                                    border: dark ? '1px solid var(--border-color)' : '1px solid rgba(68, 133, 237, 0.2)',
                                    boxShadow: dark ? 'none' : '0 4px 20px rgba(68, 133, 237, 0.1)',
                                    color: 'var(--text-color)' 
                                }}
                                dangerouslySetInnerHTML={{ __html: processHtmlContent(course.requirements) }}
                            />
                        </section>
                    )}
                    {course.learningFormat && (
                        <section style={{ marginBottom: 48 }}>
                            <h2 style={{ fontSize: 28, marginBottom: 20, color: 'var(--text-color)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 12 }}>
                                <FontAwesomeIcon icon={faPlay} style={{ color: 'var(--accent-color, #4485ed)' }} />
                                {t('course.learning_format')}
                            </h2>
                            <div 
                                className="promo-html"
                                style={{ 
                                    background: dark ? 'var(--teach-tile-bg)' : 'rgba(255, 255, 255, 0.95)', 
                                    padding: 24, 
                                    borderRadius: 16, 
                                    border: dark ? '1px solid var(--border-color)' : '1px solid rgba(68, 133, 237, 0.2)',
                                    boxShadow: dark ? 'none' : '0 4px 20px rgba(68, 133, 237, 0.1)',
                                    color: 'var(--text-color)' 
                                }}
                                dangerouslySetInnerHTML={{ __html: processHtmlContent(course.learningFormat) }}
                            />
                        </section>
                    )}

                    {course.targeting && (
                        <section style={{ marginBottom: 48 }}>
                            <h2 style={{ fontSize: 28, marginBottom: 20, color: 'var(--text-color)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 12 }}>
                                <FontAwesomeIcon icon={faUser} style={{ color: 'var(--accent-color, #4485ed)' }} />
                                {t('course.targeting', 'Для кого этот курс')}
                            </h2>
                            <div 
                                className="promo-html"
                                style={{ 
                                    background: dark ? 'var(--teach-tile-bg)' : 'rgba(255, 255, 255, 0.95)', 
                                    padding: 24, 
                                    borderRadius: 16, 
                                    border: dark ? '1px solid var(--border-color)' : '1px solid rgba(68, 133, 237, 0.2)',
                                    boxShadow: dark ? 'none' : '0 4px 20px rgba(68, 133, 237, 0.1)'
                                }}
                                dangerouslySetInnerHTML={{ __html: processHtmlContent(course.targeting) }}
                            />
                        </section>
                    )}
                    {course.acquiredAssets && (
                        <section style={{ marginBottom: 48 }}>
                            <h2 style={{ fontSize: 28, marginBottom: 20, color: 'var(--text-color)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 12 }}>
                                <FontAwesomeIcon icon={faCheckCircle} style={{ color: 'var(--accent-color, #4485ed)' }} />
                                {t('course.acquired_assets')}
                            </h2>
                            <div 
                                className="promo-html"
                                style={{ 
                                    background: dark ? 'var(--teach-tile-bg)' : 'rgba(255, 255, 255, 0.95)', 
                                    padding: 24, 
                                    borderRadius: 16, 
                                    border: dark ? '1px solid var(--border-color)' : '1px solid rgba(68, 133, 237, 0.2)',
                                    boxShadow: dark ? 'none' : '0 4px 20px rgba(68, 133, 237, 0.1)',
                                    color: 'var(--text-color)' 
                                }}
                                dangerouslySetInnerHTML={{ __html: processHtmlContent(course.acquiredAssets) }}
                            />
                        </section>
                    )}

                    {/* Рейтинг курса */}
                    <section style={{ marginBottom: 48 }}>
                        <h2 style={{ fontSize: 28, marginBottom: 20, color: 'var(--text-color)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 12 }}>
                            <FontAwesomeIcon icon={faStar} style={{ color: 'var(--accent-color, #4485ed)' }} />
                            {t('course.rating')}
                        </h2>
                        <div style={{ background: 'var(--teach-tile-bg)', padding: 24, borderRadius: 16, border: '1px solid var(--border-color)' }}>
                            <CourseRating 
                                courseId={id} 
                                onRatingChange={async () => {
                                    await refreshCourseData();
                                    await refreshUserRating();
                                }}
                            />
                        </div>
                    </section>

                    {/* {t('course.comments')} */}
                    <section style={{ marginBottom: 48 }}>
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            marginBottom: '20px'
                        }}>
                            <h2 style={{ 
                                fontSize: 28, 
                                color: 'var(--text-color)', 
                                fontWeight: 700, 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 12,
                                margin: 0
                            }}>
                                <FontAwesomeIcon icon={faComment} style={{ color: 'var(--accent-color, #4485ed)' }} />
                                {t('course.comments')}
                            </h2>
                            <button
                                onClick={() => setShowComments(!showComments)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--accent-color, #4485ed)',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    textDecoration: 'underline',
                                    padding: '8px 16px',
                                    borderRadius: '4px',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(68, 133, 237, 0.1)'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                            >
                                {showComments ? t('course.hide_comments') : t('course.show_comments')}
                            </button>
                        </div>
                        {showComments && (
                            <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}
                                 className="comments-section">
                                <CourseComments 
                                  courseId={id} 
                                  onRatingChange={async () => {
                                    await refreshCourseData();
                                    await refreshUserRating();
                                  }}
                                  currentUserRating={userRating}
                                />
                            </div>
                        )}
                    </section>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default CoursePromo;