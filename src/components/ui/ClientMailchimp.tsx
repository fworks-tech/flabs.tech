"use client";

import dynamic from "next/dynamic";

const Mailchimp = dynamic(
  () => import("@/components/ui/Mailchimp").then((mod) => mod.Mailchimp),
  { ssr: false },
);

interface ClientMailchimpProps {
  marginBottom?: string;
  padding?: string;
}

export default function ClientMailchimp({ marginBottom, padding }: ClientMailchimpProps) {
  return <Mailchimp marginBottom={marginBottom} padding={padding} />;
}
