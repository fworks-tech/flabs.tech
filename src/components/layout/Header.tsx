"use client";

import { ActionIcon, Button, Group } from "@mantine/core";
import {
  IconBook,
  IconCode,
  IconGridDots,
  IconHome,
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
  home: <IconHome size={18} />,
  grid: <IconGridDots size={18} />,
  code: <IconCode size={18} />,
  book: <IconBook size={18} />,
  person: <IconUser size={18} />,
};

type NavItem = {
  path: string;
  label: string;
  icon: string;
  selected: boolean;
};

export const Header = () => {
  const pathname = usePathname() ?? "";

  const navItems: NavItem[] = [
    { path: "/", label: "Home", icon: "home", selected: pathname === "/" },
    { path: "/work", label: work.label, icon: "grid", selected: pathname.startsWith("/work") },
    { path: "/projects", label: projects.label, icon: "code", selected: pathname.startsWith("/projects") },
    { path: "/blog", label: blog.label, icon: "book", selected: pathname.startsWith("/blog") },
    { path: "/about", label: about.label, icon: "person", selected: pathname === "/about" },
  ].filter((item) => routes[item.path as keyof typeof routes]);

  return (
    <Group
      className={styles.position}
      pos="sticky"
      component="header"
      top={0}
      style={{ width: "100%", zIndex: 100 }}
      px="24"
      py="xs"
      align="center"
      suppressHydrationWarning
      role="banner"
    >
      <nav style={{ flex: 1 }}>
        <Group justify="center" gap="4" align="center">
          {navItems.map((item) => (
            <div key={item.path} className={styles.navItem}>
              <Button
                component={Link}
                href={item.path}
                variant={item.selected ? "light" : "subtle"}
                className={styles.desktopLabel}
                onClick={() => trackEvent("nav_click", { page: item.path })}
              >
                {item.label}
              </Button>
              <ActionIcon
                component={Link}
                href={item.path}
                variant={item.selected ? "light" : "subtle"}
                size="lg"
                className={styles.mobileIcon}
                onClick={() => trackEvent("nav_click", { page: item.path })}
              >
                {iconMap[item.icon] || null}
              </ActionIcon>
            </div>
          ))}
        </Group>
      </nav>

      <Group gap="16" align="center">
        {display.time && (
          <Group visibleFrom="sm">
            <TimeDisplay timeZone={person.location} />
          </Group>
        )}
        {display.themeSwitcher && <ThemeToggle />}
      </Group>
    </Group>
  );
};
