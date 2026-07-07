import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Campaign from '../models/Campaign';
import User from '../models/User';
import { AppError } from '../utils/AppError';

// POST /api/campaigns  (NGO only)
export const createCampaign = asyncHandler(async (req: Request, res: Response) => {
  const ngo = await User.findById(req.user!.id);
  if (!ngo || ngo.role !== 'ngo') {
    throw new AppError('Only NGO accounts can create campaigns', 403);
  }
  if (!ngo.walletAddress) {
    throw new AppError('Connect a Stellar wallet before creating a campaign', 400);
  }

  const { title, description, category, targetAmount, imageUrl, location, impactGoal } = req.body;

  const campaign = await Campaign.create({
    ngoId: ngo._id,
    title,
    description,
    category,
    targetAmount,
    imageUrl,
    location,
    impactGoal,
    status: 'pending',
  });

  res.status(201).json({ success: true, campaign });
});

// GET /api/campaigns  (public, supports search/filter/pagination)
export const getCampaigns = asyncHandler(async (req: Request, res: Response) => {
  const {
    status = 'active',
    category,
    search,
    page = '1',
    limit = '12',
    sort = '-createdAt',
  } = req.query as Record<string, string>;

  const query: Record<string, unknown> = {};

  if (status && status !== 'all') query.status = status;
  if (category) query.category = category;
  if (search) query.$text = { $search: search };

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));

  const [campaigns, total] = await Promise.all([
    Campaign.find(query)
      .populate('ngoId', 'name organizationName verified')
      .sort(sort)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Campaign.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    campaigns,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

// GET /api/campaigns/:id  (public)
export const getCampaignById = asyncHandler(async (req: Request, res: Response) => {
  const campaign = await Campaign.findById(req.params.id).populate(
    'ngoId',
    'name organizationName verified walletAddress'
  );

  if (!campaign) {
    throw new AppError('Campaign not found', 404);
  }

  res.status(200).json({ success: true, campaign });
});

// PATCH /api/campaigns/:id  (NGO owner only, pending campaigns only)
export const updateCampaign = asyncHandler(async (req: Request, res: Response) => {
  const campaign = await Campaign.findById(req.params.id);
  if (!campaign) {
    throw new AppError('Campaign not found', 404);
  }

  if (campaign.ngoId.toString() !== req.user!.id) {
    throw new AppError('You can only edit your own campaigns', 403);
  }

  if (campaign.status !== 'pending') {
    throw new AppError('Only pending campaigns can be edited', 400);
  }

  const allowedFields = ['title', 'description', 'category', 'targetAmount', 'imageUrl', 'location', 'impactGoal'];
  for (const field of allowedFields) {
    if (field in req.body) {
      (campaign as unknown as Record<string, unknown>)[field] = req.body[field];
    }
  }

  await campaign.save();

  res.status(200).json({ success: true, campaign });
});

// PATCH /api/campaigns/:id/approve  (admin only)
export const approveCampaign = asyncHandler(async (req: Request, res: Response) => {
  const { contractCampaignId } = req.body;

  const campaign = await Campaign.findById(req.params.id);
  if (!campaign) {
    throw new AppError('Campaign not found', 404);
  }
  if (campaign.status !== 'pending') {
    throw new AppError('Only pending campaigns can be approved', 400);
  }

  campaign.status = 'active';
  if (contractCampaignId !== undefined) {
    campaign.contractCampaignId = contractCampaignId;
  }
  await campaign.save();

  res.status(200).json({ success: true, campaign });
});

// PATCH /api/campaigns/:id/reject  (admin only)
export const rejectCampaign = asyncHandler(async (req: Request, res: Response) => {
  const { reason } = req.body;

  const campaign = await Campaign.findById(req.params.id);
  if (!campaign) {
    throw new AppError('Campaign not found', 404);
  }
  if (campaign.status !== 'pending') {
    throw new AppError('Only pending campaigns can be rejected', 400);
  }

  campaign.status = 'rejected';
  campaign.rejectionReason = reason || 'Did not meet platform guidelines';
  await campaign.save();

  res.status(200).json({ success: true, campaign });
});
