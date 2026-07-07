import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { PageLayout } from '../components/layout/PageLayout';
import { ProtectedRoute } from '../components/layout/ProtectedRoute';
import { campaignService } from '../services/campaignService';
import { useToast } from '../context/ToastContext';
import { track } from '../services/analytics';
import { CAMPAIGN_CATEGORIES_DISPLAY } from '../utils/categories';

function CreateCampaignForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CAMPAIGN_CATEGORIES_DISPLAY[0].value);
  const [targetAmount, setTargetAmount] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [location, setLocation] = useState('');
  const [impactGoal, setImpactGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const campaign = await campaignService.create({
        title,
        description,
        category,
        targetAmount: parseFloat(targetAmount),
        imageUrl: imageUrl || undefined,
        location: location || undefined,
        impactGoal: impactGoal || undefined,
      });
      track('campaign_created', { campaignId: campaign._id });
      showToast('Campaign submitted for admin approval', 'success');
      navigate('/ngo/dashboard');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create campaign', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout>
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="font-display text-2xl font-bold text-ink-900 dark:text-white">Create a campaign</h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
          Your campaign will go live once approved by an AidChain admin.
        </p>

        <form onSubmit={handleSubmit} className="card mt-6 space-y-4 p-6">
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-500 dark:text-ink-400">Title</label>
            <input required minLength={5} value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-ink-500 dark:text-ink-400">Description</label>
            <textarea
              required
              minLength={20}
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-500 dark:text-ink-400">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-field">
                {CAMPAIGN_CATEGORIES_DISPLAY.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-500 dark:text-ink-400">
                Target amount (XLM)
              </label>
              <input
                required
                type="number"
                min="1"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-ink-500 dark:text-ink-400">
              Cover image URL (optional)
            </label>
            <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="input-field" placeholder="https://..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-500 dark:text-ink-400">Location (optional)</label>
              <input value={location} onChange={(e) => setLocation(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-500 dark:text-ink-400">
                Impact goal (optional)
              </label>
              <input value={impactGoal} onChange={(e) => setImpactGoal(e.target.value)} className="input-field" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Submitting...' : 'Submit for approval'}
          </button>
        </form>
      </div>
    </PageLayout>
  );
}

export default function CreateCampaignPage() {
  return (
    <ProtectedRoute allowedRoles={['ngo']}>
      <CreateCampaignForm />
    </ProtectedRoute>
  );
}
