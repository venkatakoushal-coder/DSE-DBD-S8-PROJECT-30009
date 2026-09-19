import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ProgressBar } from '../components/ProgressBar';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [interventions, setInterventions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [myEnrollments, myInterventions] = await Promise.all([
          api.enrollments.getMy(),
          api.interventions.getStudentInterventions()
        ]);
        setEnrollments(myEnrollments);
        setInterventions(myInterventions);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const totalCompletedMaterials = enrollments.reduce((acc, curr) => acc + (curr.completed_materials || 0), 0);
  const totalMaterials = enrollments.reduce((acc, curr) => acc + (curr.total_materials || 0), 0);
  const overallProgress = totalMaterials > 0 ? Math.round((totalCompletedMaterials / totalMaterials) * 100) : 0;

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading student dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome back, {user?.full_name}</h1>
          <p className="page-subtitle">
            Department of {user?.department} • Student ID: #{user?.user_id}
          </p>
        </div>
        <Link to="/courses" className="btn btn-primary">
          Browse Course Catalog
        </Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="stats-grid">
        <div className="stat-card card">
          <span className="stat-label">Enrolled Courses</span>
          <span className="stat-number">{enrollments.length}</span>
          <span className="stat-hint">Active academic enrollments</span>
        </div>

        <div className="stat-card card">
          <span className="stat-label">Completed Lessons</span>
          <span className="stat-number">{totalCompletedMaterials}</span>
          <span className="stat-hint">Out of {totalMaterials} curriculum items</span>
        </div>

        <div className="stat-card card">
          <span className="stat-label">Overall Progress</span>
          <span className="stat-number">{overallProgress}%</span>
          <span className="stat-hint">Database verified completion</span>
        </div>

        <div className="stat-card card">
          <span className="stat-label">Educator Messages</span>
          <span className="stat-number">{interventions.length}</span>
          <span className="stat-hint">Personalized interventions</span>
        </div>
      </div>

      {interventions.length > 0 && (
        <section className="dashboard-section">
          <div className="section-header">
            <h2>Faculty Interventions & Guidance</h2>
            <span className="badge badge-info">{interventions.length} Unresolved Actions</span>
          </div>

          <div className="interventions-list">
            {interventions.map((item) => (
              <div key={item.intervention_id} className="intervention-item card card-highlight-amber">
                <div className="intervention-item-header">
                  <div>
                    <span className="course-code-tag">{item.course_code}</span>
                    <strong className="intervention-course">{item.course_title}</strong>
                  </div>
                  <span className="intervention-date">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="intervention-message">{item.message}</p>
                <div className="intervention-footer">
                  <span className="teacher-credit">Instructor: {item.teacher_name}</span>
                  {item.resource_url && (
                    <a
                      href={item.resource_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-outline"
                    >
                      Open Recommended Resource →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="dashboard-section">
        <div className="section-header">
          <h2>My Enrolled Courses</h2>
          <Link to="/courses" className="link-primary">Explore more courses</Link>
        </div>

        {enrollments.length === 0 ? (
          <div className="empty-state card">
            <div className="empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
            </div>
            <h3>You are not enrolled in any courses yet</h3>
            <p>Browse our catalog to select courses and begin your structured learning path.</p>
            <Link to="/courses" className="btn btn-primary">
              Browse Available Courses
            </Link>
          </div>
        ) : (
          <div className="courses-grid">
            {enrollments.map((course) => (
              <div key={course.course_id} className="card enrolled-course-card">
                <div className="course-card-header">
                  <span className="badge category-badge">{course.category}</span>
                  <span className="course-code">{course.course_code}</span>
                </div>
                <h3 className="course-title">{course.title}</h3>
                <p className="course-instructor">Instructor: {course.teacher_name}</p>

                <div className="progress-section">
                  <ProgressBar percentage={course.progress_percentage} height={8} />
                  <div className="progress-count-label">
                    <span>{course.completed_materials} of {course.total_materials} materials completed</span>
                  </div>
                </div>

                <div className="course-card-footer">
                  <Link to={`/courses/${course.course_id}`} className="btn btn-primary btn-block">
                    Continue Course
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
