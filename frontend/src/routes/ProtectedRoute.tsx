import { Navigate, Outlet } from 'react-router-dom';
import { authStore } from '../store/authStore';

export const ProtectedRoute = () => {
  const { isAuthenticated } = authStore();
  
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};
