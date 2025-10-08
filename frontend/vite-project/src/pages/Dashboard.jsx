import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

/**
 * This component acts as a router after a user logs in.
 * It checks the user's role and redirects them to their appropriate dashboard.
 */
function Dashboard() {
  const { user, isLoading } = useAuth();

  // While the auth context is initializing, show a loading state.
  if (isLoading) {
    return <div className="text-center p-5">Loading Dashboard...</div>;
  }

  // This case should rarely be hit due to ProtectedRoute, but it's a safe fallback.
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Redirect admins and super admins to the main admin panel.
  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
    return <Navigate to="/admin" replace />;
  }
  
  // If the user is not an admin, they are a student. Redirect to the student dashboard.
  return <Navigate to="/student-dashboard" replace />;
}

export default Dashboard;