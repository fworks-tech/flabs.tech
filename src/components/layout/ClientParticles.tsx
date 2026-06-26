"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const Particles = dynamic(() => import("@/components/layout/Particles"), { ssr: false });

interface ClientParticlesProps {
  quantity?: number;
  staticity?: number;
  ease?: number;
}

export default function ClientParticles({ quantity, staticity, ease }: ClientParticlesProps) {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    setIsDesktop(window.innerWidth >= 768);
    const onResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (!isDesktop) return null;

  return <Particles quantity={quantity} staticity={staticity} ease={ease} />;
}
