'use client';

import { ActionIcon, Button, Divider, Group, Popover, Stack, Text } from '@mantine/core';
import {
  IconBook,
  IconCode,
  IconGridDots,
  IconHome,
  IconMenu2,
  IconPuzzle,
  IconUser,
  IconX,
} from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { display, routes } from '@/config';
import { about, blog, person, projects, work } from '@/content';
import styles from './Header.module.scss';
import { ThemeToggle } from './ThemeToggle';

type TimeDisplayProps = {
  timeZone: string;
  locale?: string;
};

const TimeDisplay: React.FC<TimeDisplayProps> = ({ timeZone, locale = 'en-GB' }) => {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
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
  const pathname = usePathname() ?? '';
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems: NavItem[] = [
    { path: '/', label: 'Home', icon: 'home', selected: pathname === '/' },
    { path: '/work', label: work.label, icon: 'grid', selected: pathname.startsWith('/work') },
    {
      path: '/projects',
      label: projects.label,
      icon: 'code',
      selected: pathname.startsWith('/projects'),
    },
    { path: '/blog', label: blog.label, icon: 'book', selected: pathname.startsWith('/blog') },
    { path: '/about', label: about.label, icon: 'person', selected: pathname === '/about' },
    {
      path: '/quiz',
      label: 'Try Yourself!',
      icon: 'puzzle',
      selected: pathname.startsWith('/quiz'),
      highlight: true,
    },
  ].filter((item) => routes[item.path as keyof typeof routes]);

  return (
    <>
      {/* Desktop: sticky header with nav + theme toggle */}
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
              <div
                key={item.path}
                className={`${styles.navItem} ${item.highlight ? styles.highlight : ''}`}
              >
                <Button
                  component={Link}
                  href={item.path}
                  variant={item.selected ? 'light' : 'subtle'}
                  visibleFrom="sm"
                  className={item.highlight ? styles.tryYourself : undefined}
                >
                  {item.label}
                </Button>
                <ActionIcon
                  component={Link}
                  href={item.path}
                  variant={item.selected ? 'light' : 'subtle'}
                  size="md"
                  hiddenFrom="sm"
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

      {/* Mobile: hamburger menu replaces floating pill + floating ThemeToggle */}
      <div className={styles.mobileMenuTrigger}>
        <Popover
          opened={menuOpen}
          onChange={setMenuOpen}
          position="bottom-end"
          shadow="md"
          radius="lg"
          width={220}
          withinPortal
        >
          <Popover.Target>
            <ActionIcon
              variant="default"
              size="lg"
              aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-haspopup="menu"
              onClick={() => setMenuOpen((o) => !o)}
              className={styles.hamburgerButton}
            >
              {menuOpen ? <IconX size={18} /> : <IconMenu2 size={18} />}
            </ActionIcon>
          </Popover.Target>

          <Popover.Dropdown className={styles.mobileMenuDropdown}>
            <nav aria-label="Mobile navigation">
              <Stack gap="4">
                {navItems.map((item) => (
                  <Button
                    key={item.path}
                    component={Link}
                    href={item.path}
                    variant={item.selected ? 'light' : 'subtle'}
                    justify="flex-start"
                    leftSection={iconMap[item.icon] || null}
                    onClick={() => setMenuOpen(false)}
                    className={item.highlight ? styles.tryYourself : undefined}
                  >
                    {item.label}
                  </Button>
                ))}
              </Stack>
            </nav>
            {display.themeSwitcher && (
              <>
                <Divider my="sm" />
                <Group justify="space-between" px="xs">
                  <Text size="sm" c="dimmed">
                    Theme
                  </Text>
                  <ThemeToggle />
                </Group>
              </>
            )}
          </Popover.Dropdown>
        </Popover>
      </div>
    </>
  );
};
