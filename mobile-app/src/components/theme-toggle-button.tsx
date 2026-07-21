import React, { useMemo } from "react";
import { Animated, Pressable, View } from "react-native";
import { MoonIcon, SunIcon } from "./icons";
import { useTheme } from "../theme/theme-context";

const KNOB = 38;
const PAD = 4;
const GAP = 0;

export function ThemeToggleButton() {
  const { colors, isDark, setMode, themeProgress } = useTheme();

  const slideX = useMemo(
    () =>
      themeProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [PAD, PAD + KNOB + GAP]
      }),
    [themeProgress]
  );

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.inset,
        borderRadius: 999,
        padding: PAD,
        alignSelf: "flex-start",
        marginTop: 4,
        width: PAD * 2 + KNOB * 2 + GAP,
        height: PAD * 2 + KNOB,
        overflow: "hidden"
      }}
    >
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: 0,
          top: PAD,
          width: KNOB,
          height: KNOB,
          borderRadius: KNOB / 2,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.primary,
          transform: [{ translateX: slideX }]
        }}
      />

      <Pressable
        onPress={() => setMode("light")}
        accessibilityRole="button"
        accessibilityLabel="Light mode"
        accessibilityState={{ selected: !isDark }}
        style={({ pressed }) => ({
          width: KNOB,
          height: KNOB,
          borderRadius: KNOB / 2,
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.85 : 1,
          zIndex: 1
        })}
      >
        <SunIcon color={!isDark ? "#F59E0B" : colors.muted} size={19} />
      </Pressable>

      <Pressable
        onPress={() => setMode("dark")}
        accessibilityRole="button"
        accessibilityLabel="Dark mode"
        accessibilityState={{ selected: isDark }}
        style={({ pressed }) => ({
          width: KNOB,
          height: KNOB,
          borderRadius: KNOB / 2,
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.85 : 1,
          zIndex: 1
        })}
      >
        <MoonIcon color={isDark ? "#A5B4FC" : colors.muted} size={19} />
      </Pressable>
    </View>
  );
}
