import React, { useState, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBell, 
  faCheckCircle, 
  faExclamationTriangle,
  faInfoCircle,
  faTimes,
  faSort,
  faFilter,
  faBook,
  faList
} from '@fortawesome/free-solid-svg-icons';
import useTheme from '../hooks/useTheme';
import axios from '../utils/axios';


// Компонент для отображения переведенного уведомления
function TranslatedNotificationItem({ notification, theme, currentLanguage, onMarkAsRead, t }) {
  const [translatedTitle, setTranslatedTitle] = useState(notification.title);
  const [translatedMessage, setTranslatedMessage] = useState(notification.message);
  
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return faCheckCircle;
      case 'warning':
        return faExclamationTriangle;
      case 'error':
        return faTimes;
      default:
        return faInfoCircle;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'success':
        return '#28a745';
      case 'warning':
        return '#ffc107';
      case 'error':
        return '#dc3545';
      default:
        return '#17a2b8';
    }
  };
  
  useEffect(() => {
    const translateNotification = () => {
      try {
        // Проверяем, является ли заголовок ключом перевода
        const translationKeys = [
          'step_modified', 'step_added', 'step_deleted',
          'lesson_modified', 'lesson_added', 'lesson_deleted',
          'module_modified', 'module_added', 'module_deleted',
          'course_updated', 'profile_updated'
        ];
        
        if (translationKeys.includes(notification.title)) {
          // Это ключ перевода, получаем перевод из translations.json
          const titleKey = `notifications.${notification.title}`;
          const messageKey = `notifications.${notification.title}_message`;
          
          let title = t(titleKey);
          let message = t(messageKey);
          
          // Заменяем параметры в сообщении, если они есть
          if (notification.message) {
            // Извлекаем параметры из оригинального сообщения
            const lessonMatch = notification.message.match(/"([^"]+)"/g);
            if (lessonMatch && lessonMatch.length >= 1) {
              const lessonName = lessonMatch[0].replace(/"/g, '');
              
              message = message
                .replace('{lessonName}', lessonName);
              
              // Если есть второй параметр (для шагов)
              if (lessonMatch.length >= 2) {
                const stepName = lessonMatch[1].replace(/"/g, '');
                message = message.replace('{stepTitle}', stepName);
              }
            }
          }
          
          setTranslatedTitle(title);
          setTranslatedMessage(message);
        } else {
          // Это обычный текст, оставляем как есть
          setTranslatedTitle(notification.title);
          setTranslatedMessage(notification.message);
        }
      } catch (error) {
        console.error('Error translating notification:', error);
        setTranslatedTitle(notification.title);
        setTranslatedMessage(notification.message);
      }
    };
    
    translateNotification();
  }, [notification, currentLanguage, t]);
  
  return (
    <div
      style={{
        background: theme === 'dark' ? '#2d2d2d' : '#ffffff',
        padding: '20px',
        borderRadius: '12px',
        border: `1px solid ${theme === 'dark' ? '#404040' : '#e9ecef'}`,
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        opacity: notification.read ? 0.7 : 1,
        transition: 'all 0.2s'
      }}
    >
      <div style={{ 
        display: 'flex', 
        alignItems: 'flex-start', 
        gap: '15px' 
      }}>
        <FontAwesomeIcon 
          icon={getNotificationIcon(notification.type)} 
          style={{ 
            fontSize: '1.5rem', 
            color: getNotificationColor(notification.type),
            marginTop: '2px'
          }} 
        />
        
        <div style={{ flex: 1 }}>
          <h3 style={{ 
            fontSize: '1.1rem', 
            fontWeight: '600', 
            marginBottom: '8px',
            color: theme === 'dark' ? '#ffffff' : '#333333'
          }}>
            {translatedTitle}
          </h3>
          <p style={{ 
            color: theme === 'dark' ? '#cccccc' : '#666666',
            marginBottom: '10px',
            lineHeight: '1.5'
          }}>
            {translatedMessage}
          </p>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            fontSize: '0.9rem',
            color: theme === 'dark' ? '#999999' : '#888888'
          }}>
            <span>
              {new Date(notification.createdAt).toLocaleDateString(currentLanguage === 'ru' ? 'ru-RU' : 
                                                               currentLanguage === 'de' ? 'de-DE' :
                                                               currentLanguage === 'es' ? 'es-ES' :
                                                               currentLanguage === 'pt' ? 'pt-BR' :
                                                               currentLanguage === 'uk' ? 'uk-UA' :
                                                               currentLanguage === 'zh' ? 'zh-CN' :
                                                               'en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
            {!notification.read && (
              <button
                onClick={() => onMarkAsRead(notification.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#007bff',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  textDecoration: 'underline'
                }}
              >
                {t('notifications.mark_as_read')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AnimatedSelectBox({ value, onChange, options, style }) {
  const [open, setOpen] = useState(false);
  const ref = React.useRef();

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find(opt => opt.value === value);

  return (
    <div ref={ref} style={{ position: 'relative', minWidth: 180, width: 180, ...style }}>
      <button
        type="button"
        className="select-box__toggle-btn"
        style={{
          height: 48,
          padding: '0 22px',
          borderRadius: 8,
          background: 'var(--form-bg)',
          color: 'var(--text-color)',
          border: '1.5px solid var(--border-color)',
          fontWeight: 500,
          fontSize: 16,
          minWidth: 180,
          width: 180,
          textAlign: 'left',
          transition: 'background 0.2s, color 0.2s, border 0.18s, box-shadow 0.18s',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          boxSizing: 'border-box',
          boxShadow: 'none'
        }}
        onClick={() => setOpen(v => !v)}
      >
        <FontAwesomeIcon icon={selected?.icon || faFilter} style={{ color: 'var(--text-color)' }} />
        <span className="select-box-option__slot-item">
          <span className="select-box-option__content">
            {selected?.label}
          </span>
        </span>
        <svg width="18" height="18" viewBox="0 0 20 20" style={{ marginLeft: 'auto', transition: 'transform 0.18s', transform: open ? 'rotate(180deg)' : 'none' }}>
          <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="2" fill="none"/>
        </svg>
      </button>
      <ul
        className={`dropdown-anim${open ? ' dropdown-anim-open' : ''}`}
        style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          minWidth: 180,
          width: 180,
          maxHeight: 260,
          overflowY: 'auto',
          background: 'var(--form-bg)',
          border: '1.5px solid var(--border-color)',
          borderRadius: 8,
          margin: 0,
          padding: '6px 0',
          boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
          zIndex: 1000,
          listStyle: 'none'
        }}
      >
        {options.map(opt => (
          <li
            key={opt.value}
            style={{
              padding: '8px 18px',
              cursor: 'pointer',
              color: 'var(--text-color)',
              fontSize: 15,
              transition: 'background 0.18s',
              background: value === opt.value ? 'var(--teach-active-bg)' : 'transparent'
            }}
            onClick={() => { onChange(opt.value); setOpen(false); }}
          >
            <FontAwesomeIcon icon={opt.icon || faFilter} style={{ marginRight: 8, color: 'var(--text-color)' }} />
            {opt.label}
          </li>
        ))}
      </ul>
      <style>{`
        .dropdown-anim {
          opacity: 0;
          transform: translateY(-8px) scale(0.98);
          pointer-events: none;
          transition: opacity 0.22s cubic-bezier(.4,0,.2,1), transform 0.22s cubic-bezier(.4,0,.2,1);
        }
        .dropdown-anim-open {
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: auto;
        }
      `}</style>
    </div>
  );
}

const Notifications = () => {
  const { t, currentLanguage } = useLanguage();
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('user');

  const [statusFilter, setStatusFilter] = useState('unread');
  const [sortOrder, setSortOrder] = useState('newest');

  const statusOptions = [
    { value: 'unread', label: t('notifications.unread'), icon: faBell },
    { value: 'read', label: t('notifications.read'), icon: faBell },
    { value: 'all', label: t('notifications.all_status'), icon: faBell }
  ];

  const sortOptions = [
    { value: 'newest', label: t('notifications.newest_first'), icon: faSort },
    { value: 'oldest', label: t('notifications.oldest_first'), icon: faSort }
  ];

  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    setIsAuthenticated(!!token);
    
    if (token) {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      setUserRole(decoded.role || 'user');
      loadNotifications();
    } else {
      setLoading(false);
    }
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        setError(t('notifications.user_not_authorized'));
        return;
      }

      const decoded = JSON.parse(atob(token.split('.')[1]));
      if (!decoded || !decoded.id) {
        setError(t('notifications.invalid_auth_token'));
        return;
      }

      const response = await axios.get(`/notifications/user/${decoded.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setNotifications(response.data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
      if (error.response?.status === 403) {
        setError(t('notifications.access_denied'));
      } else if (error.response?.status === 404) {
        setError(t('notifications.notifications_not_found'));
      } else {
        setError(t('notifications.load_error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('jwtToken');
      await axios.put(`/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, read: true }
            : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return faCheckCircle;
      case 'warning':
        return faExclamationTriangle;
      case 'error':
        return faTimes;
      default:
        return faInfoCircle;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'success':
        return '#28a745';
      case 'warning':
        return '#ffc107';
      case 'error':
        return '#dc3545';
      default:
        return '#17a2b8';
    }
  };

  const filteredNotifications = React.useMemo(() => {
    return notifications.filter(notification => {
      if (statusFilter === 'unread' && notification.read) return false;
      if (statusFilter === 'read' && !notification.read) return false;
      
      return true;
    }).sort((a, b) => {
      if (sortOrder === 'newest') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
    });
  }, [notifications, statusFilter, sortOrder]);

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: theme === 'dark' ? '#1a1a1a' : '#f8f9fa',
        color: theme === 'dark' ? '#ffffff' : '#333333',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <NavBar />
        <div style={{ 
          flex: 1,
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          fontSize: '18px'
        }}>
          {t('notifications.loading')}
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
        color: theme === 'dark' ? '#ffffff' : '#333333',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <NavBar />
        <div style={{ 
          flex: 1,
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
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
        color: theme === 'dark' ? '#ffffff' : '#333333',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <NavBar />
        
        <div style={{ 
          flex: 1,
          maxWidth: '800px', 
          margin: '0 auto', 
          padding: '40px 20px'
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
              {t('notifications.title')}
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
              icon={faBell} 
              style={{ 
                fontSize: '3rem', 
                color: '#4485ed', 
                marginBottom: '20px' 
              }} 
            />
            <h3 style={{ 
              fontSize: '1.3rem', 
              fontWeight: '600', 
              marginBottom: '10px',
              color: theme === 'dark' ? '#ffffff' : '#333333'
            }}>
              {t('notifications.login_to_receive')}
            </h3>
            <p style={{ 
              color: theme === 'dark' ? '#cccccc' : '#666666',
              marginBottom: '30px'
            }}>
              {t('notifications.login_description')}
            </p>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: '15px',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => window.location.href = '/login'}
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
                {t('notifications.login')}
              </button>
              <button
                onClick={() => window.location.href = '/register'}
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
                {t('notifications.register')}
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
      color: theme === 'dark' ? '#ffffff' : '#333333',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <NavBar />
      
      <div style={{ 
        flex: 1,
        width: '100%', 
        maxWidth: '900px', 
        margin: '32px auto 0px', 
        background: 'var(--form-bg)', 
        borderRadius: '16px', 
        boxShadow: 'rgba(0, 0, 0, 0.07) 0px 2px 8px', 
        padding: '32px 24px 24px', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center'
      }}>
        <header className="marco-layout__header" style={{ width: '100%', textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontWeight: 700, fontSize: 32, margin: 0, color: 'var(--text-color)', transition: 'color 0.22s' }}>
            {t('notifications.title')}
          </h1>
        </header>
        
        <div className="notifications__filters" style={{ display: 'flex', gap: 16, flexWrap: 'nowrap', justifyContent: 'center', width: '100%' }}>
          <AnimatedSelectBox 
            value={statusFilter} 
            onChange={setStatusFilter} 
            options={statusOptions} 
          />
          <AnimatedSelectBox 
            value={sortOrder} 
            onChange={setSortOrder} 
            options={sortOptions} 
          />
        </div>

        {/* Список уведомлений */}
        <div style={{ width: '100%', marginTop: '32px' }}>
          {filteredNotifications.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 20px',
              background: theme === 'dark' ? '#2d2d2d' : '#ffffff',
              borderRadius: '12px',
              border: `1px solid ${theme === 'dark' ? '#404040' : '#e9ecef'}`
            }}>
              <h3 style={{ 
                fontSize: '1.3rem', 
                fontWeight: '600', 
                marginBottom: '10px',
                color: theme === 'dark' ? '#ffffff' : '#333333'
              }}>
                {t('notifications.no_notifications')}
              </h3>
              <p style={{ 
                color: theme === 'dark' ? '#cccccc' : '#666666'
              }}>
                {t('notifications.no_notifications_desc')}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {filteredNotifications.map((notification) => (
                <TranslatedNotificationItem 
                  key={notification.id}
                  notification={notification}
                  theme={theme}
                  currentLanguage={currentLanguage}
                  onMarkAsRead={markAsRead}
                  t={t}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Notifications; 