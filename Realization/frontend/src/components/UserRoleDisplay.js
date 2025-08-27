import React from 'react';
import { getCurrentUserRole, isAdmin } from '../utils/userRole';

const UserRoleDisplay = () => {
  const userRole = getCurrentUserRole();
  const adminStatus = isAdmin();

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: '#f0f0f0', 
      padding: '10px', 
      borderRadius: '5px', 
      fontSize: '12px',
      zIndex: 1000,
      border: '1px solid #ccc'
    }}>
      <div><strong>Current Role:</strong> {userRole || 'None'}</div>
      <div><strong>Is Admin:</strong> {adminStatus ? 'Yes' : 'No'}</div>
    </div>
  );
};

export default UserRoleDisplay; 