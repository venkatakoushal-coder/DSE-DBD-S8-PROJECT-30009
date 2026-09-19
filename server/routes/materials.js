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
        return res.status(403).json({ message: 'Forbidden. You must be enrolled to access learning materials.' });
      }

      const query = `
        SELECT 
          lm.material_id,
          lm.course_id,
          lm.title,
          lm.material_type,
          lm.resource_url,
          lm.sequence_order,
          lm.created_at,
          COALESCE(sp.is_completed, 0) AS is_completed,
          sp.completed_at
        FROM learning_materials lm
        LEFT JOIN student_progress sp 
          ON lm.material_id = sp.material_id AND sp.student_id = ?
        WHERE lm.course_id = ?
        ORDER BY lm.sequence_order ASC, lm.material_id ASC
      `;
      const [materials] = await pool.query(query, [req.user.user_id, courseId]);
      return res.json(materials);
    }

    if (req.user.role === 'teacher') {
      if (courses[0].teacher_id !== req.user.user_id) {
        return res.status(403).json({ message: 'Forbidden. You do not own this course.' });
      }

      const [materials] = await pool.query(
        'SELECT * FROM learning_materials WHERE course_id = ? ORDER BY sequence_order ASC, material_id ASC',
        [courseId]
      );
      return res.json(materials);
    }

    return res.status(403).json({ message: 'Forbidden.' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error fetching materials.', error: error.message });
  }
});

router.post('/', authenticateToken, requireRole('teacher'), async (req, res) => {
  try {
    const { course_id, title, material_type, resource_url, sequence_order } = req.body;

    if (!course_id || !title || !material_type || !resource_url) {
      return res.status(400).json({ message: 'course_id, title, material_type, and resource_url are required.' });
    }

    const [courses] = await pool.query('SELECT teacher_id FROM courses WHERE course_id = ?', [course_id]);
    if (courses.length === 0) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    if (courses[0].teacher_id !== req.user.user_id) {
      return res.status(403).json({ message: 'Forbidden. You do not own this course.' });
    }

    const order = sequence_order !== undefined ? sequence_order : 1;

    const [result] = await pool.query(
      'INSERT INTO learning_materials (course_id, title, material_type, resource_url, sequence_order) VALUES (?, ?, ?, ?, ?)',
      [course_id, title, material_type, resource_url, order]
    );

    return res.status(201).json({
      message: 'Learning material added successfully.',
      material_id: result.insertId
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error adding material.', error: error.message });
  }
});

router.put('/:materialId', authenticateToken, requireRole('teacher'), async (req, res) => {
  try {
    const { materialId } = req.params;
    const { title, material_type, resource_url, sequence_order } = req.body;

    const [materials] = await pool.query(
      'SELECT lm.material_id, lm.course_id, c.teacher_id FROM learning_materials lm JOIN courses c ON lm.course_id = c.course_id WHERE lm.material_id = ?',
      [materialId]
    );

    if (materials.length === 0) {
      return res.status(404).json({ message: 'Material not found.' });
    }

    if (materials[0].teacher_id !== req.user.user_id) {
      return res.status(403).json({ message: 'Forbidden. You do not own the course for this material.' });
    }

    await pool.query(
      'UPDATE learning_materials SET title = COALESCE(?, title), material_type = COALESCE(?, material_type), resource_url = COALESCE(?, resource_url), sequence_order = COALESCE(?, sequence_order) WHERE material_id = ?',
      [title, material_type, resource_url, sequence_order, materialId]
    );

    return res.json({ message: 'Learning material updated successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error updating material.', error: error.message });
  }
});

router.delete('/:materialId', authenticateToken, requireRole('teacher'), async (req, res) => {
  try {
    const { materialId } = req.params;

    const [materials] = await pool.query(
      'SELECT lm.material_id, lm.course_id, c.teacher_id FROM learning_materials lm JOIN courses c ON lm.course_id = c.course_id WHERE lm.material_id = ?',
      [materialId]
    );

    if (materials.length === 0) {
      return res.status(404).json({ message: 'Material not found.' });
    }

    if (materials[0].teacher_id !== req.user.user_id) {
      return res.status(403).json({ message: 'Forbidden. You do not own the course for this material.' });
    }

    await pool.query('DELETE FROM learning_materials WHERE material_id = ?', [materialId]);
    return res.json({ message: 'Learning material deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error deleting material.', error: error.message });
  }
});

export default router;
