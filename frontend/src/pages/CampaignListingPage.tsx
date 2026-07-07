import { useEffect, useState, useCallback } from 'react';
import { Search, Inbox } from 'lucide-react';
import { PageLayout } from '../components/layout/PageLayout';
import { CampaignCard } from '../components/campaign/CampaignCard';
import { CampaignGridSkeleton } from '../components/ui/Skeletons';
import { EmptyState, ErrorState } from '../components/ui/States';
import { campaignService } from '../services/campaignService';
import { Campaign, Pagination } from '../types';
import { CAMPAIGN_CATEGORIES_DISPLAY } from '../utils/categories';

export default function CampaignListingPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);

  // Debounce free-text search so we don't hit the backend on every
  // keystroke — only fetch 350ms after the user stops typing.
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timeout);
  }, [search]);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const { campaigns: results, pagination: pag } = await campaignService.list({
        status: 'active',
        search: debouncedSearch || undefined,
        category: category || undefined,
        page,
        limit: 9,
      });
      setCampaigns(results);
      setPagination(pag);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, category, page]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  return (
    <PageLayout>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-ink-900 dark:text-white">
            Active Campaigns
          </h1>
          <p className="mt-1 text-ink-500 dark:text-ink-400">
            Browse verified NGO campaigns and support causes you care about.
          </p>
        </div>

        <div className="mb-8 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              placeholder="Search campaigns..."
              className="input-field pl-10"
            />
          </div>
          <select
            value={category}
            onChange={(e) => {
              setPage(1);
              setCategory(e.target.value);
            }}
            className="input-field sm:w-56"
          >
            <option value="">All categories</option>
            {CAMPAIGN_CATEGORIES_DISPLAY.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {loading && <CampaignGridSkeleton count={9} />}

        {!loading && error && <ErrorState onRetry={fetchCampaigns} />}

        {!loading && !error && campaigns.length === 0 && (
          <EmptyState
            icon={<Inbox className="h-6 w-6" />}
            title="No campaigns found"
            description="Try adjusting your search or check back soon for new campaigns."
          />
        )}

        {!loading && !error && campaigns.length > 0 && (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {campaigns.map((c) => (
                <CampaignCard key={c._id} campaign={c} />
              ))}
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                {Array.from({ length: pagination.totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`h-9 w-9 rounded-lg text-sm font-medium ${
                      page === i + 1
                        ? 'bg-brand-600 text-white'
                        : 'text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </PageLayout>
  );
}
