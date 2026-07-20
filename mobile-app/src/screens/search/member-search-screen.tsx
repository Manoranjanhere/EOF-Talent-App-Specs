import React, { useState } from "react";
import { Alert, Text } from "react-native";
import {
  Card,
  EmptyState,
  LabeledInput,
  PrimaryButton,
  ScreenLayout,
  SecondaryButton,
  SectionTitle,
  SegmentedControl
} from "../../components/ui";
import { FlagReason, flagUser } from "../../services/admin.service";
import { searchMembers } from "../../services/search.service";
import { useAuth } from "../../state/auth-context";
import { useTheme } from "../../theme/theme-context";

type RoleFilter = "all" | "talent" | "employer";

const FLAG_REASONS: { value: FlagReason; label: string }[] = [
  { value: "FINANCIAL_SCAM", label: "Scam" },
  { value: "OBSCENE", label: "Obscene" },
  { value: "CHILD_ABUSE", label: "Abuse" },
  { value: "PORNOGRAPHY", label: "Adult" }
];

export function MemberSearchScreen() {
  const { accessToken } = useAuth();
  const { colors } = useTheme();
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [gender, setGender] = useState("");
  const [isAvailable, setIsAvailable] = useState<"all" | "yes" | "no">("all");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [flagTarget, setFlagTarget] = useState<{ id: string; name: string } | null>(null);
  const [flagReason, setFlagReason] = useState<FlagReason>("FINANCIAL_SCAM");
  const [flagging, setFlagging] = useState(false);

  const onSearch = async () => {
    if (!accessToken) {
      Alert.alert("Sign in required", "Please sign in to discover talent.");
      return;
    }
    try {
      setLoading(true);
      const groupId =
        roleFilter === "talent" ? 1 : roleFilter === "employer" ? 2 : undefined;
      const result = await searchMembers(accessToken, {
        city: city || undefined,
        country: country || undefined,
        gender: gender || undefined,
        isAvailable:
          isAvailable === "all" ? undefined : isAvailable === "yes" ? "true" : "false",
        groupId
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
    <ScreenLayout title="Discover talent" subtitle="Card results · filter by profile fields and role">
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
        <PrimaryButton title="Search members" onPress={onSearch} loading={loading} disabled={loading} />
      </Card>

      {flagTarget ? (
        <Card>
          <SectionTitle title={`Flag ${flagTarget.name}`} />
          <Text style={{ color: colors.muted, fontSize: 13 }}>
            Select a reason (Financial Scam, Obscene, Child Abuse, Pornography)
          </Text>
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
          <Card key={card.id}>
            <SectionTitle title={card.title} />
            <Text style={{ color: colors.muted, fontSize: 14 }}>{card.subtitle || "No location"}</Text>
            <Text style={{ color: colors.text, fontSize: 13 }}>★ {String(card.rating)}</Text>
            <Text style={{ color: colors.muted, fontSize: 12 }}>
              {(card.tags ?? []).length ? `Tags: ${(card.tags ?? []).join(", ")}` : "No tags"}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 12 }}>
              {card.isAvailable ? "Looking for work" : "Not looking for work"}
            </Text>
            <SecondaryButton
              title="Flag profile"
              onPress={() => setFlagTarget({ id: card.id, name: card.title })}
            />
          </Card>
        ))
      )}
    </ScreenLayout>
  );
}
