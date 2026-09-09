import { Pressable, View } from "react-native";
import { CachedMediaImage } from "./cached-media-image";
import { AppText } from "./app-text";
import { TagChips } from "./ui";
import { fonts } from "../theme/typography";
import { useTheme } from "../theme/theme-context";

export function ProfileHero({
  name,
  subtitle,
  avatarUri,
  avatarKey,
  meta,
  tags,
  bio,
  onAvatarPress,
  badge
}: {
  name: string;
  subtitle?: string;
  avatarUri?: string | null;
  avatarKey?: string | null;
  meta?: string;
  tags?: string[];
  bio?: string | null;
  onAvatarPress?: () => void;
  badge?: string | null;
}) {
  const { colors } = useTheme();
  const initial = (name || "?").slice(0, 1).toUpperCase();
  const size = 168;

  return (
    <View
      style={{
        width: "100%",
        alignItems: "center",
        marginBottom: 8,
        paddingVertical: 4,
        gap: 14
      }}
    >
      <Pressable
        onPress={onAvatarPress}
        disabled={!onAvatarPress}
        style={{
          width: size + 10,
          height: Math.round(size * 1.22) + 10,
          borderRadius: 28,
          backgroundColor: colors.goldSoft,
          borderWidth: 1.5,
          borderColor: colors.gold,
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.16,
          shadowRadius: 20,
          elevation: 6
        }}
      >
        <View
          style={{
            width: size,
            height: Math.round(size * 1.22),
            borderRadius: 24,
            overflow: "hidden",
            backgroundColor: colors.inset
          }}
        >
          {avatarUri ? (
            <CachedMediaImage
              uri={avatarUri}
              cacheKey={avatarKey}
              style={{ width: "100%", height: "100%" }}
            />
          ) : (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <AppText style={{ color: colors.goldText, fontFamily: fonts.serifBold, fontSize: 56, lineHeight: 60 }}>
                {initial}
              </AppText>
            </View>
          )}
        </View>
      </Pressable>

      {onAvatarPress && avatarUri ? (
        <AppText variant="caption" style={{ color: colors.muted, letterSpacing: 0.4 }}>
          Tap portrait to enlarge
        </AppText>
      ) : null}

      <View style={{ alignItems: "center", gap: 8, paddingHorizontal: 16, width: "100%" }}>
        <AppText
          variant="display"
          style={{ color: colors.text, textAlign: "center", fontSize: 32, lineHeight: 36 }}
          numberOfLines={2}
        >
          {name}
        </AppText>
        {badge ? (
          <View
            style={{
              backgroundColor: colors.goldSoft,
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: colors.gold
            }}
          >
            <AppText variant="label" style={{ color: colors.goldText }}>
              {badge}
            </AppText>
          </View>
        ) : null}
        {subtitle ? (
          <AppText variant="subtitle" style={{ color: colors.muted, textAlign: "center" }} numberOfLines={2}>
            {subtitle}
          </AppText>
        ) : null}
        {meta ? (
          <View
            style={{
              backgroundColor: colors.goldSoft,
              paddingHorizontal: 14,
              paddingVertical: 7,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: colors.gold,
              maxWidth: "100%",
              overflow: "hidden"
            }}
          >
            <AppText
              variant="meta"
              style={{ color: colors.goldText, textAlign: "center", fontFamily: fonts.sansSemi }}
              numberOfLines={2}
            >
              {meta}
            </AppText>
          </View>
        ) : null}
        {tags?.length ? <TagChips tags={tags} /> : null}
        {bio ? (
          <AppText
            style={{
              color: colors.text,
              textAlign: "center",
              marginTop: 4,
              paddingHorizontal: 4,
              fontFamily: fonts.serifItalic,
              fontSize: 16,
              lineHeight: 24
            }}
          >
            {bio}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}
