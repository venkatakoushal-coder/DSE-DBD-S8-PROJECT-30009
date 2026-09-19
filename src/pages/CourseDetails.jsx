import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ProgressBar } from '../components/ProgressBar';

export const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [course, setCourse] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [materials, setMaterials] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [progress, setProgress] = useState({ completed: 0, total: 0, percentage: 0 });
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadCourseData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const courseData = await api.courses.getById(id);
      setCourse(courseData);

      if (user && user.role === 'student') {
        const status = await api.enrollments.check(id);
        setIsEnrolled(status.isEnrolled);

        if (status.isEnrolled) {
          const [materialsData, quizzesData, progressData] = await Promise.all([
            api.materials.getByCourse(id),
            api.quizzes.getByCourse(id),
            api.progress.getCourseProgress(id)
          ]);
          setMaterials(materialsData);
          setQuizzes(quizzesData);
          setProgress(progressData);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load course details.');
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    loadCourseData();
  }, [loadCourseData]);

  const handleEnroll = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      setEnrolling(true);
      setError('');
      await api.enrollments.enroll(id);
      setSuccessMessage('Successfully enrolled in course!');
      await loadCourseData();
    } catch (err) {
      setError(err.message || 'Enrollment failed.');
    } finally {
      setEnrolling(false);
    }
  };

  const handleToggleMaterial = async (materialId) => {
    try {
      const result = await api.progress.toggle(materialId);
      setMaterials((prev) =>
        prev.map((m) =>
          m.material_id === materialId
            ? { ...m, is_completed: result.is_completed }
            : m
        )
      );
      setProgress({
        completed: result.completed,
        total: result.total,
        percentage: result.percentage
      });
    } catch (err) {
      setError(err.message || 'Failed to update progress.');
    }
  };

  const getMaterialTypeIcon = (type) => {
    switch (type) {
      case 'video':
        return (
          <span className="type-badge badge-blue">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
            Video
          </span>
        );
      case 'pdf':
        return (
          <span className="type-badge badge-red">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
            </svg>
            PDF
          </span>
        );
      case 'article':
        return (
          <span className="type-badge badge-teal">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
              <path d="M14 17H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
            Article
          </span>
        );
      case 'assignment':
        return (
          <span className="type-badge badge-purple">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
            </svg>
            Assignment
          </span>
        );
      default:
        return <span className="type-badge badge-gray">{type}</span>;
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading course content...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="page-container">
        <div className="alert alert-danger">Course not found.</div>
        <Link to="/courses" className="btn btn-outline">Back to Catalog</Link>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="course-hero card">
        <div className="course-hero-header">
          <span className="badge category-badge">{course.category}</span>
          <span className="course-code-pill">{course.course_code}</span>
        </div>

        <h1 className="course-hero-title">{course.title}</h1>
        <p className="course-hero-desc">{course.description}</p>

        <div className="instructor-card">
          <div className="instructor-avatar">
            {course.teacher_name ? course.teacher_name.charAt(0) : 'P'}
          </div>
          <div>
            <span className="instructor-title">Course Instructor</span>
            <strong className="instructor-name">{course.teacher_name}</strong>
            <span className="instructor-dept">{course.teacher_department}</span>
          </div>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {successMessage && <div className="alert alert-success">{successMessage}</div>}

        {!isEnrolled ? (
          <div className="enrollment-banner">
            <div>
              <h3>Enroll to Unlock Full Course Content</h3>
              <p>
                Enrolled students gain immediate access to video lectures, lecture notes, assignments, 
                and knowledge-check quizzes.
              </p>
            </div>
            <button
              onClick={handleEnroll}
              disabled={enrolling}
              className="btn btn-primary btn-lg"
            >
              {enrolling ? 'Enrolling...' : 'Enroll in this Course (Free)'}
            </button>
          </div>
        ) : (
          <div className="enrolled-status-banner">
            <div className="enrolled-indicator">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>You are enrolled in this course</span>
            </div>
            <div className="hero-progress-box">
              <ProgressBar percentage={progress.percentage} height={10} />
              <div className="hero-progress-label">
                <span>{progress.completed} of {progress.total} items completed</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {isEnrolled && (
        <div className="course-content-layout">
          <section className="course-section">
            <div className="section-header">
              <h2>Learning Materials & Syllabus</h2>
              <span className="badge badge-neutral">{materials.length} Lessons</span>
            </div>

            {materials.length === 0 ? (
              <div className="empty-state card">
                <p>No learning materials have been posted for this course yet.</p>
              </div>
            ) : (
              <div className="materials-list">
                {materials.map((m, index) => (
                  <div 
                    key={m.material_id} 
                    className={`material-item card ${m.is_completed ? 'completed' : ''}`}
                  >
                    <div className="material-left">
                      <label className="checkbox-container">
                        <input
                          type="checkbox"
                          checked={Boolean(m.is_completed)}
                          onChange={() => handleToggleMaterial(m.material_id)}
                        />
                        <span className="checkmark"></span>
                      </label>
                      <div className="material-info">
                        <div className="material-meta">
                          <span className="material-order">#{index + 1}</span>
                          {getMaterialTypeIcon(m.material_type)}
                        </div>
                        <h4 className="material-title">{m.title}</h4>
                      </div>
                    </div>

                    <div className="material-right">
                      <a
                        href={m.resource_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-outline"
                      >
                        Open Resource ↗
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="course-section">
            <div className="section-header">
              <h2>Assessments & Quizzes</h2>
              <span className="badge badge-neutral">{quizzes.length} Available</span>
            </div>

            {quizzes.length === 0 ? (
              <div className="empty-state card">
                <p>No quizzes are currently assigned for this course.</p>
              </div>
            ) : (
              <div className="quizzes-grid">
                {quizzes.map((quiz) => (
                  <div key={quiz.quiz_id} className="quiz-card card">
                    <div className="quiz-card-header">
                      <h3>{quiz.title}</h3>
                    </div>

                    <div className="quiz-spec-grid">
                      <div className="spec-box">
                        <span className="spec-label">Time Limit</span>
                        <span className="spec-val">{quiz.time_limit_minutes} Mins</span>
                      </div>
                      <div className="spec-box">
                        <span className="spec-label">Total Marks</span>
                        <span className="spec-val">{quiz.total_marks} Pts</span>
                      </div>
                      <div className="spec-box">
                        <span className="spec-label">Passing Marks</span>
                        <span className="spec-val">{quiz.passing_marks} Pts</span>
                      </div>
                    </div>

                    {quiz.latest_score !== null && quiz.latest_score !== undefined ? (
                      <div className={`quiz-result-badge ${quiz.latest_passed ? 'passed' : 'failed'}`}>
                        <span>Latest: {quiz.latest_score}/{quiz.total_marks} ({quiz.latest_percentage}%)</span>
                        <span className="result-pill">{quiz.latest_passed ? 'PASSED' : 'RETAKE SUGGESTED'}</span>
                      </div>
                    ) : (
                      <div className="quiz-not-taken">
                        <span>Not attempted yet</span>
                      </div>
                    )}

                    <div className="quiz-card-footer">
                      <Link to={`/quiz/${quiz.quiz_id}`} className="btn btn-primary btn-block">
                        {quiz.latest_score !== null && quiz.latest_score !== undefined ? 'Retake Quiz' : 'Start Quiz'}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};
