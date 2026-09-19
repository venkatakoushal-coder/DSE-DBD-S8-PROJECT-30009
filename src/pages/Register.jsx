import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Register = () => {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'teacher' ? 'teacher' : 'student';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [role, setRole] = useState(initialRole);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, isAuthenticated, user } = useAuth();
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
      const newUser = await register({
        full_name: fullName,
        email,
        password,
        role,
        department
      });

      if (newUser.role === 'teacher') {
        navigate('/teacher/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card card">
        <div className="auth-header">
          <h2>Create an Account</h2>
          <p>Register as a student or faculty educator</p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="role-selector-tabs">
          <button
            type="button"
            className={`tab-button ${role === 'student' ? 'active' : ''}`}
            onClick={() => setRole('student')}
          >
            Student Account
          </button>
          <button
            type="button"
            className={`tab-button ${role === 'teacher' ? 'active' : ''}`}
            onClick={() => setRole('teacher')}
          >
            Teacher Account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="fullName">Full Legal Name</label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. John Doe"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. john@edtech.edu"
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
              placeholder="Minimum 6 characters"
              required
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label htmlFor="department">Academic Department</label>
            <select
              id="department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              required
            >
              <option value="Computer Science">Computer Science</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Electrical Engineering">Electrical Engineering</option>
              <option value="Mechanical Engineering">Mechanical Engineering</option>
              <option value="Mathematics & Data Science">Mathematics & Data Science</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={isSubmitting}>
            {isSubmitting ? 'Registering...' : `Create ${role === 'teacher' ? 'Teacher' : 'Student'} Account`}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to={`/login?role=${role}`} className="link-primary">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
