import { Pressable, View } from "react-native";
import { AppText } from "./app-text";
import { ChatUserAvatar } from "./chat-user-avatar";
import { useTheme } from "../theme/theme-context";
import { fonts } from "../theme/typography";

export function JobEditorialCard({
  title,
  description,
  location,
  pay,
  gender,
  age,
  tags,
  validTill,
  postedBy,
  postedByPhotoUrl,
  postedByPhotoKey,
  applied,
  applying,
  onApply,
  onEmployer,
  onWhatsApp,
  onReferInApp
}: {
  title: string;
  description?: string;
  location?: string;
  pay: string;
  gender?: string;
  age?: string;
  tags?: string[];
  validTill?: string;
  postedBy?: string;
  postedByPhotoUrl?: string | null;
  postedByPhotoKey?: string | null;
  applied?: boolean;
  applying?: boolean;
  onApply: () => void;
  onEmployer?: () => void;
  onWhatsApp: () => void;
  onReferInApp: () => void;
}) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 26,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: "hidden",
        marginBottom: 14,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 3
      }}
    >
      <View style={{ height: 3, backgroundColor: colors.gold }} />
      <View style={{ padding: 18, gap: 12 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10 }}>
          <AppText
            numberOfLines={2}
            style={{
              flex: 1,
              color: colors.text,
              fontFamily: fonts.serifBold,
              fontSize: 26,
              lineHeight: 30,
              fontWeight: "700"
            }}
          >
            {title}
          </AppText>
          <View
            style={{
              alignSelf: "flex-start",
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 999,
              backgroundColor: applied ? colors.primarySoft : colors.goldSoft,
              borderWidth: 1,
              borderColor: applied ? colors.primary : colors.gold
            }}
          >
            <AppText variant="label" style={{ color: applied ? colors.accentText : colors.goldText }}>
              {applied ? "Applied" : "Open"}
            </AppText>
          </View>
        </View>

        {description ? (
          <AppText style={{ color: colors.muted }} numberOfLines={3}>
            {description}
          </AppText>
        ) : null}

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {[location || "Location open", pay, gender, age, validTill].filter(Boolean).map((item) => (
            <View
              key={String(item)}
              style={{
                backgroundColor: colors.inset,
                borderRadius: 999,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderWidth: 1,
                borderColor: colors.border
              }}
            >
              <AppText variant="caption" style={{ color: colors.chipText, fontFamily: fonts.sansSemi }}>
                {item}
              </AppText>
            </View>
          ))}
        </View>

        {tags?.length ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {tags.slice(0, 5).map((tag) => (
              <AppText key={tag} variant="caption" style={{ color: colors.goldText }}>
                {tag}
              </AppText>
            ))}
          </View>
        ) : null}

        {postedBy ? (
          <Pressable
            onPress={onEmployer}
            disabled={!onEmployer}
            style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
          >
            <ChatUserAvatar name={postedBy} uri={postedByPhotoUrl} cacheKey={postedByPhotoKey} size={36} />
            <View>
              <AppText variant="label" style={{ color: colors.muted }}>
                Casting by
              </AppText>
              <AppText variant="meta" style={{ color: colors.text, fontFamily: fonts.sansSemi }}>
                {postedBy}
              </AppText>
            </View>
          </Pressable>
        ) : null}

        <Pressable
          onPress={onApply}
          disabled={applied || applying}
          style={({ pressed }) => ({
            backgroundColor: applied ? colors.inset : colors.primary,
            borderRadius: 16,
            minHeight: 50,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed && !applied ? 0.9 : 1
          })}
        >
          <AppText
            style={{
              color: applied ? colors.muted : colors.primaryOn,
              fontFamily: fonts.sansBold,
              fontSize: 15,
              fontWeight: "700"
            }}
          >
            {applied ? "Already applied" : applying ? "Applying…" : "Apply now"}
          </AppText>
        </Pressable>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pressable
            onPress={onWhatsApp}
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 14,
              minHeight: 44,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.card
            }}
          >
            <AppText variant="meta" style={{ color: colors.text, fontFamily: fonts.sansSemi }}>
              WhatsApp
            </AppText>
          </Pressable>
          <Pressable
            onPress={onReferInApp}
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 14,
              minHeight: 44,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.card
            }}
          >
            <AppText variant="meta" style={{ color: colors.text, fontFamily: fonts.sansSemi }}>
              Refer in app
            </AppText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
