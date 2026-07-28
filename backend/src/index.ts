import { env } from '@config/env';
import { logger } from '@config/logger';
import { connectDB } from '@config/database';
import { errorHandler } from '@core/middleware/error.middleware';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import apiRouter from './routes';

const app = express();
const PORT = env.PORT;

// Enable trust proxy for reverse proxies like Render/Cloudflare
app.set('trust proxy', 1);

// Connect to Database
connectDB();

// Middlewares
app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
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

// General rate limiting to prevent brute force
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each IP to 300 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas peticiones desde esta IP. Inténtelo más tarde.' },
});
app.use(limiter);

// Strict rate limiting for Auth routes (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 auth attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de autenticación. Inténtelo en 15 minutos.' },
});
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);

// Conditional Body Parser for Stripe Webhook
app.use((req, res, next) => {
  if (req.originalUrl === '/api/v1/billing/webhook') {
    next();
  } else {
    express.json()(req, res, next);
  }
});

app.use(express.urlencoded({ extended: true }));

// API Health / Root Route
app.get('/', (req, res) => {
  res.status(200).json({
    app: 'TimeFlow API',
    status: 'online',
    version: '1.0.0',
    time: new Date(),
  });
});

// Centralized Modular API Router Mounting
app.use('/api/v1', apiRouter);

// Global Error Handler Middleware
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  logger.info(`🚀 TimeFlow API corriendo en el puerto ${PORT}`);
});
