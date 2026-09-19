import express from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';

const router = express.Router();

router.get('/course/:courseId', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;

    const [courses] = await pool.query('SELECT teacher_id FROM courses WHERE course_id = ?', [courseId]);
    if (courses.length === 0) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    if (req.user.role === 'student') {
      const [enrollments] = await pool.query(
        'SELECT enrollment_id FROM enrollments WHERE student_id = ? AND course_id = ?',
        [req.user.user_id, courseId]
      );
      if (enrollments.length === 0) {
        return res.status(403).json({ message: 'Forbidden. You must be enrolled to access course quizzes.' });
      }

      const query = `
        SELECT 
          q.quiz_id,
          q.course_id,
          q.title,
          q.total_marks,
          q.passing_marks,
          q.time_limit_minutes,
          (SELECT COUNT(*) FROM quiz_questions qq WHERE qq.quiz_id = q.quiz_id) AS question_count,
          (
            SELECT qs.score 
            FROM quiz_submissions qs 
            WHERE qs.quiz_id = q.quiz_id AND qs.student_id = ? 
            ORDER BY qs.submitted_at DESC 
            LIMIT 1
          ) AS latest_score,
          (
            SELECT qs.percentage 
            FROM quiz_submissions qs 
            WHERE qs.quiz_id = q.quiz_id AND qs.student_id = ? 
            ORDER BY qs.submitted_at DESC 
            LIMIT 1
          ) AS latest_percentage,
          (
            SELECT qs.passed 
            FROM quiz_submissions qs 
            WHERE qs.quiz_id = q.quiz_id AND qs.student_id = ? 
            ORDER BY qs.submitted_at DESC 
            LIMIT 1
          ) AS latest_passed,
          (
            SELECT qs.submitted_at 
            FROM quiz_submissions qs 
            WHERE qs.quiz_id = q.quiz_id AND qs.student_id = ? 
            ORDER BY qs.submitted_at DESC 
            LIMIT 1
          ) AS latest_submitted_at
        FROM quizzes q
        WHERE q.course_id = ?
        ORDER BY q.quiz_id ASC
      `;
      const [quizzes] = await pool.query(query, [req.user.user_id, req.user.user_id, req.user.user_id, req.user.user_id, courseId]);
      return res.json(quizzes);
    }

    if (req.user.role === 'teacher') {
      if (courses[0].teacher_id !== req.user.user_id) {
        return res.status(403).json({ message: 'Forbidden. You do not own this course.' });
      }

      const query = `
        SELECT 
          q.quiz_id,
          q.course_id,
          q.title,
          q.total_marks,
          q.passing_marks,
          q.time_limit_minutes,
          (SELECT COUNT(*) FROM quiz_questions qq WHERE qq.quiz_id = q.quiz_id) AS question_count,
          (SELECT COUNT(*) FROM quiz_submissions qs WHERE qs.quiz_id = q.quiz_id) AS submission_count
        FROM quizzes q
        WHERE q.course_id = ?
        ORDER BY q.quiz_id ASC
      `;
      const [quizzes] = await pool.query(query, [courseId]);
      return res.json(quizzes);
    }

    return res.status(403).json({ message: 'Forbidden.' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error fetching quizzes.', error: error.message });
  }
});

router.get('/:quizId', authenticateToken, async (req, res) => {
  try {
    const { quizId } = req.params;

    const [quizzes] = await pool.query(
      'SELECT q.*, c.title AS course_title, c.teacher_id FROM quizzes q JOIN courses c ON q.course_id = c.course_id WHERE q.quiz_id = ?',
      [quizId]
    );

    if (quizzes.length === 0) {
      return res.status(404).json({ message: 'Quiz not found.' });
    }

    const quiz = quizzes[0];

    if (req.user.role === 'student') {
      const [enrollments] = await pool.query(
        'SELECT enrollment_id FROM enrollments WHERE student_id = ? AND course_id = ?',
        [req.user.user_id, quiz.course_id]
      );
      if (enrollments.length === 0) {
        return res.status(403).json({ message: 'Forbidden. You must be enrolled in the course to take this quiz.' });
      }

      const [questions] = await pool.query(
        'SELECT question_id, quiz_id, question_text, option_a, option_b, option_c, option_d, points FROM quiz_questions WHERE quiz_id = ? ORDER BY question_id ASC',
        [quizId]
      );

      const { teacher_id, ...quizData } = quiz;
      return res.json({
        ...quizData,
        questions
      });
    }

    if (req.user.role === 'teacher') {
      if (quiz.teacher_id !== req.user.user_id) {
        return res.status(403).json({ message: 'Forbidden. You do not own the course for this quiz.' });
      }

      const [questions] = await pool.query(
        'SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY question_id ASC',
        [quizId]
      );

      return res.json({
        ...quiz,
        questions
      });
    }

    return res.status(403).json({ message: 'Forbidden.' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error fetching quiz.', error: error.message });
  }
});

router.post('/:quizId/submit', authenticateToken, requireRole('student'), async (req, res) => {
  try {
    const { quizId } = req.params;
    const { answers } = req.body;

    const [quizzes] = await pool.query(
      'SELECT q.* FROM quizzes q JOIN courses c ON q.course_id = c.course_id WHERE q.quiz_id = ?',
      [quizId]
    );

    if (quizzes.length === 0) {
      return res.status(404).json({ message: 'Quiz not found.' });
    }

    const quiz = quizzes[0];

    const [enrollments] = await pool.query(
      'SELECT enrollment_id FROM enrollments WHERE student_id = ? AND course_id = ?',
      [req.user.user_id, quiz.course_id]
    );

    if (enrollments.length === 0) {
      return res.status(403).json({ message: 'Forbidden. You must be enrolled in this course to submit this quiz.' });
    }

    const [questions] = await pool.query(
      'SELECT question_id, correct_option, points FROM quiz_questions WHERE quiz_id = ?',
      [quizId]
    );

    if (questions.length === 0) {
      return res.status(400).json({ message: 'Quiz has no questions available.' });
    }

    let calculatedScore = 0;
    let totalPossiblePoints = 0;
    const submittedAnswers = answers || {};

    for (const q of questions) {
      totalPossiblePoints += q.points;
      const studentAnswer = submittedAnswers[q.question_id];
      if (studentAnswer && studentAnswer.toString().toUpperCase() === q.correct_option.toString().toUpperCase()) {
        calculatedScore += q.points;
      }
    }

    const percentage = totalPossiblePoints > 0 
      ? parseFloat(((calculatedScore / totalPossiblePoints) * 100).toFixed(2)) 
      : 0;

    const passed = calculatedScore >= quiz.passing_marks ? 1 : 0;

    const [result] = await pool.query(
      'INSERT INTO quiz_submissions (quiz_id, student_id, score, percentage, passed, submitted_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
      [quizId, req.user.user_id, calculatedScore, percentage, passed]
    );

    return res.status(201).json({
      submission_id: result.insertId,
      score: calculatedScore,
      total_marks: totalPossiblePoints,
      percentage,
      passed: Boolean(passed),
      passing_marks: quiz.passing_marks
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error submitting quiz.', error: error.message });
  }
});

router.get('/:quizId/submissions/my', authenticateToken, requireRole('student'), async (req, res) => {
  try {
    const { quizId } = req.params;
    const [submissions] = await pool.query(
      'SELECT * FROM quiz_submissions WHERE quiz_id = ? AND student_id = ? ORDER BY submitted_at DESC',
      [quizId, req.user.user_id]
    );
    return res.json(submissions);
  } catch (error) {
    return res.status(500).json({ message: 'Server error fetching submissions.', error: error.message });
  }
});

router.post('/', authenticateToken, requireRole('teacher'), async (req, res) => {
  try {
    const { course_id, title, total_marks, passing_marks, time_limit_minutes } = req.body;

    if (!course_id || !title || total_marks === undefined || passing_marks === undefined || time_limit_minutes === undefined) {
      return res.status(400).json({ message: 'course_id, title, total_marks, passing_marks, and time_limit_minutes are required.' });
    }

    const [courses] = await pool.query('SELECT teacher_id FROM courses WHERE course_id = ?', [course_id]);
    if (courses.length === 0) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    if (courses[0].teacher_id !== req.user.user_id) {
      return res.status(403).json({ message: 'Forbidden. You do not own this course.' });
    }

    const [result] = await pool.query(
      'INSERT INTO quizzes (course_id, title, total_marks, passing_marks, time_limit_minutes) VALUES (?, ?, ?, ?, ?)',
      [course_id, title, parseInt(total_marks, 10), parseInt(passing_marks, 10), parseInt(time_limit_minutes, 10)]
    );

    return res.status(201).json({
      message: 'Quiz created successfully.',
      quiz_id: result.insertId
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error creating quiz.', error: error.message });
  }
});

router.post('/:quizId/questions', authenticateToken, requireRole('teacher'), async (req, res) => {
  try {
    const { quizId } = req.params;
    const { question_text, option_a, option_b, option_c, option_d, correct_option, points } = req.body;

    if (!question_text || !option_a || !option_b || !option_c || !option_d || !correct_option) {
      return res.status(400).json({ message: 'question_text, option_a, option_b, option_c, option_d, and correct_option are required.' });
    }

    const normalizedCorrect = correct_option.toString().toUpperCase();
    if (!['A', 'B', 'C', 'D'].includes(normalizedCorrect)) {
      return res.status(400).json({ message: 'correct_option must be A, B, C, or D.' });
    }

    const [quizzes] = await pool.query(
      'SELECT q.quiz_id, c.teacher_id FROM quizzes q JOIN courses c ON q.course_id = c.course_id WHERE q.quiz_id = ?',
      [quizId]
    );

    if (quizzes.length === 0) {
      return res.status(404).json({ message: 'Quiz not found.' });
    }

    if (quizzes[0].teacher_id !== req.user.user_id) {
      return res.status(403).json({ message: 'Forbidden. You do not own the course for this quiz.' });
    }

    const assignedPoints = points !== undefined ? parseInt(points, 10) : 1;

    const [result] = await pool.query(
      'INSERT INTO quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, points) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [quizId, question_text, option_a, option_b, option_c, option_d, normalizedCorrect, assignedPoints]
    );

    return res.status(201).json({
      message: 'Question added successfully.',
      question_id: result.insertId
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error adding question.', error: error.message });
  }
});

router.delete('/:quizId', authenticateToken, requireRole('teacher'), async (req, res) => {
  try {
    const { quizId } = req.params;

    const [quizzes] = await pool.query(
      'SELECT q.quiz_id, c.teacher_id FROM quizzes q JOIN courses c ON q.course_id = c.course_id WHERE q.quiz_id = ?',
      [quizId]
    );

    if (quizzes.length === 0) {
      return res.status(404).json({ message: 'Quiz not found.' });
    }

    if (quizzes[0].teacher_id !== req.user.user_id) {
      return res.status(403).json({ message: 'Forbidden. You do not own the course for this quiz.' });
    }

    await pool.query('DELETE FROM quizzes WHERE quiz_id = ?', [quizId]);
    return res.json({ message: 'Quiz deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error deleting quiz.', error: error.message });
  }
});

router.delete('/questions/:questionId', authenticateToken, requireRole('teacher'), async (req, res) => {
  try {
    const { questionId } = req.params;

    const [questions] = await pool.query(
      'SELECT qq.question_id, c.teacher_id FROM quiz_questions qq JOIN quizzes q ON qq.quiz_id = q.quiz_id JOIN courses c ON q.course_id = c.course_id WHERE qq.question_id = ?',
      [questionId]
    );

    if (questions.length === 0) {
      return res.status(404).json({ message: 'Question not found.' });
    }

    if (questions[0].teacher_id !== req.user.user_id) {
      return res.status(403).json({ message: 'Forbidden. You do not own the course for this question.' });
    }

    await pool.query('DELETE FROM quiz_questions WHERE question_id = ?', [questionId]);
    return res.json({ message: 'Question deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error deleting question.', error: error.message });
  }
});

export default router;
