import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HandCoins, TrendingUp, Layers, ExternalLink, Download } from 'lucide-react';
import { PageLayout } from '../components/layout/PageLayout';
import { StatCard } from '../components/dashboard/StatCard';
import { EmptyState } from '../components/ui/States';
import { TableRowSkeleton } from '../components/ui/Skeletons';
import { useAuth } from '../context/AuthContext';
import { donationService } from '../services/donationService';
import { Donation } from '../types';
import { formatXlm, formatDateTime, truncateHash, stellarExplorerTxUrl } from '../utils/format';

export default function DonorDashboardPage() {
  const { user } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    donationService
      .getMine()
      .then(setDonations)
      .finally(() => setLoading(false));
  }, []);

  const totalDonated = donations.reduce((sum, d) => sum + d.amount, 0);
  const campaignsSupported = new Set(
    donations.map((d) => (typeof d.campaignId === 'object' ? d.campaignId._id : d.campaignId))
  ).size;

  const exportCsv = () => {
    const header = 'Date,Campaign,Amount (XLM),Status,Transaction Hash\n';
    const rows = donations
      .map((d) => {
        const campaignTitle = typeof d.campaignId === 'object' ? d.campaignId.title : d.campaignId;
        return `${d.createdAt},${campaignTitle},${d.amount},${d.status},${d.txHash}`;
      })
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'aidchain-donations.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PageLayout>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink-900 dark:text-white">
              Welcome back, {user?.name?.split(' ')[0]}
            </h1>
            <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Your donor impact dashboard</p>
          </div>
          {donations.length > 0 && (
            <button onClick={exportCsv} className="btn-secondary">
              <Download className="h-4 w-4" /> Export CSV
            </button>
          )}
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Total donated" value={formatXlm(totalDonated)} icon={<HandCoins className="h-4 w-4" />} />
          <StatCard label="Campaigns supported" value={campaignsSupported} icon={<Layers className="h-4 w-4" />} accent="blue" />
          <StatCard label="Total donations made" value={donations.length} icon={<TrendingUp className="h-4 w-4" />} accent="amber" />
        </div>

        <div className="card overflow-hidden">
          <div className="border-b border-ink-100 px-6 py-4 dark:border-ink-800">
            <h2 className="font-semibold text-ink-900 dark:text-white">Donation history</h2>
          </div>

          {loading ? (
            <table className="w-full">
              <tbody>
                {Array.from({ length: 4 }).map((_, i) => (
                  <TableRowSkeleton key={i} columns={4} />
                ))}
              </tbody>
            </table>
          ) : donations.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={<HandCoins className="h-6 w-6" />}
                title="No donations yet"
                description="Explore campaigns and make your first transparent donation."
                action={
                  <Link to="/campaigns" className="btn-primary">
                    Browse campaigns
                  </Link>
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-ink-50 text-left text-xs uppercase text-ink-500 dark:bg-ink-900 dark:text-ink-400">
                  <tr>
                    <th className="px-6 py-3">Campaign</th>
                    <th className="px-6 py-3">Amount</th>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Tx Hash</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                  {donations.map((d) => {
                    const campaign = typeof d.campaignId === 'object' ? d.campaignId : null;
                    return (
                      <tr key={d._id}>
                        <td className="px-6 py-4">
                          {campaign ? (
                            <Link to={`/campaigns/${campaign._id}`} className="font-medium text-ink-900 hover:text-brand-600 dark:text-white">
                              {campaign.title}
                            </Link>
                          ) : (
                            'Campaign removed'
                          )}
                        </td>
                        <td className="px-6 py-4 font-semibold text-ink-900 dark:text-white">{formatXlm(d.amount)}</td>
                        <td className="px-6 py-4 text-ink-500 dark:text-ink-400">{formatDateTime(d.createdAt)}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                              d.status === 'success'
                                ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                                : d.status === 'pending'
                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
                            }`}
                          >
                            {d.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <a
                            href={stellarExplorerTxUrl(d.txHash)}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 font-medium text-brand-600 hover:underline"
                          >
                            {truncateHash(d.txHash)} <ExternalLink className="h-3 w-3" />
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
