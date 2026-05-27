import React from "react";
import { StatusBar } from "react-native";
import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { colors } from "./src/components/ui";
import { RootNavigator } from "./src/navigation/root-navigator";
import { AuthProvider } from "./src/state/auth-context";

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.card,
    border: colors.border,
    text: colors.text,
    primary: colors.primary
  }
};

export default function App() {
  return (
    <AuthProvider>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <NavigationContainer theme={navTheme}>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
