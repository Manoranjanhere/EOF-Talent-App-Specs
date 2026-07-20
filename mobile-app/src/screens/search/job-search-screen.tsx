import React, { useState } from "react";
import { Alert } from "react-native";
import {
  Card,
  EmptyState,
  LabeledInput,
  ListCard,
  PrimaryButton,
  ScreenLayout,
  SectionTitle
} from "../../components/ui";
import { searchJobs } from "../../services/search.service";
import { useAuth } from "../../state/auth-context";

export function JobSearchScreen() {
  const { accessToken } = useAuth();
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const onSearch = async () => {
    if (!accessToken) {
      Alert.alert("Sign in required", "Please sign in to search jobs.");
      return;
    }
    try {
      setLoading(true);
      const result = await searchJobs(accessToken, {
        city: city || undefined,
        country: country || undefined
      });
      setCards((result as any).cards ?? []);
    } catch (error) {
      Alert.alert("Search error", (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout title="Job board" subtitle="Find casting calls and gigs near you">
      <Card>
        <SectionTitle title="Search jobs" />
        <LabeledInput label="City" value={city} onChangeText={setCity} placeholder="Mumbai" />
        <LabeledInput label="Country" value={country} onChangeText={setCountry} placeholder="India" />
        <PrimaryButton title="Search jobs" onPress={onSearch} loading={loading} disabled={loading} />
      </Card>

      {cards.length === 0 ? (
        <EmptyState message="No jobs found. Try broadening your search." />
      ) : (
        cards.map((card) => (
          <ListCard
            key={card.id}
            title={card.title}
            subtitle={card.subtitle}
            meta={[
              card.location || "Location N/A",
              `Pay: ${card.payRange?.[0] ?? "-"} – ${card.payRange?.[1] ?? "-"}`,
              `By: ${card.postedBy ?? "Unknown"}`
            ]}
            badge="JOB"
          />
        ))
      )}
    </ScreenLayout>
  );
}
