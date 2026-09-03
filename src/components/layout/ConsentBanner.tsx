"use client";

import { Button, Group, Paper, Text } from "@mantine/core";
import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { getConsent, setConsent, subscribeConsent, track } from "@/lib/tracking";
import type { ConsentState } from "@/lib/tracking";
import styles from "./ConsentBanner.module.scss";

const AUTO_DISMISS_MS = 8000;

const getServerSnapshot = (): ConsentState => {
  // Unknown until hydration — assume decided so static prerenders never flash the banner.
  return "accepted";
};

export const ConsentBanner = () => {
  const consent = useSyncExternalStore(subscribeConsent, getConsent, getServerSnapshot);
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

  // Opt-out model: tracking runs by default, so an un-dismissed banner
  // auto-accepts after a short window instead of blocking navigation.
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => setConsent("accepted"), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [visible]);

  const handleDecline = useCallback(() => {
    setConsent("declined");
    track("consent_declined", undefined, { force: true });
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
        This site collects anonymous usage analytics to improve the experience. No personal data is
        collected — no IPs, no names. By continuing to browse, you agree.
      </Text>
      <Group justify="flex-end" mt="xs">
        <Button variant="subtle" size="xs" onClick={handleDecline} data-testid="consent-decline">
          Decline
        </Button>
      </Group>
    </Paper>
  );
};