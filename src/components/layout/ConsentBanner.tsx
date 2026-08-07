"use client";

import { Button, Group, Paper, Text } from "@mantine/core";
import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import {
  getConsent,
  setConsent,
  startTrackingSession,
  subscribeConsent,
  track,
} from "@/lib/tracking";
import styles from "./ConsentBanner.module.scss";

interface ConsentBannerProps {
  /** Consent cookie value read server-side (SSR-consistent initial state). */
  initialConsent: string | null;
}

export const ConsentBanner = ({ initialConsent }: ConsentBannerProps) => {
  const consent = useSyncExternalStore(subscribeConsent, getConsent, () => initialConsent);
  const bannerRef = useRef<HTMLDivElement>(null);
  const visible = consent === null;

  // Expose the banner height so fixed widgets (AI assistant toggle/panel)
  // can shift above it instead of being covered.
  useEffect(() => {
    if (!visible || typeof window === "undefined") return;
    const el = bannerRef.current;
    if (!el) return;

    document.body.dataset.consentBanner = "open";
    const update = () => {
      document.body.style.setProperty("--consent-banner-height", `${el.offsetHeight}px`);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    window.addEventListener("resize", update);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
      delete document.body.dataset.consentBanner;
      document.body.style.removeProperty("--consent-banner-height");
    };
  }, [visible]);

  const handleAccept = useCallback(() => {
    setConsent("accepted");
    startTrackingSession();
    track("consent_accepted");
  }, []);

  const handleDecline = useCallback(() => {
    setConsent("declined");
  }, []);

  if (!visible) return null;

  return (
    <Paper
      ref={bannerRef}
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
