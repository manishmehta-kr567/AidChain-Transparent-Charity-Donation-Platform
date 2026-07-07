export type UserRole = 'donor' | 'ngo' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationName?: string;
  verified: boolean;
  walletAddress?: string;
  createdAt?: string;
}

export type CampaignStatus = 'pending' | 'active' | 'completed' | 'rejected';

export interface Campaign {
  _id: string;
  ngoId: {
    _id: string;
    name: string;
    organizationName?: string;
    verified: boolean;
    walletAddress?: string;
  } | string;
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
  progressPercent?: number;
  createdAt: string;
}

export type DonationStatus = 'success' | 'failed' | 'pending';

export interface Donation {
  _id: string;
  campaignId: Campaign | string;
  donorId: { _id: string; name: string } | string;
  donorWallet: string;
  ngoWallet: string;
  amount: number;
  txHash: string;
  network: 'testnet';
  status: DonationStatus;
  createdAt: string;
}

export interface Expense {
  _id: string;
  campaignId: string;
  ngoId: string;
  title: string;
  amount: number;
  description: string;
  proofImageUrl: string;
  proofHash: string;
  txHash?: string;
  createdAt: string;
}

export interface Feedback {
  _id: string;
  userId: string;
  rating: number;
  message: string;
  createdAt: string;
}

export interface AdminStats {
  users: { total: number; donors: number; ngos: number };
  campaigns: { pending: number; active: number; completed: number };
  donations: { totalAmount: number; totalCount: number; uniqueWallets: number };
  expenses: { totalAmount: number };
  feedback: { averageRating: number; totalResponses: number };
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
}

export interface AuthResponse extends ApiResponse<User> {
  token: string;
  user: User;
}
