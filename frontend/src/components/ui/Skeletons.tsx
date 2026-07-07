export const CampaignCardSkeleton = () => (
  <div className="card overflow-hidden">
    <div className="skeleton h-44 w-full" />
    <div className="space-y-3 p-5">
      <div className="skeleton h-4 w-1/3 rounded-full" />
      <div className="skeleton h-5 w-4/5 rounded-full" />
      <div className="skeleton h-3 w-full rounded-full" />
      <div className="skeleton h-3 w-2/3 rounded-full" />
      <div className="skeleton h-2 w-full rounded-full" />
      <div className="flex justify-between">
        <div className="skeleton h-4 w-20 rounded-full" />
        <div className="skeleton h-4 w-20 rounded-full" />
      </div>
    </div>
  </div>
);

export const CampaignGridSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: count }).map((_, i) => (
      <CampaignCardSkeleton key={i} />
    ))}
  </div>
);

export const TextSkeleton = ({ className = 'h-4 w-full' }: { className?: string }) => (
  <div className={`skeleton rounded-full ${className}`} />
);

export const TableRowSkeleton = ({ columns = 4 }: { columns?: number }) => (
  <tr>
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <div className="skeleton h-4 w-full rounded-full" />
      </td>
    ))}
  </tr>
);
