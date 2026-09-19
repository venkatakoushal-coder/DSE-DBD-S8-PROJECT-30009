import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';

export const QuizPage = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const timerRef = useRef(null);

  const handleSubmit = useCallback(async (auto = false) => {
    if (isSubmitting || submissionResult) return;
    setIsSubmitting(true);
    setError('');

    try {
      if (timerRef.current) clearInterval(timerRef.current);
      const result = await api.quizzes.submit(quizId, answers);
      setSubmissionResult(result);
    } catch (err) {
      setError(err.message || 'Failed to submit quiz.');
      setIsSubmitting(false);
    }
  }, [quizId, answers, isSubmitting, submissionResult]);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await api.quizzes.getById(quizId);
        setQuiz(data);
        if (data.time_limit_minutes) {
          setTimeLeftSeconds(data.time_limit_minutes * 60);
        }
      } catch (err) {
        setError(err.message || 'Failed to load quiz.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId]);

  useEffect(() => {
    if (timeLeftSeconds === null || submissionResult) return;

    if (timeLeftSeconds <= 0) {
      handleSubmit(true);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeLeftSeconds, submissionResult, handleSubmit]);

  const handleSelectOption = (questionId, optionLetter) => {
    if (submissionResult) return;
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionLetter
    }));
  };

  const formatTime = (totalSeconds) => {
    if (totalSeconds === null || totalSeconds === undefined) return '00:00';
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (error && !quiz) {
    return (
      <div className="page-container">
        <div className="alert alert-danger">{error}</div>
        <button onClick={() => navigate(-1)} className="btn btn-outline">Go Back</button>
      </div>
    );
  }

  return (
    <div className="page-container quiz-container">
      <div className="quiz-header card">
        <div className="quiz-header-meta">
          <div>
            <span className="course-code-tag">{quiz.course_title}</span>
            <h1 className="quiz-page-title">{quiz.title}</h1>
          </div>

          {!submissionResult && timeLeftSeconds !== null && (
            <div className={`timer-box ${timeLeftSeconds < 120 ? 'timer-warning' : ''}`}>
              <span className="timer-label">Time Remaining</span>
              <span className="timer-digits">{formatTime(timeLeftSeconds)}</span>
            </div>
          )}
        </div>

        <div className="quiz-info-pills">
          <span className="pill">Total Marks: {quiz.total_marks}</span>
          <span className="pill">Passing Marks: {quiz.passing_marks}</span>
          <span className="pill">Questions: {quiz.questions?.length || 0}</span>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {submissionResult ? (
        <div className="quiz-result-card card">
          <div className={`result-header ${submissionResult.passed ? 'passed' : 'failed'}`}>
            <div className="result-icon">
              {submissionResult.passed ? (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              ) : (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              )}
            </div>
            <h2>{submissionResult.passed ? 'Quiz Passed!' : 'Needs Improvement'}</h2>
            <p className="result-subtitle">
              {submissionResult.passed
                ? 'Congratulations! You met the passing threshold for this assessment.'
                : 'You scored below the passing mark. Please review the course materials and try again.'}
            </p>
          </div>

          <div className="result-metrics">
            <div className="metric-box">
              <span className="metric-label">Your Score</span>
              <span className="metric-value">{submissionResult.score} / {submissionResult.total_marks}</span>
            </div>
            <div className="metric-box">
              <span className="metric-label">Percentage</span>
              <span className="metric-value">{submissionResult.percentage}%</span>
            </div>
            <div className="metric-box">
              <span className="metric-label">Required to Pass</span>
              <span className="metric-value">{submissionResult.passing_marks} marks</span>
            </div>
          </div>

          <div className="result-actions">
            <Link to={`/courses/${quiz.course_id}`} className="btn btn-primary">
              Return to Course Syllabus
            </Link>
            <button
              onClick={() => {
                setSubmissionResult(null);
                setAnswers({});
                setTimeLeftSeconds(quiz.time_limit_minutes * 60);
              }}
              className="btn btn-outline"
            >
              Retake Quiz
            </button>
          </div>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(false);
          }}
          className="quiz-questions-form"
        >
          {quiz.questions && quiz.questions.map((q, idx) => (
            <div key={q.question_id} className="question-card card">
              <div className="question-header">
                <span className="question-number">Question {idx + 1}</span>
                <span className="question-points">({q.points} pt{q.points > 1 ? 's' : ''})</span>
              </div>
              <p className="question-text">{q.question_text}</p>

              <div className="options-group">
                {['A', 'B', 'C', 'D'].map((letter) => {
                  const key = `option_${letter.toLowerCase()}`;
                  const optionText = q[key];
                  if (!optionText) return null;

                  const isSelected = answers[q.question_id] === letter;

                  return (
                    <label
                      key={letter}
                      className={`option-label ${isSelected ? 'selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name={`q_${q.question_id}`}
                        value={letter}
                        checked={isSelected}
                        onChange={() => handleSelectOption(q.question_id, letter)}
                      />
                      <span className="option-letter">{letter}</span>
                      <span className="option-text">{optionText}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="quiz-submit-bar card">
            <div className="submit-summary">
              <span>
                Answered {Object.keys(answers).length} of {quiz.questions?.length || 0} questions
              </span>
            </div>
            <button
              type="submit"
              disabled={isSubmitting || Object.keys(answers).length === 0}
              className="btn btn-primary btn-lg"
            >
              {isSubmitting ? 'Calculating Score...' : 'Submit Answers for Grading'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
