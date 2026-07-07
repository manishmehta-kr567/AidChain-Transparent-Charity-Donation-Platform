import { ReactNode } from 'react';
import { Inbox, AlertCircle, RefreshCcw } from 'lucide-react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 bg-ink-50/50 px-6 py-16 text-center dark:border-ink-800 dark:bg-ink-900/40">
    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-ink-100 text-ink-400 dark:bg-ink-800">
      {icon || <Inbox className="h-6 w-6" />}
    </div>
    <h3 className="text-base font-semibold text-ink-800 dark:text-ink-100">{title}</h3>
    {description && (
      <p className="mt-1 max-w-sm text-sm text-ink-500 dark:text-ink-400">{description}</p>
    )}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export const ErrorState = ({
  title = 'Something went wrong',
  description = 'We could not load this data. Please try again.',
  onRetry,
}: ErrorStateProps) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50/60 px-6 py-16 text-center dark:border-red-900 dark:bg-red-950/30">
    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-500 dark:bg-red-900">
      <AlertCircle className="h-6 w-6" />
    </div>
    <h3 className="text-base font-semibold text-red-800 dark:text-red-200">{title}</h3>
    <p className="mt-1 max-w-sm text-sm text-red-600 dark:text-red-300">{description}</p>
    {onRetry && (
      <button onClick={onRetry} className="btn-secondary mt-5">
        <RefreshCcw className="h-4 w-4" />
        Try again
      </button>
    )}
  </div>
);
