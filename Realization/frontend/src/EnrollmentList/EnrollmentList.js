import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from '../utils/axios';
import { toast } from 'react-toastify';
import { isAdmin } from '../utils/userRole';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCheck, 
  faTimes, 
  faClock, 
  faUser, 
  faBook, 
  faSpinner,
  faEye,
  faEyeSlash,
  faEdit,
  faUserPlus,
  faCog
} from '@fortawesome/free-solid-svg-icons';
import './EnrollmentList.css';

const EnrollmentList = () => {
  const { t } = useTranslation();
  const [enrollments, setEnrollments] = useState([]);
  const [pendingEnrollments, setPendingEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState({});
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'approved', 'rejected'
  const [showPendingOnly, setShowPendingOnly] = useState(false);

  useEffect(() => {
    loadEnrollments();
  }, []);

  const loadEnrollments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('jwtToken');
      
      // Load all enrollments
      const allEnrollmentsResponse = await axios.get('/enrollments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Load pending enrollments
      const pendingResponse = await axios.get('/enrollment/pending', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setEnrollments(allEnrollmentsResponse.data || []);
      setPendingEnrollments(pendingResponse.data || []);
    } catch (error) {
      console.error('Error loading enrollments:', error);
      toast.error(t('enrollment.failed_to_load_enrollments'));
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (enrollmentId, approved) => {
    try {
      setApproving(prev => ({ ...prev, [enrollmentId]: true }));
      
      const token = localStorage.getItem('jwtToken');
      await axios.put(`/enrollment/${enrollmentId}/approve`, 
        { approved }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(approved ? t('enrollment.enrollment_approved') : t('enrollment.enrollment_rejected'));
      
      // Reload enrollments to get updated data
      await loadEnrollments();
    } catch (error) {
      console.error('Error updating enrollment:', error);
      
      // Provide more specific error messages
      if (error.response?.status === 403) {
        toast.error(t('enrollment.access_denied'));
      } else if (error.response?.status === 401) {
        toast.error(t('enrollment.authentication_required'));
      } else {
        toast.error(approved ? t('enrollment.failed_to_approve') : t('enrollment.failed_to_reject'));
      }
    } finally {
      setApproving(prev => ({ ...prev, [enrollmentId]: false }));
    }
  };

  const handleEditStudent = (userId) => {
    // Используем единый способ навигации через URL параметры
    window.location.href = `/users?editUserId=${userId}&openEditModal=true`;
  };

  const handleEditCourse = (courseId) => {
    // Переход на страницу редактирования курса
    window.location.href = `/editcourse/${courseId}`;
  };

  const getStatusIcon = (approved) => {
    if (approved === null || approved === undefined) {
      return <FontAwesomeIcon icon={faClock} className="status-icon pending" />;
    }
    return approved ? 
      <FontAwesomeIcon icon={faCheck} className="status-icon approved" /> : 
      <FontAwesomeIcon icon={faTimes} className="status-icon rejected" />;
  };

  const getStatusText = (approved) => {
    if (approved === null || approved === undefined) {
      return t('enrollment.pending');
    }
    return approved ? t('enrollment.approved') : t('enrollment.rejected');
  };

  const getStatusClass = (approved) => {
    if (approved === null || approved === undefined) {
      return 'status-pending';
    }
    return approved ? 'status-approved' : 'status-rejected';
  };

  const filteredEnrollments = showPendingOnly ? 
    pendingEnrollments : 
    enrollments.filter(enrollment => {
      if (filter === 'all') return true;
      if (filter === 'pending') return !enrollment.approved;
      if (filter === 'approved') return enrollment.approved === true;
      if (filter === 'rejected') return enrollment.approved === false;
      return true;
    });

  if (loading) {
    return (
      <div className="enrollment-list-container">
        <div className="loading-spinner">
          <FontAwesomeIcon icon={faSpinner} spin size="2x" />
          <p>{t('enrollment.loading_enrollments')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="enrollment-list-container">
      <div className="enrollment-header">
        <h1>{t('enrollment.management')}</h1>
        <div className="enrollment-controls">
          <div className="filter-controls">
            <button 
              className={`filter-btn ${!showPendingOnly ? 'active' : ''}`}
              onClick={() => setShowPendingOnly(false)}
            >
              <FontAwesomeIcon icon={faEye} /> {t('enrollment.all_enrollments')}
            </button>
            <button 
              className={`filter-btn ${showPendingOnly ? 'active' : ''}`}
              onClick={() => setShowPendingOnly(true)}
            >
              <FontAwesomeIcon icon={faClock} /> {t('enrollment.pending_only')}
            </button>
          </div>
          
          {!showPendingOnly && (
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="status-filter"
            >
              <option value="all">{t('enrollment.all_statuses')}</option>
              <option value="pending">{t('enrollment.pending')}</option>
              <option value="approved">{t('enrollment.approved')}</option>
              <option value="rejected">{t('enrollment.rejected')}</option>
            </select>
          )}
        </div>
      </div>

      <div className="enrollment-stats">
        <div className="stat-card">
          <div className="stat-number">{enrollments.length}</div>
          <div className="stat-label">{t('enrollment.total_enrollments')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-number pending">{pendingEnrollments.length}</div>
          <div className="stat-label">{t('enrollment.pending_approval')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-number approved">
            {enrollments.filter(e => e.approved === true).length}
          </div>
          <div className="stat-label">{t('enrollment.approved')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-number rejected">
            {enrollments.filter(e => e.approved === false).length}
          </div>
          <div className="stat-label">{t('enrollment.rejected')}</div>
        </div>
      </div>

      <div className="enrollments-table">
        {filteredEnrollments.length === 0 ? (
          <div className="no-enrollments">
            <FontAwesomeIcon icon={faBook} size="3x" />
            <p>{t('enrollment.no_enrollments_found')}</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>{t('enrollment.student')}</th>
                <th>{t('enrollment.course')}</th>
                <th>{t('enrollment.status')}</th>
                <th>{t('enrollment.date')}</th>
                <th>{t('enrollment.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredEnrollments.map((enrollment) => (
                <tr key={enrollment.id} className={getStatusClass(enrollment.approved)}>
                  <td className="student-info">
                    <FontAwesomeIcon icon={faUser} />
                    <div>
                      <div className="student-name">
                        {enrollment.User?.username || enrollment.User?.email || t('enrollment.unknown_user')}
                      </div>
                      <div className="student-email">
                        {enrollment.User?.email}
                      </div>
                    </div>
                  </td>
                  <td className="course-info">
                    <FontAwesomeIcon icon={faBook} />
                    <div>
                      <div className="course-name">
                        {enrollment.Course?.name || t('enrollment.unknown_course')}
                      </div>
                      <div className="course-status">
                        {t('enrollment.course_status')}: {enrollment.Course?.status || t('enrollment.unknown')}
                      </div>
                    </div>
                  </td>
                  <td className="status-cell">
                    <div className="status-indicator">
                      {getStatusIcon(enrollment.approved)}
                      <span className={getStatusClass(enrollment.approved)}>
                        {getStatusText(enrollment.approved)}
                      </span>
                    </div>
                  </td>
                  <td className="date-cell">
                    {/* Поскольку createdAt не существует в модели, показываем N/A */}
                    N/A
                  </td>
                  <td className="actions-cell">
                    <div className="action-buttons">
                    {enrollment.approved === null || enrollment.approved === undefined ? (
                        isAdmin() ? (
                        <>
                        <button
                          className="approve-btn"
                          onClick={() => handleApproval(enrollment.id, true)}
                          disabled={approving[enrollment.id]}
                        >
                          {approving[enrollment.id] ? (
                            <FontAwesomeIcon icon={faSpinner} spin />
                          ) : (
                            <FontAwesomeIcon icon={faCheck} />
                          )}
                          {t('enrollment.approve')}
                        </button>
                        <button
                          className="reject-btn"
                          onClick={() => handleApproval(enrollment.id, false)}
                          disabled={approving[enrollment.id]}
                        >
                          {approving[enrollment.id] ? (
                            <FontAwesomeIcon icon={faSpinner} spin />
                          ) : (
                            <FontAwesomeIcon icon={faTimes} />
                          )}
                          {t('enrollment.reject')}
                        </button>
                        </>
                        ) : (
                          <span className="status-text">
                            {t('enrollment.pending_admin_approval')}
                          </span>
                        )
                    ) : (
                      <span className="status-text">
                        {enrollment.approved ? t('enrollment.approved') : t('enrollment.rejected')}
                      </span>
                    )}
                      {enrollment.User?.id && (
                        <button
                          className="edit-student-btn"
                          onClick={() => handleEditStudent(enrollment.User.id)}
                          title={t('enrollment.edit_student_data')}
                        >
                          <FontAwesomeIcon icon={faEdit} />
                          {t('enrollment.edit_student_data')}
                        </button>
                      )}
                      {enrollment.Course?.id && (
                        <button
                          className="edit-course-btn"
                          onClick={() => handleEditCourse(enrollment.Course.id)}
                          title={t('enrollment.edit_course_data')}
                        >
                          <FontAwesomeIcon icon={faCog} />
                          {t('enrollment.edit_course_data')}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default EnrollmentList; 