import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { Animated, Easing } from "react-native";
import { AppColors, ThemeMode, lightColors, palettes } from "./colors";
import { blendPalettes } from "./blend-colors";

const THEME_ANIM_MS = 220;

type ThemeContextValue = {
  mode: ThemeMode;
  colors: AppColors;
  isDark: boolean;
  isTransitioning: boolean;
  themeProgress: Animated.Value;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("light");
  const [colors, setColors] = useState<AppColors>(lightColors);
  const [progressValue, setProgressValue] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);
  const modeRef = useRef(mode);
  const targetModeRef = useRef<ThemeMode>("light");
  modeRef.current = mode;

  useEffect(() => {
    const listenerId = progress.addListener(({ value }) => {
      setProgressValue(value);
      setColors(blendPalettes(palettes.light, palettes.dark, value));
    });
    return () => {
      progress.removeListener(listenerId);
    };
  }, [progress]);

  const animateTo = useCallback(
    (nextMode: ThemeMode) => {
      const toValue = nextMode === "dark" ? 1 : 0;
      targetModeRef.current = nextMode;
      animRef.current?.stop();
      setIsTransitioning(true);
      animRef.current = Animated.timing(progress, {
        toValue,
        duration: THEME_ANIM_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false
      });
      animRef.current.start(({ finished }) => {
        if (finished) {
          setMode(nextMode);
          setColors(palettes[nextMode]);
          setProgressValue(toValue);
          progress.setValue(toValue);
        }
        setIsTransitioning(false);
      });
    },
    [progress]
  );

  const setModeAnimated = useCallback(
    (nextMode: ThemeMode) => {
      if (!isTransitioning && modeRef.current === nextMode) return;
      if (isTransitioning && targetModeRef.current === nextMode) return;
      animateTo(nextMode);
    },
    [animateTo, isTransitioning]
  );

  const toggleMode = useCallback(() => {
    setModeAnimated(modeRef.current === "light" ? "dark" : "light");
  }, [setModeAnimated]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      colors,
      isDark: progressValue >= 0.5,
      isTransitioning,
      themeProgress: progress,
      setMode: setModeAnimated,
      toggleMode
    }),
    [mode, colors, progressValue, isTransitioning, progress, setModeAnimated, toggleMode]
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
