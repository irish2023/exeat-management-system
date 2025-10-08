import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";

// Layouts & Core
import MainLayout from "../src/components/MainLayouts";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

// Public Pages
import Register from "./pages/Register";
import Login from "./pages/Login";

// Student Pages
import StudentDashboard from "./pages/StudentDashboard";
import MakeRequest from "./pages/MakeRequest";
import MyRequests from "./pages/MyRequests";
import ProfilePage from "./pages/ProfilePage";

// Admin & Super Admin Pages
import AdminDashboard from "./pages/AdminDashboard";
import UserManagement from "./pages/userManagement";
import SystemSettings from "./pages/SystemSettings";
import ReportsPage from "./pages/ReportsPage";

/**
 * The main component that defines the application's routing structure.
 */
function App() {
  return (
    <Routes>
      {/* --- Public Routes --- */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* --- Protected Routes --- */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        
        <Route path="student-dashboard" element={<StudentDashboard />} />
        <Route path="make-request" element={<MakeRequest />} />
        <Route path="my-requests" element={<MyRequests />} />
        <Route path="profile" element={<ProfilePage />} />

        <Route 
          path="admin" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="reports" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
              <ReportsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="user-management" 
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
              <UserManagement />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="settings" 
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
              <SystemSettings />
            </ProtectedRoute>
          } 
        />
      </Route>

      {/* --- Not Found Route --- */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;