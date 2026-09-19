import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { ProgressBar } from '../components/ProgressBar';

export const StudentPerformance = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [selectedStudentForIntervention, setSelectedStudentForIntervention] = useState(null);
  const [interventionMessage, setInterventionMessage] = useState('');
  const [interventionUrl, setInterventionUrl] = useState('');
  const [sendingIntervention, setSendingIntervention] = useState(false);

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.performance.getTeacherOverview();
      setCourses(data);
      if (data.length > 0) {
        setSelectedCourseId(data[0].course_id.toString());
      }
    } catch (err) {
      setError(err.message || 'Failed to load course list.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCourseStudents = useCallback(async (courseId) => {
    if (!courseId) return;
    try {
      setLoading(true);
      setError('');
      const data = await api.performance.getCourseStudents(courseId);
      setPerformanceData(data);
    } catch (err) {
      setError(err.message || 'Failed to load student performance data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    if (selectedCourseId) {
      fetchCourseStudents(selectedCourseId);
    }
  }, [selectedCourseId, fetchCourseStudents]);

  const handleOpenIntervention = (student) => {
    setSelectedStudentForIntervention(student);
    setInterventionMessage(`Hello ${student.full_name}, I noticed your progress in ${performanceData.course.course_code} is currently below expectations. Please review the recommended study material.`);
    setInterventionUrl('');
  };

  const handleSendIntervention = async (e) => {
    e.preventDefault();
    if (!selectedStudentForIntervention || !selectedCourseId) return;
    setSendingIntervention(true);
    setError('');
    setSuccess('');

    try {
      await api.interventions.create({
        student_id: selectedStudentForIntervention.student_id,
        course_id: parseInt(selectedCourseId, 10),
        message: interventionMessage,
        resource_url: interventionUrl || null
      });
      setSuccess(`Intervention sent to ${selectedStudentForIntervention.full_name} successfully!`);
      setSelectedStudentForIntervention(null);
      setInterventionMessage('');
      setInterventionUrl('');
      await fetchCourseStudents(selectedCourseId);
    } catch (err) {
      setError(err.message || 'Failed to send intervention.');
    } finally {
      setSendingIntervention(false);
    }
  };

  const weakStudentsCount = performanceData?.students?.filter((s) => s.is_weak).length || 0;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Student Performance & Analytics</h1>
          <p className="page-subtitle">Track individual learning metrics and identify students needing support</p>
        </div>

        {courses.length > 0 && (
          <div className="course-select-bar">
            <label htmlFor="course-select">Selected Course:</label>
            <select
              id="course-select"
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="select-dropdown"
            >
              {courses.map((c) => (
                <option key={c.course_id} value={c.course_id}>
                  {c.course_code}: {c.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {courses.length === 0 ? (
        <div className="empty-state card">
          <p>You have no courses yet. Create a course first to enroll students.</p>
        </div>
      ) : loading && !performanceData ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Calculating cohort metrics...</p>
        </div>
      ) : performanceData ? (
        <>
          <div className="stats-grid">
            <div className="stat-card card">
              <span className="stat-label">Enrolled Students</span>
              <span className="stat-number">{performanceData.students.length}</span>
              <span className="stat-hint">Active cohort size</span>
            </div>

            <div className="stat-card card">
              <span className="stat-label">Curriculum Lessons</span>
              <span className="stat-number">{performanceData.total_materials}</span>
              <span className="stat-hint">Total learning resources</span>
            </div>

            <div className="stat-card card">
              <span className="stat-label">Students Needing Help</span>
              <span className={`stat-number ${weakStudentsCount > 0 ? 'text-danger' : 'text-success'}`}>
                {weakStudentsCount}
              </span>
              <span className="stat-hint">Progress &lt; 50% or quiz failing</span>
            </div>
          </div>

          <div className="performance-table-section card">
            <div className="section-header">
              <h2>Student Roster & Progress Tracking</h2>
              <span className="badge badge-neutral">{performanceData.students.length} Enrolled</span>
            </div>

            {performanceData.students.length === 0 ? (
              <div className="empty-state">
                <p>No students have enrolled in this course yet.</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Department</th>
                      <th>Curriculum Completion</th>
                      <th>Quiz Attempts</th>
                      <th>Avg Quiz Score</th>
                      <th>Academic Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performanceData.students.map((s) => (
                      <tr key={s.student_id} className={s.is_weak ? 'row-warning' : ''}>
                        <td>
                          <div className="user-cell">
                            <span className="cell-name">{s.full_name}</span>
                            <span className="cell-email">{s.email}</span>
                          </div>
                        </td>
                        <td>{s.department}</td>
                        <td style={{ minWidth: '180px' }}>
                          <ProgressBar percentage={s.progress_percentage} height={6} showLabel={false} />
                          <div className="cell-subtext">
                            {s.completed_materials} / {s.total_materials} ({s.progress_percentage}%)
                          </div>
                        </td>
                        <td>{s.quiz_attempts}</td>
                        <td>
                          {s.average_quiz_percentage !== null 
                            ? `${s.average_quiz_percentage}%` 
                            : <span className="text-muted">None</span>}
                        </td>
                        <td>
                          {s.is_weak ? (
                            <span className="status-pill status-weak">Needs Help</span>
                          ) : (
                            <span className="status-pill status-good">On Track</span>
                          )}
                        </td>
                        <td>
                          <button
                            onClick={() => handleOpenIntervention(s)}
                            className={`btn btn-sm ${s.is_weak ? 'btn-danger' : 'btn-outline'}`}
                          >
                            Send Help
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}

      {selectedStudentForIntervention && (
        <div className="modal-overlay">
          <div className="modal-card card">
            <div className="modal-header">
              <h2>Send Intervention: {selectedStudentForIntervention.full_name}</h2>
              <button onClick={() => setSelectedStudentForIntervention(null)} className="btn-close">✕</button>
            </div>
            <form onSubmit={handleSendIntervention}>
              <div className="form-group">
                <label>Target Student</label>
                <input
                  type="text"
                  value={`${selectedStudentForIntervention.full_name} (${selectedStudentForIntervention.email})`}
                  disabled
                  className="input-disabled"
                />
              </div>

              <div className="form-group">
                <label>Instructional Message / Remedial Feedback</label>
                <textarea
                  rows="4"
                  value={interventionMessage}
                  onChange={(e) => setInterventionMessage(e.target.value)}
                  placeholder="Explain where the student should focus and how to improve..."
                  required
                />
              </div>

              <div className="form-group">
                <label>Remedial Resource URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://example.edu/review-sheet.pdf or YouTube link"
                  value={interventionUrl}
                  onChange={(e) => setInterventionUrl(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setSelectedStudentForIntervention(null)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" disabled={sendingIntervention} className="btn btn-primary">
                  {sendingIntervention ? 'Dispatching...' : 'Dispatch Intervention'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
