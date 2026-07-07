import { useState, FormEvent } from 'react';
import { Star, MessageSquareHeart } from 'lucide-react';
import { PageLayout } from '../components/layout/PageLayout';
import { ProtectedRoute } from '../components/layout/ProtectedRoute';
import { useToast } from '../context/ToastContext';
import { feedbackService } from '../services/donationService';
import { track } from '../services/analytics';
import { cn } from '../utils/format';

function FeedbackForm() {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      showToast('Please select a star rating', 'error');
      return;
    }
    if (message.trim().length < 3) {
      showToast('Please share a few words of feedback', 'error');
      return;
    }

    setLoading(true);
    try {
      await feedbackService.submit(rating, message.trim());
      track('feedback_submitted', { rating });
      setSubmitted(true);
      showToast('Thank you for your feedback!', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not submit feedback', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="card flex flex-col items-center gap-3 p-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-900">
          <MessageSquareHeart className="h-7 w-7" />
        </div>
        <h2 className="font-display text-xl font-bold text-ink-900 dark:text-white">Thanks for sharing!</h2>
        <p className="text-sm text-ink-500 dark:text-ink-400">
          Your feedback helps us make AidChain better for donors and NGOs alike.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-5 p-8">
      <div>
        <label className="mb-2 block text-sm font-medium text-ink-700 dark:text-ink-300">
          How would you rate your experience?
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-1"
              aria-label={`${star} star`}
            >
              <Star
                className={cn(
                  'h-8 w-8 transition',
                  (hoverRating || rating) >= star
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-ink-200 dark:text-ink-700'
                )}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-ink-700 dark:text-ink-300">
          Tell us more
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          maxLength={1000}
          className="input-field resize-none"
          placeholder="What did you like? What could be better?"
        />
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? 'Submitting...' : 'Submit feedback'}
      </button>
    </form>
  );
}

export default function FeedbackPage() {
  return (
    <PageLayout>
      <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-bold text-ink-900 dark:text-white">
            We'd love your feedback
          </h1>
          <p className="mt-2 text-ink-500 dark:text-ink-400">
            Help us improve AidChain for donors and NGOs.
          </p>
        </div>
        <ProtectedRoute>
          <FeedbackForm />
        </ProtectedRoute>
      </div>
    </PageLayout>
  );
}
