import React, { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { MoonIcon, SunIcon } from "./icons";
import { useTheme } from "../theme/theme-context";

export function ThemeToggleButton() {
  const { mode, toggleMode, colors } = useTheme();
  const isLight = mode === "light";

  const styles = useMemo(
    () =>
      StyleSheet.create({
        track: {
          flexDirection: "row",
          alignItems: "center",
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.inset,
          borderRadius: 999,
          padding: 3,
          alignSelf: "flex-start",
          marginTop: 4,
          gap: 2
        },
        knob: {
          width: 34,
          height: 34,
          borderRadius: 17,
          alignItems: "center",
          justifyContent: "center"
        },
        knobActive: {
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          elevation: 2,
          shadowColor: "#0F172A",
          shadowOpacity: 0.12,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 1 }
        }
      }),
    [colors]
  );

  return (
    <Pressable
      onPress={toggleMode}
      accessibilityRole="button"
      accessibilityLabel={`Switch to ${isLight ? "dark" : "light"} mode`}
      style={({ pressed }) => [styles.track, pressed && { opacity: 0.9 }]}
    >
      <View style={[styles.knob, isLight && styles.knobActive]}>
        <SunIcon color={isLight ? "#F59E0B" : colors.muted} size={18} />
      </View>
      <View style={[styles.knob, !isLight && styles.knobActive]}>
        <MoonIcon color={!isLight ? "#A5B4FC" : colors.muted} size={18} />
      </View>
    </Pressable>
  );
}
