import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { GroupId } from "@eof/shared";
import {
  Card,
  EmptyState,
  LabeledInput,
  PrimaryButton,
  ScreenLayout,
  SecondaryButton,
  SectionTitle
} from "../../components/ui";
import { TalentPortraitCard } from "../../components/talent-portrait-card";
import {
  deletePeopleList,
  getPeopleList,
  removeListMember,
  updatePeopleList,
  type PeopleListDetail
} from "../../services/lists.service";
import { listPublishedTags } from "../../services/profile.service";
import { useAuth } from "../../state/auth-context";
import { useTheme } from "../../theme/theme-context";
import type { DiscoverStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<DiscoverStackParamList, "PeopleListDetail">;
type TagOption = { id: string; slug: string; title: string };

function memberRoleLabel(roleIds?: number[]) {
  if (!roleIds?.length) return undefined;
  if (roleIds.includes(GroupId.TalentEmployerOrAgency)) return "Employer";
  if (roleIds.includes(GroupId.Talent)) return "Talent";
  return undefined;
}

export function PeopleListDetailScreen({ route, navigation }: Props) {
  const { listId } = route.params;
  const { accessToken } = useAuth();
  const { colors } = useTheme();
  const [list, setList] = useState<PeopleListDetail | null>(null);
  const [title, setTitle] = useState("");
  const [q, setQ] = useState("");
  const [tags, setTags] = useState<TagOption[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const filtersRef = useRef({ q: "", tagIds: [] as string[] });
  filtersRef.current = { q, tagIds: selectedTagIds };

  useEffect(() => {
    filtersRef.current = { q: "", tagIds: [] };
    setTitle("");
    setQ("");
    setSelectedTagIds([]);
  }, [listId]);

  const fetchList = useCallback(
    async (name: string, tagIds: string[]) => {
      if (!accessToken) return;
      try {
        const [detail, tagList] = await Promise.all([
          getPeopleList(accessToken, listId, {
            q: name.trim() || undefined,
            tagIds: tagIds.length ? tagIds.join(",") : undefined
          }),
          listPublishedTags()
        ]);
        setList(detail);
        setTitle((prev) => (prev.trim() ? prev : detail.title));
        setTags(tagList);
      } catch (error) {
        Alert.alert("Could not load list", (error as Error).message);
        navigation.goBack();
      }
    },
    [accessToken, listId, navigation]
  );

  useFocusEffect(
    useCallback(() => {
      const { q: name, tagIds } = filtersRef.current;
      void fetchList(name, tagIds);
    }, [fetchList])
  );

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const onRename = async () => {
    if (!accessToken) return;
    const trimmed = title.trim();
    if (trimmed.length < 2) {
      Alert.alert("List name", "Enter at least 2 characters.");
      return;
    }
    try {
      setSaving(true);
      await updatePeopleList(accessToken, listId, trimmed);
      await fetchList(q, selectedTagIds);
    } catch (error) {
      Alert.alert("Rename failed", (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = () => {
    Alert.alert("Delete list?", "People are only removed from this folder.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          if (!accessToken) return;
          try {
            await deletePeopleList(accessToken, listId);
            navigation.goBack();
          } catch (error) {
            Alert.alert("Delete failed", (error as Error).message);
          }
        }
      }
    ]);
  };

  const onRemoveMember = (userId: string, name: string) => {
    Alert.alert("Remove from list?", `Remove ${name} from this folder?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        onPress: async () => {
          if (!accessToken) return;
          try {
            await removeListMember(accessToken, listId, userId);
            await fetchList(q, selectedTagIds);
          } catch (error) {
            Alert.alert("Remove failed", (error as Error).message);
          }
        }
      }
    ]);
  };

  return (
    <ScreenLayout
      title={list?.title || "List"}
      subtitle="Your private shortlist"
      headerStyle="slim"
      footer={<SecondaryButton title="Back to lists" onPress={() => navigation.goBack()} />}
    >
      <Card>
        <SectionTitle title="Edit list" />
        <LabeledInput label="Name" value={title} onChangeText={setTitle} />
        <PrimaryButton title="Save name" onPress={() => void onRename()} loading={saving} disabled={saving} />
        <SecondaryButton title="Delete list" onPress={onDelete} />
      </Card>

      <Card>
        <SectionTitle title="Search this list" />
        <LabeledInput
          label="Name"
          value={q}
          onChangeText={setQ}
          placeholder="Search people"
        />
        <Text style={{ color: colors.muted, fontSize: 13, marginBottom: 8 }}>Skill tags</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {tags.map((tag) => {
            const selected = selectedTagIds.includes(tag.id);
            return (
              <Pressable
                key={tag.id}
                onPress={() => toggleTag(tag.id)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: selected ? colors.primary : colors.border,
                  backgroundColor: selected ? colors.primarySoft : colors.inset
                }}
              >
                <Text style={{ color: selected ? colors.accentText : colors.text, fontSize: 13 }}>
                  {tag.title}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <PrimaryButton title="Apply filters" onPress={() => void fetchList(q, selectedTagIds)} />
      </Card>

      {(list?.members ?? []).length === 0 ? (
        <EmptyState message="No people in this list match the filters." />
      ) : (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          {(list?.members ?? []).map((member) => (
            <View key={member.id} style={{ width: "48%", flexGrow: 1, maxWidth: "48.5%", gap: 8 }}>
              <TalentPortraitCard
                name={member.fullName}
                location={[member.city, member.country].filter(Boolean).join(", ")}
                rating={member.ratingAverage}
                photoUrl={member.profilePhotoUrl}
                photoKey={member.profilePhotoObjectKey}
                role={memberRoleLabel(member.roleIds)}
                onPress={() => navigation.navigate("MemberProfile", { userId: member.userId })}
              />
              <SecondaryButton
                title="Remove"
                onPress={() => onRemoveMember(member.userId, member.fullName)}
              />
            </View>
          ))}
        </View>
      )}
    </ScreenLayout>
  );
}
