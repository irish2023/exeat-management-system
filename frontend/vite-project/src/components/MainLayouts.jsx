import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AppLogo from '../assets/Trinity-logo.jpg';

const MainLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-light shadow-sm" style={{ backgroundColor: '#87CEEB' }}>
        <div className="container">
          <Link className="navbar-brand" to="/dashboard">
             Exeat
             <img src={AppLogo} alt="Trinity University Logo" style={{ height: '40px' }} />
          </Link>
          <div className="collapse navbar-collapse">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              {user?.role === 'STUDENT' && <Link className="nav-link" to="/my-requests">My Requests</Link>}
              {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && <Link className="nav-link" to="/admin">Admin Dashboard</Link>}
              {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && <Link className="nav-link" to="/reports">Reports</Link>}
              {user?.role === 'SUPER_ADMIN' && <Link className="nav-link" to="/user-management">User Management</Link>}
              {user?.role === 'SUPER_ADMIN' && <Link className="nav-link" to="/settings">Settings</Link>}
            </ul>
            
            <span className="navbar-text me-3">
              <Link to="/profile" className="text-white text-decoration-none">
                Signed in as: {user?.name} ({user?.role})
              </Link>
            </span>
            
            <button className="btn btn-outline-light" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </nav>
      <main className="container mt-4">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;