import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link';

  return (
    <header className="navbar-container">
      <div className="navbar-content">
        <Link to="/" className="navbar-brand">
          <div className="brand-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM3.45 9L12 4.33 20.55 9 12 13.67 3.45 9zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/>
            </svg>
          </div>
          <div className="brand-text-group">
            <span className="brand-text">EdTech <span className="brand-accent">Cross-Platform</span></span>
            <span className="brand-subtext">Students &amp; Teachers</span>
          </div>
        </Link>

        <nav className="navbar-nav">
          {isAuthenticated && user.role === 'student' && (
            <>
              <Link to="/student/dashboard" className={isActive('/student/dashboard')}>My Dashboard</Link>
              <Link to="/courses" className={isActive('/courses')}>Browse Courses</Link>
            </>
          )}

          {isAuthenticated && user.role === 'teacher' && (
            <>
              <Link to="/teacher/dashboard" className={isActive('/teacher/dashboard')}>Dashboard</Link>
              <Link to="/teacher/courses" className={isActive('/teacher/courses')}>My Courses</Link>
              <Link to="/teacher/performance" className={isActive('/teacher/performance')}>Student Performance</Link>
              <Link to="/teacher/interventions" className={isActive('/teacher/interventions')}>Interventions</Link>
            </>
          )}

          {!isAuthenticated && (
            <>
              <Link to="/" className={isActive('/')}>Home</Link>
              <Link to="/login" className={isActive('/login')}>Login</Link>
              <Link to="/register" className={isActive('/register')}>Register</Link>
            </>
          )}
        </nav>

        <div className="navbar-actions">
          {isAuthenticated ? (
            <div className="user-profile">
              <div className="user-info">
                <span className="user-name">{user.full_name}</span>
                <span className={`role-badge ${user.role}`}>{user.role}</span>
              </div>
              <button onClick={handleLogout} className="btn-logout" title="Sign out">
                Logout
              </button>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-outline">Sign In</Link>
              <Link to="/register" className="btn btn-primary">Sign Up</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
