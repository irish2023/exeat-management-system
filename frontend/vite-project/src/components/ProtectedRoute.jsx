import { useAuth } from '../context/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * A wrapper component that protects routes from unauthorized access.
 * It checks for a valid, authenticated user and optionally for specific roles.
 */
export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // 1. While the authentication state is being determined, show a loading indicator.
  if (isLoading) {
    return <div className="text-center p-5">Authenticating...</div>;
  }

  // 2. If authentication is resolved and there is no user, redirect to the login page.
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. If the route requires specific roles and the user does not have one, redirect.
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // 4. If all checks pass, render the requested component.
  return children;
};