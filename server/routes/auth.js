import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { full_name, email, password, role, department } = req.body;

    if (!full_name || !email || !password || !role || !department) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    if (role !== 'student' && role !== 'teacher') {
      return res.status(400).json({ message: 'Role must be student or teacher.' });
    }

    const [existingUsers] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Email is already registered.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [result] = await pool.query(
      'INSERT INTO users (full_name, email, password, role, department) VALUES (?, ?, ?, ?, ?)',
      [full_name, email, hashedPassword, role, department]
    );

    const user_id = result.insertId;
    const token = jwt.sign(
      { user_id, email, role },
      process.env.JWT_SECRET || 'edtech_jwt_secret_key_2026_super_secure',
      { expiresIn: '24h' }
    );

    return res.status(201).json({
      token,
      user: {
        user_id,
        full_name,
        email,
        role,
        department
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error during registration.', error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ message: 'Email, password, and role are required.' });
    }

    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = users[0];

    if (user.role !== role) {
      return res.status(401).json({ message: `Account is registered as ${user.role}, not ${role}.` });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { user_id: user.user_id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'edtech_jwt_secret_key_2026_super_secure',
      { expiresIn: '24h' }
    );

    return res.json({
      token,
      user: {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        department: user.department
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error during login.', error: error.message });
  }
});

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT user_id, full_name, email, role, department, created_at FROM users WHERE user_id = ?',
      [req.user.user_id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.json(users[0]);
  } catch (error) {
    return res.status(500).json({ message: 'Server error fetching user.', error: error.message });
  }
});

export default router;
