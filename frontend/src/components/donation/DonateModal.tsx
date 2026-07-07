import { useState } from 'react';
import { X, Loader2, Wallet as WalletIcon } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { useToast } from '../../context/ToastContext';
import { sendDonation, StellarPaymentError } from '../../services/stellar';
import { donationService } from '../../services/donationService';
import { track } from '../../services/analytics';
import { captureDonationError } from '../../services/sentry';
import { Campaign, Donation } from '../../types';
import { formatXlm } from '../../utils/format';

interface DonateModalProps {
  campaign: Campaign;
  onClose: () => void;
  onSuccess: (donation: Donation) => void;
}

const PRESET_AMOUNTS = [10, 50, 100, 500];

export const DonateModal = ({ campaign, onClose, onSuccess }: DonateModalProps) => {
  const [amount, setAmount] = useState('50');
  const [step, setStep] = useState<'input' | 'signing' | 'submitting' | 'saving'>('input');
  const [error, setError] = useState<string | null>(null);
  const { publicKey, connect, connecting } = useWallet();
  const { showToast } = useToast();

  const ngo = typeof campaign.ngoId === 'object' ? campaign.ngoId : null;
  const ngoWallet = ngo?.walletAddress;

  const isBusy = step !== 'input';

  const handleDonate = async () => {
    setError(null);
    const numericAmount = parseFloat(amount);

    if (!numericAmount || numericAmount <= 0) {
      setError('Enter a valid amount greater than 0.');
      return;
    }
    if (!publicKey) {
      setError('Connect your Freighter wallet first.');
      return;
    }
    if (!ngoWallet) {
      setError("This campaign's NGO has not linked a payout wallet yet.");
      return;
    }

    track('donation_started', { campaignId: campaign._id, amount: numericAmount });

    try {
      setStep('signing');
      const { txHash } = await sendDonation(publicKey, ngoWallet, numericAmount.toFixed(7));

      setStep('saving');
      const donation = await donationService.create(campaign._id, txHash, numericAmount);

      track('donation_success', { campaignId: campaign._id, amount: numericAmount, txHash });
      showToast('Donation successful — thank you!', 'success');
      onSuccess(donation);
    } catch (err) {
      captureDonationError(err, { campaignId: campaign._id, amount: numericAmount });
      const message =
        err instanceof StellarPaymentError
          ? err.message
          : err instanceof Error
          ? err.message
          : 'Donation failed. Please try again.';
      setError(message);
      setStep('input');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-ink-900 dark:text-white">Donate to campaign</h2>
          <button onClick={onClose} className="rounded-full p-1 text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 line-clamp-1 text-sm text-ink-500 dark:text-ink-400">{campaign.title}</p>

        {!publicKey ? (
          <button onClick={() => connect()} disabled={connecting} className="btn-primary w-full">
            {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <WalletIcon className="h-4 w-4" />}
            {connecting ? 'Connecting...' : 'Connect Freighter Wallet'}
          </button>
        ) : (
          <>
            <div className="mb-4 grid grid-cols-4 gap-2">
              {PRESET_AMOUNTS.map((preset) => (
                <button
                  key={preset}
                  onClick={() => setAmount(String(preset))}
                  disabled={isBusy}
                  className={`rounded-xl border px-2 py-2 text-sm font-semibold transition ${
                    amount === String(preset)
                      ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-950'
                      : 'border-ink-200 text-ink-600 hover:border-brand-300 dark:border-ink-700 dark:text-ink-300'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            <label className="mb-1 block text-xs font-medium text-ink-500 dark:text-ink-400">
              Amount (XLM)
            </label>
            <input
              type="number"
              min="0.0000001"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isBusy}
              className="input-field mb-4"
              placeholder="Enter amount"
            />

            {error && (
              <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
                {error}
              </p>
            )}

            <button onClick={handleDonate} disabled={isBusy} className="btn-primary w-full">
              {isBusy && <Loader2 className="h-4 w-4 animate-spin" />}
              {step === 'input' && `Donate ${formatXlm(parseFloat(amount) || 0)}`}
              {step === 'signing' && 'Confirm in Freighter...'}
              {step === 'submitting' && 'Submitting to Stellar...'}
              {step === 'saving' && 'Saving donation record...'}
            </button>

            <p className="mt-3 text-center text-xs text-ink-400">
              Funds are sent directly to the NGO's Stellar testnet wallet. This is not real currency.
            </p>
          </>
        )}
      </div>
    </div>
  );
};
