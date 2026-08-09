"use client";

import { Button, Card, Group, Text } from "@mantine/core";
import { IconX } from "@tabler/icons-react";
import { useState } from "react";

import { referral } from "@/config";
import { trackEvent } from "@/lib/analytics";
import styles from "./ReferralCard.module.scss";

const DISMISS_KEY = "devsprint.referralDismissed";

interface ReferralCardProps {
  score: number;
  accuracy: number;
}

/**
 * Referral CTA — shown only to eligible scorers (≥80% accuracy),
 * once per device (localStorage dismiss). Clicking fires a server-side
 * counter via sendBeacon so it counts even without PostHog consent.
 */
export function ReferralCard({ score, accuracy }: ReferralCardProps) {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(DISMISS_KEY) === "1";
  });

  const config = referral.default;
  if (!config.display || dismissed) return null;

  // Track when the referral CTA becomes visible
  trackEvent("quiz_referral_cta_shown", { score, accuracy });

  function dismiss() {
    window.localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  function trackClick() {
    trackEvent("quiz_referral_click", { score, accuracy });
    try {
      navigator.sendBeacon(
        "/api/quiz/referral-click",
        new Blob([JSON.stringify({ score, accuracy })], { type: "application/json" }),
      );
    } catch {
      // best-effort: never block the CTA
    }
  }

  return (
    <Card
      withBorder
      p="lg"
      radius="md"
      className={styles.card}
      w="100%"
      maw={460}
      data-testid="referral-card"
    >
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Text fw={700} size="md">
          {config.headline}
        </Text>
        <Button
          size="compact-sm"
          variant="subtle"
          onClick={dismiss}
          aria-label="Dismiss referral"
          data-testid="referral-dismiss"
        >
          <IconX size={16} aria-hidden="true" />
        </Button>
      </Group>
      <Text size="sm" c="dimmed" mt="4">
        {config.body}
      </Text>
      <Button
        component="a"
        href={config.url}
        target="_blank"
        rel="noopener noreferrer"
        fullWidth
        mt="md"
        onClick={trackClick}
        data-testid="referral-cta"
      >
        {config.cta}
      </Button>
    </Card>
  );
}
