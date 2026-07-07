import { ReactNode } from 'react';
import { cn } from '../../utils/format';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  accent?: 'brand' | 'blue' | 'amber' | 'red';
}

const ACCENTS = {
  brand: 'bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400',
  blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
  red: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
};

export const StatCard = ({ label, value, icon, trend, accent = 'brand' }: StatCardProps) => (
  <div className="card p-5">
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-ink-500 dark:text-ink-400">{label}</span>
      <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg', ACCENTS[accent])}>{icon}</span>
    </div>
    <p className="mt-3 font-display text-2xl font-bold text-ink-900 dark:text-white">{value}</p>
    {trend && <p className="mt-1 text-xs text-ink-400">{trend}</p>}
  </div>
);
