"use client";

import { ActionIcon, Button, Group } from "@mantine/core";
import {
  IconBook,
  IconCode,
  IconGridDots,
  IconHome,
  IconPuzzle,
  IconUser,
} from "@tabler/icons-react";
import Link from "next/link";
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

const iconMap: Record<string, React.ReactNode> = {
  home: <IconHome size={16} />,
  grid: <IconGridDots size={16} />,
  code: <IconCode size={16} />,
  book: <IconBook size={16} />,
  puzzle: <IconPuzzle size={16} />,
  person: <IconUser size={16} />,
};

type NavItem = {
  path: string;
  label: string;
  icon: string;
  selected: boolean;
  highlight?: boolean;
};

export const Header = () => {
  const pathname = usePathname() ?? "";

  const navItems: NavItem[] = [
    { path: "/", label: "Home", icon: "home", selected: pathname === "/" },
    { path: "/work", label: work.label, icon: "grid", selected: pathname.startsWith("/work") },
    { path: "/projects", label: projects.label, icon: "code", selected: pathname.startsWith("/projects") },
    { path: "/blog", label: blog.label, icon: "book", selected: pathname.startsWith("/blog") },
    { path: "/quiz", label: "Quiz", icon: "puzzle", selected: pathname.startsWith("/quiz"), highlight: true },
    { path: "/about", label: about.label, icon: "person", selected: pathname === "/about" },
  ].filter((item) => routes[item.path as keyof typeof routes]);

  return (
    <>
      <Group
        className={styles.position}
        component="header"
        style={{ zIndex: 100 }}
        px="24"
        py="xs"
        align="center"
        suppressHydrationWarning
        role="banner"
      >
        <nav aria-label="Main navigation" style={{ flex: 1 }}>
          <Group justify="center" gap="4" align="center" wrap="nowrap">
            {navItems.map((item) => (
              <div key={item.path} className={`${styles.navItem} ${item.highlight ? styles.highlight : ""}`}>
                <Button
                  component={Link}
                  href={item.path}
                  variant={item.selected ? "light" : "subtle"}
                  visibleFrom="sm"
                  onClick={() => trackEvent("nav_click", { page: item.path })}
                >
                  {item.label}
                </Button>
                <ActionIcon
                  component={Link}
                  href={item.path}
                  variant={item.selected ? "light" : "subtle"}
                  size="md"
                  hiddenFrom="sm"
                  onClick={() => trackEvent("nav_click", { page: item.path })}
                >
                  {iconMap[item.icon] || null}
                </ActionIcon>
              </div>
            ))}
          </Group>
        </nav>

        <Group className={styles.utils} gap="16" align="center">
          {display.time && (
            <Group visibleFrom="sm">
              <TimeDisplay timeZone={person.location} />
            </Group>
          )}
          {display.themeSwitcher && <ThemeToggle className={styles.desktopThemeToggle} />}
        </Group>
      </Group>

      {display.themeSwitcher && (
        <div className={styles.mobileThemeToggle}>
          <ThemeToggle />
        </div>
      )}
    </>
  );
};
