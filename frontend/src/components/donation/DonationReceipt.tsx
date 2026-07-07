import { CheckCircle2, ExternalLink, Download } from 'lucide-react';
import { Donation } from '../../types';
import { formatXlm, formatDateTime, truncateHash, stellarExplorerTxUrl } from '../../utils/format';

export const DonationReceipt = ({ donation, campaignTitle }: { donation: Donation; campaignTitle: string }) => {
  return (
    <div className="card mx-auto max-w-md overflow-hidden">
      <div className="flex flex-col items-center gap-3 bg-brand-50 px-6 py-8 text-center dark:bg-brand-950">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h2 className="font-display text-xl font-bold text-ink-900 dark:text-white">Thank you!</h2>
        <p className="text-sm text-ink-500 dark:text-ink-400">Your donation was recorded on Stellar Testnet.</p>
      </div>

      <div className="space-y-4 p-6">
        <Row label="Campaign" value={campaignTitle} />
        <Row label="Amount" value={formatXlm(donation.amount)} highlight />
        <Row label="Date" value={formatDateTime(donation.createdAt)} />
        <Row label="Status" value={donation.status} capitalize />
        <div className="flex items-center justify-between border-t border-ink-100 pt-4 dark:border-ink-800">
          <span className="text-sm text-ink-500 dark:text-ink-400">Transaction Hash</span>
          <a
            href={stellarExplorerTxUrl(donation.txHash)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline"
          >
            {truncateHash(donation.txHash)}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      <div className="border-t border-ink-100 p-6 dark:border-ink-800">
        <button onClick={() => window.print()} className="btn-secondary w-full">
          <Download className="h-4 w-4" /> Save receipt
        </button>
      </div>
    </div>
  );
};

const Row = ({
  label,
  value,
  highlight,
  capitalize,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  capitalize?: boolean;
}) => (
  <div className="flex items-center justify-between">
    <span className="text-sm text-ink-500 dark:text-ink-400">{label}</span>
    <span
      className={`text-sm font-medium ${highlight ? 'text-lg font-bold text-brand-600' : 'text-ink-900 dark:text-white'} ${
        capitalize ? 'capitalize' : ''
      }`}
    >
      {value}
    </span>
  </div>
);
