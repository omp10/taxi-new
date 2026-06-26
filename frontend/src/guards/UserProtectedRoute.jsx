import React, { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { getLocalUserToken, clearLocalUserSession } from '../modules/user/services/authService';
import { UserHome } from '../routes/lazyPages';

export const UserProtectedRoute = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const token = getLocalUserToken();

  useEffect(() => {
    if (!token) {
      clearLocalUserSession();
      const loginPath = location.pathname.startsWith('/taxi/user')
        ? '/taxi/user/login'
        : '/login';
      navigate(loginPath, { replace: true });
    }
  }, [token, navigate, location.pathname]);

  if (!token) {
    return null;
  }

  return <Outlet />;
};

export const UserHomeRoute = ({ taxiPrefixed = false }) => {
  const navigate = useNavigate();
  const token = getLocalUserToken();

  useEffect(() => {
    if (!token) {
      clearLocalUserSession();
      navigate(taxiPrefixed ? '/taxi/user/login' : '/login', { replace: true });
    }
  }, [token, navigate, taxiPrefixed]);

  if (!token) {
    return null;
  }

  return <UserHome />;
};

export default UserProtectedRoute;
