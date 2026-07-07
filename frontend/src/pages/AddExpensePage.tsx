import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, Upload } from 'lucide-react';
import { PageLayout } from '../components/layout/PageLayout';
import { ProtectedRoute } from '../components/layout/ProtectedRoute';
import { campaignService } from '../services/campaignService';
import { expenseService } from '../services/donationService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { track } from '../services/analytics';
import { Campaign } from '../types';
import { formatXlm } from '../utils/format';

function AddExpenseForm() {
  const { campaignId: campaignIdFromRoute } = useParams<{ campaignId?: string }>();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignId, setCampaignId] = useState(campaignIdFromRoute || '');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    campaignService
      .myCampaignsForNgo(user.id)
      .then((results) => {
        setCampaigns(results.filter((c) => c.status === 'active' || c.status === 'completed'));
      })
      .finally(() => setLoadingCampaigns(false));
  }, [user]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) {
      showToast('Please attach a proof image', 'error');
      return;
    }
    if (!campaignId) {
      showToast('Select a campaign', 'error');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('campaignId', campaignId);
      formData.append('title', title);
      formData.append('amount', amount);
      formData.append('description', description);
      formData.append('proofImage', file);

      const expense = await expenseService.create(formData);
      track('expense_added', { campaignId, expenseId: expense._id, amount: parseFloat(amount) });
      showToast('Expense proof uploaded successfully', 'success');
      navigate('/ngo/dashboard');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to add expense', 'error');
    } finally {
      setLoading(false);
    }
  };

  const selectedCampaign = campaigns.find((c) => c._id === campaignId);

  return (
    <PageLayout>
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="font-display text-2xl font-bold text-ink-900 dark:text-white">Add expense proof</h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
          Show donors exactly how funds were used. This record is permanent.
        </p>

        <form onSubmit={handleSubmit} className="card mt-6 space-y-4 p-6">
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-500 dark:text-ink-400">Campaign</label>
            <select
              required
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
              className="input-field"
              disabled={loadingCampaigns}
            >
              <option value="">{loadingCampaigns ? 'Loading...' : 'Select a campaign'}</option>
              {campaigns.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title}
                </option>
              ))}
            </select>
            {selectedCampaign && (
              <p className="mt-1 text-xs text-ink-400">
                Raised: {formatXlm(selectedCampaign.raisedAmount)}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-ink-500 dark:text-ink-400">Expense title</label>
            <input required value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" placeholder="e.g. Water purification tablets" />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-ink-500 dark:text-ink-400">Amount spent (XLM)</label>
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-ink-500 dark:text-ink-400">Description</label>
            <textarea
              required
              minLength={10}
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field resize-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-ink-500 dark:text-ink-400">Proof image</label>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-ink-200 p-6 text-center hover:border-brand-400 dark:border-ink-700">
              {preview ? (
                <img src={preview} alt="Preview" className="h-32 w-full rounded-lg object-cover" />
              ) : (
                <>
                  <Upload className="mb-2 h-6 w-6 text-ink-400" />
                  <span className="text-sm text-ink-500 dark:text-ink-400">Click to upload receipt or photo</span>
                </>
              )}
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} className="hidden" />
            </label>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Uploading...' : 'Submit expense proof'}
          </button>
        </form>
      </div>
    </PageLayout>
  );
}

export default function AddExpensePage() {
  return (
    <ProtectedRoute allowedRoles={['ngo']}>
      <AddExpenseForm />
    </ProtectedRoute>
  );
}
