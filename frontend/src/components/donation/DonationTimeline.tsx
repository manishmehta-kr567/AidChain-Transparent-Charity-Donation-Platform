import { ExternalLink, Wallet } from 'lucide-react';
import { Donation } from '../../types';
import { formatXlm, formatDateTime, truncateWallet, truncateHash, stellarExplorerTxUrl } from '../../utils/format';
import { EmptyState } from '../ui/States';

export const DonationTimeline = ({ donations }: { donations: Donation[] }) => {
  if (donations.length === 0) {
    return (
      <EmptyState
        icon={<Wallet className="h-6 w-6" />}
        title="No donations yet"
        description="Be the first to support this campaign."
      />
    );
  }

  return (
    <ol className="relative space-y-6 border-l border-ink-200 pl-6 dark:border-ink-800">
      {donations.map((donation) => {
        const donor = typeof donation.donorId === 'object' ? donation.donorId.name : 'Anonymous donor';
        return (
          <li key={donation._id} className="relative">
            <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 border-white bg-brand-500 dark:border-ink-950" />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-ink-900 dark:text-white">
                  {donor} donated {formatXlm(donation.amount)}
                </p>
                <p className="text-xs text-ink-400">
                  {truncateWallet(donation.donorWallet)} · {formatDateTime(donation.createdAt)}
                </p>
              </div>
              <a
                href={stellarExplorerTxUrl(donation.txHash)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
              >
                {truncateHash(donation.txHash)} <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </li>
        );
      })}
    </ol>
  );
};
