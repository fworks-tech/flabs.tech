"use client";

import dynamic from "next/dynamic";
import type { SpacingToken } from "@once-ui-system/core";

const Mailchimp = dynamic(
  () => import("@/components/ui/Mailchimp").then((mod) => mod.Mailchimp),
  { ssr: false },
);

interface ClientMailchimpProps {
  marginBottom?: SpacingToken;
  padding?: SpacingToken;
}

export default function ClientMailchimp({ marginBottom, padding }: ClientMailchimpProps) {
  return <Mailchimp marginBottom={marginBottom} padding={padding} />;
}
