// Design tokens for EATLY. Light theme (primary) + dark.
// Keys match the "color" block of /app/design_guidelines.json.
// Use makeStyles() for StyleSheets and useTheme().colors for color props.

import { useMemo } from "react";
import { Appearance, StyleSheet, useColorScheme } from "react-native";

export type ColorScheme = "light" | "dark";

const light = {
  // Surfaces
  surface: "#F7F3EE", // warm cream app background
  onSurface: "#1A1D26",
  surfaceSecondary: "#FFFFFF", // white cards & list rows
  onSurfaceSecondary: "#1A1D26",
  surfaceTertiary: "#F3F4F6", // inputs, chips, deepest nesting
  onSurfaceTertiary: "#4B5563",
  surfaceInverse: "#1A1D26", // dark referral card, snackbars
  onSurfaceInverse: "#FFFFFF",
  muted: "#6B7280", // secondary text

  // Brand (orange)
  brand: "#F97316",
  onBrand: "#FFFFFF",
  brandPrimary: "#F97316",
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#FFF7ED",
  onBrandSecondary: "#EA580C",
  brandTertiary: "#FFEDD5",
  onBrandTertiary: "#C2410C",

  // Status (soft tint bg + darker text)
  success: "#D1FAE5",
  onSuccess: "#065F46",
  warning: "#FEF3C7",
  onWarning: "#92400E",
  error: "#FEE2E2",
  onError: "#991B1B",
  info: "#FFEDD5",
  onInfo: "#C2410C",

  // Solid status accents (dots, icons)
  successSolid: "#16A34A",
  warningSolid: "#F59E0B",
  errorSolid: "#DC2626",
  star: "#F59E0B",

  // Lines
  border: "#EDE7DF",
  borderStrong: "#D1D5DB",
  divider: "#F3F4F6",

  // Overlays
  overlay: "rgba(0,0,0,0.35)",
  overlayStrong: "rgba(0,0,0,0.55)",
  glass: "rgba(255,255,255,0.85)",
};

const dark: typeof light = {
  surface: "#14151A",
  onSurface: "#F5F5F7",
  surfaceSecondary: "#1F2129",
  onSurfaceSecondary: "#F5F5F7",
  surfaceTertiary: "#282A33",
  onSurfaceTertiary: "#C7CAD1",
  surfaceInverse: "#000000",
  onSurfaceInverse: "#FFFFFF",
  muted: "#9AA0AC",

  brand: "#F97316",
  onBrand: "#FFFFFF",
  brandPrimary: "#F97316",
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#3A2A1A",
  onBrandSecondary: "#FDBA74",
  brandTertiary: "#4A331E",
  onBrandTertiary: "#FDBA74",

  success: "#123C2C",
  onSuccess: "#6EE7B7",
  warning: "#3D2F12",
  onWarning: "#FCD34D",
  error: "#3B1717",
  onError: "#FCA5A5",
  info: "#3A2A1A",
  onInfo: "#FDBA74",

  successSolid: "#22C55E",
  warningSolid: "#FBBF24",
  errorSolid: "#EF4444",
  star: "#FBBF24",

  border: "#2E313B",
  borderStrong: "#3A3D48",
  divider: "#282A33",

  overlay: "rgba(0,0,0,0.45)",
  overlayStrong: "rgba(0,0,0,0.65)",
  glass: "rgba(30,32,40,0.85)",
};

export type ThemeColors = typeof light;

export const defaultScheme = "light" satisfies ColorScheme;

export const themes: { light: ThemeColors; dark?: ThemeColors } = { light, dark };

export function setColorScheme(scheme: ColorScheme | null) {
  Appearance.setColorScheme?.(scheme ?? "unspecified");
}

setColorScheme?.(themes.dark ? null : defaultScheme);

export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  const system = useColorScheme();
  const scheme: ColorScheme = system && themes[system] ? system : defaultScheme;
  return { scheme, colors: themes[scheme] ?? themes.light };
}

export function makeStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (colors: ThemeColors) => T & StyleSheet.NamedStyles<any>,
): () => T {
  return function useStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}

// Shared design constants
export const radius = { sm: 6, md: 12, lg: 16, xl: 20, pill: 999 };
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, "2xl": 32, "3xl": 48 };
