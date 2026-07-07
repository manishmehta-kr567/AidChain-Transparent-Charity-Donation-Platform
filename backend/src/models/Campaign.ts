import { Schema, model, Document, Types } from 'mongoose';

export type CampaignStatus = 'pending' | 'active' | 'completed' | 'rejected';

export interface ICampaign extends Document {
  _id: Types.ObjectId;
  ngoId: Types.ObjectId;
  title: string;
  description: string;
  category: string;
  targetAmount: number;
  raisedAmount: number;
  imageUrl?: string;
  location?: string;
  impactGoal?: string;
  status: CampaignStatus;
  contractCampaignId?: number;
  riskFlagged: boolean;
  riskFlagReason?: string;
  rejectionReason?: string;
  createdAt: Date;
}

export const CAMPAIGN_CATEGORIES = [
  'education',
  'health',
  'disaster-relief',
  'environment',
  'poverty',
  'water-sanitation',
  'children',
  'animal-welfare',
  'other',
] as const;

const campaignSchema = new Schema<ICampaign>(
  {
    ngoId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, required: true, maxlength: 5000 },
    category: {
      type: String,
      required: true,
      enum: CAMPAIGN_CATEGORIES,
    },
    targetAmount: { type: Number, required: true, min: 1 },
    raisedAmount: { type: Number, default: 0, min: 0 },
    imageUrl: { type: String, trim: true },
    location: { type: String, trim: true },
    impactGoal: { type: String, trim: true, maxlength: 500 },
    status: {
      type: String,
      enum: ['pending', 'active', 'completed', 'rejected'],
      default: 'pending',
      index: true,
    },
    contractCampaignId: { type: Number, sparse: true, unique: true },
    riskFlagged: { type: Boolean, default: false },
    riskFlagReason: { type: String, trim: true },
    rejectionReason: { type: String, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

campaignSchema.index({ title: 'text', description: 'text' });
campaignSchema.index({ status: 1, category: 1 });
campaignSchema.index({ createdAt: -1 });

campaignSchema.virtual('progressPercent').get(function (this: ICampaign) {
  if (!this.targetAmount) return 0;
  return Math.min(100, Math.round((this.raisedAmount / this.targetAmount) * 100));
});

campaignSchema.set('toJSON', { virtuals: true });
campaignSchema.set('toObject', { virtuals: true });

export default model<ICampaign>('Campaign', campaignSchema);
