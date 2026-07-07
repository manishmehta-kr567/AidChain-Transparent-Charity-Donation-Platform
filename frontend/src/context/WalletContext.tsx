import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { connectFreighter, FreighterError } from '../services/freighter';
import { getXlmBalance } from '../services/stellar';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { track } from '../services/analytics';
import { captureWalletError } from '../services/sentry';
import { authService } from '../services/authService';

interface WalletContextValue {
  publicKey: string | null;
  balance: string | null;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const { user, setUserWallet } = useAuth();
  const { showToast } = useToast();

  const connect = useCallback(async () => {
    setConnecting(true);
    try {
      const address = await connectFreighter();
      setPublicKey(address);

      // Persist to the user's profile if logged in and not already saved,
      // so the wallet address survives across sessions/devices.
      if (user && user.walletAddress !== address) {
        await authService.updateWallet(address);
        setUserWallet(address);
      }

      track('wallet_connected', { publicKey: address });
      showToast('Wallet connected successfully', 'success');

      const bal = await getXlmBalance(address);
      setBalance(bal);
    } catch (err) {
      captureWalletError(err, { action: 'connect' });
      const message = err instanceof FreighterError ? err.message : 'Failed to connect wallet.';
      showToast(message, 'error');
      throw err;
    } finally {
      setConnecting(false);
    }
  }, [user, setUserWallet, showToast]);

  const disconnect = useCallback(() => {
    setPublicKey(null);
    setBalance(null);
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!publicKey) return;
    const bal = await getXlmBalance(publicKey);
    setBalance(bal);
  }, [publicKey]);

  return (
    <WalletContext.Provider
      value={{ publicKey, balance, connecting, connect, disconnect, refreshBalance }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextValue => {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
};
