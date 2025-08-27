import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarRegular } from '@fortawesome/free-regular-svg-icons';
import axios from '../utils/axios';
import { toast } from 'react-toastify';
import useTheme from '../hooks/useTheme';
import { useTranslation } from 'react-i18next';

const CourseRating = ({ courseId, onRatingChange }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRatingStats();
    loadUserRating();
  }, [courseId]);

  const loadRatingStats = async () => {
    try {
      const response = await axios.get(`/course-rating/${courseId}/stats`);
      setAverageRating(response.data.averageRating);
      setTotalRatings(response.data.totalRatings);
    } catch (error) {
      console.error('Error loading rating stats:', error);
    }
  };

  const loadUserRating = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      if (!token) return;

      const response = await axios.get(`/course-rating/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserRating(response.data.rating || 0);
    } catch (error) {
      console.error('Error loading user rating:', error);
    }
  };

  const handleRatingClick = async (rating) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        // Пользователь не авторизован
        return;
      }

      await axios.post('/course-rating', {
        courseId: courseId,
        rating: rating
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUserRating(rating);
      await loadRatingStats();
              // Оценка успешно отправлена
      
      if (onRatingChange) {
        onRatingChange(rating);
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
              if (error.response?.status === 403) {
            // Пользователь не записан на курс
        } else {
            // Ошибка при отправке оценки
        }
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating, interactive = false) => {
    return Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1;
      const isFilled = starValue <= rating;
      const isHovered = interactive && starValue <= hoverRating;
      
      return (
        <FontAwesomeIcon
          key={index}
          icon={isFilled || isHovered ? faStar : faStarRegular}
          style={{
            color: isFilled || isHovered ? '#ffc107' : '#e4e5e9',
            fontSize: interactive ? '24px' : '18px',
            cursor: interactive ? 'pointer' : 'default',
            marginRight: '2px',
            transition: 'color 0.2s ease'
          }}
          onMouseEnter={() => interactive && setHoverRating(starValue)}
          onMouseLeave={() => interactive && setHoverRating(0)}
          onClick={() => interactive && handleRatingClick(starValue)}
        />
      );
    });
  };

  return (
    <div style={{
      padding: '20px',
      background: theme === 'dark' ? '#2d2d2d' : '#ffffff',
      borderRadius: '12px',
      border: `1px solid ${theme === 'dark' ? '#404040' : '#e9ecef'}`,
      marginBottom: '20px'
    }}>
      <h3 style={{
        marginBottom: '15px',
        color: theme === 'dark' ? '#ffffff' : '#333333',
        fontSize: '18px',
        fontWeight: '600'
      }}>
        {t('course.rate_this_course')}
      </h3>
      
      <div style={{ marginBottom: '15px' }}>
        <div style={{ marginBottom: '10px' }}>
          {renderStars(userRating, true)}
        </div>
        <div style={{
          fontSize: '14px',
          color: theme === 'dark' ? '#cccccc' : '#666666'
        }}>
          {userRating > 0 ? t('course.you_rated', { rating: userRating }) : t('course.click_to_rate')}
        </div>
      </div>

      <div style={{
        borderTop: `1px solid ${theme === 'dark' ? '#404040' : '#e9ecef'}`,
        paddingTop: '15px'
      }}>
        <div style={{ marginBottom: '10px' }}>
          {renderStars(averageRating, false)}
        </div>
        <div style={{
          fontSize: '14px',
          color: theme === 'dark' ? '#cccccc' : '#666666'
        }}>
          {averageRating > 0 ? (
            <>
              <strong>{averageRating.toFixed(1)}/5</strong>
              {totalRatings > 0 && (
                <span style={{ marginLeft: '10px' }}>
                  ({totalRatings} {t('course.rating', { count: totalRatings })})
                </span>
              )}
            </>
          ) : (
            t('course.no_ratings_yet')
          )}
        </div>
      </div>

      {loading && (
        <div style={{
          marginTop: '10px',
          fontSize: '14px',
          color: theme === 'dark' ? '#cccccc' : '#666666',
          fontStyle: 'italic'
        }}>
          {t('course.submitting_rating')}
        </div>
      )}
    </div>
  );
};

export default CourseRating; 