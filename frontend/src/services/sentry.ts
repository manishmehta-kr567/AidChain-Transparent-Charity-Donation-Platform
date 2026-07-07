import * as Sentry from '@sentry/react';

export const initSentry = (): void => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) {
    console.warn('[sentry] VITE_SENTRY_DSN not set — frontend error monitoring disabled');
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
    tracesSampleRate: import.meta.env.PROD ? 0.2 : 1.0,
    replaysSessionSampleRate: 0.05,
    replaysOnErrorSampleRate: 1.0,
  });
};

/** Captures wallet-specific errors (Freighter connect/sign failures) with tagging so they're easy to filter in the Sentry dashboard. */
export const captureWalletError = (error: unknown, context: Record<string, unknown> = {}): void => {
  Sentry.captureException(error, { tags: { category: 'wallet' }, extra: context });
};

/** Captures donation-transaction errors (build/sign/submit failures) with tagging for the same reason. */
export const captureDonationError = (error: unknown, context: Record<string, unknown> = {}): void => {
  Sentry.captureException(error, { tags: { category: 'donation' }, extra: context });
};

export { Sentry };
