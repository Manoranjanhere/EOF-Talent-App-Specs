import { Pressable, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { CachedMediaImage } from "./cached-media-image";
import { AppText } from "./app-text";
import { BookmarkIcon, FlagIcon, StarIcon } from "./icons";
import { useTheme } from "../theme/theme-context";
import { fonts } from "../theme/typography";
import { mediaUrl } from "../services/albums.service";

export function TalentPortraitCard({
  name,
  location,
  rating,
  photoUrl,
  photoKey,
  badge,
  role,
  onPress,
  onAddToList,
  onFlag
}: {
  name: string;
  location?: string;
  rating?: number | string | null;
  photoUrl?: string | null;
  photoKey?: string | null;
  badge?: string;
  role?: string;
  onPress: () => void;
  onAddToList?: () => void;
  onFlag?: () => void;
}) {
  const { colors } = useTheme();
  const uri = mediaUrl(photoUrl);
  const initial = (name || "?").slice(0, 1).toUpperCase();
  const stars = rating == null || rating === "" ? null : Number(rating);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        borderRadius: 22,
        overflow: "hidden",
        backgroundColor: colors.inset,
        borderWidth: 1,
        borderColor: colors.border,
        minHeight: 248,
        opacity: pressed ? 0.94 : 1,
        transform: [{ scale: pressed ? 0.985 : 1 }]
      })}
    >
      {uri ? (
        <CachedMediaImage
          uri={uri}
          cacheKey={photoKey}
          style={{ position: "absolute", width: "100%", height: "100%" }}
        />
      ) : (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 36 }}>
          <AppText
            variant="display"
            style={{ color: colors.gold, fontSize: 56, lineHeight: 60 }}
          >
            {initial}
          </AppText>
        </View>
      )}

      <LinearGradient
        colors={["transparent", "rgba(12,8,6,0.18)", "rgba(12,8,6,0.92)"]}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: 12,
          paddingTop: 48,
          paddingBottom: 12
        }}
      >
        {badge || role ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 6 }}>
            {role ? (
              <View
                style={{
                  backgroundColor: "rgba(255,251,247,0.16)",
                  borderWidth: 1,
                  borderColor: "rgba(198,163,106,0.55)",
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 999
                }}
              >
                <AppText variant="label" style={{ color: "#F4E9D4", fontSize: 9, letterSpacing: 0.8 }}>
                  {role}
                </AppText>
              </View>
            ) : null}
            {badge ? (
              <View
                style={{
                  backgroundColor: colors.gold,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 999
                }}
              >
                <AppText variant="label" style={{ color: "#1A1410", fontSize: 9, letterSpacing: 0.8 }}>
                  {badge}
                </AppText>
              </View>
            ) : null}
          </View>
        ) : null}

        <AppText
          numberOfLines={1}
          style={{
            color: "#FFF8F0",
            fontFamily: fonts.serifBold,
            fontSize: 20,
            lineHeight: 24,
            fontWeight: "700"
          }}
        >
          {name}
        </AppText>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 }}>
          {stars != null && Number.isFinite(stars) ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
              <StarIcon color={colors.gold} size={12} filled />
              <AppText variant="caption" style={{ color: colors.gold, fontFamily: fonts.sansSemi }}>
                {stars.toFixed(1)}
              </AppText>
            </View>
          ) : null}
          <AppText variant="caption" style={{ color: "#D8C8B6" }} numberOfLines={1}>
            {location || "Location open"}
          </AppText>
        </View>
      </LinearGradient>

      {onAddToList || onFlag ? (
        <View style={{ position: "absolute", top: 10, right: 10, gap: 8 }}>
          {onAddToList ? (
            <Pressable
              onPress={onAddToList}
              hitSlop={8}
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: "rgba(255,251,247,0.92)",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <BookmarkIcon color={colors.primary} size={16} />
            </Pressable>
          ) : null}
          {onFlag ? (
            <Pressable
              onPress={onFlag}
              hitSlop={8}
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: "rgba(255,251,247,0.92)",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <FlagIcon color={colors.danger} size={16} />
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
}
