import { BadgeCheck, Clock } from 'lucide-react';
import { cn } from '../../utils/format';

export const VerifiedBadge = ({ verified, size = 'sm' }: { verified: boolean; size?: 'sm' | 'md' }) => {
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return verified ? (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 font-medium text-brand-700 dark:bg-brand-950 dark:text-brand-300',
        textSize
      )}
    >
      <BadgeCheck className={iconSize} />
      Verified NGO
    </span>
  ) : (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300',
        textSize
      )}
    >
      <Clock className={iconSize} />
      Pending Verification
    </span>
  );
};
