import { z } from 'zod';
import { CAMPAIGN_CATEGORIES } from '../models/Campaign';

const stellarPublicKey = z.string().regex(/^G[A-Z2-7]{55}$/, 'Invalid Stellar public key');
const stellarTxHash = z.string().regex(/^[a-fA-F0-9]{64}$/, 'Invalid Stellar transaction hash');

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    role: z.enum(['donor', 'ngo']).optional(),
    organizationName: z.string().min(2).max(150).optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
});

export const updateWalletSchema = z.object({
  body: z.object({
    walletAddress: stellarPublicKey,
  }),
});

export const createCampaignSchema = z.object({
  body: z.object({
    title: z.string().min(5).max(150),
    description: z.string().min(20).max(5000),
    category: z.enum(CAMPAIGN_CATEGORIES),
    targetAmount: z.number().positive(),
    imageUrl: z.string().url().optional(),
    location: z.string().max(150).optional(),
    impactGoal: z.string().max(500).optional(),
  }),
});

export const approveCampaignSchema = z.object({
  body: z.object({
    contractCampaignId: z.number().int().positive().optional(),
  }),
});

export const rejectCampaignSchema = z.object({
  body: z.object({
    reason: z.string().max(500).optional(),
  }),
});

export const createDonationSchema = z.object({
  body: z.object({
    campaignId: z.string().length(24, 'Invalid campaign id'),
    txHash: stellarTxHash,
    amount: z.number().positive(),
  }),
});

export const createExpenseSchema = z.object({
  body: z.object({
    campaignId: z.string().length(24, 'Invalid campaign id'),
    title: z.string().min(3).max(150),
    amount: z.string().or(z.number()),
    description: z.string().min(10).max(2000),
  }),
});

export const feedbackSchema = z.object({
  body: z.object({
    rating: z.number().int().min(1).max(5),
    message: z.string().min(3).max(1000),
  }),
});
