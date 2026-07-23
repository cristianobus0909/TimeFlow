import dotenv from 'dotenv';
// Load environment variables first
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/db';

// Import Routes
import authRoutes from './routes/authRoutes';
import taskRoutes from './routes/taskRoutes';
import projectRoutes from './routes/projectRoutes';
import sessionRoutes from './routes/sessionRoutes';
import settingsRoutes from './routes/settingsRoutes';
import billingRoutes from './routes/billingRoutes';
import analyticsRoutes from './routes/analyticsRoutes';

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

// Middlewares
app.use(helmet());
app.use(cookieParser());

// CORS configuration supporting cookies and handling potential trailing slashes
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
const cleanFrontendUrl = frontendUrl.replace(/\/$/, ''); // Remove trailing slash if present

const allowedOrigins = [frontendUrl, cleanFrontendUrl];

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // If no origin (like mobile apps or curl) or origin matches allowed, accept it
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS bloqueó el origen: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Rate limiting to prevent brute force
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each IP to 300 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas peticiones desde esta IP. Inténtelo más tarde.' },
});
app.use(limiter);

// Conditional Body Parser: Stripe webhook requires raw body for signature verification.
// For all other routes, we parse as standard JSON.
app.use((req, res, next) => {
  if (req.originalUrl === '/api/v1/billing/webhook') {
    next();
  } else {
    express.json()(req, res, next);
  }
});

app.use(express.urlencoded({ extended: true }));

// API Root Route
app.get('/', (req, res) => {
  res.status(200).json({
    app: 'TimeFlow API',
    status: 'online',
    version: '1.0.0',
    time: new Date(),
  });
});

// Register Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/sessions', sessionRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/billing', billingRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Error Global Handler:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Ocurrió un error inesperado en el servidor.',
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 TimeFlow API corriendo en el puerto ${PORT}`);
});
