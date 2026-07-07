import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { setupSentryRequestHandlers } from './config/sentry';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import campaignRoutes from './routes/campaignRoutes';
import donationRoutes from './routes/donationRoutes';
import expenseRoutes from './routes/expenseRoutes';
import feedbackRoutes from './routes/feedbackRoutes';
import adminRoutes from './routes/adminRoutes';

export const createApp = (): Application => {
  const app = express();

  // Sentry's request/tracing instrumentation must be set up before routes.
  setupSentryRequestHandlers(app);

  app.use(helmet());
  app.use(
    cors({
      origin: process.env.CLIENT_URL || '*',
      credentials: true,
    })
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  // Generous but present rate limiting — protects auth and donation
  // endpoints from abuse without punishing normal browsing.
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api', apiLimiter);

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/campaigns', campaignRoutes);
  app.use('/api/donations', donationRoutes);
  app.use('/api/expenses', expenseRoutes);
  app.use('/api/feedback', feedbackRoutes);
  app.use('/api/admin', adminRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
