import mongoose from 'mongoose';
import * as Sentry from '@sentry/node';

/**
 * Connects to MongoDB Atlas via Mongoose. Fails fast on boot if the
 * connection string is missing or unreachable, rather than letting the
 * server start in a broken state and fail confusingly on first request.
 */
export const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error('MONGO_URI is not defined in environment variables');
  }

  mongoose.set('strictQuery', true);

  try {
    const conn = await mongoose.connect(uri);
    console.log(`[db] MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('[db] MongoDB connection failed:', error);
    Sentry.captureException(error);
    throw error;
  }

  mongoose.connection.on('error', (err) => {
    console.error('[db] MongoDB connection error:', err);
    Sentry.captureException(err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[db] MongoDB disconnected');
  });
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.disconnect();
};
