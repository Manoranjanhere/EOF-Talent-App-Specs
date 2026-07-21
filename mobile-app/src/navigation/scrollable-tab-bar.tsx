import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { tabIcons, TabRouteName } from "../components/icons";
import { useTheme } from "../theme/theme-context";
import { useChatUnread } from "../state/chat-unread-context";

/** Horizontal scroll so admin/employer extra tabs stay visible */
export function ScrollableTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { totalUnread } = useChatUnread();

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, 8),
          shadowColor: "#0F172A",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 12
        }
      ]}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        bounces={false}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            typeof options.tabBarLabel === "string"
              ? options.tabBarLabel
              : typeof options.title === "string"
                ? options.title
                : route.name;
          const focused = state.index === index;
          const color = focused ? colors.primary : colors.muted;
          const Icon = tabIcons[route.name as TabRouteName];
          const badgeCount = route.name === "Chat" ? totalUnread : 0;
          const badgeLabel = badgeCount > 99 ? "99+" : String(badgeCount);

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={
                badgeCount > 0 ? `${label}, ${badgeCount} unread messages` : label
              }
              onPress={() => {
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true
                });
                if (!focused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              }}
              style={[
                styles.item,
                focused && {
                  backgroundColor: colors.primarySoft,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colors.border
                }
              ]}
            >
              {focused ? (
                <View
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 12,
                    right: 12,
                    height: 3,
                    borderRadius: 2,
                    backgroundColor: colors.primary
                  }}
                />
              ) : null}
              {Icon ? (
                <View>
                  <Icon color={color} size={22} />
                  {badgeCount > 0 ? (
                    <View
                      style={{
                        position: "absolute",
                        top: -6,
                        right: -10,
                        minWidth: 18,
                        height: 18,
                        borderRadius: 9,
                        backgroundColor: "#FF3040",
                        alignItems: "center",
                        justifyContent: "center",
                        paddingHorizontal: 4,
                        borderWidth: 2,
                        borderColor: colors.card
                      }}
                    >
                      <Text style={{ color: "#fff", fontSize: 10, fontWeight: "800" }}>
                        {badgeLabel}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ) : null}
              <Text style={[styles.label, { color, fontWeight: focused ? "800" : "600" }]} numberOfLines={1}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8
  },
  row: {
    paddingHorizontal: 10,
    paddingRight: 28,
    alignItems: "center"
  },
  item: {
    minWidth: 76,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 4
  },
  label: {
    fontSize: 11
  }
});
