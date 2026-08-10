import { MantineProvider } from '@mantine/core';
import { render, screen, within } from '@testing-library/react';
import { type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: Record<string, unknown>) => (
    <a href={href as string} {...props}>
      {children}
    </a>
  ),
}));
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));
vi.mock('@/config', () => ({
  display: { time: true, themeSwitcher: true },
  routes: { '/': true, '/work': true, '/projects': true, '/blog': true, '/about': true },
}));

import { Header } from '@/components/layout/Header';

function Wrapper({ children }: { children: ReactNode }) {
  return <MantineProvider env="test">{children}</MantineProvider>;
}

function openMenu() {
  const hamburger = screen.getByRole('button', { name: /open navigation menu/i });
  return hamburger;
}

describe('Header', () => {
  it('renders navigation links for each route', () => {
    render(<Header />, { wrapper: Wrapper });
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThanOrEqual(5);
  });

  it('renders theme toggle button', () => {
    render(<Header />, { wrapper: Wrapper });
    const toggles = screen.getAllByRole('button', { name: /switch to/i });
    expect(toggles).toHaveLength(1);
  });

  it('renders hamburger menu trigger on mobile', () => {
    render(<Header />, { wrapper: Wrapper });
    expect(openMenu()).toBeInTheDocument();
  });

  it('opens the menu with nav links when the hamburger is clicked', async () => {
    const { default: userEvent } = await import('@testing-library/user-event');
    const ue = userEvent.setup();

    render(<Header />, { wrapper: Wrapper });
    await ue.click(openMenu());

    const mobileNav = screen.getByRole('navigation', { name: /mobile navigation/i });
    const homeLink = within(mobileNav).getByRole('link', { name: /home/i });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('closes the menu when a nav link is clicked', async () => {
    const { default: userEvent } = await import('@testing-library/user-event');
    const ue = userEvent.setup();

    render(<Header />, { wrapper: Wrapper });
    await ue.click(openMenu());

    const mobileNav = screen.getByRole('navigation', { name: /mobile navigation/i });
    await ue.click(within(mobileNav).getByRole('link', { name: /home/i }));

    expect(
      screen.queryByRole('navigation', { name: /mobile navigation/i }),
    ).not.toBeInTheDocument();
  });

  it('toggles between open and close labels on the hamburger', async () => {
    const { default: userEvent } = await import('@testing-library/user-event');
    const ue = userEvent.setup();

    render(<Header />, { wrapper: Wrapper });
    await ue.click(openMenu());

    expect(screen.getByRole('button', { name: /close navigation menu/i })).toBeInTheDocument();
  });
});
