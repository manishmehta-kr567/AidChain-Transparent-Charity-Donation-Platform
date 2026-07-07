import { useEffect, useState, useCallback, ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, Target, Users, Flag } from 'lucide-react';
import { PageLayout } from '../components/layout/PageLayout';
import { CampaignProgressBar } from '../components/campaign/CampaignProgressBar';
import { VerifiedBadge } from '../components/campaign/VerifiedBadge';
import { DonationTimeline } from '../components/donation/DonationTimeline';
import { ExpenseProofGallery } from '../components/donation/ExpenseProofGallery';
import { DonateModal } from '../components/donation/DonateModal';
import { DonationReceipt } from '../components/donation/DonationReceipt';
import { CampaignQrCode } from '../components/dashboard/CampaignQrCode';
import { TextSkeleton } from '../components/ui/Skeletons';
import { ErrorState } from '../components/ui/States';
import { campaignService } from '../services/campaignService';
import { donationService, expenseService } from '../services/donationService';
import { Campaign, Donation, Expense } from '../types';
import { formatXlm, categoryLabel, progressPercent } from '../utils/format';
import { track } from '../services/analytics';

type Tab = 'timeline' | 'expenses';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1593113646773-028c64a8f1b8?auto=format&fit=crop&w=1200&q=80';

export default function CampaignDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [tab, setTab] = useState<Tab>('timeline');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showDonate, setShowDonate] = useState(false);
  const [receipt, setReceipt] = useState<Donation | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(false);
    try {
      const [campaignData, donationData, expenseData] = await Promise.all([
        campaignService.getById(id),
        donationService.getForCampaign(id),
        expenseService.getForCampaign(id),
      ]);
      setCampaign(campaignData);
      setDonations(donationData);
      setExpenses(expenseData);
      track('campaign_viewed', { campaignId: id });
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <PageLayout>
        <div className="mx-auto max-w-5xl space-y-4 px-4 py-12 sm:px-6 lg:px-8">
          <TextSkeleton className="h-72 w-full rounded-2xl" />
          <TextSkeleton className="h-8 w-2/3" />
          <TextSkeleton className="h-4 w-full" />
          <TextSkeleton className="h-4 w-1/2" />
        </div>
      </PageLayout>
    );
  }

  if (error || !campaign) {
    return (
      <PageLayout>
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <ErrorState title="Campaign not found" description="This campaign may have been removed or the link is incorrect." onRetry={load} />
        </div>
      </PageLayout>
    );
  }

  const ngo = typeof campaign.ngoId === 'object' ? campaign.ngoId : null;
  const percent = campaign.progressPercent ?? progressPercent(campaign.raisedAmount, campaign.targetAmount);

  return (
    <PageLayout>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {campaign.riskFlagged && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            <Flag className="h-4 w-4" /> This campaign has been flagged for review by AidChain admins.
          </div>
        )}

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="mb-6 h-72 w-full overflow-hidden rounded-2xl bg-ink-100">
              <img
                src={campaign.imageUrl || FALLBACK_IMAGE}
                alt={campaign.title}
                className="h-full w-full object-cover"
              />
            </div>

            <span className="mb-3 inline-block rounded-full bg-ink-100 px-3 py-1 text-xs font-medium text-ink-600 dark:bg-ink-800 dark:text-ink-300">
              {categoryLabel(campaign.category)}
            </span>
            <h1 className="font-display text-3xl font-bold text-ink-900 dark:text-white">{campaign.title}</h1>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              {ngo && <VerifiedBadge verified={ngo.verified} />}
              {campaign.location && (
                <span className="flex items-center gap-1 text-sm text-ink-500 dark:text-ink-400">
                  <MapPin className="h-3.5 w-3.5" /> {campaign.location}
                </span>
              )}
              {ngo && (
                <span className="text-sm text-ink-500 dark:text-ink-400">
                  by {ngo.organizationName || ngo.name}
                </span>
              )}
            </div>

            <p className="mt-6 whitespace-pre-line text-ink-600 dark:text-ink-300">{campaign.description}</p>

            {campaign.impactGoal && (
              <div className="mt-6 rounded-xl bg-brand-50 p-4 dark:bg-brand-950">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-brand-800 dark:text-brand-300">
                  <Target className="h-4 w-4" /> Impact goal
                </h3>
                <p className="mt-1 text-sm text-brand-700 dark:text-brand-400">{campaign.impactGoal}</p>
              </div>
            )}

            <div className="mt-10 border-b border-ink-100 dark:border-ink-800">
              <div className="flex gap-6">
                <TabButton active={tab === 'timeline'} onClick={() => setTab('timeline')}>
                  Donation Timeline ({donations.length})
                </TabButton>
                <TabButton active={tab === 'expenses'} onClick={() => setTab('expenses')}>
                  Expense Proofs ({expenses.length})
                </TabButton>
              </div>
            </div>

            <div className="pt-6">
              {tab === 'timeline' ? (
                <DonationTimeline donations={donations} />
              ) : (
                <ExpenseProofGallery expenses={expenses} />
              )}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="card sticky top-24 p-6">
              <CampaignProgressBar percent={percent} className="mb-4" />
              <div className="flex items-baseline justify-between">
                <span className="font-display text-2xl font-bold text-ink-900 dark:text-white">
                  {formatXlm(campaign.raisedAmount)}
                </span>
                <span className="text-sm text-ink-400">raised of {formatXlm(campaign.targetAmount)}</span>
              </div>
              <div className="mt-2 flex items-center gap-1 text-sm text-ink-500 dark:text-ink-400">
                <Users className="h-3.5 w-3.5" /> {donations.length} donation{donations.length !== 1 && 's'}
              </div>

              {campaign.status === 'active' ? (
                <button onClick={() => setShowDonate(true)} className="btn-primary mt-6 w-full py-3">
                  Donate now
                </button>
              ) : (
                <div className="mt-6 rounded-xl bg-ink-100 px-4 py-3 text-center text-sm font-medium capitalize text-ink-600 dark:bg-ink-800 dark:text-ink-300">
                  Campaign {campaign.status}
                </div>
              )}
            </div>

            <CampaignQrCode campaignId={campaign._id} />
          </aside>
        </div>
      </div>

      {showDonate && (
        <DonateModal
          campaign={campaign}
          onClose={() => setShowDonate(false)}
          onSuccess={(donation) => {
            setShowDonate(false);
            setReceipt(donation);
            load();
          }}
        />
      )}

      {receipt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setReceipt(null)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <DonationReceipt donation={receipt} campaignTitle={campaign.title} />
            <div className="mt-4 text-center">
              <button onClick={() => setReceipt(null)} className="text-sm font-medium text-white hover:underline">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}

const TabButton = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) => (
  <button
    onClick={onClick}
    className={`border-b-2 pb-3 text-sm font-medium transition ${
      active
        ? 'border-brand-600 text-brand-600'
        : 'border-transparent text-ink-500 hover:text-ink-800 dark:text-ink-400 dark:hover:text-ink-200'
    }`}
  >
    {children}
  </button>
);
