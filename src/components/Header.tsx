"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Flex, Row, ToggleButton } from "@once-ui-system/core";

import { routes, display, person, about, blog, work, gallery } from "@/resources";
import { ThemeToggle } from "./ThemeToggle";
import styles from "./Header.module.scss";

type TimeDisplayProps = {
  timeZone: string;
  locale?: string;
};

const TimeDisplay: React.FC<TimeDisplayProps> = ({ timeZone, locale = "en-GB" }) => {
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      };
      const timeString = new Intl.DateTimeFormat(locale, options).format(now);
      setCurrentTime(timeString);
    };

    updateTime();
    const intervalId = setInterval(updateTime, 1000);

    return () => clearInterval(intervalId);
  }, [timeZone, locale]);

  return <>{currentTime}</>;
};

export default TimeDisplay;

export const Header = () => {
  const pathname = usePathname() ?? "";

  return (
    <Row
      fitHeight
      className={styles.position}
      position="sticky"
      as="header"
      zIndex={9}
      fillWidth
      paddingX="24"
      paddingY="12"
      vertical="center"
      suppressHydrationWarning
    >
      {/* Center: Flat nav */}
      <Row horizontal="center" gap="4" vertical="center" textVariant="body-default-s">
        {routes["/"] && (
          <div className={styles.navItem}>
            <Row s={{ hide: true }}>
              <ToggleButton href="/" label="Home" selected={pathname === "/"} />
            </Row>
            <Row hide s={{ hide: false }}>
              <ToggleButton prefixIcon="home" href="/" selected={pathname === "/"} />
            </Row>
          </div>
        )}
        {routes["/work"] && (
          <div className={styles.navItem}>
            <Row s={{ hide: true }}>
              <ToggleButton href="/work" label={work.label} selected={pathname.startsWith("/work")} />
            </Row>
            <Row hide s={{ hide: false }}>
              <ToggleButton prefixIcon="grid" href="/work" selected={pathname.startsWith("/work")} />
            </Row>
          </div>
        )}
        {routes["/blog"] && (
          <div className={styles.navItem}>
            <Row s={{ hide: true }}>
              <ToggleButton href="/blog" label={blog.label} selected={pathname.startsWith("/blog")} />
            </Row>
            <Row hide s={{ hide: false }}>
              <ToggleButton prefixIcon="book" href="/blog" selected={pathname.startsWith("/blog")} />
            </Row>
          </div>
        )}
        {routes["/about"] && (
          <div className={styles.navItem}>
            <Row s={{ hide: true }}>
              <ToggleButton href="/about" label={about.label} selected={pathname === "/about"} />
            </Row>
            <Row hide s={{ hide: false }}>
              <ToggleButton prefixIcon="person" href="/about" selected={pathname === "/about"} />
            </Row>
          </div>
        )}
        {routes["/gallery"] && (
          <div className={styles.navItem}>
            <Row s={{ hide: true }}>
              <ToggleButton href="/gallery" label={gallery.label} selected={pathname.startsWith("/gallery")} />
            </Row>
            <Row hide s={{ hide: false }}>
              <ToggleButton prefixIcon="gallery" href="/gallery" selected={pathname.startsWith("/gallery")} />
            </Row>
          </div>
        )}
      </Row>

      {/* Right: Time + Theme toggle */}
      <Flex flex={1} horizontal="end" vertical="center" gap="16" textVariant="body-default-s">
        {display.time && (
          <Row s={{ hide: true }}>
            <TimeDisplay timeZone={person.location} />
          </Row>
        )}
        {display.themeSwitcher && <ThemeToggle />}
      </Flex>
    </Row>
  );
};
