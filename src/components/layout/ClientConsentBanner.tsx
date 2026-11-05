'use client';

import dynamic from 'next/dynamic';

const ConsentBanner = dynamic(
  () => import('@/components/layout/ConsentBanner').then((m) => m.ConsentBanner),
  { ssr: false },
);

export default function ClientConsentBanner() {
  return <ConsentBanner />;
}