import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { healthRouter } from './routes/health';
import { authRouter } from './routes/auth';
import { classesRouter } from './routes/classes';
import { subjectsRouter } from './routes/subjects';
import { timetableRouter } from './routes/timetable';
import { sessionsRouter } from './routes/sessions';
import { teacherRouter } from './routes/teacher';
import { studentRouter } from './routes/student';
import { adminRouter } from './routes/admin';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

dotenv.config();

const app = express();

// ─── Security & Parsing ──────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Observability ───────────────────────────────────────────────────────────
app.use(requestLogger);

// ─── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/v1/health',    healthRouter);
app.use('/api/v1/auth',      authRouter);
app.use('/api/v1/classes',   classesRouter);
app.use('/api/v1/subjects',  subjectsRouter);
app.use('/api/v1/timetable', timetableRouter);
app.use('/api/v1/sessions',  sessionsRouter);
app.use('/api/v1/teacher',   teacherRouter);
app.use('/api/v1/student',   studentRouter);
app.use('/api/v1/admin',     adminRouter);

// ─── 404 ────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use(errorHandler);

export default app;
