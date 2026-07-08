"use client";

import { Anchor } from "@mantine/core";
import styles from "./SkipLink.module.scss";

export const SkipLink = () => (
  <Anchor href="#main-content" className={styles.skipLink} underline="never">
    Skip to main content
  </Anchor>
);