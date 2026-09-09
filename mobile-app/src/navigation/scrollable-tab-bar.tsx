import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { tabIcons, TabRouteName } from "../components/icons";
import { fonts } from "../theme/typography";
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
          paddingBottom: Math.max(insets.bottom, 4),
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 10,
          elevation: 8
        }
      ]}
    >
      <View style={{ height: 1.5, backgroundColor: colors.gold, opacity: 0.65 }} />
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
                  borderRadius: 12
                }
              ]}
            >
              {Icon ? (
                <View>
                  <Icon color={color} size={20} />
                  {badgeCount > 0 ? (
                    <View
                      style={{
                        position: "absolute",
                        top: -5,
                        right: -8,
                        minWidth: 16,
                        height: 16,
                        borderRadius: 8,
                        backgroundColor: colors.primary,
                        alignItems: "center",
                        justifyContent: "center",
                        paddingHorizontal: 4,
                        borderWidth: 2,
                        borderColor: colors.card,
                        overflow: "hidden"
                      }}
                    >
                      <Text style={{ color: colors.primaryOn, fontSize: 10, fontWeight: "800" }}>
                        {badgeLabel}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ) : null}
              <Text
                style={[styles.label, { color, fontWeight: focused ? "800" : "600" }]}
                numberOfLines={1}
              >
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
    borderTopWidth: 0
  },
  row: {
    paddingHorizontal: 8,
    paddingRight: 20,
    paddingTop: 4,
    alignItems: "center"
  },
  item: {
    minWidth: 68,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: "center",
    justifyContent: "center",
    gap: 2
  },
  label: {
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    fontFamily: fonts.sansSemi
  }
});
