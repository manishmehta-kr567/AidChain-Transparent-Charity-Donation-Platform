import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Layers, HandCoins, Receipt, Wallet, AlertCircle } from 'lucide-react';
import { PageLayout } from '../components/layout/PageLayout';
import { StatCard } from '../components/dashboard/StatCard';
import { VerifiedBadge } from '../components/campaign/VerifiedBadge';
import { CampaignProgressBar } from '../components/campaign/CampaignProgressBar';
import { EmptyState } from '../components/ui/States';
import { CampaignGridSkeleton } from '../components/ui/Skeletons';
import { WalletConnectButton } from '../components/wallet/WalletConnectButton';
import { useAuth } from '../context/AuthContext';
import { campaignService } from '../services/campaignService';
import { Campaign } from '../types';
import { formatXlm, progressPercent } from '../utils/format';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  active: 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300',
  completed: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  rejected: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
};

export default function NgoDashboardPage() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    campaignService
      .myCampaignsForNgo(user.id)
      .then(setCampaigns)
      .finally(() => setLoading(false));
  }, [user]);

  const totalRaised = campaigns.reduce((sum, c) => sum + c.raisedAmount, 0);
  const activeCount = campaigns.filter((c) => c.status === 'active').length;

  return (
    <PageLayout>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-bold text-ink-900 dark:text-white">
                {user?.organizationName || user?.name}
              </h1>
              <VerifiedBadge verified={!!user?.verified} />
            </div>
            <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">NGO campaign dashboard</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <WalletConnectButton className="btn-secondary" />
            <Link to="/ngo/campaigns/new" className="btn-primary">
              <Plus className="h-4 w-4" /> New campaign
            </Link>
          </div>
        </div>

        {!user?.walletAddress && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            Connect a Stellar wallet above before creating a campaign — it becomes your payout address.
          </div>
        )}

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Total raised" value={formatXlm(totalRaised)} icon={<HandCoins className="h-4 w-4" />} />
          <StatCard label="Active campaigns" value={activeCount} icon={<Layers className="h-4 w-4" />} accent="blue" />
          <StatCard label="Total campaigns" value={campaigns.length} icon={<Receipt className="h-4 w-4" />} accent="amber" />
        </div>

        <h2 className="mb-4 font-semibold text-ink-900 dark:text-white">Your campaigns</h2>

        {loading ? (
          <CampaignGridSkeleton count={3} />
        ) : campaigns.length === 0 ? (
          <EmptyState
            icon={<Layers className="h-6 w-6" />}
            title="No campaigns yet"
            description="Create your first campaign to start receiving transparent donations."
            action={
              <Link to="/ngo/campaigns/new" className="btn-primary">
                <Plus className="h-4 w-4" /> Create campaign
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {campaigns.map((c) => (
              <div key={c._id} className="card p-5">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <h3 className="line-clamp-2 font-semibold text-ink-900 dark:text-white">{c.title}</h3>
                  <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[c.status]}`}>
                    {c.status}
                  </span>
                </div>
                <CampaignProgressBar percent={progressPercent(c.raisedAmount, c.targetAmount)} showLabel />
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="font-semibold text-ink-900 dark:text-white">{formatXlm(c.raisedAmount)}</span>
                  <span className="text-ink-400">of {formatXlm(c.targetAmount)}</span>
                </div>
                {c.status === 'rejected' && c.rejectionReason && (
                  <p className="mt-2 text-xs text-red-600 dark:text-red-400">Reason: {c.rejectionReason}</p>
                )}
                <div className="mt-4 flex gap-2">
                  <Link to={`/campaigns/${c._id}`} className="btn-secondary flex-1 text-xs">
                    View
                  </Link>
                  {c.status === 'active' && (
                    <Link to={`/ngo/campaigns/${c._id}/expenses/new`} className="btn-primary flex-1 text-xs">
                      Add expense
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
