import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db.js';

import authRoutes from './routes/auth.js';
import courseRoutes from './routes/courses.js';
import enrollmentRoutes from './routes/enrollments.js';
import materialRoutes from './routes/materials.js';
import progressRoutes from './routes/progress.js';
import quizRoutes from './routes/quizzes.js';
import performanceRoutes from './routes/performance.js';
import interventionRoutes from './routes/interventions.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl}`);
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/interventions', interventionRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

async function startServer() {
  try {
    const connection = await pool.getConnection();
    console.log('Successfully connected to MySQL database: ' + (process.env.DB_NAME || 'edtech_db'));
    connection.release();

    app.listen(PORT, () => {
      console.log('EdTech Backend server is running on port ' + PORT);
    });
  } catch (error) {
    console.error('CRITICAL: Database connection failed! Please check your .env configuration and ensure MySQL is running.');
    console.error('Error Details:', error.message);
    process.exit(1);
  }
}

startServer();
