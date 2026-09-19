import express from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';

const router = express.Router();

router.get('/courses', authenticateToken, requireRole('teacher'), async (req, res) => {
  try {
    const query = `
      SELECT 
        c.course_id,
        c.course_code,
        c.title,
        c.category,
        (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.course_id) AS enrolled_students,
        (SELECT COUNT(*) FROM learning_materials lm WHERE lm.course_id = c.course_id) AS total_materials,
        (SELECT COUNT(*) FROM quizzes q WHERE q.course_id = c.course_id) AS total_quizzes
      FROM courses c
      WHERE c.teacher_id = ?
      ORDER BY c.created_at DESC
    `;
    const [courses] = await pool.query(query, [req.user.user_id]);
    return res.json(courses);
  } catch (error) {
    return res.status(500).json({ message: 'Server error fetching performance overview.', error: error.message });
  }
});

router.get('/course/:courseId', authenticateToken, requireRole('teacher'), async (req, res) => {
  try {
    const { courseId } = req.params;

    const [courses] = await pool.query('SELECT teacher_id, title, course_code FROM courses WHERE course_id = ?', [courseId]);
    if (courses.length === 0) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    if (courses[0].teacher_id !== req.user.user_id) {
      return res.status(403).json({ message: 'Forbidden. You do not own this course.' });
    }

    const [materialCountRows] = await pool.query(
      'SELECT COUNT(*) AS total FROM learning_materials WHERE course_id = ?',
      [courseId]
    );
    const totalMaterials = materialCountRows[0].total;

    const studentsQuery = `
      SELECT 
        u.user_id AS student_id,
        u.full_name,
        u.email,
        u.department,
        e.enrolled_at,
        (
          SELECT COUNT(*) 
          FROM student_progress sp 
          JOIN learning_materials lm ON sp.material_id = lm.material_id 
          WHERE sp.student_id = u.user_id AND lm.course_id = ? AND sp.is_completed = 1
        ) AS completed_materials,
        (
          SELECT COUNT(*) 
          FROM quiz_submissions qs 
          JOIN quizzes q ON qs.quiz_id = q.quiz_id 
          WHERE qs.student_id = u.user_id AND q.course_id = ?
        ) AS quiz_attempts,
        (
          SELECT AVG(qs.percentage) 
          FROM quiz_submissions qs 
          JOIN quizzes q ON qs.quiz_id = q.quiz_id 
          WHERE qs.student_id = u.user_id AND q.course_id = ?
        ) AS average_quiz_percentage,
        (
          SELECT qs.passed 
          FROM quiz_submissions qs 
          JOIN quizzes q ON qs.quiz_id = q.quiz_id 
          WHERE qs.student_id = u.user_id AND q.course_id = ? 
          ORDER BY qs.submitted_at DESC 
          LIMIT 1
        ) AS latest_quiz_passed,
        (
          SELECT ei.message 
          FROM educator_interventions ei 
          WHERE ei.student_id = u.user_id AND ei.course_id = ? 
          ORDER BY ei.created_at DESC 
          LIMIT 1
        ) AS latest_intervention_message,
        (
          SELECT ei.created_at 
          FROM educator_interventions ei 
          WHERE ei.student_id = u.user_id AND ei.course_id = ? 
          ORDER BY ei.created_at DESC 
          LIMIT 1
        ) AS latest_intervention_date
      FROM enrollments e
      JOIN users u ON e.student_id = u.user_id
      WHERE e.course_id = ?
      ORDER BY u.full_name ASC
    `;

    const [students] = await pool.query(studentsQuery, [
      courseId,
      courseId,
      courseId,
      courseId,
      courseId,
      courseId,
      courseId
    ]);

    const formattedStudents = students.map(s => {
      const completed = s.completed_materials;
      const progress_percentage = totalMaterials > 0 ? Math.round((completed / totalMaterials) * 100) : 0;
      const avg_quiz = s.average_quiz_percentage !== null ? parseFloat(Number(s.average_quiz_percentage).toFixed(2)) : null;
      const is_weak = progress_percentage < 50 || (avg_quiz !== null && avg_quiz < 50) || s.latest_quiz_passed === 0;

      return {
        student_id: s.student_id,
        full_name: s.full_name,
        email: s.email,
        department: s.department,
        enrolled_at: s.enrolled_at,
        total_materials: totalMaterials,
        completed_materials: completed,
        progress_percentage,
        quiz_attempts: s.quiz_attempts,
        average_quiz_percentage: avg_quiz,
        latest_quiz_passed: s.latest_quiz_passed !== null ? Boolean(s.latest_quiz_passed) : null,
        is_weak,
        latest_intervention_message: s.latest_intervention_message,
        latest_intervention_date: s.latest_intervention_date
      };
    });

    return res.json({
      course: courses[0],
      total_materials: totalMaterials,
      students: formattedStudents
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error fetching student performance.', error: error.message });
  }
});

export default router;
