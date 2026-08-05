import posthog from 'posthog-js';

const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

if (!key) {
  // Warn instead of throwing so `next dev` (and the e2e suite that boots it)
  // stays functional when PostHog is not configured — analytics are simply
  // disabled. Production is a silent no-op.
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      'NEXT_PUBLIC_POSTHOG_KEY variable required by PostHog is missing or un-configured, events will be silently missed',
    );
  }
} else if (!host) {
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      'NEXT_PUBLIC_POSTHOG_HOST variable required by PostHog is missing or un-configured, events will be silently missed',
    );
  }
} else {
  posthog.init(key, {
    api_host: host,
    defaults: '2026-01-30',
    capture_exceptions: true,
    debug: process.env.NODE_ENV === 'development',
  });
}
