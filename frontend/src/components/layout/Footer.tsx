import { Link } from 'react-router-dom';
import { Heart, Github, Twitter } from 'lucide-react';

export const Footer = () => (
  <footer className="border-t border-ink-100 bg-ink-50/60 dark:border-ink-800 dark:bg-ink-950">
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
        <div className="col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2 font-display text-lg font-bold text-ink-900 dark:text-white">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Heart className="h-3.5 w-3.5" fill="currentColor" />
            </span>
            AidChain
          </div>
          <p className="mt-3 text-sm text-ink-500 dark:text-ink-400">
            Transparent NGO donations, verifiable on Stellar.
          </p>
          <div className="mt-4 flex gap-3">
            <a href="#" className="text-ink-400 hover:text-brand-600" aria-label="GitHub">
              <Github className="h-4 w-4" />
            </a>
            <a href="#" className="text-ink-400 hover:text-brand-600" aria-label="Twitter">
              <Twitter className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-ink-900 dark:text-white">Platform</h4>
          <ul className="mt-3 space-y-2 text-sm text-ink-500 dark:text-ink-400">
            <li><Link to="/campaigns" className="hover:text-brand-600">Browse campaigns</Link></li>
            <li><Link to="/register" className="hover:text-brand-600">Register your NGO</Link></li>
            <li><Link to="/how-it-works" className="hover:text-brand-600">How it works</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-ink-900 dark:text-white">Resources</h4>
          <ul className="mt-3 space-y-2 text-sm text-ink-500 dark:text-ink-400">
            <li><a href="https://stellar.org" target="_blank" rel="noreferrer" className="hover:text-brand-600">Stellar Network</a></li>
            <li><a href="https://www.freighter.app" target="_blank" rel="noreferrer" className="hover:text-brand-600">Freighter Wallet</a></li>
            <li><Link to="/feedback" className="hover:text-brand-600">Give feedback</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-ink-900 dark:text-white">Company</h4>
          <ul className="mt-3 space-y-2 text-sm text-ink-500 dark:text-ink-400">
            <li><a href="#" className="hover:text-brand-600">About</a></li>
            <li><a href="#" className="hover:text-brand-600">Contact</a></li>
            <li><a href="#" className="hover:text-brand-600">Privacy</a></li>
          </ul>
        </div>
      </div>

      <div className="mt-10 border-t border-ink-200 pt-6 text-center text-xs text-ink-400 dark:border-ink-800">
        © {new Date().getFullYear()} AidChain. Built on Stellar Testnet for demonstration purposes.
      </div>
    </div>
  </footer>
);
