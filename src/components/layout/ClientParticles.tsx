'use client';

import dynamic from 'next/dynamic';

const Particles = dynamic(() => import('@/components/layout/Particles'), { ssr: false });

interface ClientParticlesProps {
  quantity?: number;
  staticity?: number;
  ease?: number;
  comets?: boolean;
}

export default function ClientParticles({
  quantity,
  staticity,
  ease,
  comets,
}: ClientParticlesProps) {
  return <Particles quantity={quantity} staticity={staticity} ease={ease} comets={comets} />;
}
