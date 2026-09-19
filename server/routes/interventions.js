import express from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';

const router = express.Router();

router.post('/', authenticateToken, requireRole('teacher'), async (req, res) => {
  try {
    const { student_id, course_id, message, resource_url } = req.body;

    if (!student_id || !course_id || !message) {
      return res.status(400).json({ message: 'student_id, course_id, and message are required.' });
    }

    const [courses] = await pool.query('SELECT teacher_id FROM courses WHERE course_id = ?', [course_id]);
    if (courses.length === 0) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    if (courses[0].teacher_id !== req.user.user_id) {
      return res.status(403).json({ message: 'Forbidden. You do not own this course.' });
    }

    const [enrollments] = await pool.query(
      'SELECT enrollment_id FROM enrollments WHERE student_id = ? AND course_id = ?',
      [student_id, course_id]
    );

    if (enrollments.length === 0) {
      return res.status(400).json({ message: 'Student is not enrolled in this course.' });
    }

    const [result] = await pool.query(
      'INSERT INTO educator_interventions (teacher_id, student_id, course_id, message, resource_url, status) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.user_id, student_id, course_id, message, resource_url || null, 'sent']
    );

    return res.status(201).json({
      message: 'Intervention sent successfully.',
      intervention_id: result.insertId
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error creating intervention.', error: error.message });
  }
});

router.get('/student', authenticateToken, requireRole('student'), async (req, res) => {
  try {
    const query = `
      SELECT 
        ei.intervention_id,
        ei.teacher_id,
        ei.course_id,
        ei.message,
        ei.resource_url,
        ei.status,
        ei.created_at,
        c.title AS course_title,
        c.course_code,
        u.full_name AS teacher_name,
        u.email AS teacher_email
      FROM educator_interventions ei
      JOIN courses c ON ei.course_id = c.course_id
      JOIN users u ON ei.teacher_id = u.user_id
      WHERE ei.student_id = ?
      ORDER BY ei.created_at DESC
    `;
    const [interventions] = await pool.query(query, [req.user.user_id]);
    return res.json(interventions);
  } catch (error) {
    return res.status(500).json({ message: 'Server error fetching student interventions.', error: error.message });
  }
});

router.get('/teacher', authenticateToken, requireRole('teacher'), async (req, res) => {
  try {
    const query = `
      SELECT 
        ei.intervention_id,
        ei.student_id,
        ei.course_id,
        ei.message,
        ei.resource_url,
        ei.status,
        ei.created_at,
        c.title AS course_title,
        c.course_code,
        u.full_name AS student_name,
        u.email AS student_email,
        u.department AS student_department
      FROM educator_interventions ei
      JOIN courses c ON ei.course_id = c.course_id
      JOIN users u ON ei.student_id = u.user_id
      WHERE ei.teacher_id = ?
      ORDER BY ei.created_at DESC
    `;
    const [interventions] = await pool.query(query, [req.user.user_id]);
    return res.json(interventions);
  } catch (error) {
    return res.status(500).json({ message: 'Server error fetching teacher interventions.', error: error.message });
  }
});

export default router;
