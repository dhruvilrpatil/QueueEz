import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';

import { config } from './config';
import { generalLimiter } from './middleware/rateLimit';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Route modules
import authRoutes from './modules/auth/routes';
import facilityRoutes from './modules/facilities/routes';
import appointmentRoutes from './modules/appointments/routes';
import queueRoutes from './modules/queues/routes';
import notificationRoutes from './modules/notifications/routes';
import analyticsRoutes from './modules/analytics/routes';
import messagingRoutes from './modules/messaging/routes';

const app = express();

// ============================================================
// SECURITY MIDDLEWARE
// ============================================================
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

const allowedOrigins = config.clientUrl
  ? config.clientUrl.split(',').map((u) => u.trim())
  : ['http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    if (origin.endsWith('.vercel.app') && allowedOrigins.some((o) => o.includes('vercel.app'))) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ============================================================
// GENERAL MIDDLEWARE
// ============================================================
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (config.isDevelopment) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

app.use(generalLimiter);

// ============================================================
// HEALTH CHECK
// ============================================================
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      version: '1.0.0',
      environment: config.nodeEnv,
      timestamp: new Date().toISOString(),
    },
  });
});

// ============================================================
// API ROUTES
// ============================================================
const API_PREFIX = '/api/v1';

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/facilities`, facilityRoutes);
app.use(`${API_PREFIX}/appointments`, appointmentRoutes);
app.use(`${API_PREFIX}/queues`, queueRoutes);
app.use(`${API_PREFIX}/notifications`, notificationRoutes);
app.use(`${API_PREFIX}/analytics`, analyticsRoutes);
app.use(`${API_PREFIX}/conversations`, messagingRoutes);

// ============================================================
// ERROR HANDLING
// ============================================================
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
