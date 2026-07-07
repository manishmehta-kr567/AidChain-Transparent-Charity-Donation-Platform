import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User } from '../types';
import { authService, RegisterPayload } from '../services/authService';
import { setAuthToken } from '../services/api';
import { identifyUser, resetAnalyticsUser, track } from '../services/analytics';
import { Sentry } from '../services/sentry';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setUserWallet: (walletAddress: string) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const bootstrap = useCallback(async () => {
    const token = localStorage.getItem('aidchain_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const me = await authService.getMe();
      setUser(me);
      identifyUser(me.id, { role: me.role, email: me.email });
      Sentry.setUser({ id: me.id, email: me.email });
    } catch {
      setAuthToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const login = async (email: string, password: string) => {
    const { token, user: loggedInUser } = await authService.login(email, password);
    setAuthToken(token);
    setUser(loggedInUser);
    identifyUser(loggedInUser.id, { role: loggedInUser.role, email: loggedInUser.email });
    Sentry.setUser({ id: loggedInUser.id, email: loggedInUser.email });
    return loggedInUser;
  };

  const register = async (payload: RegisterPayload) => {
    const { token, user: newUser } = await authService.register(payload);
    setAuthToken(token);
    setUser(newUser);
    identifyUser(newUser.id, { role: newUser.role, email: newUser.email });
    track('user_registered', { role: newUser.role });
    return newUser;
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
    resetAnalyticsUser();
    Sentry.setUser(null);
  };

  const refreshUser = async () => {
    const me = await authService.getMe();
    setUser(me);
  };

  const setUserWallet = (walletAddress: string) => {
    setUser((prev) => (prev ? { ...prev, walletAddress } : prev));
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refreshUser, setUserWallet }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
