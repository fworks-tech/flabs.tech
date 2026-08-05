"use client";

import { Button, Group, Paper, Text } from "@mantine/core";
import { useCallback, useSyncExternalStore } from "react";
import { getConsent, setConsent, startTrackingSession, track } from "@/lib/tracking";
import styles from "./ConsentBanner.module.scss";

function subscribeConsent(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("fa:consent", callback);
  return () => window.removeEventListener("fa:consent", callback);
}

interface ConsentBannerProps {
  /** Consent cookie value read server-side (SSR-consistent initial state). */
  initialConsent: string | null;
}

export const ConsentBanner = ({ initialConsent }: ConsentBannerProps) => {
  const consent = useSyncExternalStore(subscribeConsent, getConsent, () => initialConsent);

  const handleAccept = useCallback(() => {
    setConsent("accepted");
    startTrackingSession();
    track("consent_accepted");
  }, []);

  const handleDecline = useCallback(() => {
    setConsent("declined");
  }, []);

  if (consent !== null) return null;

  return (
    <Paper
      className={styles.banner}
      role="dialog"
      aria-label="Analytics consent"
      data-testid="consent-banner"
      radius="lg"
      shadow="lg"
      withBorder
    >
      <Text size="sm" fw={600}>
        Privacy-first analytics
      </Text>
      <Text size="sm" c="dimmed">
        This site uses anonymous cookies to understand how visitors use it. Nothing personal is
        collected — no IPs, no names. You can accept or decline.
      </Text>
      <Group justify="flex-end" mt="xs">
        <Button variant="subtle" size="xs" onClick={handleDecline} data-testid="consent-decline">
          Decline
        </Button>
        <Button size="xs" onClick={handleAccept} data-testid="consent-accept">
          Accept
        </Button>
      </Group>
    </Paper>
  );
};
