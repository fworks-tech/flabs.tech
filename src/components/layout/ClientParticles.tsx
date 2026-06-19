"use client";

import dynamic from "next/dynamic";

const Particles = dynamic(() => import("@/components/layout/Particles"), { ssr: false });

interface ClientParticlesProps {
  quantity?: number;
  staticity?: number;
  ease?: number;
}

export default function ClientParticles({ quantity, staticity, ease }: ClientParticlesProps) {
  return <Particles quantity={quantity} staticity={staticity} ease={ease} />;
}
