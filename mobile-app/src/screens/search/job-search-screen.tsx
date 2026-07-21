import React, { useCallback, useState } from "react";
import { Alert, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
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
import { applyToJob } from "../../services/jobs.service";
import { searchJobs } from "../../services/search.service";
import { useAuth } from "../../state/auth-context";
import { useTheme } from "../../theme/theme-context";

type JobCard = {
  id: string;
  title: string;
  subtitle?: string;
  location?: string;
  payRange?: [number | null, number | null];
  ageRange?: [number | null, number | null];
  gender?: string;
  validTill?: string;
  tags?: string[];
  postedBy?: string;
  hasApplied?: boolean;
};

function formatPay(min?: number | null, max?: number | null) {
  if (min == null && max == null) return "Pay not specified";
  if (min != null && max != null) return `₹${min.toLocaleString()} – ₹${max.toLocaleString()}`;
  if (min != null) return `From ₹${min.toLocaleString()}`;
  return `Up to ₹${max!.toLocaleString()}`;
}

function formatAge(min?: number | null, max?: number | null) {
  if (min == null && max == null) return "Any age";
  if (min != null && max != null) return `${min}–${max} years`;
  if (min != null) return `${min}+ years`;
  return `Up to ${max} years`;
}

export function JobSearchScreen() {
  const { accessToken } = useAuth();
  const { colors } = useTheme();
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [cards, setCards] = useState<JobCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const result = await searchJobs(accessToken, {
        city: city || undefined,
        country: country || undefined
      });
      setCards((result as { cards?: JobCard[] }).cards ?? []);
    } catch (error) {
      Alert.alert("Search error", (error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [accessToken, city, country]);

  useFocusEffect(
    useCallback(() => {
      void loadJobs();
    }, [loadJobs])
  );

  const onApply = (jobId: string, jobTitle: string) => {
    if (!accessToken) {
      Alert.alert("Sign in required", "Please sign in to apply.");
      return;
    }
    Alert.alert("Apply to job?", `Send your interest for "${jobTitle}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Apply",
        onPress: async () => {
          try {
            setApplyingId(jobId);
            await applyToJob(
              accessToken,
              jobId,
              "Interested in this role — please review my profile."
            );
            setCards((prev) =>
              prev.map((c) => (c.id === jobId ? { ...c, hasApplied: true } : c))
            );
            Alert.alert("Applied", "The employer will see your application on their job board.");
          } catch (error) {
            Alert.alert("Apply failed", (error as Error).message);
          } finally {
            setApplyingId(null);
          }
        }
      }
    ]);
  };

  return (
    <ScreenLayout title="Job board" subtitle="Casting calls & gigs posted by agencies">
      <Card>
        <SectionTitle title="Filter jobs" />
        <LabeledInput label="City" value={city} onChangeText={setCity} placeholder="Mumbai" />
        <LabeledInput label="Country" value={country} onChangeText={setCountry} placeholder="India" />
        <PrimaryButton title="Search jobs" onPress={loadJobs} loading={loading} disabled={loading} />
      </Card>

      {cards.length === 0 ? (
        <EmptyState message={loading ? "Loading jobs..." : "No jobs found. Try broadening your search."} />
      ) : (
        cards.map((card) => (
          <View key={card.id} style={{ marginBottom: 4 }}>
            <ListCard
              title={card.title}
              subtitle={card.subtitle}
              meta={[
                card.location || "Location N/A",
                formatPay(card.payRange?.[0], card.payRange?.[1]),
                card.gender ? `Gender: ${card.gender}` : "Gender: Any",
                formatAge(card.ageRange?.[0], card.ageRange?.[1]),
                (card.tags ?? []).length ? `Skills: ${(card.tags ?? []).join(" · ")}` : "No skill tags",
                card.validTill
                  ? `Valid till ${new Date(card.validTill).toLocaleDateString()}`
                  : "90-day listing",
                `Posted by ${card.postedBy ?? "Agency"}`
              ]}
              badge={card.hasApplied ? "APPLIED" : "JOB"}
            />
            <View style={{ marginTop: -4, marginBottom: 10 }}>
              {card.hasApplied ? (
                <SecondaryButton title="Already applied" onPress={() => {}} disabled />
              ) : (
                <PrimaryButton
                  title={applyingId === card.id ? "Applying..." : "Apply"}
                  onPress={() => onApply(card.id, card.title)}
                  disabled={applyingId === card.id}
                  loading={applyingId === card.id}
                />
              )}
            </View>
          </View>
        ))
      )}

      {cards.length > 0 ? (
        <Text style={{ color: colors.muted, fontSize: 12, textAlign: "center", marginTop: 8 }}>
          {cards.length} job{cards.length === 1 ? "" : "s"} shown
        </Text>
      ) : null}
    </ScreenLayout>
  );
}
