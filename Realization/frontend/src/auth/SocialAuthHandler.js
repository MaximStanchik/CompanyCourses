import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
import jwt_decode from 'jwt-decode';
import setAuthToken from '../utils/setAuthToken';
import { setCurrentUser } from '../actions/authActions';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const SocialAuthHandler = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  const query = useQuery();

  useEffect(() => {
    const token = query.get('token');
    if (token) {
      localStorage.setItem('jwtToken', token);
      setAuthToken(token);
      const decoded = jwt_decode(token);
      dispatch(setCurrentUser(decoded));
      // redirect depending on role
      const role = decoded.roles ? decoded.roles[0] : decoded.role;
      if (role === 'ADMIN') {
        history.replace('/services');
      } else {
        history.replace('/my-training');
      }
    } else {
      history.replace('/login');
    }
  }, [dispatch, history, query]);

  return <div>Authenticating...</div>;
};

export default SocialAuthHandler; 