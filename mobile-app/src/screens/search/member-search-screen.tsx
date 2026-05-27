import React, { useState } from "react";
import { Alert } from "react-native";
import {
  Card,
  EmptyState,
  LabeledInput,
  ListCard,
  PrimaryButton,
  ScreenLayout,
  SectionTitle,
  SegmentedControl
} from "../../components/ui";
import { searchMembers } from "../../services/search.service";

type RoleFilter = "all" | "talent" | "employer";

export function MemberSearchScreen() {
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const onSearch = async () => {
    try {
      setLoading(true);
      const groupId =
        roleFilter === "talent" ? 1 : roleFilter === "employer" ? 2 : undefined;
      const result = await searchMembers({ city, country, groupId });
      setCards((result as any).cards ?? []);
    } catch (error) {
      Alert.alert("Search error", (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout title="Discover talent" subtitle="Swipe-style cards · filter by location and role">
      <Card>
        <SectionTitle title="Filters" />
        <LabeledInput label="City" value={city} onChangeText={setCity} placeholder="Mumbai" />
        <LabeledInput label="Country" value={country} onChangeText={setCountry} placeholder="India" />
        <SegmentedControl
          value={roleFilter}
          onChange={setRoleFilter}
          options={[
            { value: "all", label: "All" },
            { value: "talent", label: "Talent" },
            { value: "employer", label: "Employer" }
          ]}
        />
        <PrimaryButton title="Search members" onPress={onSearch} loading={loading} disabled={loading} />
      </Card>

      {cards.length === 0 ? (
        <EmptyState message="No members found. Try different filters." />
      ) : (
        cards.map((card) => (
          <ListCard
            key={card.id}
            title={card.title}
            subtitle={card.subtitle}
            badge={`★ ${String(card.rating)}`}
            meta={[
              (card.tags ?? []).length ? `Tags: ${(card.tags ?? []).join(", ")}` : "No tags",
              `Roles: ${(card.roleIds ?? []).join(", ")}`
            ]}
          />
        ))
      )}
    </ScreenLayout>
  );
}
