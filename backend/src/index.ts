import { env } from '@config/env';
import { logger } from '@config/logger';
import { connectDB } from '@config/database';
import { errorHandler } from '@core/middleware/error.middleware';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

// Import Routes from Modules
import authRoutes from '@modules/auth/auth.routes';
import taskRoutes from '@modules/tasks/task.routes';
import projectRoutes from '@modules/projects/project.routes';
import sessionRoutes from '@modules/timer/timer.routes';
import settingsRoutes from '@modules/settings/settings.routes';
import billingRoutes from '@modules/billing/billing.routes';
import analyticsRoutes from '@modules/analytics/analytics.routes';
import organizationRoutes from '@modules/organizations/organization.routes';
import clientRoutes from '@modules/clients/client.routes';
import rateRoutes from '@modules/rates/rate.routes';
import workSessionRoutes from '@modules/workSessions/work-session.routes';
import dashboardRoutes from '@modules/dashboard/dashboard.routes';
import focusRoutes from '@modules/focus/focus.routes';

const app = express();
const PORT = env.PORT;

// Connect to Database
connectDB();

// Middlewares
app.use(helmet());
app.use(cookieParser());

// CORS configuration supporting cookies and handling missing protocols / Vercel preview URLs
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000'
    ];

    if (env.FRONTEND_URL) {
      const cleanUrl = env.FRONTEND_URL.trim().replace(/\/$/, '');
      allowedOrigins.push(cleanUrl);
      if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
        allowedOrigins.push(`https://${cleanUrl}`);
        allowedOrigins.push(`http://${cleanUrl}`);
      }
    }

    const isMatch = allowedOrigins.includes(origin) || 
                    /^https:\/\/time-flow[a-z0-9-]*\.vercel\.app$/.test(origin) ||
                    /^https:\/\/timeflow[a-z0-9-]*\.vercel\.app$/.test(origin);

    if (isMatch) {
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

// Conditional Body Parser for Stripe Webhook
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
app.use('/api/v1/organizations', organizationRoutes);
app.use('/api/v1/clients', clientRoutes);
app.use('/api/v1/rates', rateRoutes);
app.use('/api/v1/work-sessions', workSessionRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/focus', focusRoutes);

// Global Error Handler Middleware
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  logger.info(`🚀 TimeFlow API corriendo en el puerto ${PORT}`);
});
