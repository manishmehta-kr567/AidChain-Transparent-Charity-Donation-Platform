import { cn } from '../../utils/format';

interface ProgressBarProps {
  percent: number;
  className?: string;
  showLabel?: boolean;
}

export const CampaignProgressBar = ({ percent, className, showLabel = false }: ProgressBarProps) => {
  const clamped = Math.min(100, Math.max(0, percent));

  return (
    <div className={className}>
      <div className="h-2 w-full overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            clamped >= 100 ? 'bg-brand-500' : 'bg-brand-600'
          )}
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      {showLabel && (
        <p className="mt-1 text-xs font-medium text-ink-500 dark:text-ink-400">{clamped}% funded</p>
      )}
    </div>
  );
};
