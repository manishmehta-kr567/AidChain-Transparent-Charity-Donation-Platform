import { Schema, model, Document, Types } from 'mongoose';

export type DonationStatus = 'success' | 'failed' | 'pending';

export interface IDonation extends Document {
  _id: Types.ObjectId;
  campaignId: Types.ObjectId;
  donorId: Types.ObjectId;
  donorWallet: string;
  ngoWallet: string;
  amount: number;
  txHash: string;
  network: 'testnet';
  status: DonationStatus;
  createdAt: Date;
}

const donationSchema = new Schema<IDonation>(
  {
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
    donorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    donorWallet: {
      type: String,
      required: true,
      match: [/^G[A-Z2-7]{55}$/, 'Invalid Stellar public key'],
    },
    ngoWallet: {
      type: String,
      required: true,
      match: [/^G[A-Z2-7]{55}$/, 'Invalid Stellar public key'],
    },
    amount: { type: Number, required: true, min: 0.0000001 },
    txHash: {
      type: String,
      required: true,
      unique: true,
      // Stellar tx hashes are 64-char hex strings.
      match: [/^[a-fA-F0-9]{64}$/, 'Invalid Stellar transaction hash'],
    },
    network: { type: String, enum: ['testnet'], default: 'testnet' },
    status: {
      type: String,
      enum: ['success', 'failed', 'pending'],
      default: 'pending',
      index: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

donationSchema.index({ createdAt: -1 });

export default model<IDonation>('Donation', donationSchema);
