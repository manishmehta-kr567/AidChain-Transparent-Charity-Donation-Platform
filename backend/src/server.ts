import dotenv from 'dotenv';
dotenv.config();

// Sentry must be initialized before anything else is imported/executed,
// so it can instrument as much of the app's lifecycle as possible.
import { initSentry, Sentry } from './config/sentry';
initSentry();

import { createApp } from './app';
import { connectDB } from './config/db';

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB();
    const app = createApp();

    const server = app.listen(PORT, () => {
      console.log(`[server] AidChain API running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
    });

    const shutdown = (signal: string) => {
      console.log(`[server] Received ${signal}, shutting down gracefully...`);
      server.close(() => {
        console.log('[server] Closed remaining connections');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('[server] Failed to start:', error);
    Sentry.captureException(error);
    process.exit(1);
  }
};

process.on('unhandledRejection', (reason) => {
  console.error('[server] Unhandled rejection:', reason);
  Sentry.captureException(reason);
});

start();
