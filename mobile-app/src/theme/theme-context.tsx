import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AppColors, ThemeMode, palettes } from "./colors";

type ThemeContextValue = {
  mode: ThemeMode;
  colors: AppColors;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("light");

  const toggleMode = useCallback(() => {
    setMode((current) => (current === "light" ? "dark" : "light"));
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      colors: palettes[mode],
      isDark: mode === "dark",
      setMode,
      toggleMode
    }),
    [mode, toggleMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
