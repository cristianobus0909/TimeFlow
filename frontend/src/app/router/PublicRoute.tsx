import { Navigate, Outlet } from 'react-router-dom';
import { authStore } from '@/store/authStore';

export const PublicRoute = () => {
  const { isAuthenticated } = authStore();
  
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />;
};
