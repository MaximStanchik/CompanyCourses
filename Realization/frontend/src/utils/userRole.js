import jwt_decode from 'jwt-decode';

export const getCurrentUserRole = () => {
  try {
    const token = localStorage.getItem('jwtToken');
    if (!token) return null;
    
    const decoded = jwt_decode(token);
    return decoded.roles ? decoded.roles[0] : decoded.role;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

export const isAdmin = () => {
  const role = getCurrentUserRole();
  return role === 'ADMIN';
};

export const isUser = () => {
  const role = getCurrentUserRole();
  return role === 'USER';
}; 