import { useEffect, useState, useCallback } from 'react';
import {
  Users, HandCoins, Layers, Star, ShieldAlert, Check, X, Flag,
} from 'lucide-react';
import { PageLayout } from '../components/layout/PageLayout';
import { ProtectedRoute } from '../components/layout/ProtectedRoute';
import { StatCard } from '../components/dashboard/StatCard';
import { EmptyState } from '../components/ui/States';
import { TableRowSkeleton } from '../components/ui/Skeletons';
import { adminService } from '../services/donationService';
import { campaignService } from '../services/campaignService';
import { useToast } from '../context/ToastContext';
import { track } from '../services/analytics';
import { AdminStats, Campaign } from '../types';
import { formatXlm, formatDate, categoryLabel } from '../utils/format';

function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pendingCampaigns, setPendingCampaigns] = useState<Campaign[]>([]);
  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'pending' | 'all'>('pending');
  const { showToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, pendingData, allData] = await Promise.all([
        adminService.getStats(),
        campaignService.list({ status: 'pending', limit: 50 }),
        campaignService.list({ status: 'all', limit: 50 }),
      ]);
      setStats(statsData);
      setPendingCampaigns(pendingData.campaigns);
      setAllCampaigns(allData.campaigns);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to load admin data', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleApprove = async (campaign: Campaign) => {
    try {
      await campaignService.approve(campaign._id);
      track('campaign_approved', { campaignId: campaign._id });
      showToast('Campaign approved', 'success');
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to approve campaign', 'error');
    }
  };

  const handleReject = async (campaign: Campaign) => {
    const reason = window.prompt('Reason for rejection (optional):') || undefined;
    try {
      await campaignService.reject(campaign._id, reason);
      showToast('Campaign rejected', 'success');
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to reject campaign', 'error');
    }
  };

  const handleFlag = async (campaign: Campaign) => {
    const reason = campaign.riskFlagged ? undefined : window.prompt('Reason for flagging this campaign:') || 'Manual review';
    try {
      await campaignService.flag(campaign._id, !campaign.riskFlagged, reason);
      showToast(campaign.riskFlagged ? 'Flag removed' : 'Campaign flagged for review', 'success');
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update flag', 'error');
    }
  };

  const list = tab === 'pending' ? pendingCampaigns : allCampaigns;

  return (
    <PageLayout>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="font-display text-2xl font-bold text-ink-900 dark:text-white">Admin dashboard</h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Platform-wide overview and campaign moderation</p>

        {stats && (
          <div className="mb-8 mt-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
            <StatCard label="Total users" value={stats.users.total} icon={<Users className="h-4 w-4" />} />
            <StatCard label="Total donated" value={formatXlm(stats.donations.totalAmount)} icon={<HandCoins className="h-4 w-4" />} accent="blue" />
            <StatCard label="Active campaigns" value={stats.campaigns.active} icon={<Layers className="h-4 w-4" />} accent="amber" />
            <StatCard label="Unique donor wallets" value={stats.donations.uniqueWallets} icon={<ShieldAlert className="h-4 w-4" />} />
            <StatCard
              label="Avg. feedback rating"
              value={stats.feedback.averageRating ? stats.feedback.averageRating.toFixed(1) : '—'}
              icon={<Star className="h-4 w-4" />}
              accent="amber"
              trend={`${stats.feedback.totalResponses} responses`}
            />
          </div>
        )}

        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setTab('pending')}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === 'pending' ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300'}`}
          >
            Pending approval ({pendingCampaigns.length})
          </button>
          <button
            onClick={() => setTab('all')}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === 'all' ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300'}`}
          >
            All campaigns ({allCampaigns.length})
          </button>
        </div>

        <div className="card overflow-hidden">
          {loading ? (
            <table className="w-full">
              <tbody>
                {Array.from({ length: 4 }).map((_, i) => (
                  <TableRowSkeleton key={i} columns={5} />
                ))}
              </tbody>
            </table>
          ) : list.length === 0 ? (
            <div className="p-6">
              <EmptyState title="Nothing here" description="No campaigns to show in this view." />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-ink-50 text-left text-xs uppercase text-ink-500 dark:bg-ink-900 dark:text-ink-400">
                  <tr>
                    <th className="px-6 py-3">Campaign</th>
                    <th className="px-6 py-3">Category</th>
                    <th className="px-6 py-3">Target</th>
                    <th className="px-6 py-3">Created</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                  {list.map((c) => (
                    <tr key={c._id}>
                      <td className="px-6 py-4 font-medium text-ink-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          {c.title}
                          {c.riskFlagged && <Flag className="h-3.5 w-3.5 text-red-500" />}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-ink-500 dark:text-ink-400">{categoryLabel(c.category)}</td>
                      <td className="px-6 py-4 text-ink-500 dark:text-ink-400">{formatXlm(c.targetAmount)}</td>
                      <td className="px-6 py-4 text-ink-500 dark:text-ink-400">{formatDate(c.createdAt)}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {c.status === 'pending' && (
                            <>
                              <button onClick={() => handleApprove(c)} className="rounded-lg bg-brand-50 p-1.5 text-brand-600 hover:bg-brand-100 dark:bg-brand-950" aria-label="Approve">
                                <Check className="h-4 w-4" />
                              </button>
                              <button onClick={() => handleReject(c)} className="rounded-lg bg-red-50 p-1.5 text-red-600 hover:bg-red-100 dark:bg-red-950" aria-label="Reject">
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          {c.status !== 'pending' && (
                            <button
                              onClick={() => handleFlag(c)}
                              className={`rounded-lg p-1.5 ${c.riskFlagged ? 'bg-red-100 text-red-600' : 'bg-ink-100 text-ink-500 hover:bg-ink-200'} dark:bg-ink-800`}
                              aria-label="Toggle risk flag"
                            >
                              <Flag className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminDashboard />
    </ProtectedRoute>
  );
}
