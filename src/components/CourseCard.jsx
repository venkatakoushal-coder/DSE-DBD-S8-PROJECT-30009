import { Link } from 'react-router-dom';

export const CourseCard = ({ course, actionLink, actionText = 'View Course', badgeText = null }) => {
  return (
    <div className="card course-card">
      <div className="course-card-header">
        <span className="badge category-badge">{course.category}</span>
        <span className="course-code">{course.course_code}</span>
      </div>
      <h3 className="course-title">{course.title}</h3>
      <p className="course-description">{course.description || 'No description provided.'}</p>
      
      <div className="course-meta">
        {course.teacher_name && (
          <div className="meta-item">
            <span className="meta-label">Instructor:</span>
            <span className="meta-value">{course.teacher_name}</span>
          </div>
        )}
        <div className="meta-stats">
          <span className="stat-pill">{course.material_count || 0} Materials</span>
          <span className="stat-pill">{course.quiz_count || 0} Quizzes</span>
          {course.enrolled_count !== undefined && (
            <span className="stat-pill">{course.enrolled_count} Students</span>
          )}
        </div>
      </div>

      <div className="course-card-footer">
        {badgeText && <span className="status-indicator">{badgeText}</span>}
        <Link to={actionLink} className="btn btn-primary btn-sm">
          {actionText}
        </Link>
      </div>
    </div>
  );
};
