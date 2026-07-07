import { QRCodeSVG } from 'qrcode.react';
import { Share2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const CampaignQrCode = ({ campaignId }: { campaignId: string }) => {
  const url = `${window.location.origin}/campaigns/${campaignId}`;
  const { showToast } = useToast();

  const copyLink = () => {
    navigator.clipboard.writeText(url);
    showToast('Campaign link copied to clipboard', 'success');
  };

  return (
    <div className="card flex flex-col items-center gap-4 p-6 text-center">
      <div className="rounded-xl border border-ink-100 bg-white p-3 dark:border-ink-800">
        <QRCodeSVG value={url} size={140} fgColor="#0d543e" />
      </div>
      <p className="text-xs text-ink-500 dark:text-ink-400">Scan to view or donate to this campaign</p>
      <button onClick={copyLink} className="btn-secondary w-full">
        <Share2 className="h-4 w-4" /> Copy link
      </button>
    </div>
  );
};
