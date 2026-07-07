import { Schema, model, Document, Types } from 'mongoose';

export interface IExpense extends Document {
  _id: Types.ObjectId;
  campaignId: Types.ObjectId;
  ngoId: Types.ObjectId;
  title: string;
  amount: number;
  description: string;
  proofImageUrl: string;
  proofHash: string;
  txHash?: string;
  createdAt: Date;
}

const expenseSchema = new Schema<IExpense>(
  {
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
    ngoId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    amount: { type: Number, required: true, min: 0.0000001 },
    description: { type: String, required: true, maxlength: 2000 },
    proofImageUrl: { type: String, required: true },
    proofHash: {
      type: String,
      required: true,
      // SHA-256 hex digest of the proof image, used on-chain.
      match: [/^[a-fA-F0-9]{64}$/, 'Invalid proof hash — expected SHA-256 hex digest'],
    },
    txHash: {
      type: String,
      match: [/^[a-fA-F0-9]{64}$/, 'Invalid Stellar transaction hash'],
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

expenseSchema.index({ createdAt: -1 });

export default model<IExpense>('Expense', expenseSchema);
