import express from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';

const router = express.Router();

router.post('/', authenticateToken, requireRole('student'), async (req, res) => {
  try {
    const { course_id } = req.body;

    if (!course_id) {
      return res.status(400).json({ message: 'course_id is required.' });
    }

    const [courses] = await pool.query('SELECT course_id FROM courses WHERE course_id = ?', [course_id]);
    if (courses.length === 0) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    const [existing] = await pool.query(
      'SELECT enrollment_id FROM enrollments WHERE student_id = ? AND course_id = ?',
      [req.user.user_id, course_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Already enrolled in this course.' });
    }

    const [result] = await pool.query(
      'INSERT INTO enrollments (student_id, course_id, status) VALUES (?, ?, ?)',
      [req.user.user_id, course_id, 'active']
    );

    return res.status(201).json({
      message: 'Enrolled successfully.',
      enrollment_id: result.insertId
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error during enrollment.', error: error.message });
  }
});

router.get('/my', authenticateToken, requireRole('student'), async (req, res) => {
  try {
    const query = `
      SELECT 
        e.enrollment_id,
        e.enrolled_at,
        e.status,
        c.course_id,
        c.course_code,
        c.title,
        c.category,
        c.description,
        u.full_name AS teacher_name,
        (SELECT COUNT(*) FROM learning_materials lm WHERE lm.course_id = c.course_id) AS total_materials,
        (
          SELECT COUNT(*) 
          FROM student_progress sp 
          JOIN learning_materials lm2 ON sp.material_id = lm2.material_id
          WHERE sp.student_id = ? AND sp.course_id = c.course_id AND sp.is_completed = 1
        ) AS completed_materials
      FROM enrollments e
      JOIN courses c ON e.course_id = c.course_id
      JOIN users u ON c.teacher_id = u.user_id
      WHERE e.student_id = ?
      ORDER BY e.enrolled_at DESC
    `;
    const [enrollments] = await pool.query(query, [req.user.user_id, req.user.user_id]);

    const formatted = enrollments.map(item => {
      const total = item.total_materials;
      const completed = item.completed_materials;
      const progress_percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      return {
        ...item,
        progress_percentage
      };
    });

    return res.json(formatted);
  } catch (error) {
    return res.status(500).json({ message: 'Server error fetching student enrollments.', error: error.message });
  }
});

router.get('/check/:courseId', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;

    const [courses] = await pool.query('SELECT teacher_id FROM courses WHERE course_id = ?', [courseId]);
    if (courses.length === 0) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    const isTeacher = courses[0].teacher_id === req.user.user_id;

    if (req.user.role === 'student') {
      const [enrollments] = await pool.query(
        'SELECT enrollment_id FROM enrollments WHERE student_id = ? AND course_id = ?',
        [req.user.user_id, courseId]
      );
      return res.json({
        isEnrolled: enrollments.length > 0,
        isTeacher: false
      });
    }

    return res.json({
      isEnrolled: false,
      isTeacher
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error checking enrollment.', error: error.message });
  }
});

export default router;
