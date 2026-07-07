import { api } from './api';
import { Campaign, Pagination } from '../types';

export interface CampaignFilters {
  status?: string;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

export interface CreateCampaignPayload {
  title: string;
  description: string;
  category: string;
  targetAmount: number;
  imageUrl?: string;
  location?: string;
  impactGoal?: string;
}

export const campaignService = {
  list: async (filters: CampaignFilters = {}): Promise<{ campaigns: Campaign[]; pagination: Pagination }> => {
    const { data } = await api.get('/campaigns', { params: filters });
    return data;
  },

  getById: async (id: string): Promise<Campaign> => {
    const { data } = await api.get(`/campaigns/${id}`);
    return data.campaign;
  },

  create: async (payload: CreateCampaignPayload): Promise<Campaign> => {
    const { data } = await api.post('/campaigns', payload);
    return data.campaign;
  },

  update: async (id: string, payload: Partial<CreateCampaignPayload>): Promise<Campaign> => {
    const { data } = await api.patch(`/campaigns/${id}`, payload);
    return data.campaign;
  },

  approve: async (id: string, contractCampaignId?: number): Promise<Campaign> => {
    const { data } = await api.patch(`/campaigns/${id}/approve`, { contractCampaignId });
    return data.campaign;
  },

  reject: async (id: string, reason?: string): Promise<Campaign> => {
    const { data } = await api.patch(`/campaigns/${id}/reject`, { reason });
    return data.campaign;
  },

  flag: async (id: string, flagged: boolean, reason?: string): Promise<Campaign> => {
    const { data } = await api.patch(`/campaigns/${id}/flag`, { flagged, reason });
    return data.campaign;
  },

  myCampaignsForNgo: async (ngoId: string): Promise<Campaign[]> => {
    const { data } = await api.get('/campaigns', { params: { status: 'all', limit: 50 } });
    return (data.campaigns as Campaign[]).filter((c) => {
      const ngo = typeof c.ngoId === 'string' ? c.ngoId : c.ngoId._id;
      return ngo === ngoId;
    });
  },
};
