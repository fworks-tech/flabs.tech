"use client";

import { useEffect, useState } from "react";
import styles from "./AnimatedHeadline.module.scss";

interface AnimatedHeadlineProps {
  text: string;
  className?: string;
}

export function AnimatedHeadline({ text, className }: AnimatedHeadlineProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const chars = text.split("");

  return (
    <span className={[styles.wrapper, className].filter(Boolean).join(" ")} aria-label={text}>
      {chars.map((char, i) => (
        <span
          key={i}
          className={styles.char}
          style={{
            animationDelay: visible ? `${i * 55}ms` : undefined,
            opacity: 0,
            display: char === " " ? "inline" : "inline-block",
          }}
          data-visible={visible ? "true" : undefined}
          aria-hidden="true"
        >
          {char === " " ? " " : char}
        </span>
      ))}
    </span>
  );
}
