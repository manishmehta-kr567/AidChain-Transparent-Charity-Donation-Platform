import posthog from 'posthog-js';

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';

export const initAnalytics = (): void => {
  if (!POSTHOG_KEY) {
    console.warn('[analytics] VITE_POSTHOG_KEY not set — analytics disabled');
    return;
  }

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: true,
  });
};

export const identifyUser = (userId: string, traits: Record<string, unknown> = {}): void => {
  if (!POSTHOG_KEY) return;
  posthog.identify(userId, traits);
};

export const resetAnalyticsUser = (): void => {
  if (!POSTHOG_KEY) return;
  posthog.reset();
};

/**
 * Central event name registry, matching the analytics events required by
 * the spec exactly. Using a typed union here prevents typo'd event names
 * from silently going untracked.
 */
export type AnalyticsEvent =
  | 'user_registered'
  | 'wallet_connected'
  | 'campaign_created'
  | 'campaign_approved'
  | 'campaign_viewed'
  | 'donation_started'
  | 'donation_success'
  | 'expense_added'
  | 'feedback_submitted';

export const track = (event: AnalyticsEvent, properties: Record<string, unknown> = {}): void => {
  if (!POSTHOG_KEY) {
    console.log(`[analytics:dev] ${event}`, properties);
    return;
  }
  posthog.capture(event, properties);
};
