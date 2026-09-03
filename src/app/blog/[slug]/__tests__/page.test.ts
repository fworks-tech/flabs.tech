import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Space_Grotesk: () => ({ variable: "--font-heading" }),
  Inter: () => ({ variable: "--font-body" }),
  JetBrains_Mono: () => ({ variable: "--font-code" }),
}));

import { generateStaticParams } from "@/app/blog/[slug]/page";

describe("blog generateStaticParams", () => {
  it("exposes published slugs only, so drafts stay out of the static build", async () => {
    const slugs = (await generateStaticParams()).map((entry) => entry.slug);
    expect(slugs).toContain("never-leave-the-chatbox-hanging");
    expect(slugs).not.toContain("mantine-nextjs");
  });
});
