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
      toast.error('Failed to load enrollments');
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

      toast.success(`Enrollment ${approved ? 'approved' : 'rejected'} successfully`);
      
      // Reload enrollments to get updated data
      await loadEnrollments();
    } catch (error) {
      console.error('Error updating enrollment:', error);
      
      // Provide more specific error messages
      if (error.response?.status === 403) {
        toast.error('Access denied. Admin privileges required to approve/reject enrollments.');
      } else if (error.response?.status === 401) {
        toast.error('Authentication required. Please log in again.');
      } else {
        toast.error(`Failed to ${approved ? 'approve' : 'reject'} enrollment: ${error.response?.data || error.message}`);
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
      return 'Pending';
    }
    return approved ? 'Approved' : 'Rejected';
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
          <p>Loading enrollments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="enrollment-list-container">
      <div className="enrollment-header">
        <h1>Enrollment Management</h1>
        <div className="enrollment-controls">
          <div className="filter-controls">
            <button 
              className={`filter-btn ${!showPendingOnly ? 'active' : ''}`}
              onClick={() => setShowPendingOnly(false)}
            >
              <FontAwesomeIcon icon={faEye} /> All Enrollments
            </button>
            <button 
              className={`filter-btn ${showPendingOnly ? 'active' : ''}`}
              onClick={() => setShowPendingOnly(true)}
            >
              <FontAwesomeIcon icon={faClock} /> Pending Only
            </button>
          </div>
          
          {!showPendingOnly && (
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="status-filter"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          )}
        </div>
      </div>

      <div className="enrollment-stats">
        <div className="stat-card">
          <div className="stat-number">{enrollments.length}</div>
          <div className="stat-label">Total Enrollments</div>
        </div>
        <div className="stat-card">
          <div className="stat-number pending">{pendingEnrollments.length}</div>
          <div className="stat-label">Pending Approval</div>
        </div>
        <div className="stat-card">
          <div className="stat-number approved">
            {enrollments.filter(e => e.approved === true).length}
          </div>
          <div className="stat-label">Approved</div>
        </div>
        <div className="stat-card">
          <div className="stat-number rejected">
            {enrollments.filter(e => e.approved === false).length}
          </div>
          <div className="stat-label">Rejected</div>
        </div>
      </div>

      <div className="enrollments-table">
        {filteredEnrollments.length === 0 ? (
          <div className="no-enrollments">
            <FontAwesomeIcon icon={faBook} size="3x" />
            <p>No enrollments found</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Course</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEnrollments.map((enrollment) => (
                <tr key={enrollment.id} className={getStatusClass(enrollment.approved)}>
                  <td className="student-info">
                    <FontAwesomeIcon icon={faUser} />
                    <div>
                      <div className="student-name">
                        {enrollment.User?.username || enrollment.User?.email || 'Unknown User'}
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
                        {enrollment.Course?.name || 'Unknown Course'}
                      </div>
                      <div className="course-status">
                        Course Status: {enrollment.Course?.status || 'Unknown'}
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
                          Approve
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
                          Reject
                        </button>
                        </>
                        ) : (
                          <span className="status-text">
                            Pending (Admin approval required)
                          </span>
                        )
                    ) : (
                      <span className="status-text">
                        {enrollment.approved ? 'Approved' : 'Rejected'}
                      </span>
                    )}
                      {enrollment.User?.id && (
                        <button
                          className="edit-student-btn"
                          onClick={() => handleEditStudent(enrollment.User.id)}
                          title="Изменить данные студента"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                          Изменить данные студента
                        </button>
                      )}
                      {enrollment.Course?.id && (
                        <button
                          className="edit-course-btn"
                          onClick={() => handleEditCourse(enrollment.Course.id)}
                          title="Изменить курс"
                        >
                          <FontAwesomeIcon icon={faCog} />
                          Изменить курс
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