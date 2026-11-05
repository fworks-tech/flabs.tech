'use client';

import dynamic from 'next/dynamic';

const AiAssistant = dynamic(() => import('@/components/ai').then((m) => m.AiAssistant), {
  ssr: false,
});

export default function ClientAiAssistant() {
  return <AiAssistant />;
}