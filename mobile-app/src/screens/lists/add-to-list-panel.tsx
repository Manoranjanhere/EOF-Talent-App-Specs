import { useEffect, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import {
  Card,
  LabeledInput,
  PrimaryButton,
  SecondaryButton,
  SectionTitle
} from "../../components/ui";
import {
  addListMember,
  createPeopleList,
  listMyPeopleLists,
  listSuggestions,
  type PeopleListSummary
} from "../../services/lists.service";
import { useTheme } from "../../theme/theme-context";

export function AddToListPanel({
  token,
  memberUserId,
  memberName,
  onClose,
  onAdded
}: {
  token: string;
  memberUserId: string;
  memberName: string;
  onClose: () => void;
  onAdded?: () => void;
}) {
  const { colors } = useTheme();
  const [lists, setLists] = useState<PeopleListSummary[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [mine, tags] = await Promise.all([
          listMyPeopleLists(token),
          listSuggestions(token).catch(() => [])
        ]);
        if (cancelled) return;
        setLists(Array.isArray(mine) ? mine : []);
        setSuggestions(Array.isArray(tags) ? tags : []);
      } catch (error) {
        if (!cancelled) Alert.alert("Could not load lists", (error as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const addTo = async (listId: string, title: string) => {
    try {
      setBusy(true);
      await addListMember(token, listId, memberUserId);
      Alert.alert("Added", `${memberName} was added to ${title}.`);
      onAdded?.();
      onClose();
    } catch (error) {
      Alert.alert("Could not add", (error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const createAndAdd = async (title: string) => {
    const trimmed = title.trim();
    if (trimmed.length < 2) {
      Alert.alert("List name", "Enter at least 2 characters.");
      return;
    }
    try {
      setBusy(true);
      const created = await createPeopleList(token, trimmed);
      await addListMember(token, created.id, memberUserId);
      Alert.alert("Added", `${memberName} was added to ${trimmed}.`);
      setNewTitle("");
      onAdded?.();
      onClose();
    } catch (error) {
      Alert.alert("Could not add", (error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <SectionTitle title={`Add ${memberName} to a list`} />
      {lists.length === 0 ? (
        <Text style={{ color: colors.muted, fontSize: 13, marginBottom: 8 }}>
          You have no lists yet. Create one below.
        </Text>
      ) : (
        lists.map((list) => (
          <View key={list.id} style={{ marginBottom: 8 }}>
            <SecondaryButton
              title={list.title}
              onPress={() => void addTo(list.id, list.title)}
              disabled={busy}
            />
          </View>
        ))
      )}
      <LabeledInput
        label="New list"
        value={newTitle}
        onChangeText={setNewTitle}
        placeholder="Colleagues, Competitors…"
      />
      <PrimaryButton
        title="Create and add"
        onPress={() => void createAndAdd(newTitle)}
        loading={busy}
        disabled={busy}
      />
      {suggestions.length ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
          {suggestions.slice(0, 8).map((tag) => (
            <Pressable
              key={tag}
              onPress={() => void createAndAdd(tag)}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.inset
              }}
            >
              <Text style={{ color: colors.text, fontSize: 12 }}>{tag}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      <SecondaryButton title="Cancel" onPress={onClose} />
    </Card>
  );
}
