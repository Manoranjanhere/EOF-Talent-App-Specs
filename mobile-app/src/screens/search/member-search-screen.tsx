import React, { useCallback, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { GroupId } from "@eof/shared";
import {
  Card,
  EmptyState,
  LabeledInput,
  ListCard,
  PrimaryButton,
  ScreenLayout,
  SecondaryButton,
  SectionTitle,
  SegmentedControl
} from "../../components/ui";
import { FlagReason, flagUser } from "../../services/admin.service";
import { listPublishedTags } from "../../services/profile.service";
import { searchMembers } from "../../services/search.service";
import { useAuth } from "../../state/auth-context";
import { useTheme } from "../../theme/theme-context";
import type { DiscoverStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<DiscoverStackParamList, "MemberSearch">;

type RoleFilter = "all" | "talent" | "employer";
type TagOption = { id: string; slug: string; title: string };

const MAX_SEARCH_TAGS = 5;

const FLAG_REASONS: { value: FlagReason; label: string }[] = [
  { value: "FINANCIAL_SCAM", label: "Scam" },
  { value: "OBSCENE", label: "Obscene" },
  { value: "CHILD_ABUSE", label: "Abuse" },
  { value: "PORNOGRAPHY", label: "Adult" }
];

export function MemberSearchScreen({ navigation }: Props) {
  const { accessToken } = useAuth();
  const { colors } = useTheme();
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [gender, setGender] = useState("");
  const [isAvailable, setIsAvailable] = useState<"all" | "yes" | "no">("all");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [tags, setTags] = useState<TagOption[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [flagTarget, setFlagTarget] = useState<{ id: string; name: string } | null>(null);
  const [flagReason, setFlagReason] = useState<FlagReason>("FINANCIAL_SCAM");
  const [flagging, setFlagging] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void listPublishedTags()
        .then((list) => setTags(list))
        .catch(() => setTags([]));
    }, [])
  );

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) => {
      if (prev.includes(tagId)) return prev.filter((id) => id !== tagId);
      if (prev.length >= MAX_SEARCH_TAGS) return prev;
      return [...prev, tagId];
    });
  };

  const onSearch = async () => {
    if (!accessToken) {
      Alert.alert("Sign in required", "Please sign in to discover talent.");
      return;
    }
    try {
      setLoading(true);
      const groupId =
        roleFilter === "talent"
          ? GroupId.Talent
          : roleFilter === "employer"
            ? GroupId.TalentEmployerOrAgency
            : undefined;
      const result = await searchMembers(accessToken, {
        city: city || undefined,
        country: country || undefined,
        gender: gender || undefined,
        isAvailable:
          isAvailable === "all" ? undefined : isAvailable === "yes" ? "true" : "false",
        groupId,
        tagIds: selectedTagIds.length ? selectedTagIds.join(",") : undefined
      });
      setCards((result as any).cards ?? []);
    } catch (error) {
      Alert.alert("Search error", (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const submitFlag = async () => {
    if (!accessToken || !flagTarget) {
      Alert.alert("Sign in required", "Please sign in to flag a profile.");
      return;
    }
    try {
      setFlagging(true);
      await flagUser(accessToken, {
        reportedUserId: flagTarget.id,
        reason: flagReason
      });
      Alert.alert("Reported", `${flagTarget.name} was sent to the moderation queue.`);
      setFlagTarget(null);
    } catch (error) {
      Alert.alert("Flag failed", (error as Error).message);
    } finally {
      setFlagging(false);
    }
  };

  return (
    <ScreenLayout title="Discover talent" subtitle="Filter by location, role, availability & skills">
      <Card>
        <SectionTitle title="Filters" />
        <LabeledInput label="City" value={city} onChangeText={setCity} placeholder="Mumbai" />
        <LabeledInput label="Country" value={country} onChangeText={setCountry} placeholder="India" />
        <LabeledInput label="Gender" value={gender} onChangeText={setGender} placeholder="Any" />
        <SegmentedControl
          value={roleFilter}
          onChange={setRoleFilter}
          options={[
            { value: "all", label: "All" },
            { value: "talent", label: "Talent" },
            { value: "employer", label: "Employer" }
          ]}
        />
        <SegmentedControl
          value={isAvailable}
          onChange={setIsAvailable}
          options={[
            { value: "all", label: "Any" },
            { value: "yes", label: "Looking" },
            { value: "no", label: "Not looking" }
          ]}
        />

        <Text style={{ color: colors.muted, fontSize: 13, fontWeight: "600", marginTop: 4 }}>
          Skills / tags (max {MAX_SEARCH_TAGS})
        </Text>
        <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 8 }}>
          {selectedTagIds.length
            ? `${selectedTagIds.length} selected — shows members with any matching tag`
            : "Tap tags to narrow results"}
        </Text>
        {tags.length === 0 ? (
          <Text style={{ color: colors.muted, fontSize: 12 }}>Loading tags…</Text>
        ) : (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {tags.map((tag) => {
              const selected = selectedTagIds.includes(tag.id);
              const disabled = !selected && selectedTagIds.length >= MAX_SEARCH_TAGS;
              return (
                <Pressable
                  key={tag.id}
                  disabled={disabled}
                  onPress={() => toggleTag(tag.id)}
                  style={{
                    opacity: disabled ? 0.4 : 1,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: selected ? colors.primary : colors.border,
                    backgroundColor: selected ? colors.primarySoft : colors.inset
                  }}
                >
                  <Text
                    style={{
                      color: selected ? colors.accentText : colors.text,
                      fontSize: 13,
                      fontWeight: selected ? "700" : "500"
                    }}
                  >
                    {tag.title}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {selectedTagIds.length > 0 ? (
          <SecondaryButton title="Clear tags" onPress={() => setSelectedTagIds([])} />
        ) : null}

        <PrimaryButton title="Search members" onPress={onSearch} loading={loading} disabled={loading} />
      </Card>

      {flagTarget ? (
        <Card>
          <SectionTitle title={`Flag ${flagTarget.name}`} />
          <SegmentedControl
            value={flagReason}
            onChange={setFlagReason}
            options={FLAG_REASONS}
          />
          <PrimaryButton
            title="Submit report"
            onPress={submitFlag}
            loading={flagging}
            disabled={flagging}
          />
          <SecondaryButton title="Cancel" onPress={() => setFlagTarget(null)} />
        </Card>
      ) : null}

      {cards.length === 0 ? (
        <EmptyState message="No members found. Try different filters." />
      ) : (
        cards.map((card) => (
          <View key={card.id}>
            <ListCard
              title={card.title}
              subtitle={card.subtitle || "No location"}
              badge={card.isAvailable ? "Looking" : undefined}
              meta={[
                `★ ${String(card.rating ?? "—")}`,
                (card.tags ?? []).length ? (card.tags ?? []).join(" · ") : "No tags"
              ]}
              onPress={() => navigation.navigate("MemberProfile", { userId: card.id })}
            />
            <View style={{ marginTop: -4, marginBottom: 10, paddingHorizontal: 4 }}>
              <SecondaryButton
                title="Flag profile"
                onPress={() => setFlagTarget({ id: card.id, name: card.title })}
              />
            </View>
          </View>
        ))
      )}
    </ScreenLayout>
  );
}
