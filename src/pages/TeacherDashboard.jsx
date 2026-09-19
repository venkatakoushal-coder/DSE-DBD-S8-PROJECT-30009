import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const TeacherDashboard = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [interventions, setInterventions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        setLoading(true);
        const [coursesData, interventionsData] = await Promise.all([
          api.courses.getTeacherCourses(),
          api.interventions.getTeacherInterventions()
        ]);
        setCourses(coursesData);
        setInterventions(interventionsData);
      } catch (err) {
        setError(err.message || 'Failed to load faculty dashboard.');
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherData();
  }, []);

  const totalEnrollments = courses.reduce((acc, curr) => acc + parseInt(curr.enrolled_count || 0, 10), 0);
  const totalMaterials = courses.reduce((acc, curr) => acc + parseInt(curr.material_count || 0, 10), 0);
  const totalQuizzes = courses.reduce((acc, curr) => acc + parseInt(curr.quiz_count || 0, 10), 0);

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading faculty portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Faculty Dashboard</h1>
          <p className="page-subtitle">
            Welcome, {user?.full_name} • {user?.department}
          </p>
        </div>
        <div className="header-actions">
          <Link to="/teacher/courses" className="btn btn-primary">
            Manage Courses
          </Link>
          <Link to="/teacher/performance" className="btn btn-outline">
            Cohort Analytics
          </Link>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="stats-grid">
        <div className="stat-card card">
          <span className="stat-label">Active Courses</span>
          <span className="stat-number">{courses.length}</span>
          <span className="stat-hint">Curricula taught by you</span>
        </div>

        <div className="stat-card card">
          <span className="stat-label">Enrolled Students</span>
          <span className="stat-number">{totalEnrollments}</span>
          <span className="stat-hint">Across all your courses</span>
        </div>

        <div className="stat-card card">
          <span className="stat-label">Published Lessons</span>
          <span className="stat-number">{totalMaterials}</span>
          <span className="stat-hint">Videos, PDFs, articles</span>
        </div>

        <div className="stat-card card">
          <span className="stat-label">Active Assessments</span>
          <span className="stat-number">{totalQuizzes}</span>
          <span className="stat-hint">Quizzes available to students</span>
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-main">
          <div className="section-header">
            <h2>Course Curricula Under Instruction</h2>
            <Link to="/teacher/courses" className="link-primary">Add / Edit Courses →</Link>
          </div>

          {courses.length === 0 ? (
            <div className="empty-state card">
              <p>You have not authored any courses yet.</p>
              <Link to="/teacher/courses" className="btn btn-primary">
                Create First Course
              </Link>
            </div>
          ) : (
            <div className="table-wrapper card">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Students</th>
                    <th>Materials</th>
                    <th>Quizzes</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((c) => (
                    <tr key={c.course_id}>
                      <td><span className="table-code">{c.course_code}</span></td>
                      <td><strong>{c.title}</strong></td>
                      <td><span className="badge category-badge">{c.category}</span></td>
                      <td>{c.enrolled_count}</td>
                      <td>{c.material_count}</td>
                      <td>{c.quiz_count}</td>
                      <td>
                        <div className="table-actions">
                          <Link to={`/teacher/courses/${c.course_id}/manage`} className="btn btn-sm btn-outline">
                            Manage Syllabus
                          </Link>
                          <Link to={`/teacher/performance`} className="btn btn-sm btn-primary">
                            Performance
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="dashboard-sidebar">
          <div className="section-header">
            <h2>Recent Interventions</h2>
            <Link to="/teacher/interventions" className="link-primary">All →</Link>
          </div>

          <div className="interventions-sidebar-list">
            {interventions.length === 0 ? (
              <div className="card empty-mini">
                <p>No interventions dispatched yet.</p>
                <Link to="/teacher/interventions" className="btn btn-sm btn-outline">
                  Send Guidance
                </Link>
              </div>
            ) : (
              interventions.slice(0, 4).map((item) => (
                <div key={item.intervention_id} className="card mini-intervention-card">
                  <div className="mini-card-header">
                    <strong>{item.student_name}</strong>
                    <span className="mini-date">{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                  <span className="mini-course">{item.course_code} - {item.course_title}</span>
                  <p className="mini-message">{item.message}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
