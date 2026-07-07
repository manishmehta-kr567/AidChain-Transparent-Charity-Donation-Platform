import { Wallet, Loader2 } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { truncateWallet } from '../../utils/format';

export const WalletConnectButton = ({ className = 'btn-primary' }: { className?: string }) => {
  const { publicKey, balance, connecting, connect } = useWallet();

  if (publicKey) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700 dark:border-brand-800 dark:bg-brand-950 dark:text-brand-300">
        <Wallet className="h-4 w-4" />
        <span>{truncateWallet(publicKey)}</span>
        {balance && <span className="text-xs opacity-70">· {parseFloat(balance).toFixed(2)} XLM</span>}
      </div>
    );
  }

  return (
    <button onClick={() => connect()} disabled={connecting} className={className}>
      {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
      {connecting ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
};
