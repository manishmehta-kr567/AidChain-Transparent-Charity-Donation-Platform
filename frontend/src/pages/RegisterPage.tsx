import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Loader2 } from 'lucide-react';
import { PageLayout } from '../components/layout/PageLayout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { UserRole } from '../types';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('donor');
  const [organizationName, setOrganizationName] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register({
        name,
        email,
        password,
        role,
        organizationName: role === 'ngo' ? organizationName : undefined,
      });
      showToast('Account created! Welcome to AidChain.', 'success');
      navigate(role === 'ngo' ? '/ngo/dashboard' : '/dashboard');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout>
      <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-16">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white">
            <Heart className="h-6 w-6" fill="currentColor" />
          </span>
          <h1 className="font-display text-2xl font-bold text-ink-900 dark:text-white">Create your account</h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Join AidChain as a donor or NGO</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4 p-6">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRole('donor')}
              className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                role === 'donor'
                  ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-950'
                  : 'border-ink-200 text-ink-600 dark:border-ink-700 dark:text-ink-300'
              }`}
            >
              I'm a Donor
            </button>
            <button
              type="button"
              onClick={() => setRole('ngo')}
              className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                role === 'ngo'
                  ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-950'
                  : 'border-ink-200 text-ink-600 dark:border-ink-700 dark:text-ink-300'
              }`}
            >
              I'm an NGO
            </button>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-ink-500 dark:text-ink-400">
              {role === 'ngo' ? 'Contact name' : 'Full name'}
            </label>
            <input required value={name} onChange={(e) => setName(e.target.value)} className="input-field" />
          </div>

          {role === 'ngo' && (
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-500 dark:text-ink-400">
                Organization name
              </label>
              <input
                required
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                className="input-field"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-ink-500 dark:text-ink-400">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-500 dark:text-ink-400">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="At least 8 characters"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-500 dark:text-ink-400">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </PageLayout>
  );
}
