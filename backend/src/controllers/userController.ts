import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import User from '../models/User';
import { AppError } from '../utils/AppError';

// PATCH /api/users/wallet
export const updateWallet = asyncHandler(async (req: Request, res: Response) => {
  const { walletAddress } = req.body;

  if (!/^G[A-Z2-7]{55}$/.test(walletAddress)) {
    throw new AppError('Invalid Stellar public key format', 400);
  }

  const user = await User.findByIdAndUpdate(
    req.user!.id,
    { walletAddress },
    { new: true, runValidators: true }
  );

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.status(200).json({
    success: true,
    user: {
      id: user._id,
      walletAddress: user.walletAddress,
    },
  });
});
