import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Login = () => {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'teacher' ? 'teacher' : 'student';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(initialRole);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'teacher') {
        navigate('/teacher/dashboard', { replace: true });
      } else {
        navigate('/student/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const loggedUser = await login(email, password, role);
      if (loggedUser.role === 'teacher') {
        navigate('/teacher/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card card">
        <div className="auth-header">
          <h2>Sign In to Portal</h2>
          <p>Access your personalized learning environment</p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="role-selector-tabs">
          <button
            type="button"
            className={`tab-button ${role === 'student' ? 'active' : ''}`}
            onClick={() => setRole('student')}
          >
            Student
          </button>
          <button
            type="button"
            className={`tab-button ${role === 'teacher' ? 'active' : ''}`}
            onClick={() => setRole('teacher')}
          >
            Teacher
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Institutional Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. user@edtech.edu"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={isSubmitting}>
            {isSubmitting ? 'Verifying...' : `Sign in as ${role === 'teacher' ? 'Teacher' : 'Student'}`}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Do not have an account?{' '}
            <Link to={`/register?role=${role}`} className="link-primary">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
