import { api } from './api';
import { AuthResponse, User, UserRole } from '../types';

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  organizationName?: string;
}

export const authService = {
  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/register', payload);
    return data;
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
    return data;
  },

  getMe: async (): Promise<User> => {
    const { data } = await api.get<{ success: boolean; user: User }>('/auth/me');
    return data.user;
  },

  updateWallet: async (walletAddress: string): Promise<{ walletAddress: string }> => {
    const { data } = await api.patch<{ success: boolean; user: { walletAddress: string } }>(
      '/users/wallet',
      { walletAddress }
    );
    return data.user;
  },
};
