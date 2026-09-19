import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';

export const CourseManagement = () => {
  const { id } = useParams();

  const [course, setCourse] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [matTitle, setMatTitle] = useState('');
  const [matType, setMatType] = useState('video');
  const [matUrl, setMatUrl] = useState('');
  const [matOrder, setMatOrder] = useState(1);
  const [savingMaterial, setSavingMaterial] = useState(false);

  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizTitle, setQuizTitle] = useState('');
  const [quizTotalMarks, setQuizTotalMarks] = useState(10);
  const [quizPassingMarks, setQuizPassingMarks] = useState(6);
  const [quizTimeLimit, setQuizTimeLimit] = useState(15);
  const [savingQuiz, setSavingQuiz] = useState(false);

  const [selectedQuizForQuestion, setSelectedQuizForQuestion] = useState(null);
  const [qText, setQText] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctOpt, setCorrectOpt] = useState('A');
  const [qPoints, setQPoints] = useState(5);
  const [savingQuestion, setSavingQuestion] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [courseData, materialsData, quizzesData] = await Promise.all([
        api.courses.getById(id),
        api.materials.getByCourse(id),
        api.quizzes.getByCourse(id)
      ]);
      setCourse(courseData);
      setMaterials(materialsData);
      setQuizzes(quizzesData);
      setMatOrder(materialsData.length + 1);
    } catch (err) {
      setError(err.message || 'Failed to load course details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSavingMaterial(true);

    try {
      await api.materials.create({
        course_id: id,
        title: matTitle,
        material_type: matType,
        resource_url: matUrl,
        sequence_order: parseInt(matOrder, 10)
      });
      setSuccess('Learning material added successfully!');
      setShowMaterialModal(false);
      setMatTitle('');
      setMatUrl('');
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to add material.');
    } finally {
      setSavingMaterial(false);
    }
  };

  const handleDeleteMaterial = async (materialId) => {
    if (!window.confirm('Delete this learning material?')) return;
    try {
      setError('');
      await api.materials.delete(materialId);
      setSuccess('Material deleted.');
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to delete material.');
    }
  };

  const handleAddQuiz = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSavingQuiz(true);

    try {
      await api.quizzes.create({
        course_id: id,
        title: quizTitle,
        total_marks: parseInt(quizTotalMarks, 10),
        passing_marks: parseInt(quizPassingMarks, 10),
        time_limit_minutes: parseInt(quizTimeLimit, 10)
      });
      setSuccess('Quiz created successfully!');
      setShowQuizModal(false);
      setQuizTitle('');
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to create quiz.');
    } finally {
      setSavingQuiz(false);
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm('Delete this quiz and all its questions?')) return;
    try {
      setError('');
      await api.quizzes.delete(quizId);
      setSuccess('Quiz removed.');
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to delete quiz.');
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!selectedQuizForQuestion) return;
    setSavingQuestion(true);
    setError('');
    setSuccess('');

    try {
      await api.quizzes.addQuestion(selectedQuizForQuestion.quiz_id, {
        question_text: qText,
        option_a: optA,
        option_b: optB,
        option_c: optC,
        option_d: optD,
        correct_option: correctOpt,
        points: parseInt(qPoints, 10)
      });
      setSuccess('Question added to quiz!');
      setSelectedQuizForQuestion(null);
      setQText('');
      setOptA('');
      setOptB('');
      setOptC('');
      setOptD('');
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to add question.');
    } finally {
      setSavingQuestion(false);
    }
  };

  if (loading && !course) {
    return (
      <div className="page-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading course editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <div className="breadcrumbs">
            <Link to="/teacher/courses">My Courses</Link> / <span>{course?.course_code}</span>
          </div>
          <h1 className="page-title">{course?.title}</h1>
          <p className="page-subtitle">Syllabus materials and assessment creator</p>
        </div>
        <div className="header-actions">
          <button onClick={() => setShowMaterialModal(true)} className="btn btn-primary">
            + Add Material
          </button>
          <button onClick={() => setShowQuizModal(true)} className="btn btn-outline">
            + Add Quiz
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="management-sections">
        <section className="dashboard-section">
          <div className="section-header">
            <h2>Course Learning Materials ({materials.length})</h2>
            <button onClick={() => setShowMaterialModal(true)} className="btn btn-sm btn-outline">
              + New Resource
            </button>
          </div>

          {materials.length === 0 ? (
            <div className="empty-state card">
              <p>No learning materials have been added yet.</p>
              <button onClick={() => setShowMaterialModal(true)} className="btn btn-primary btn-sm">
                Add First Material
              </button>
            </div>
          ) : (
            <div className="materials-admin-list">
              {materials.map((m) => (
                <div key={m.material_id} className="card material-admin-item">
                  <div className="material-admin-meta">
                    <span className="order-tag">Seq: {m.sequence_order}</span>
                    <span className={`type-badge badge-${m.material_type}`}>{m.material_type}</span>
                    <h4 className="material-admin-title">{m.title}</h4>
                  </div>
                  <div className="material-admin-url">
                    <a href={m.resource_url} target="_blank" rel="noopener noreferrer" className="link-truncate">
                      {m.resource_url}
                    </a>
                  </div>
                  <div className="material-admin-actions">
                    <button
                      onClick={() => handleDeleteMaterial(m.material_id)}
                      className="btn btn-danger-outline btn-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="dashboard-section">
          <div className="section-header">
            <h2>Course Quizzes & Assessments ({quizzes.length})</h2>
            <button onClick={() => setShowQuizModal(true)} className="btn btn-sm btn-outline">
              + New Quiz
            </button>
          </div>

          {quizzes.length === 0 ? (
            <div className="empty-state card">
              <p>No assessments have been created for this course.</p>
              <button onClick={() => setShowQuizModal(true)} className="btn btn-primary btn-sm">
                Create First Quiz
              </button>
            </div>
          ) : (
            <div className="quizzes-admin-grid">
              {quizzes.map((q) => (
                <div key={q.quiz_id} className="card quiz-admin-card">
                  <div className="quiz-admin-header">
                    <h3>{q.title}</h3>
                    <span className="badge badge-primary">{q.question_count || 0} Questions</span>
                  </div>

                  <div className="quiz-spec-grid">
                    <div className="spec-box">
                      <span className="spec-label">Time Limit</span>
                      <span className="spec-val">{q.time_limit_minutes} Mins</span>
                    </div>
                    <div className="spec-box">
                      <span className="spec-label">Total Marks</span>
                      <span className="spec-val">{q.total_marks} Pts</span>
                    </div>
                    <div className="spec-box">
                      <span className="spec-label">Passing</span>
                      <span className="spec-val">{q.passing_marks} Pts</span>
                    </div>
                  </div>

                  <div className="quiz-admin-footer">
                    <button
                      onClick={() => setSelectedQuizForQuestion(q)}
                      className="btn btn-primary btn-sm"
                    >
                      + Add Question
                    </button>
                    <button
                      onClick={() => handleDeleteQuiz(q.quiz_id)}
                      className="btn btn-danger-outline btn-sm"
                    >
                      Delete Quiz
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {showMaterialModal && (
        <div className="modal-overlay">
          <div className="modal-card card">
            <div className="modal-header">
              <h2>Add Learning Material</h2>
              <button onClick={() => setShowMaterialModal(false)} className="btn-close">✕</button>
            </div>
            <form onSubmit={handleAddMaterial}>
              <div className="form-group">
                <label>Lesson Title</label>
                <input
                  type="text"
                  placeholder="e.g. Graph Traversals BFS and DFS"
                  value={matTitle}
                  onChange={(e) => setMatTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Material Type</label>
                <select
                  value={matType}
                  onChange={(e) => setMatType(e.target.value)}
                  required
                >
                  <option value="video">Video Lecture</option>
                  <option value="pdf">PDF / Lecture Notes</option>
                  <option value="article">Article / Documentation</option>
                  <option value="assignment">Assignment Task</option>
                </select>
              </div>

              <div className="form-group">
                <label>Resource URL</label>
                <input
                  type="url"
                  placeholder="https://example.edu/resource or YouTube URL"
                  value={matUrl}
                  onChange={(e) => setMatUrl(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Sequence Order</label>
                <input
                  type="number"
                  min="1"
                  value={matOrder}
                  onChange={(e) => setMatOrder(e.target.value)}
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowMaterialModal(false)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" disabled={savingMaterial} className="btn btn-primary">
                  {savingMaterial ? 'Saving...' : 'Add Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showQuizModal && (
        <div className="modal-overlay">
          <div className="modal-card card">
            <div className="modal-header">
              <h2>Create New Quiz</h2>
              <button onClick={() => setShowQuizModal(false)} className="btn-close">✕</button>
            </div>
            <form onSubmit={handleAddQuiz}>
              <div className="form-group">
                <label>Quiz Title</label>
                <input
                  type="text"
                  placeholder="e.g. Mid-term Assessment on Trees"
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Total Marks</label>
                  <input
                    type="number"
                    min="1"
                    value={quizTotalMarks}
                    onChange={(e) => setQuizTotalMarks(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Passing Marks</label>
                  <input
                    type="number"
                    min="1"
                    value={quizPassingMarks}
                    onChange={(e) => setQuizPassingMarks(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Time Limit (Minutes)</label>
                  <input
                    type="number"
                    min="1"
                    value={quizTimeLimit}
                    onChange={(e) => setQuizTimeLimit(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowQuizModal(false)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" disabled={savingQuiz} className="btn btn-primary">
                  {savingQuiz ? 'Creating...' : 'Create Quiz'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedQuizForQuestion && (
        <div className="modal-overlay">
          <div className="modal-card card">
            <div className="modal-header">
              <h2>Add Question: {selectedQuizForQuestion.title}</h2>
              <button onClick={() => setSelectedQuizForQuestion(null)} className="btn-close">✕</button>
            </div>
            <form onSubmit={handleAddQuestion}>
              <div className="form-group">
                <label>Question Text</label>
                <textarea
                  rows="3"
                  placeholder="Enter multiple-choice question problem..."
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Option A</label>
                <input
                  type="text"
                  placeholder="Option A description"
                  value={optA}
                  onChange={(e) => setOptA(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Option B</label>
                <input
                  type="text"
                  placeholder="Option B description"
                  value={optB}
                  onChange={(e) => setOptB(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Option C</label>
                <input
                  type="text"
                  placeholder="Option C description"
                  value={optC}
                  onChange={(e) => setOptC(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Option D</label>
                <input
                  type="text"
                  placeholder="Option D description"
                  value={optD}
                  onChange={(e) => setOptD(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Correct Answer</label>
                  <select
                    value={correctOpt}
                    onChange={(e) => setCorrectOpt(e.target.value)}
                    required
                  >
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Points Value</label>
                  <input
                    type="number"
                    min="1"
                    value={qPoints}
                    onChange={(e) => setQPoints(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setSelectedQuizForQuestion(null)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" disabled={savingQuestion} className="btn btn-primary">
                  {savingQuestion ? 'Adding...' : 'Add Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
