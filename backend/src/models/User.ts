import { Schema, model, Document, Types } from 'mongoose';

export type UserRole = 'donor' | 'ngo' | 'admin';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  walletAddress?: string;
  organizationName?: string;
  verified: boolean;
  createdAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email address'],
    },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ['donor', 'ngo', 'admin'],
      default: 'donor',
      required: true,
    },
    walletAddress: {
      type: String,
      trim: true,
      // Stellar public keys start with G and are 56 chars, base32.
      match: [/^G[A-Z2-7]{55}$/, 'Invalid Stellar public key'],
      sparse: true,
    },
    organizationName: {
      type: String,
      trim: true,
      required: function (this: IUser) {
        return this.role === 'ngo';
      },
    },
    verified: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

userSchema.index({ role: 1 });

export default model<IUser>('User', userSchema);
