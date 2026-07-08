import { home } from "@/content";

export type RoutesConfig = Record<string, boolean>;
export type DisplayConfig = { location: boolean; time: boolean; themeSwitcher: boolean };
export type ProtectedRoutesConfig = Record<string, boolean>;
export type SameAsConfig = Record<string, string | undefined>;
export type FontsConfig = {
  heading: { variable: string };
  body: { variable: string };
  label: { variable: string };
  code: { variable: string };
};

const baseURL: string = "https://flabs.tech";

const routes: RoutesConfig = {
  "/": true,
  "/about": true,
  "/work": true,
  "/projects": true,
  "/blog": true,
};

const display: DisplayConfig = {
  location: true,
  time: true,
  themeSwitcher: true,
};

const protectedRoutes: ProtectedRoutesConfig = {};

import { Geist } from "next/font/google";
import { Geist_Mono } from "next/font/google";

const heading = Geist({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

const body = Geist({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const label = Geist({
  variable: "--font-label",
  subsets: ["latin"],
  display: "swap",
});

const code = Geist_Mono({
  variable: "--font-code",
  subsets: ["latin"],
  display: "swap",
});

const fonts: FontsConfig = {
  heading,
  body,
  label,
  code,
};

const style = {
  theme: "dark" as const,
  neutral: "gray" as const,
  brand: "indigo" as const,
  accent: "violet" as const,
  solid: "contrast" as const,
  solidStyle: "flat" as const,
  border: "rounded" as const,
  surface: "translucent" as const,
  transition: "all" as const,
  scaling: "100" as const,
};

const dataStyle = {
  variant: "default" as const,
  mode: "light" as const,
  height: 300,
  axis: { stroke: "#888888" },
  tick: {
    fill: "#888888",
    fontSize: 12,
    line: { stroke: "#888888" },
  },
};

const schema = {
  logo: "",
  name: "Fabio Ritzel Borges",
  email: "fritzelborges@gmail.com",
  description: home.description,
};

const sameAs: SameAsConfig = {
  github: "https://github.com/fworks-tech",
  linkedin: "https://www.linkedin.com/in/fabiorborges/",
  devto: undefined,
  stackoverflow: undefined,
  npm: undefined,
  hashnode: undefined,
};

const socialSharing = {
  display: true,
  platforms: {
    x: true,
    linkedin: true,
    facebook: true,
    pinterest: true,
    whatsapp: true,
    reddit: true,
    telegram: true,
    email: true,
    copyLink: true,
  },
};

const mailchimp = {
  action: "",
  effects: {
    mask: { x: 0, y: 0, radius: 0, cursor: true },
    gradient: { display: false, opacity: 100, x: 0, y: 0, width: 0, height: 0, tilt: 0, colorStart: "", colorEnd: "" },
    dots: { display: false, opacity: 100, size: 0, color: "" },
    grid: { display: false, opacity: 100, color: "", width: 0, height: 0 },
    lines: { display: false, opacity: 100, size: 0, thickness: 0, angle: 0, color: "" },
  },
};

export {
  baseURL,
  display,
  fonts,
  mailchimp,
  protectedRoutes,
  routes,
  sameAs,
  schema,
  socialSharing,
  style,
  dataStyle,
};
