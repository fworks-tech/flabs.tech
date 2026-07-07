"use client";

import dynamic from "next/dynamic";

export const PostHogInit = dynamic(
  () => import("./PostHogTracker"),
  { ssr: false },
);
