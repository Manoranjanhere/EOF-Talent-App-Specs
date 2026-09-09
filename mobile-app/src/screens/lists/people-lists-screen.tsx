import { useCallback, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  Card,
  EmptyState,
  LabeledInput,
  ListCard,
  PrimaryButton,
  ScreenLayout,
  SecondaryButton,
  SectionTitle
} from "../../components/ui";
import {
  createPeopleList,
  listMyPeopleLists,
  listSuggestions,
  type PeopleListSummary
} from "../../services/lists.service";
import { useAuth } from "../../state/auth-context";
import { useTheme } from "../../theme/theme-context";
import type { DiscoverStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<DiscoverStackParamList, "PeopleLists">;

export function PeopleListsScreen({ navigation }: Props) {
  const { accessToken } = useAuth();
  const { colors } = useTheme();
  const [lists, setLists] = useState<PeopleListSummary[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const [mine, tags] = await Promise.all([
        listMyPeopleLists(accessToken),
        listSuggestions(accessToken).catch(() => [])
      ]);
      setLists(Array.isArray(mine) ? mine : []);
      setSuggestions(Array.isArray(tags) ? tags : []);
    } catch (error) {
      Alert.alert("Could not load lists", (error as Error).message);
    }
  }, [accessToken]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const onCreate = async (name?: string) => {
    if (!accessToken) return;
    const trimmed = (name ?? title).trim();
    if (trimmed.length < 2) {
      Alert.alert("List name", "Enter at least 2 characters.");
      return;
    }
    try {
      setLoading(true);
      await createPeopleList(accessToken, trimmed);
      setTitle("");
      await load();
    } catch (error) {
      Alert.alert("Could not create list", (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout
      title="Your lists"
      subtitle="Private folders. Your cast."
      headerStyle="slim"
      footer={<SecondaryButton title="Back to Discover" onPress={() => navigation.goBack()} />}
    >
      <Card>
        <SectionTitle title="Create a list" />
        <LabeledInput
          label="List name"
          value={title}
          onChangeText={setTitle}
          placeholder="Colleagues, Good talent…"
        />
        <PrimaryButton title="Create list" onPress={() => void onCreate()} loading={loading} disabled={loading} />
        {suggestions.length ? (
          <>
            <Text style={{ color: colors.muted, fontSize: 12, marginTop: 12, marginBottom: 8 }}>
              Suggested tags
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {suggestions.map((tag) => (
                <Pressable
                  key={tag}
                  onPress={() => void onCreate(tag)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.inset
                  }}
                >
                  <Text style={{ color: colors.text, fontSize: 13 }}>{tag}</Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}
      </Card>

      {lists.length === 0 ? (
        <EmptyState message="No lists yet. Create one to start adding people." />
      ) : (
        lists.map((list) => (
          <ListCard
            key={list.id}
            title={list.title}
            subtitle={`${list._count?.members ?? 0} people`}
            badge="LIST"
            onPress={() => navigation.navigate("PeopleListDetail", { listId: list.id })}
          />
        ))
      )}
    </ScreenLayout>
  );
}
