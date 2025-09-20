import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const doLogout = async () => {
      try {
        await api.post('/users/logout/', {}, { withCredentials: true }); // include cookies
      } catch (err) {
        console.error('Logout failed:', err);
        // Even if server fails, proceed to client-side cleanup
      } finally {
        // Clear any client-side auth state/storage
        localStorage.clear();
        sessionStorage.clear();
        navigate('/', { replace: true });
      }
    };
    doLogout();
  }, [navigate]);

  return <div />;
};

export default Logout;
  