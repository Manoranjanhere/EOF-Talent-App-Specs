import { useCallback, useRef, useState } from "react";
import { Alert, Pressable, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { GroupId } from "@eof/shared";
import {
  Card,
  EmptyState,
  FilterDisclosure,
  LabeledInput,
  PrimaryButton,
  ScreenLayout,
  SecondaryButton,
  SectionTitle,
  SegmentedControl,
  SelectableChip
} from "../../components/ui";
import { TalentPortraitCard } from "../../components/talent-portrait-card";
import { AppText } from "../../components/app-text";
import { FlagReason, flagUser } from "../../services/admin.service";
import { listPublishedTags } from "../../services/profile.service";
import { searchMembers, type MemberSearchCard } from "../../services/search.service";
import { AddToListPanel } from "../lists/add-to-list-panel";
import { useAuth } from "../../state/auth-context";
import { useTheme } from "../../theme/theme-context";
import type { DiscoverStackParamList } from "../../navigation/types";
import type { GenderFilterValue } from "../../constants/gender";
import { GENDER_FILTER_OPTIONS } from "../../constants/gender";

type Props = NativeStackScreenProps<DiscoverStackParamList, "MemberSearch">;

type RoleFilter = "all" | "talent" | "employer";
type TagOption = { id: string; slug: string; title: string };

const MAX_SEARCH_TAGS = 5;

function memberRoleLabel(roleIds?: number[]): string | undefined {
  if (!roleIds?.length) return undefined;
  if (roleIds.includes(GroupId.TalentEmployerOrAgency)) return "Employer";
  if (roleIds.includes(GroupId.Talent)) return "Talent";
  return undefined;
}

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
  const [nameQuery, setNameQuery] = useState("");
  const [gender, setGender] = useState<GenderFilterValue>("all");
  const [isAvailable, setIsAvailable] = useState<"all" | "yes" | "no">("all");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [tags, setTags] = useState<TagOption[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [cards, setCards] = useState<MemberSearchCard[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [flagTarget, setFlagTarget] = useState<{ id: string; name: string } | null>(null);
  const [flagReason, setFlagReason] = useState<FlagReason>("FINANCIAL_SCAM");
  const [flagging, setFlagging] = useState(false);
  const [listTarget, setListTarget] = useState<{ id: string; name: string } | null>(null);

  const onSearch = useCallback(async () => {
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
        q: nameQuery || undefined,
        city: city || undefined,
        country: country || undefined,
        gender: gender === "all" ? undefined : gender,
        isAvailable:
          isAvailable === "all" ? undefined : isAvailable === "yes" ? "true" : "false",
        groupId,
        tagIds: selectedTagIds.length ? selectedTagIds.join(",") : undefined
      });
      setCards(result.cards ?? []);
      setSearched(true);
    } catch (error) {
      Alert.alert("Search error", (error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [
    accessToken,
    city,
    country,
    gender,
    isAvailable,
    nameQuery,
    roleFilter,
    selectedTagIds
  ]);

  const onSearchRef = useRef(onSearch);
  onSearchRef.current = onSearch;

  useFocusEffect(
    useCallback(() => {
      void listPublishedTags()
        .then((list) => setTags(list))
        .catch(() => setTags([]));
      void onSearchRef.current();
    }, [])
  );

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) => {
      if (prev.includes(tagId)) return prev.filter((id) => id !== tagId);
      if (prev.length >= MAX_SEARCH_TAGS) return prev;
      return [...prev, tagId];
    });
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

  const filterCount = [
    nameQuery,
    city,
    country,
    gender !== "all" ? gender : "",
    roleFilter !== "all" ? roleFilter : "",
    isAvailable !== "all" ? isAvailable : "",
    selectedTagIds.length ? "tags" : ""
  ].filter(Boolean).length;

  return (
    <ScreenLayout
      title="Discover"
      subtitle="Faces first · save the ones you want"
      headerRight={
        <Pressable
          onPress={() => navigation.navigate("PeopleLists")}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 9,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: colors.gold,
            backgroundColor: colors.goldSoft
          }}
        >
          <AppText variant="label" style={{ color: colors.goldText }}>
            Lists
          </AppText>
        </Pressable>
      }
    >
      <FilterDisclosure
        title="Refine the room"
        open={filtersOpen}
        onToggle={() => setFiltersOpen((v) => !v)}
        summary={
          filterCount
            ? `${filterCount} filter${filterCount === 1 ? "" : "s"} on`
            : "Name, city, skills, availability"
        }
      >
        <LabeledInput label="Name" value={nameQuery} onChangeText={setNameQuery} placeholder="Search by name" />
        <LabeledInput label="City" value={city} onChangeText={setCity} placeholder="Mumbai" />
        <LabeledInput label="Country" value={country} onChangeText={setCountry} placeholder="India" />
        <AppText variant="meta" style={{ color: colors.muted }}>
          Gender
        </AppText>
        <SegmentedControl value={gender} onChange={setGender} options={GENDER_FILTER_OPTIONS} />
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

        <AppText variant="meta" style={{ color: colors.muted }}>
          Skills / tags (max {MAX_SEARCH_TAGS})
        </AppText>
        {tags.length === 0 ? (
          <AppText variant="caption" style={{ color: colors.muted }}>
            Loading tags…
          </AppText>
        ) : (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {tags.map((tag) => {
              const selected = selectedTagIds.includes(tag.id);
              const disabled = !selected && selectedTagIds.length >= MAX_SEARCH_TAGS;
              return (
                <SelectableChip
                  key={tag.id}
                  label={tag.title}
                  selected={selected}
                  disabled={disabled}
                  onPress={() => toggleTag(tag.id)}
                />
              );
            })}
          </View>
        )}

        {selectedTagIds.length > 0 ? (
          <SecondaryButton title="Clear tags" onPress={() => setSelectedTagIds([])} />
        ) : null}

        <PrimaryButton
          title="Show people"
          onPress={() => {
            setFiltersOpen(false);
            void onSearch();
          }}
          loading={loading}
          disabled={loading}
        />
      </FilterDisclosure>

      {listTarget && accessToken ? (
        <AddToListPanel
          token={accessToken}
          memberUserId={listTarget.id}
          memberName={listTarget.name}
          onClose={() => setListTarget(null)}
        />
      ) : null}

      {flagTarget ? (
        <Card>
          <SectionTitle title={`Flag ${flagTarget.name}`} />
          <SegmentedControl value={flagReason} onChange={setFlagReason} options={FLAG_REASONS} />
          <PrimaryButton
            title="Submit report"
            onPress={submitFlag}
            loading={flagging}
            disabled={flagging}
          />
          <SecondaryButton title="Cancel" onPress={() => setFlagTarget(null)} />
        </Card>
      ) : null}

      {!searched || loading ? (
        <EmptyState message={loading ? "Opening the room…" : "Search by name, city, or skills."} />
      ) : cards.length === 0 ? (
        <EmptyState message="No members found. Soften the filters." />
      ) : (
        <>
          <AppText variant="label" style={{ color: colors.muted, marginBottom: 2 }}>
            {cards.length} {cards.length === 1 ? "face" : "faces"}
          </AppText>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {cards.map((card) => (
              <View key={card.id} style={{ width: "48%", flexGrow: 1, maxWidth: "48.5%" }}>
                <TalentPortraitCard
                  name={card.title}
                  location={card.subtitle}
                  rating={card.rating}
                  photoUrl={card.profilePhotoUrl}
                  photoKey={card.profilePhotoObjectKey}
                  role={memberRoleLabel(card.roleIds)}
                  badge={card.seriousAboutJob ? "Serious" : card.isAvailable ? "Looking" : undefined}
                  onPress={() => navigation.navigate("MemberProfile", { userId: card.id })}
                  onAddToList={() => setListTarget({ id: card.id, name: card.title })}
                  onFlag={() => setFlagTarget({ id: card.id, name: card.title })}
                />
              </View>
            ))}
          </View>
        </>
      )}
    </ScreenLayout>
  );
}
