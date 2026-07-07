import { Link } from 'react-router-dom';
import { MapPin, AlertTriangle } from 'lucide-react';
import { Campaign } from '../../types';
import { CampaignProgressBar } from './CampaignProgressBar';
import { VerifiedBadge } from './VerifiedBadge';
import { formatXlm, categoryLabel, progressPercent } from '../../utils/format';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1593113646773-028c64a8f1b8?auto=format&fit=crop&w=800&q=80';

export const CampaignCard = ({ campaign }: { campaign: Campaign }) => {
  const ngo = typeof campaign.ngoId === 'object' ? campaign.ngoId : null;
  const percent = campaign.progressPercent ?? progressPercent(campaign.raisedAmount, campaign.targetAmount);

  return (
    <Link
      to={`/campaigns/${campaign._id}`}
      className="card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-card-hover"
    >
      <div className="relative h-44 w-full overflow-hidden bg-ink-100">
        <img
          src={campaign.imageUrl || FALLBACK_IMAGE}
          alt={campaign.title}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          loading="lazy"
        />
        {campaign.riskFlagged && (
          <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-red-600 px-2 py-1 text-xs font-semibold text-white">
            <AlertTriangle className="h-3 w-3" /> Flagged
          </span>
        )}
        <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-ink-700 backdrop-blur">
          {categoryLabel(campaign.category)}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        {ngo && <VerifiedBadge verified={ngo.verified} />}

        <h3 className="line-clamp-2 font-display text-base font-semibold text-ink-900 dark:text-white">
          {campaign.title}
        </h3>

        <p className="line-clamp-2 text-sm text-ink-500 dark:text-ink-400">{campaign.description}</p>

        {campaign.location && (
          <div className="flex items-center gap-1 text-xs text-ink-400">
            <MapPin className="h-3 w-3" /> {campaign.location}
          </div>
        )}

        <div className="mt-auto space-y-2 pt-2">
          <CampaignProgressBar percent={percent} />
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-ink-900 dark:text-white">
              {formatXlm(campaign.raisedAmount)}
            </span>
            <span className="text-ink-400">of {formatXlm(campaign.targetAmount)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};
