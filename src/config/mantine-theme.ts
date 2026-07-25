import { createTheme, type MantineThemeOverride } from "@mantine/core";

export const mantineTheme: MantineThemeOverride = createTheme({
  primaryColor: "indigo",
  defaultRadius: "md",
  fontFamily: "var(--font-body)",
  fontFamilyMonospace: "var(--font-code)",
  defaultGradient: { deg: 135, from: "indigo", to: "violet" },
  colors: {
    dark: [
      "#C1C2C5",
      "#A6A7AB",
      "#909296",
      "#5C5F66",
      "#373A40",
      "#2C2E33",
      "#25262B",
      "#1A1B1E",
      "#141517",
      "#101113",
    ],
  },
  primaryShade: { light: 6, dark: 8 },
  autoContrast: true,
  luminanceThreshold: 0.3,
});
