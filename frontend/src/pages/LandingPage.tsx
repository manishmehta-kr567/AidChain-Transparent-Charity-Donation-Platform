import { Link } from 'react-router-dom';
import {
  Heart, ShieldCheck, Eye, Wallet, TrendingUp, ArrowRight,
  UserPlus, FileCheck, HandCoins, Receipt,
} from 'lucide-react';
import { PageLayout } from '../components/layout/PageLayout';

const FEATURES = [
  { icon: ShieldCheck, title: 'On-chain transparency', desc: 'Every donation and expense is recorded on Stellar, independently verifiable by anyone.' },
  { icon: Wallet, title: 'Direct wallet-to-wallet', desc: 'Funds move straight from donor to NGO wallet — no custodial middleman holding your money.' },
  { icon: Eye, title: 'Expense proof gallery', desc: 'NGOs upload proof of spending; donors see exactly where their contribution went.' },
  { icon: TrendingUp, title: 'Real-time progress', desc: 'Live campaign progress bars and donation timelines, updated the moment funds arrive.' },
];

const STEPS = [
  { icon: UserPlus, title: 'NGO registers', desc: 'Organizations sign up and connect a Stellar testnet wallet.' },
  { icon: FileCheck, title: 'Campaign approved', desc: 'Admin reviews and approves the campaign before it goes live.' },
  { icon: HandCoins, title: 'Donors contribute', desc: 'Donors connect Freighter and send XLM directly to the NGO wallet.' },
  { icon: Receipt, title: 'Proof of impact', desc: 'NGOs upload expense proof so donors can track fund usage.' },
];

export default function LandingPage() {
  return (
    <PageLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 to-white dark:from-ink-900 dark:to-ink-950">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-900 dark:text-brand-300">
              <Heart className="h-3.5 w-3.5" fill="currentColor" /> Built on Stellar Testnet
            </span>
            <h1 className="font-display text-4xl font-bold tracking-tight text-ink-900 sm:text-5xl md:text-6xl dark:text-white">
              Give with certainty.<br />
              <span className="text-brand-600">Track every stroop.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-ink-500 dark:text-ink-400">
              AidChain lets donors fund verified NGO campaigns and follow their money on-chain,
              from wallet to real-world impact — no blind trust required.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link to="/campaigns" className="btn-primary px-6 py-3 text-base">
                Explore Campaigns <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/register" className="btn-secondary px-6 py-3 text-base">
                Register your NGO
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Problem / Solution */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2">
          <div className="card p-8">
            <h2 className="font-display text-xl font-bold text-ink-900 dark:text-white">The problem</h2>
            <p className="mt-3 text-ink-500 dark:text-ink-400">
              Donors rarely know what happens to their money after they give. Opaque intermediaries,
              delayed reporting, and a lack of verifiable records erode trust in charitable giving —
              and that mistrust means real needs go underfunded.
            </p>
          </div>
          <div className="card border-brand-200 bg-brand-50/50 p-8 dark:border-brand-900 dark:bg-brand-950/40">
            <h2 className="font-display text-xl font-bold text-ink-900 dark:text-white">Our solution</h2>
            <p className="mt-3 text-ink-500 dark:text-ink-400">
              AidChain routes every donation as a native Stellar payment straight to the NGO's wallet,
              logs campaign state on a Soroban smart contract, and requires expense proof for every
              withdrawal — so transparency isn't a promise, it's enforced by code.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-ink-50/60 py-20 dark:bg-ink-900/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center font-display text-3xl font-bold text-ink-900 dark:text-white">
            Why AidChain
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="card p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-900 dark:text-brand-300">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-ink-900 dark:text-white">{f.title}</h3>
                <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <h2 className="text-center font-display text-3xl font-bold text-ink-900 dark:text-white">
          How it works
        </h2>
        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <div key={step.title} className="relative text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-card">
                <step.icon className="h-6 w-6" />
              </div>
              <span className="mt-3 block text-xs font-bold text-brand-600">STEP {i + 1}</span>
              <h3 className="mt-1 font-semibold text-ink-900 dark:text-white">{step.title}</h3>
              <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="card flex flex-col items-center gap-4 bg-gradient-to-br from-brand-600 to-brand-800 p-12 text-center text-white">
          <h2 className="font-display text-3xl font-bold">Ready to give transparently?</h2>
          <p className="max-w-xl text-brand-100">
            Connect your Freighter wallet and fund a verified campaign in under a minute.
          </p>
          <Link to="/campaigns" className="mt-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-brand-700 shadow-card hover:bg-brand-50">
            Browse Campaigns
          </Link>
        </div>
      </section>
    </PageLayout>
  );
}
