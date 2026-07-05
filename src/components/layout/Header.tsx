"use client";

import { Flex, Row, ToggleButton } from "@once-ui-system/core";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { display, routes } from "@/config";
import { about, blog, person, projects, work } from "@/content";
import { trackEvent } from "@/lib/analytics";
import styles from "./Header.module.scss";
import { ThemeToggle } from "./ThemeToggle";

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
      role="banner"
    >
      {/* Center: Flat nav */}
      <nav>
      <Row horizontal="center" gap="4" vertical="center" textVariant="body-default-s">
        {routes["/"] && (
          <div className={styles.navItem}>
            <ToggleButton 
              href="/" 
              label="Home" 
              selected={pathname === "/"}
              className={styles.desktopLabel}
              onClick={() => trackEvent("nav_click", { page: "/" })}
            />
            <ToggleButton 
              href="/" 
              prefixIcon="home" 
              selected={pathname === "/"}
              className={styles.mobileIcon}
              onClick={() => trackEvent("nav_click", { page: "/" })}
            />
          </div>
        )}
        {routes["/work"] && (
          <div className={styles.navItem}>
            <ToggleButton
              href="/work"
              label={work.label}
              selected={pathname.startsWith("/work")}
              className={styles.desktopLabel}
              onClick={() => trackEvent("nav_click", { page: "/work" })}
            />
            <ToggleButton
              prefixIcon="grid"
              href="/work"
              selected={pathname.startsWith("/work")}
              className={styles.mobileIcon}
              onClick={() => trackEvent("nav_click", { page: "/work" })}
            />
          </div>
        )}
        {routes["/projects"] && (
          <div className={styles.navItem}>
            <ToggleButton
              href="/projects"
              label={projects.label}
              selected={pathname.startsWith("/projects")}
              className={styles.desktopLabel}
              onClick={() => trackEvent("nav_click", { page: "/projects" })}
            />
            <ToggleButton
              prefixIcon="code"
              href="/projects"
              selected={pathname.startsWith("/projects")}
              className={styles.mobileIcon}
              onClick={() => trackEvent("nav_click", { page: "/projects" })}
            />
          </div>
        )}
        {routes["/blog"] && (
          <div className={styles.navItem}>
            <ToggleButton
              href="/blog"
              label={blog.label}
              selected={pathname.startsWith("/blog")}
              className={styles.desktopLabel}
              onClick={() => trackEvent("nav_click", { page: "/blog" })}
            />
            <ToggleButton
              prefixIcon="book"
              href="/blog"
              selected={pathname.startsWith("/blog")}
              className={styles.mobileIcon}
              onClick={() => trackEvent("nav_click", { page: "/blog" })}
            />
          </div>
        )}
        {routes["/about"] && (
          <div className={styles.navItem}>
            <ToggleButton href="/about" label={about.label} selected={pathname === "/about"} className={styles.desktopLabel} onClick={() => trackEvent("nav_click", { page: "/about" })} />
            <ToggleButton prefixIcon="person" href="/about" selected={pathname === "/about"} className={styles.mobileIcon} onClick={() => trackEvent("nav_click", { page: "/about" })} />
          </div>
        )}
      </Row>
      </nav>

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
