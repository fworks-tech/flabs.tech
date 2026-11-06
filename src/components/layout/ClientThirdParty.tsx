'use client';

import dynamic from 'next/dynamic';

const Analytics = dynamic(() => import('@vercel/analytics/next').then((m) => m.Analytics), {
  ssr: false,
});

const SpeedInsightsWithRedaction = dynamic(
  () => import('@/components/layout/SpeedInsightsWithRedaction').then((m) => m.SpeedInsightsWithRedaction),
  { ssr: false },
);

export default function ClientThirdParty() {
  return (
    <>
      <Analytics />
      <SpeedInsightsWithRedaction />
    </>
  );
}