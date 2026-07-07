import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import { signToken } from '../services/tokenService';
import { AppError } from '../utils/AppError';

// POST /api/auth/register
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, role, organizationName } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new AppError('An account with this email already exists', 409);
  }

  if (role === 'admin') {
    throw new AppError('Admin accounts cannot be self-registered', 403);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await User.create({
    name,
    email,
    passwordHash,
    role: role || 'donor',
    organizationName,
    verified: false,
  });

  const token = signToken(user._id.toString(), user.role);

  res.status(201).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationName: user.organizationName,
      verified: user.verified,
      walletAddress: user.walletAddress,
    },
  });
});

// POST /api/auth/login
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = signToken(user._id.toString(), user.role);

  res.status(200).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationName: user.organizationName,
      verified: user.verified,
      walletAddress: user.walletAddress,
    },
  });
});

// GET /api/auth/me
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.status(200).json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationName: user.organizationName,
      verified: user.verified,
      walletAddress: user.walletAddress,
      createdAt: user.createdAt,
    },
  });
});
