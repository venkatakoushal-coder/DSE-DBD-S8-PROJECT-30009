import express from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';

const router = express.Router();

router.post('/toggle', authenticateToken, requireRole('student'), async (req, res) => {
  try {
    const { material_id } = req.body;

    if (!material_id) {
      return res.status(400).json({ message: 'material_id is required.' });
    }

    const [materials] = await pool.query(
      'SELECT material_id, course_id FROM learning_materials WHERE material_id = ?',
      [material_id]
    );

    if (materials.length === 0) {
      return res.status(404).json({ message: 'Learning material not found.' });
    }

    const course_id = materials[0].course_id;

    const [enrollments] = await pool.query(
      'SELECT enrollment_id FROM enrollments WHERE student_id = ? AND course_id = ?',
      [req.user.user_id, course_id]
    );

    if (enrollments.length === 0) {
      return res.status(403).json({ message: 'Forbidden. You are not enrolled in this course.' });
    }

    const [existing] = await pool.query(
      'SELECT progress_id, is_completed FROM student_progress WHERE student_id = ? AND material_id = ?',
      [req.user.user_id, material_id]
    );

    let is_completed = 1;
    if (existing.length > 0) {
      is_completed = existing[0].is_completed ? 0 : 1;
      const completed_at = is_completed ? new Date() : null;
      await pool.query(
        'UPDATE student_progress SET is_completed = ?, completed_at = ? WHERE progress_id = ?',
        [is_completed, completed_at, existing[0].progress_id]
      );
    } else {
      await pool.query(
        'INSERT INTO student_progress (student_id, course_id, material_id, is_completed, completed_at) VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)',
        [req.user.user_id, course_id, material_id]
      );
      is_completed = 1;
    }

    const [totalRows] = await pool.query(
      'SELECT COUNT(*) as total FROM learning_materials WHERE course_id = ?',
      [course_id]
    );
    const [completedRows] = await pool.query(
      'SELECT COUNT(*) as completed FROM student_progress WHERE student_id = ? AND course_id = ? AND is_completed = 1',
      [req.user.user_id, course_id]
    );

    const total = totalRows[0].total;
    const completed = completedRows[0].completed;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return res.json({
      material_id,
      is_completed,
      completed,
      total,
      percentage
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error updating progress.', error: error.message });
  }
});

router.get('/course/:courseId', authenticateToken, requireRole('student'), async (req, res) => {
  try {
    const { courseId } = req.params;

    const [enrollments] = await pool.query(
      'SELECT enrollment_id FROM enrollments WHERE student_id = ? AND course_id = ?',
      [req.user.user_id, courseId]
    );

    if (enrollments.length === 0) {
      return res.status(403).json({ message: 'Forbidden. You are not enrolled in this course.' });
    }

    const [totalRows] = await pool.query(
      'SELECT COUNT(*) as total FROM learning_materials WHERE course_id = ?',
      [courseId]
    );
    const [completedRows] = await pool.query(
      'SELECT COUNT(*) as completed FROM student_progress WHERE student_id = ? AND course_id = ? AND is_completed = 1',
      [req.user.user_id, courseId]
    );

    const total = totalRows[0].total;
    const completed = completedRows[0].completed;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return res.json({
      course_id: parseInt(courseId, 10),
      completed,
      total,
      percentage
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error fetching progress.', error: error.message });
  }
});

export default router;
