import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { UserRole } from '../models/User';
import { AppError } from '../utils/AppError';

export interface AuthPayload {
  id: string;
  role: UserRole;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

/**
 * Verifies the JWT from the Authorization header and attaches the decoded
 * payload to req.user. Does not hit the database on every request for
 * performance — routes that need fresh user data should fetch it explicitly.
 */
export const protect = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
      throw new AppError('Not authorized, no token provided', 401);
    }

    const token = header.split(' ')[1];
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new AppError('Server misconfiguration: JWT secret missing', 500);
    }

    const decoded = jwt.verify(token, secret) as AuthPayload;

    // Confirm the user still exists (handles deleted/deactivated accounts).
    const user = await User.findById(decoded.id).select('_id role');
    if (!user) {
      throw new AppError('User belonging to this token no longer exists', 401);
    }

    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      return next(new AppError('Invalid or expired token', 401));
    }
    next(error);
  }
};

/**
 * Restricts a route to one or more roles. Must be used after `protect`.
 */
export const restrictTo = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Not authorized', 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};
