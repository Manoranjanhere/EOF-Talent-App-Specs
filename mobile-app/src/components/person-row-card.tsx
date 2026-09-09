import type { ReactNode } from "react";
import { Pressable, View } from "react-native";
import { AppText } from "./app-text";
import { ChatUserAvatar } from "./chat-user-avatar";
import { StarIcon } from "./icons";
import { fonts } from "../theme/typography";
import { useTheme } from "../theme/theme-context";

export function PersonRowCard({
  name,
  subtitle,
  photoUrl,
  photoKey,
  badge,
  rating,
  onPress,
  trailing
}: {
  name: string;
  subtitle?: string;
  photoUrl?: string | null;
  photoKey?: string | null;
  badge?: string;
  rating?: number | string | null;
  onPress?: () => void;
  trailing?: ReactNode;
}) {
  const { colors } = useTheme();
  const stars = rating == null || rating === "" ? null : Number(rating);

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 14,
        backgroundColor: colors.card,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.border,
        opacity: pressed && onPress ? 0.94 : 1
      })}
    >
      <ChatUserAvatar name={name} uri={photoUrl} cacheKey={photoKey} size={56} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <AppText
            numberOfLines={1}
            style={{
              flex: 1,
              color: colors.text,
              fontFamily: fonts.serifBold,
              fontSize: 20,
              lineHeight: 24,
              fontWeight: "700"
            }}
          >
            {name}
          </AppText>
          {badge ? (
            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 999,
                backgroundColor: colors.goldSoft,
                borderWidth: 1,
                borderColor: colors.gold
              }}
            >
              <AppText variant="label" style={{ color: colors.goldText, fontSize: 9 }}>
                {badge}
              </AppText>
            </View>
          ) : null}
        </View>
        {subtitle ? (
          <AppText variant="caption" style={{ color: colors.muted, marginTop: 3 }} numberOfLines={2}>
            {subtitle}
          </AppText>
        ) : null}
        {stars != null && Number.isFinite(stars) ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
            <StarIcon color={colors.gold} size={12} filled />
            <AppText variant="caption" style={{ color: colors.goldText, fontFamily: fonts.sansSemi }}>
              {stars.toFixed(1)}
            </AppText>
          </View>
        ) : null}
      </View>
      {trailing}
    </Pressable>
  );
}
