import { useState } from 'react';
import { User as UserIcon, Wallet, ShieldCheck, Moon, Sun } from 'lucide-react';
import { PageLayout } from '../components/layout/PageLayout';
import { ProtectedRoute } from '../components/layout/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';
import { useDarkMode } from '../hooks/useDarkMode';
import { WalletConnectButton } from '../components/wallet/WalletConnectButton';
import { truncateWallet, stellarExplorerAccountUrl } from '../utils/format';

function ProfileContent() {
  const { user } = useAuth();
  const { publicKey } = useWallet();
  const { isDark, toggle } = useDarkMode();
  const [tab, setTab] = useState<'profile' | 'wallet' | 'settings'>('profile');

  if (!user) return null;

  const walletAddress = publicKey || user.walletAddress;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-ink-900 dark:text-white">Profile & Settings</h1>

      <div className="mt-6 flex gap-2 border-b border-ink-100 dark:border-ink-800">
        {(['profile', 'wallet', 'settings'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 px-4 py-3 text-sm font-medium capitalize transition ${
              tab === t
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-ink-400 hover:text-ink-700 dark:hover:text-ink-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'profile' && (
          <div className="card space-y-5 p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-2xl font-bold text-brand-700 dark:bg-brand-900">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-display text-lg font-bold text-ink-900 dark:text-white">{user.name}</p>
                <p className="text-sm text-ink-500 dark:text-ink-400">{user.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-ink-100 pt-5 dark:border-ink-800">
              <InfoRow icon={<UserIcon className="h-4 w-4" />} label="Role" value={user.role} capitalize />
              {user.organizationName && (
                <InfoRow icon={<ShieldCheck className="h-4 w-4" />} label="Organization" value={user.organizationName} />
              )}
              <InfoRow
                icon={<ShieldCheck className="h-4 w-4" />}
                label="Verification"
                value={user.verified ? 'Verified' : 'Pending'}
              />
            </div>
          </div>
        )}

        {tab === 'wallet' && (
          <div className="card space-y-5 p-6">
            <h3 className="font-semibold text-ink-900 dark:text-white">Stellar Wallet</h3>
            {walletAddress ? (
              <div className="flex flex-col gap-3 rounded-xl border border-ink-100 p-4 dark:border-ink-800">
                <div className="flex items-center gap-2 text-sm">
                  <Wallet className="h-4 w-4 text-brand-600" />
                  <span className="font-mono">{truncateWallet(walletAddress, 8)}</span>
                </div>
                <a
                  href={stellarExplorerAccountUrl(walletAddress)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-medium text-brand-600 hover:underline"
                >
                  View on Stellar Explorer →
                </a>
              </div>
            ) : (
              <p className="text-sm text-ink-500 dark:text-ink-400">No wallet connected yet.</p>
            )}
            <WalletConnectButton />
          </div>
        )}

        {tab === 'settings' && (
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isDark ? <Moon className="h-5 w-5 text-ink-400" /> : <Sun className="h-5 w-5 text-amber-500" />}
                <div>
                  <p className="font-medium text-ink-900 dark:text-white">Dark mode</p>
                  <p className="text-xs text-ink-500 dark:text-ink-400">Switch between light and dark theme</p>
                </div>
              </div>
              <button
                onClick={toggle}
                className={`h-6 w-11 rounded-full transition ${isDark ? 'bg-brand-600' : 'bg-ink-200'}`}
              >
                <span
                  className={`block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition ${
                    isDark ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const InfoRow = ({
  icon,
  label,
  value,
  capitalize,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  capitalize?: boolean;
}) => (
  <div>
    <div className="flex items-center gap-1.5 text-xs text-ink-400">
      {icon} {label}
    </div>
    <p className={`mt-1 text-sm font-medium text-ink-900 dark:text-white ${capitalize ? 'capitalize' : ''}`}>
      {value}
    </p>
  </div>
);

export default function ProfilePage() {
  return (
    <PageLayout>
      <ProtectedRoute>
        <ProfileContent />
      </ProtectedRoute>
    </PageLayout>
  );
}
