import React, { Component, ErrorInfo, ReactNode, useMemo } from "react";
import { StatusBar, StyleSheet, Text, View } from "react-native";
import { NavigationContainer, DarkTheme, DefaultTheme } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { RootNavigator } from "./src/navigation/root-navigator";
import { AuthProvider } from "./src/state/auth-context";
import { ChatSocketProvider } from "./src/state/chat-socket-context";
import { ChatUnreadProvider } from "./src/state/chat-unread-context";
import { ThemeProvider, useTheme } from "./src/theme/theme-context";

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
      colors: {
        ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
        background: colors.bg,
        card: colors.card,
        border: colors.border,
        text: colors.text,
        primary: colors.primary
      }
    }),
    [colors, isDark]
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.bg}
      />
      <NavigationContainer theme={navTheme}>
        <RootNavigator />
      </NavigationContainer>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <ThemeProvider>
          <AuthProvider>
            <ChatSocketProvider>
              <ChatUnreadProvider>
                <AppShell />
              </ChatUnreadProvider>
            </ChatSocketProvider>
          </AuthProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  errorScreen: {
    flex: 1,
    backgroundColor: "#F4F6F9",
    padding: 24,
    justifyContent: "center"
  },
  errorTitle: {
    color: "#0F172A",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 8
  },
  errorBody: {
    color: "#64748B",
    fontSize: 14,
    lineHeight: 20
  }
});
