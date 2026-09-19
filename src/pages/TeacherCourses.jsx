import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

export const TeacherCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Computer Science');
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const [editingCourse, setEditingCourse] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.courses.getTeacherCourses();
      setCourses(data);
    } catch (err) {
      setError(err.message || 'Failed to load courses.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setCreating(true);

    try {
      await api.courses.create({
        course_code: newCode,
        title: newTitle,
        category: newCategory,
        description: newDescription
      });

      setSuccess('Course created successfully!');
      setShowCreateModal(false);
      setNewCode('');
      setNewTitle('');
      setNewDescription('');
      await fetchCourses();
    } catch (err) {
      setError(err.message || 'Failed to create course.');
    } finally {
      setCreating(false);
    }
  };

  const handleStartEdit = (course) => {
    setEditingCourse(course);
    setEditTitle(course.title);
    setEditCategory(course.category);
    setEditDescription(course.description || '');
  };

  const handleUpdateCourse = async (e) => {
    e.preventDefault();
    if (!editingCourse) return;
    setUpdating(true);
    setError('');

    try {
      await api.courses.update(editingCourse.course_id, {
        title: editTitle,
        category: editCategory,
        description: editDescription
      });
      setSuccess('Course updated successfully!');
      setEditingCourse(null);
      await fetchCourses();
    } catch (err) {
      setError(err.message || 'Failed to update course.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteCourse = async (courseId, courseTitle) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${courseTitle}"? All associated materials, quizzes, and enrollments will be deleted.`);
    if (!confirmed) return;

    try {
      setError('');
      await api.courses.delete(courseId);
      setSuccess('Course deleted successfully.');
      await fetchCourses();
    } catch (err) {
      setError(err.message || 'Failed to delete course.');
    }
  };

  if (loading && courses.length === 0) {
    return (
      <div className="page-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading your courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Course Management</h1>
          <p className="page-subtitle">Create, organize, and administer your academic courses</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
          + Add New Course
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-card card">
            <div className="modal-header">
              <h2>Create Academic Course</h2>
              <button onClick={() => setShowCreateModal(false)} className="btn-close">✕</button>
            </div>
            <form onSubmit={handleCreateCourse}>
              <div className="form-group">
                <label>Course Code (Unique)</label>
                <input
                  type="text"
                  placeholder="e.g. CS201"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Course Title</label>
                <input
                  type="text"
                  placeholder="e.g. Object Oriented Programming"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  required
                >
                  <option value="Computer Science">Computer Science</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Electrical Engineering">Electrical Engineering</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Mathematics & Data Science">Mathematics & Data Science</option>
                </select>
              </div>

              <div className="form-group">
                <label>Description & Objectives</label>
                <textarea
                  rows="4"
                  placeholder="Summarize course scope and learning outcomes..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" disabled={creating} className="btn btn-primary">
                  {creating ? 'Saving...' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingCourse && (
        <div className="modal-overlay">
          <div className="modal-card card">
            <div className="modal-header">
              <h2>Edit Course: {editingCourse.course_code}</h2>
              <button onClick={() => setEditingCourse(null)} className="btn-close">✕</button>
            </div>
            <form onSubmit={handleUpdateCourse}>
              <div className="form-group">
                <label>Course Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Category</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  required
                >
                  <option value="Computer Science">Computer Science</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Electrical Engineering">Electrical Engineering</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Mathematics & Data Science">Mathematics & Data Science</option>
                </select>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows="4"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setEditingCourse(null)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" disabled={updating} className="btn btn-primary">
                  {updating ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {courses.length === 0 ? (
        <div className="empty-state card">
          <h3>No courses created yet</h3>
          <p>Click the button above to publish your first academic course.</p>
        </div>
      ) : (
        <div className="teacher-courses-grid">
          {courses.map((course) => (
            <div key={course.course_id} className="card teacher-course-card">
              <div className="course-card-header">
                <span className="badge category-badge">{course.category}</span>
                <span className="course-code">{course.course_code}</span>
              </div>
              <h3 className="course-title">{course.title}</h3>
              <p className="course-description">{course.description || 'No description provided.'}</p>

              <div className="course-metrics-row">
                <div className="metric-pill">
                  <strong>{course.enrolled_count}</strong> Enrolled
                </div>
                <div className="metric-pill">
                  <strong>{course.material_count}</strong> Materials
                </div>
                <div className="metric-pill">
                  <strong>{course.quiz_count}</strong> Quizzes
                </div>
              </div>

              <div className="teacher-card-actions">
                <Link
                  to={`/teacher/courses/${course.course_id}/manage`}
                  className="btn btn-primary btn-sm btn-block"
                >
                  Manage Syllabus & Quizzes
                </Link>
                <div className="btn-group-row">
                  <button
                    onClick={() => handleStartEdit(course)}
                    className="btn btn-outline btn-sm"
                  >
                    Edit Info
                  </button>
                  <button
                    onClick={() => handleDeleteCourse(course.course_id, course.title)}
                    className="btn btn-danger-outline btn-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
