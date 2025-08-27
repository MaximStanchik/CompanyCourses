import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import { FontAwesomeIcon as FA } from '@fortawesome/react-fontawesome';
import { faTimes as faXmark, faEnvelope, faMapMarkerAlt, faFlag, faBuilding, faBriefcase, faIdBadge, faBullseye, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import UserProfileModal from './UserProfileModal';
import { 
  faStar,
  faUser, 
  faCalendarAlt,
  faThumbsUp,
  faThumbsDown,
  faEye
} from '@fortawesome/free-solid-svg-icons';
import axios from '../utils/axios';
import useTheme from '../hooks/useTheme';

const CourseComments = ({ courseId, onRatingChange, currentUserRating }) => {
  const { t, i18n, currentLanguage } = useLanguage();
  const { theme } = useTheme();
  const history = useHistory();
  
  // Force re-render when language changes
  const key = `comments-${currentLanguage}`;
  
  // Add effect to force re-render when language changes
  useEffect(() => {
    // Force re-render when language changes
    console.log('CourseComments: Language changed to', currentLanguage);
  }, [currentLanguage]);
  
  // Listen for language change events
  useEffect(() => {
    const handleLanguageChange = (e) => {
      console.log('CourseComments: Language change event received:', e.detail);
      // Force re-render by updating a state
      setComments(prev => [...prev]);
    };
    
    const handleI18nLanguageChange = (lng) => {
      console.log('CourseComments: i18n language changed to:', lng);
      // Force re-render by updating a state
      setComments(prev => [...prev]);
    };
    
    window.addEventListener('languageChanged', handleLanguageChange);
    i18n.on('languageChanged', handleI18nLanguageChange);
    
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange);
      i18n.off('languageChanged', handleI18nLanguageChange);
    };
  }, [i18n]);
  
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reactionLoading, setReactionLoading] = useState({});
  const [myReactions, setMyReactions] = useState({}); // commentId -> 'like' | 'dislike' | undefined
  const [profileModalUser, setProfileModalUser] = useState(null);
  const [profileModalProfile, setProfileModalProfile] = useState(null);

  useEffect(() => {
    loadComments();
  }, [courseId]);

  // Update comments when user rating changes
  useEffect(() => {
    if (currentUserRating > 0) {
      // Refresh comments to show updated rating
      loadComments();
    }
  }, [currentUserRating]);

  const loadComments = async (opts = {}) => {
    const silent = !!opts.silent;
    try {
      if (!silent) setLoading(true);
      const token = localStorage.getItem('jwtToken');
      const response = await axios.get(`/course-comment/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const list = response.data.comments || [];
      setComments(list);
      // init myReactions from payload
      const map = {};
      list.forEach(c => { if (c.myReaction) map[c.id] = c.myReaction; });
      setMyReactions(map);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleLike = async (commentId, isLike) => {
    try {
      setReactionLoading(prev => ({ ...prev, [commentId]: true }));
      const token = localStorage.getItem('jwtToken');
      // Оптимистично обновим UI c учётом взаимоисключаемости
      setComments(prev => prev.map(c => {
        if (c.id !== commentId) return c;
        const current = myReactions[commentId];
        let likes = c.likes || 0;
        let dislikes = c.dislikes || 0;
        const target = isLike ? 'like' : 'dislike';
        if (current === target) {
          // отмена текущей реакции
          if (isLike && likes > 0) likes -= 1;
          if (!isLike && dislikes > 0) dislikes -= 1;
          setMyReactions(m => ({ ...m, [commentId]: undefined }));
        } else {
          // смена реакции: убрать противоположную, добавить текущую
          if (current === 'like' && likes > 0) likes -= 1;
          if (current === 'dislike' && dislikes > 0) dislikes -= 1;
          if (isLike) likes += 1; else dislikes += 1;
          setMyReactions(m => ({ ...m, [commentId]: target }));
        }
        return { ...c, likes, dislikes };
      }));
      
      await axios.post(`/api/reactions/comment-reaction`, {
        commentId: commentId,
        reactionType: isLike ? 'like' : 'dislike'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Подтянуть фактические значения с сервера (без лоадера, чтобы не дёргалась верстка)
      await loadComments({ silent: true });
    } catch (error) {
      console.error('Error adding reaction:', error);
    } finally {
      setReactionLoading(prev => ({ ...prev, [commentId]: false }));
    }
  };



  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setSubmitting(true);
      const token = localStorage.getItem('jwtToken');
      const decoded = JSON.parse(atob(token.split('.')[1]));

      await axios.post(`/course-comment`, {
        courseId: courseId,
        content: newComment
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setNewComment('');
      await loadComments();
      
      // Уведомляем родительский компонент об изменении
      if (onRatingChange) {
        onRatingChange();
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setSubmitting(false);
    }
  };



  const handleViewProfile = async (userId) => {
    try {
      const token = localStorage.getItem('jwtToken');
      const res = await axios.get(`/profile/user/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
      const payload = res.data || {};
      setProfileModalUser({ id: userId, username: payload.user?.username || payload.user?.email || 'User', email: payload.user?.email });
      setProfileModalProfile(payload.profile || payload || {});
    } catch {
      setProfileModalUser({ id: userId, username: 'User' });
      setProfileModalProfile({});
    }
  };

  const ProfileModalWrapper = () => (
    <UserProfileModal
      open={!!profileModalUser}
      onClose={() => setProfileModalUser(null)}
      user={profileModalUser}
      profile={profileModalProfile}
      dark={theme === 'dark'}
    />
  );

  const renderStars = (rating) => {
    console.log('Rendering stars for rating:', rating);
    return Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1;
      const isFilled = starValue <= rating;
      console.log(`Star ${starValue}: isFilled = ${isFilled}, rating = ${rating}`);
      
      return (
        <FA
          key={index}
          icon={faStar}
          style={{
            color: isFilled ? '#ffc107' : '#e4e5e9',
            fontSize: '0.85rem',
            marginRight: 2,
            flexShrink: 0
          }}
        />
      );
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(currentLanguage === 'ru' ? 'ru-RU' : 
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
    });
  };



  if (loading) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '40px 20px',
        color: theme === 'dark' ? '#ffffff' : '#333333'
      }}>
        {t('comments.loading')}
      </div>
    );
  }

  return (
    <div key={key} style={{ 
      background: theme === 'dark' ? '#2d2d2d' : '#ffffff',
      borderRadius: '12px',
      border: `1px solid ${theme === 'dark' ? '#404040' : '#e9ecef'}`,
      overflow: 'hidden'
    }}>
      <ProfileModalWrapper />




              {/* {t('comments.add_comment')} */}
      <div style={{ 
        padding: '24px'
      }}>
        <h3 style={{ 
          fontSize: '1.3rem',
          fontWeight: '600',
          marginBottom: '20px',
          color: theme === 'dark' ? '#ffffff' : '#333333'
        }}>
          {t('comments.add_comment')}
        </h3>
        
        {/* Display current user rating */}
        {currentUserRating > 0 && (
          <div style={{
            marginBottom: '20px',
            padding: '16px',
            background: theme === 'dark' ? '#1a1a1a' : '#f8f9fa',
            borderRadius: '8px',
            border: `1px solid ${theme === 'dark' ? '#404040' : '#e9ecef'}`
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '8px'
            }}>
              <span style={{
                fontSize: '14px',
                fontWeight: '500',
                color: theme === 'dark' ? '#cccccc' : '#666666'
              }}>
                {t('comments.your_course_rating')}:
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {renderStars(currentUserRating)}
                <span style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: theme === 'dark' ? '#ffffff' : '#333333'
                }}>
                  {currentUserRating}/5
                </span>
              </div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmitComment}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block',
              marginBottom: '8px',
              color: theme === 'dark' ? '#ffffff' : '#333333',
              fontWeight: '500'
            }}>
              {t('comments.your_comment')}:
            </label>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={t('comments.comment_placeholder')}
              style={{
                width: '100%',
                minHeight: '100px',
                padding: '12px',
                border: `1px solid ${theme === 'dark' ? '#404040' : '#e9ecef'}`,
                borderRadius: '8px',
                background: theme === 'dark' ? '#1a1a1a' : '#ffffff',
                color: theme === 'dark' ? '#ffffff' : '#333333',
                fontSize: '14px',
                resize: 'vertical'
              }}
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !newComment.trim()}
            style={{
              padding: '12px 24px',
              background: submitting || !newComment.trim() ? '#6c757d' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: submitting || !newComment.trim() ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s'
            }}
          >
            {submitting ? t('comments.submitting') : t('comments.submit_comment')}
          </button>
        </form>
      </div>

              {/* {t('comments.all_comments')} */}
      <div style={{ padding: '24px' }}>
        <h3 style={{ 
          fontSize: '1.3rem',
          fontWeight: '600',
          marginBottom: '20px',
          color: theme === 'dark' ? '#ffffff' : '#333333'
        }}>
          {t('comments.all_comments')} ({comments.length})
        </h3>

        {comments.length === 0 ? (
          <div style={{ 
            textAlign: 'center',
            padding: '40px 20px',
            color: theme === 'dark' ? '#cccccc' : '#666666'
          }}>
            {t('comments.no_comments')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {comments.map((comment) => (
              <div
                key={comment.id}
                style={{
                  padding: '20px',
                  background: theme === 'dark' ? '#1a1a1a' : '#f8f9fa',
                  borderRadius: '8px',
                  border: `1px solid ${theme === 'dark' ? '#404040' : '#e9ecef'}`
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  marginBottom: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '50%', 
                      background: 'var(--accent-color, #4485ed)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '16px'
                    }}>
                      {(comment.user?.username || comment.user?.email || 'A').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ 
                        fontWeight: '600',
                        color: theme === 'dark' ? '#ffffff' : '#333333',
                        fontSize: '16px'
                      }}>
                        {comment.user?.username || comment.user?.email || t('comments.anonymous')}
                      </div>
                      {/* Показать рейтинг пользователя под именем */}
                      {comment.rating ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            {renderStars(comment.rating)}
                          </div>
                          <span style={{ fontSize: '0.85rem', color: theme === 'dark' ? '#cccccc' : '#666666' }}>{comment.rating}/5</span>
                        </div>
                      ) : null}
                      {comment.user?.id && (
                        <button
                          onClick={() => handleViewProfile(comment.user.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--accent-color, #4485ed)',
                            cursor: 'pointer',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 0',
                            textDecoration: 'underline'
                          }}
                          onMouseOver={(e) => e.target.style.opacity = '0.7'}
                          onMouseOut={(e) => e.target.style.opacity = '1'}
                        >
                          <FA icon={faEye} size="xs" />
                          {t('comments.view_profile')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                {/* Рейтинг уже показан под именем; место под дополнительные метки при необходимости */}
                <p style={{ 
                  color: theme === 'dark' ? '#cccccc' : '#333333',
                  lineHeight: '1.6',
                  marginBottom: '12px'
                }}>
                  {comment.content}
                </p>

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  fontSize: '0.85rem',
                  color: theme === 'dark' ? '#999999' : '#888888'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <FA icon={faCalendarAlt} />
                    {formatDate(comment.createdAt)}
                  </span>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button
                      onClick={() => handleLike(comment.id, true)}
                      disabled={reactionLoading[comment.id]}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: myReactions[comment.id] === 'like' ? '#28a745' : (theme === 'dark' ? '#cccccc' : '#666666'),
                        cursor: reactionLoading[comment.id] ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '0.85rem',
                        opacity: reactionLoading[comment.id] ? 0.6 : 1,
                        transition: 'opacity 0.2s'
                      }}
                    >
                      <FA icon={faThumbsUp} />
                      {comment.likes || 0}
                    </button>
                    <button
                      onClick={() => handleLike(comment.id, false)}
                      disabled={reactionLoading[comment.id]}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: myReactions[comment.id] === 'dislike' ? '#dc3545' : (theme === 'dark' ? '#cccccc' : '#666666'),
                        cursor: reactionLoading[comment.id] ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '0.85rem',
                        opacity: reactionLoading[comment.id] ? 0.6 : 1,
                        transition: 'opacity 0.2s'
                      }}
                    >
                      <FA icon={faThumbsDown} />
                      {comment.dislikes || 0}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseComments; 