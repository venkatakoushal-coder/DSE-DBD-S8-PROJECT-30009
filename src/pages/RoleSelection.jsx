import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const RoleSelection = () => {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated && user) {
    return user.role === 'teacher' 
      ? <Navigate to="/teacher/dashboard" replace />
      : <Navigate to="/student/dashboard" replace />;
  }

  return (
    <div className="landing-page">
      <div className="hero-section">
        <span className="hero-pill">Modern Academic Learning Platform</span>
        <h1 className="hero-title">
          Empowering Higher Education with <span className="text-primary">Data-Driven</span> Learning
        </h1>
        <p className="hero-subtitle">
          A unified, cross-platform learning management system designed for students and educators. 
          Access course materials, monitor real-time academic progress, complete interactive quizzes, 
          and receive personalized educator interventions.
        </p>

        <div className="role-cards-grid">
          <div className="role-card">
            <div className="role-icon student-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                <path d="M6 12v5c3 3 9 3 12 0v-5"/>
              </svg>
            </div>
            <h2>Student Portal</h2>
            <p>
              Browse catalog courses, enroll in curriculum modules, study structured learning materials, 
              complete assessments, track exact completion progress, and review instructor guidance.
            </p>
            <div className="role-card-actions">
              <Link to="/login?role=student" className="btn btn-primary btn-block">
                Sign in as Student
              </Link>
              <Link to="/register?role=student" className="btn btn-outline btn-block">
                Register as Student
              </Link>
            </div>
          </div>

          <div className="role-card">
            <div className="role-icon teacher-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
            </div>
            <h2>Faculty Portal</h2>
            <p>
              Author academic courses, sequence instructional resources, compose timed quizzes, 
              inspect cohort learning analytics, identify struggling students, and send targeted interventions.
            </p>
            <div className="role-card-actions">
              <Link to="/login?role=teacher" className="btn btn-primary btn-block">
                Sign in as Teacher
              </Link>
              <Link to="/register?role=teacher" className="btn btn-outline btn-block">
                Register as Teacher
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
