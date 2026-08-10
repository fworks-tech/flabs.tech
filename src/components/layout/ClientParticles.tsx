'use client';

import { useSyncExternalStore } from 'react';
import dynamic from 'next/dynamic';

const Particles = dynamic(() => import('@/components/layout/Particles'), { ssr: false });

interface ClientParticlesProps {
  quantity?: number;
  staticity?: number;
  ease?: number;
  comets?: boolean;
}

function getDesktopQuery() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(min-width: 768px)');
}

function subscribeToDesktop(callback: () => void) {
  const mq = getDesktopQuery();
  if (!mq) return () => {};
  mq.addEventListener('change', callback);
  return () => mq.removeEventListener('change', callback);
}

function getDesktopSnapshot() {
  const mq = getDesktopQuery();
  return mq ? mq.matches : false;
}

export default function ClientParticles({
  quantity,
  staticity,
  ease,
  comets,
}: ClientParticlesProps) {
  const isDesktop = useSyncExternalStore(subscribeToDesktop, getDesktopSnapshot, () => false);

  if (!isDesktop) return null;

  return <Particles quantity={quantity} staticity={staticity} ease={ease} comets={comets} />;
}
