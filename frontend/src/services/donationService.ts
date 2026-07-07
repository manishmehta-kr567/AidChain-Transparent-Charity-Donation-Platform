import { api } from './api';
import { Donation, Expense } from '../types';

export const donationService = {
  create: async (campaignId: string, txHash: string, amount: number): Promise<Donation> => {
    const { data } = await api.post('/donations', { campaignId, txHash, amount });
    return data.donation;
  },

  getMine: async (): Promise<Donation[]> => {
    const { data } = await api.get('/donations/user');
    return data.donations;
  },

  getForCampaign: async (campaignId: string): Promise<Donation[]> => {
    const { data } = await api.get(`/donations/campaign/${campaignId}`);
    return data.donations;
  },
};

export const expenseService = {
  create: async (formData: FormData): Promise<Expense> => {
    const { data } = await api.post('/expenses', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.expense;
  },

  getForCampaign: async (campaignId: string): Promise<Expense[]> => {
    const { data } = await api.get(`/expenses/campaign/${campaignId}`);
    return data.expenses;
  },
};

export const feedbackService = {
  submit: async (rating: number, message: string) => {
    const { data } = await api.post('/feedback', { rating, message });
    return data.feedback;
  },
};

export const adminService = {
  getStats: async () => {
    const { data } = await api.get('/admin/stats');
    return data.stats;
  },
};
