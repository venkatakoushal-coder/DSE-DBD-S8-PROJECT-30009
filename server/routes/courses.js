import express from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        c.course_id,
        c.course_code,
        c.title,
        c.category,
        c.description,
        c.teacher_id,
        c.created_at,
        u.full_name AS teacher_name,
        u.department AS teacher_department,
        (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.course_id) AS enrolled_count,
        (SELECT COUNT(*) FROM learning_materials lm WHERE lm.course_id = c.course_id) AS material_count,
        (SELECT COUNT(*) FROM quizzes q WHERE q.course_id = c.course_id) AS quiz_count
      FROM courses c
      JOIN users u ON c.teacher_id = u.user_id
      ORDER BY c.created_at DESC
    `;
    const [courses] = await pool.query(query);
    return res.json(courses);
  } catch (error) {
    return res.status(500).json({ message: 'Server error fetching courses.', error: error.message });
  }
});

router.get('/teacher/mine', authenticateToken, requireRole('teacher'), async (req, res) => {
  try {
    const query = `
      SELECT 
        c.course_id,
        c.course_code,
        c.title,
        c.category,
        c.description,
        c.teacher_id,
        c.created_at,
        (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.course_id) AS enrolled_count,
        (SELECT COUNT(*) FROM learning_materials lm WHERE lm.course_id = c.course_id) AS material_count,
        (SELECT COUNT(*) FROM quizzes q WHERE q.course_id = c.course_id) AS quiz_count
      FROM courses c
      WHERE c.teacher_id = ?
      ORDER BY c.created_at DESC
    `;
    const [courses] = await pool.query(query, [req.user.user_id]);
    return res.json(courses);
  } catch (error) {
    return res.status(500).json({ message: 'Server error fetching teacher courses.', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT 
        c.course_id,
        c.course_code,
        c.title,
        c.category,
        c.description,
        c.teacher_id,
        c.created_at,
        u.full_name AS teacher_name,
        u.email AS teacher_email,
        u.department AS teacher_department,
        (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.course_id) AS enrolled_count,
        (SELECT COUNT(*) FROM learning_materials lm WHERE lm.course_id = c.course_id) AS material_count,
        (SELECT COUNT(*) FROM quizzes q WHERE q.course_id = c.course_id) AS quiz_count
      FROM courses c
      JOIN users u ON c.teacher_id = u.user_id
      WHERE c.course_id = ?
    `;
    const [courses] = await pool.query(query, [id]);
    if (courses.length === 0) {
      return res.status(404).json({ message: 'Course not found.' });
    }
    return res.json(courses[0]);
  } catch (error) {
    return res.status(500).json({ message: 'Server error fetching course.', error: error.message });
  }
});

router.post('/', authenticateToken, requireRole('teacher'), async (req, res) => {
  try {
    const { course_code, title, category, description } = req.body;

    if (!course_code || !title || !category) {
      return res.status(400).json({ message: 'Course code, title, and category are required.' });
    }

    const [existing] = await pool.query('SELECT course_id FROM courses WHERE course_code = ?', [course_code]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Course code already exists.' });
    }

    const [result] = await pool.query(
      'INSERT INTO courses (course_code, title, category, description, teacher_id) VALUES (?, ?, ?, ?, ?)',
      [course_code.toUpperCase(), title, category, description || '', req.user.user_id]
    );

    return res.status(201).json({
      message: 'Course created successfully.',
      course_id: result.insertId
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error creating course.', error: error.message });
  }
});

router.put('/:id', authenticateToken, requireRole('teacher'), async (req, res) => {
  try {
    const { id } = req.params;
    const { course_code, title, category, description } = req.body;

    const [courses] = await pool.query('SELECT * FROM courses WHERE course_id = ?', [id]);
    if (courses.length === 0) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    if (courses[0].teacher_id !== req.user.user_id) {
      return res.status(403).json({ message: 'Forbidden. You do not own this course.' });
    }

    if (course_code && course_code !== courses[0].course_code) {
      const [duplicate] = await pool.query('SELECT course_id FROM courses WHERE course_code = ? AND course_id != ?', [course_code, id]);
      if (duplicate.length > 0) {
        return res.status(400).json({ message: 'Course code already exists.' });
      }
    }

    await pool.query(
      'UPDATE courses SET course_code = ?, title = ?, category = ?, description = ? WHERE course_id = ?',
      [
        course_code ? course_code.toUpperCase() : courses[0].course_code,
        title || courses[0].title,
        category || courses[0].category,
        description !== undefined ? description : courses[0].description,
        id
      ]
    );

    return res.json({ message: 'Course updated successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error updating course.', error: error.message });
  }
});

router.delete('/:id', authenticateToken, requireRole('teacher'), async (req, res) => {
  try {
    const { id } = req.params;

    const [courses] = await pool.query('SELECT * FROM courses WHERE course_id = ?', [id]);
    if (courses.length === 0) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    if (courses[0].teacher_id !== req.user.user_id) {
      return res.status(403).json({ message: 'Forbidden. You do not own this course.' });
    }

    await pool.query('DELETE FROM courses WHERE course_id = ?', [id]);
    return res.json({ message: 'Course deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error deleting course.', error: error.message });
  }
});

export default router;
