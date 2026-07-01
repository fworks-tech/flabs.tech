"use client";

import { logger } from "@/lib/logger";
import NotFound from "@/app/not-found";
import { protectedRoutes, routes } from "@/config";
import { Button, Column, Flex, Heading, PasswordInput, Spinner } from "@once-ui-system/core";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface RouteGuardProps {
  /** Child components rendered inside the guard */
  children: React.ReactNode;
}

/**
 * Client component that guards routes based on the site configuration.
 *
 * Checks whether the current pathname is enabled in the `routes` config,
 * and — if the route is password-protected (`protectedRoutes`) — prompts
 * the user for a password before rendering children.
 *
 * Shows a loading spinner while initial auth checks run, and renders the
 * `NotFound` component for disabled routes.
 */
const RouteGuard: React.FC<RouteGuardProps> = ({ children }) => {
  const pathname = usePathname();
  const [isRouteEnabled, setIsRouteEnabled] = useState(false);
  const [isPasswordRequired, setIsPasswordRequired] = useState(false);
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const performChecks = async () => {
      setLoading(true);
      setIsRouteEnabled(false);
      setIsPasswordRequired(false);
      setIsAuthenticated(false);

      const checkRouteEnabled = () => {
        if (!pathname) return false;

        if (pathname in routes) {
          return routes[pathname as keyof typeof routes];
        }

        const dynamicRoutes = ["/blog", "/work"] as const;
        for (const route of dynamicRoutes) {
          if (pathname?.startsWith(route) && routes[route]) {
            return true;
          }
        }

        return false;
      };

      const routeEnabled = checkRouteEnabled();
      setIsRouteEnabled(routeEnabled);

      if (protectedRoutes[pathname as keyof typeof protectedRoutes]) {
        setIsPasswordRequired(true);

        try {
          const response = await fetch("/api/check-auth");
          const data = await response.json();
          if (data.authenticated) {
            setIsAuthenticated(true);
          }
        } catch (error) {
          logger.error(error, "failed to check auth status");
        }
      }

      setLoading(false);
    };

    performChecks();
  }, [pathname]);

  const handlePasswordSubmit = async () => {
    try {
      const response = await fetch("/api/authenticate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        setIsAuthenticated(true);
        setError(undefined);
      } else {
        const data = await response.json().catch(() => ({}));
        setError(data.message || "Incorrect password");
      }
    } catch (error) {
      logger.error(error, "failed to authenticate");
      setError("Network error. Please try again.");
    }
  };

  if (loading) {
    return (
      <Flex fillWidth paddingY="128" horizontal="center">
        <Spinner />
      </Flex>
    );
  }

  if (!isRouteEnabled) {
    return <NotFound />;
  }

  if (isPasswordRequired && !isAuthenticated) {
    return (
      <Column paddingY="128" maxWidth={24} gap="24" center>
        <Heading align="center" wrap="balance">
          This page is password protected
        </Heading>
        <Column fillWidth gap="8" horizontal="center">
          <PasswordInput
            id="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            errorMessage={error}
          />
          <Button onClick={handlePasswordSubmit}>Submit</Button>
        </Column>
      </Column>
    );
  }

  return <>{children}</>;
};

export { RouteGuard };
