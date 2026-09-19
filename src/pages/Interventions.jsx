import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const Interventions = () => {
  const { user } = useAuth();
  const [interventions, setInterventions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInterventions = async () => {
      try {
        setLoading(true);
        setError('');
        if (user.role === 'teacher') {
          const data = await api.interventions.getTeacherInterventions();
          setInterventions(data);
        } else {
          const data = await api.interventions.getStudentInterventions();
          setInterventions(data);
        }
      } catch (err) {
        setError(err.message || 'Failed to load interventions history.');
      } finally {
        setLoading(false);
      }
    };

    fetchInterventions();
  }, [user]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading interventions record...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {user.role === 'teacher' ? 'Dispatched Interventions' : 'Personalized Interventions & Guidance'}
          </h1>
          <p className="page-subtitle">
            {user.role === 'teacher'
              ? 'Complete record of academic recommendations and remedial assignments sent to students'
              : 'Direct feedback and supplementary learning resources from your course instructors'}
          </p>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {interventions.length === 0 ? (
        <div className="empty-state card">
          <p>
            {user.role === 'teacher'
              ? 'You have not sent any interventions yet. You can send targeted interventions from the Student Performance page.'
              : 'You have no active interventions or remedial actions from your instructors.'}
          </p>
        </div>
      ) : (
        <div className="interventions-full-list">
          {interventions.map((item) => (
            <div key={item.intervention_id} className="card intervention-card-full">
              <div className="intervention-card-header">
                <div>
                  <span className="badge category-badge">{item.course_code}</span>
                  <h3 className="intervention-title">{item.course_title}</h3>
                </div>
                <div className="intervention-meta-right">
                  <span className="badge badge-neutral">Status: {item.status}</span>
                  <span className="meta-timestamp">
                    {new Date(item.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="intervention-participants">
                {user.role === 'teacher' ? (
                  <span>Student: <strong>{item.student_name}</strong> ({item.student_email} - {item.student_department})</span>
                ) : (
                  <span>Instructor: <strong>{item.teacher_name}</strong> ({item.teacher_email})</span>
                )}
              </div>

              <div className="intervention-body">
                <p>{item.message}</p>
              </div>

              {item.resource_url && (
                <div className="intervention-resource-box">
                  <span className="resource-label">Recommended Remedial Material:</span>
                  <a
                    href={item.resource_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-outline"
                  >
                    Open Resource ↗
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
