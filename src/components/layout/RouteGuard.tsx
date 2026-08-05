"use client";

import { Button, Group, Loader, PasswordInput, Stack, Title } from "@mantine/core";
import NotFound from "@/app/not-found";
import { protectedRoutes, routes } from "@/config";
import { logger } from "@/lib/logger";
import { trackEvent } from "@/lib/analytics";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface RouteGuardProps {
  children: React.ReactNode;
}

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
        trackEvent("protected_route_access_granted", { path: pathname ?? "unknown" });
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
      <Group py="128" justify="center">
        <Loader />
      </Group>
    );
  }

  if (!isRouteEnabled) {
    return <NotFound />;
  }

  if (isPasswordRequired && !isAuthenticated) {
    return (
      <Stack py="128" maw={400} gap="24" align="center" mx="auto">
        <Title order={2} ta="center">
          This page is password protected
        </Title>
        <Stack gap="8" align="center">
          <PasswordInput
            id="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={error}
          />
          <Button onClick={handlePasswordSubmit}>Submit</Button>
        </Stack>
      </Stack>
    );
  }

  return <>{children}</>;
};

export { RouteGuard };
