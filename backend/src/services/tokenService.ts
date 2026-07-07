import jwt, { SignOptions } from 'jsonwebtoken';
import { UserRole } from '../models/User';

export const signToken = (id: string, role: UserRole): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }

  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'],
  };

  return jwt.sign({ id, role }, secret, options);
};
