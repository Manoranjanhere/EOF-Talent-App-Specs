import { useCallback, useState } from "react";
import { Alert, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  Card,
  EmptyState,
  LabeledInput,
  PrimaryButton,
  ScreenLayout,
  SecondaryButton,
  SectionTitle
} from "../../components/ui";
import { AppText } from "../../components/app-text";
import { PersonRowCard } from "../../components/person-row-card";
import { referJobInApp } from "../../services/jobs.service";
import { getPeopleList, listMyPeopleLists } from "../../services/lists.service";
import { searchMembers } from "../../services/search.service";
import { useAuth } from "../../state/auth-context";
import { useTheme } from "../../theme/theme-context";
import type { JobsStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<JobsStackParamList, "ReferJob">;

type Person = {
  id: string;
  title: string;
  subtitle?: string;
  photoUrl?: string | null;
  photoKey?: string | null;
  rating?: number | string | null;
};

export function ReferJobScreen({ route, navigation }: Props) {
  const { jobId, jobTitle } = route.params;
  const { accessToken } = useAuth();
  const { colors } = useTheme();
  const [q, setQ] = useState("");
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const fromSearch = await searchMembers(accessToken, { q: q.trim() || undefined, pageSize: 30 });
      const cards = (fromSearch.cards ?? []).map((c) => ({
        id: c.id,
        title: c.title,
        subtitle: c.subtitle,
        photoUrl: c.profilePhotoUrl,
        photoKey: c.profilePhotoObjectKey,
        rating: c.rating
      }));
      if (!q.trim()) {
        const lists = await listMyPeopleLists(accessToken).catch(() => []);
        const extra: Person[] = [];
        for (const list of lists.slice(0, 5)) {
          const detail = await getPeopleList(accessToken, list.id).catch(() => null);
          for (const member of detail?.members ?? []) {
            if (!extra.some((p) => p.id === member.userId) && !cards.some((p) => p.id === member.userId)) {
              extra.push({
                id: member.userId,
                title: member.fullName,
                subtitle: list.title,
                photoUrl: member.profilePhotoUrl,
                photoKey: member.profilePhotoObjectKey,
                rating: member.ratingAverage
              });
            }
          }
        }
        setPeople([...extra, ...cards]);
      } else {
        setPeople(cards);
      }
    } catch (error) {
      Alert.alert("Search failed", (error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [accessToken, q]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const onRefer = async (person: Person) => {
    if (!accessToken) return;
    try {
      setSendingId(person.id);
      await referJobInApp(accessToken, jobId, person.id);
      Alert.alert("Referred", `${jobTitle} was sent to ${person.title} in chat.`);
      navigation.goBack();
    } catch (error) {
      Alert.alert("Referral failed", (error as Error).message);
    } finally {
      setSendingId(null);
    }
  };

  return (
    <ScreenLayout
      title="Refer in app"
      subtitle={`Send “${jobTitle}” as an in-app message`}
      headerStyle="slim"
      footer={<SecondaryButton title="Back" onPress={() => navigation.goBack()} />}
    >
      <Card>
        <SectionTitle title="Choose a person" />
        <LabeledInput label="Search by name" value={q} onChangeText={setQ} placeholder="Name" />
        <PrimaryButton title="Search" onPress={() => void load()} loading={loading} disabled={loading} />
        <AppText variant="caption" style={{ color: colors.muted, marginTop: 8 }}>
          Messaging-only plans can refer to talent. Serious about job can refer to anyone.
        </AppText>
      </Card>

      {people.length === 0 ? (
        <EmptyState message={loading ? "Loading people…" : "No people found."} />
      ) : (
        people.map((person) => (
          <View key={person.id} style={{ marginBottom: 8, gap: 8 }}>
            <PersonRowCard
              name={person.title}
              subtitle={person.subtitle || "Member"}
              photoUrl={person.photoUrl}
              photoKey={person.photoKey}
              rating={person.rating}
            />
            <PrimaryButton
              title={sendingId === person.id ? "Sending…" : "Send in-app referral"}
              onPress={() => void onRefer(person)}
              loading={sendingId === person.id}
              disabled={Boolean(sendingId)}
            />
          </View>
        ))
      )}
    </ScreenLayout>
  );
}
