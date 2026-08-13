import AsyncStorage from "@react-native-async-storage/async-storage";
import { Appearance, View, useColorScheme as useSystemColorScheme } from "react-native";
import { colorScheme as nativewindColorScheme, vars } from "nativewind";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { SchemeColors, type ColorScheme } from "@/constants/theme";

export type ThemePreference = "system" | ColorScheme;

type ThemeContextValue = {
  colorScheme: ColorScheme;
  themePreference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => void;
  setColorScheme: (scheme: ColorScheme) => void;
};

const THEME_PREFERENCE_KEY = "wanderstamp.theme-preference.v1";
const ThemeContext = createContext<ThemeContextValue | null>(null);

function isThemePreference(value: string | null): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useSystemColorScheme() ?? "light";
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>("system");
  const colorScheme: ColorScheme = themePreference === "system" ? systemScheme : themePreference;

  const applyScheme = useCallback((scheme: ColorScheme, preference: ThemePreference) => {
    nativewindColorScheme.set(scheme);
    Appearance.setColorScheme?.(preference === "system" ? null : scheme);
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.dataset.theme = scheme;
      root.classList.toggle("dark", scheme === "dark");
      const palette = SchemeColors[scheme];
      Object.entries(palette).forEach(([token, value]) => {
        root.style.setProperty(`--color-${token}`, value);
      });
    }
  }, []);

  const setThemePreference = useCallback((preference: ThemePreference) => {
    setThemePreferenceState(preference);
    void AsyncStorage.setItem(THEME_PREFERENCE_KEY, preference);
  }, []);

  const setColorScheme = useCallback((scheme: ColorScheme) => {
    setThemePreference(scheme);
  }, [setThemePreference]);

  useEffect(() => {
    let mounted = true;
    void AsyncStorage.getItem(THEME_PREFERENCE_KEY).then((stored) => {
      if (mounted && isThemePreference(stored)) setThemePreferenceState(stored);
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    applyScheme(colorScheme, themePreference);
  }, [applyScheme, colorScheme, themePreference]);

  const themeVariables = useMemo(
    () => vars({
      "color-primary": SchemeColors[colorScheme].primary,
      "color-background": SchemeColors[colorScheme].background,
      "color-surface": SchemeColors[colorScheme].surface,
      "color-foreground": SchemeColors[colorScheme].foreground,
      "color-muted": SchemeColors[colorScheme].muted,
      "color-border": SchemeColors[colorScheme].border,
      "color-success": SchemeColors[colorScheme].success,
      "color-warning": SchemeColors[colorScheme].warning,
      "color-error": SchemeColors[colorScheme].error,
    }),
    [colorScheme],
  );

  const value = useMemo(() => ({ colorScheme, themePreference, setThemePreference, setColorScheme }), [colorScheme, themePreference, setThemePreference, setColorScheme]);

  return <ThemeContext.Provider value={value}><View style={[{ flex: 1 }, themeVariables]}>{children}</View></ThemeContext.Provider>;
}

export function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useThemeContext must be used within ThemeProvider");
  return ctx;
}
