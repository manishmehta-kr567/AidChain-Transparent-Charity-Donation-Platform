import { Request, Response, NextFunction } from 'express';
import { Sentry } from '../config/sentry';
import { AppError } from '../utils/AppError';

interface MongoDuplicateKeyError extends Error {
  code?: number;
  keyValue?: Record<string, unknown>;
}

/**
 * Single place where every error in the app ends up. Converts known error
 * shapes (Mongoose validation, duplicate key, JWT, our own AppError) into
 * consistent JSON responses, and reports unexpected errors to Sentry
 * without leaking internals to the client.
 */
export const errorHandler = (
  err: Error | AppError | MongoDuplicateKeyError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal server error';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
  } else if ((err as MongoDuplicateKeyError).code === 11000) {
    statusCode = 409;
    const field = Object.keys((err as MongoDuplicateKeyError).keyValue || {})[0] || 'field';
    message = `Duplicate value for ${field}. Please use another value.`;
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid identifier format';
  }

  // Only report unexpected (non-operational, 5xx) errors to Sentry to
  // avoid drowning the dashboard in routine 400s.
  if (statusCode >= 500) {
    Sentry.captureException(err, {
      extra: { path: req.originalUrl, method: req.method, body: req.body },
    });
    console.error('[error]', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
};
