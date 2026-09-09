import { Component, ErrorInfo, ReactNode, useMemo } from "react";
import { StatusBar, StyleSheet, Text, View } from "react-native";
import { NavigationContainer, DarkTheme, DefaultTheme } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { RootNavigator } from "./src/navigation/root-navigator";
import { AuthProvider } from "./src/state/auth-context";
import { ChatSocketProvider } from "./src/state/chat-socket-context";
import { ChatUnreadProvider } from "./src/state/chat-unread-context";
import { ThemeProvider, useTheme } from "./src/theme/theme-context";
import { useAppFonts } from "./src/theme/load-fonts";
import { AppLogoIcon } from "./src/components/icons";
import { fonts } from "./src/theme/typography";

type ErrorBoundaryState = { error: Error | null };

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("App crash:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.errorScreen}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorBody}>{this.state.error.message}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

function AppShell() {
  const { colors, isDark } = useTheme();

  const navTheme = useMemo(
    () => ({
      ...(isDark ? DarkTheme : DefaultTheme),
      dark: isDark,
      colors: {
        ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
        background: colors.bg,
        card: colors.card,
        border: colors.border,
        text: colors.text,
        primary: colors.primary,
        notification: colors.primary
      }
    }),
    [colors, isDark]
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.heroFrom}
      />
      <NavigationContainer theme={navTheme}>
        <RootNavigator />
      </NavigationContainer>
    </View>
  );
}

function FontGate({ children }: { children: ReactNode }) {
  const [loaded, error] = useAppFonts();
  const { colors } = useTheme();

  if (!loaded && !error) {
    return (
      <View style={[styles.splash, { backgroundColor: colors.heroFrom }]}>
        <View style={styles.splashGold} />
        <AppLogoIcon size={56} />
        <Text style={[styles.splashBrand, { color: colors.gold }]}>EOF TALENT</Text>
        <Text style={[styles.splashTag, { color: colors.heroMuted }]}>The casting stage</Text>
      </View>
    );
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <ThemeProvider>
          <FontGate>
            <AuthProvider>
              <ChatSocketProvider>
                <ChatUnreadProvider>
                  <AppShell />
                </ChatUnreadProvider>
              </ChatSocketProvider>
            </AuthProvider>
          </FontGate>
        </ThemeProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  errorScreen: {
    flex: 1,
    backgroundColor: "#F3EDE6",
    padding: 24,
    justifyContent: "center"
  },
  errorTitle: {
    color: "#1A1410",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 8
  },
  errorBody: {
    color: "#7A6E64",
    fontSize: 14,
    lineHeight: 20
  },
  splash: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14
  },
  splashGold: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "#C6A36A"
  },
  splashBrand: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
    letterSpacing: 3,
    fontWeight: "700"
  },
  splashTag: {
    fontFamily: fonts.serifItalic,
    fontSize: 18
  }
});
