import { useState } from 'react';
import { ExternalLink, Receipt, ShieldCheck, X } from 'lucide-react';
import { Expense } from '../../types';
import { formatXlm, formatDateTime, truncateHash, stellarExplorerTxUrl } from '../../utils/format';
import { EmptyState } from '../ui/States';

export const ExpenseProofGallery = ({ expenses }: { expenses: Expense[] }) => {
  const [selected, setSelected] = useState<Expense | null>(null);

  if (expenses.length === 0) {
    return (
      <EmptyState
        icon={<Receipt className="h-6 w-6" />}
        title="No expense proofs yet"
        description="The NGO hasn't uploaded any expense records for this campaign."
      />
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {expenses.map((expense) => (
          <button
            key={expense._id}
            onClick={() => setSelected(expense)}
            className="card group overflow-hidden text-left transition hover:-translate-y-0.5 hover:shadow-card-hover"
          >
            <div className="h-40 w-full overflow-hidden bg-ink-100">
              <img
                src={expense.proofImageUrl}
                alt={expense.title}
                className="h-full w-full object-cover transition group-hover:scale-105"
                loading="lazy"
              />
            </div>
            <div className="space-y-1.5 p-4">
              <div className="flex items-center justify-between">
                <h4 className="line-clamp-1 text-sm font-semibold text-ink-900 dark:text-white">
                  {expense.title}
                </h4>
                <span className="flex items-center gap-1 text-xs font-medium text-brand-600">
                  <ShieldCheck className="h-3.5 w-3.5" /> Verified
                </span>
              </div>
              <p className="text-sm font-bold text-ink-800 dark:text-ink-100">{formatXlm(expense.amount)}</p>
              <p className="text-xs text-ink-400">{formatDateTime(expense.createdAt)}</p>
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="card max-h-[90vh] w-full max-w-lg overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <img src={selected.proofImageUrl} alt={selected.title} className="max-h-80 w-full object-cover" />
              <button
                onClick={() => setSelected(null)}
                className="absolute right-3 top-3 rounded-full bg-black/50 p-1.5 text-white"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3 p-6">
              <h3 className="font-display text-lg font-bold text-ink-900 dark:text-white">{selected.title}</h3>
              <p className="text-sm text-ink-500 dark:text-ink-400">{selected.description}</p>
              <div className="flex items-center justify-between border-t border-ink-100 pt-3 text-sm dark:border-ink-800">
                <span className="text-ink-500">Amount spent</span>
                <span className="font-bold text-ink-900 dark:text-white">{formatXlm(selected.amount)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-500">Proof hash (on-chain)</span>
                <span className="font-mono text-xs text-ink-700 dark:text-ink-300">
                  {truncateHash(selected.proofHash, 8)}
                </span>
              </div>
              {selected.txHash && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-500">Transaction</span>
                  <a
                    href={stellarExplorerTxUrl(selected.txHash)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 font-medium text-brand-600 hover:underline"
                  >
                    {truncateHash(selected.txHash)} <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
