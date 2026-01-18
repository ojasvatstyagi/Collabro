import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // This mostly shouldn't be hit because AppContent handles initial loading,
    // but good for safety if used elsewhere.
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    // Redirect to login page, but save the intended location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
