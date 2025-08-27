import React, { useState } from 'react';
import axios from '../utils/axios';
import { toast } from 'react-toastify';
import useTheme from '../hooks/useTheme';
import { isAdmin } from '../utils/userRole';

const AdminCleanup = ({ courseId }) => {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [cleanupResult, setCleanupResult] = useState(null);

  const handleCleanup = async () => {
    if (!isAdmin()) {
      toast.error('Требуются права администратора');
      return;
    }

    setIsLoading(true);
    setCleanupResult(null);

    try {
      const token = localStorage.getItem('jwtToken');
      const response = await axios.delete(`/course/${courseId}/cleanup-duplicates`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setCleanupResult(response.data);
      toast.success(`Очистка завершена! Удалено ${response.data.totalDeleted} дублирующих записей`);
    } catch (error) {
      console.error('Error during cleanup:', error);
      toast.error(`Ошибка при очистке: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAdmin()) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 9997,
      background: theme === 'dark' ? '#2d2d2d' : '#ffffff',
      border: `1px solid ${theme === 'dark' ? '#404040' : '#e9ecef'}`,
      borderRadius: '8px',
      padding: '15px',
      fontSize: '12px',
      color: theme === 'dark' ? '#ffffff' : '#333333',
      minWidth: '250px'
    }}>
      <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#dc3545' }}>
        Admin Cleanup
      </h4>
      
      <p style={{ margin: '0 0 10px 0', fontSize: '11px' }}>
        Удаляет дублирующие записи в БД для курса {courseId}
      </p>
      
      <button
        onClick={handleCleanup}
        disabled={isLoading}
        style={{
          padding: '8px 16px',
          background: isLoading ? '#6c757d' : '#dc3545',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          fontSize: '11px',
          width: '100%'
        }}
      >
        {isLoading ? 'Очистка...' : 'Очистить дубликаты'}
      </button>
      
      {cleanupResult && (
        <div style={{ marginTop: '10px', fontSize: '11px' }}>
          <div><strong>Результат:</strong></div>
          <div>Удалено завершений шагов: {cleanupResult.deletedStepCompletions}</div>
          <div>Удалено завершений уроков: {cleanupResult.deletedLessonCompletions}</div>
          <div><strong>Всего удалено: {cleanupResult.totalDeleted}</strong></div>
        </div>
      )}
    </div>
  );
};

export default AdminCleanup; 