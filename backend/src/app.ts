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
const apiRouter = express.Router();

apiRouter.use('/health',    healthRouter);
apiRouter.use('/auth',      authRouter);
apiRouter.use('/classes',   classesRouter);
apiRouter.use('/subjects',  subjectsRouter);
apiRouter.use('/timetable', timetableRouter);
apiRouter.use('/sessions',  sessionsRouter);
apiRouter.use('/teacher',   teacherRouter);
apiRouter.use('/student',   studentRouter);
apiRouter.use('/admin',     adminRouter);

// Support both /api/v1/* and /v1/* (for Vercel rewrites/mounting)
app.use('/api/v1', apiRouter);
app.use('/v1', apiRouter);

// ─── 404 ────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use(errorHandler);

export default app;
