import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import type { Express } from 'express';

/**
 * Initializes Sentry as early as possible (before the Express app is
 * constructed) so it can instrument requests, uncaught exceptions, and
 * unhandled rejections from the very first line of the app's lifecycle.
 */
export const initSentry = (): void => {
  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    console.warn('[sentry] SENTRY_DSN not set — error monitoring disabled');
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    integrations: [nodeProfilingIntegration()],
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
  });

  console.log('[sentry] initialized');
};

/**
 * Wires up Sentry's request/tracing handlers on the Express app. Must be
 * called immediately after `express()` and before any routes/middleware.
 */
export const setupSentryRequestHandlers = (app: Express): void => {
  if (!process.env.SENTRY_DSN) return;
  Sentry.setupExpressErrorHandler(app);
};

export { Sentry };
