"use client";

import { Anchor } from "@mantine/core";
import Link from "next/link";
import type { ReactNode } from "react";

interface NavLinkProps {
  href: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
}

export function NavLink({ href, children, size }: NavLinkProps) {
  return (
    <Anchor component={Link} href={href} size={size}>
      {children}
    </Anchor>
  );
}
