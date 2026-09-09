import { useCallback, useRef, useState } from "react";
import { Alert, Linking, Share, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  EmptyState,
  FilterDisclosure,
  LabeledInput,
  PrimaryButton,
  ScreenLayout
} from "../../components/ui";
import { AppText } from "../../components/app-text";
import { JobEditorialCard } from "../../components/job-editorial-card";
import { applyToJob } from "../../services/jobs.service";
import { searchJobs, type JobSearchCard } from "../../services/search.service";
import { useAuth } from "../../state/auth-context";
import { useTheme } from "../../theme/theme-context";
import { formatGenderLabel } from "../../constants/gender";
import type { JobsStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<JobsStackParamList, "JobBoard">;

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

export function JobSearchScreen({ navigation }: Props) {
  const { accessToken } = useAuth();
  const { colors } = useTheme();
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [cards, setCards] = useState<JobSearchCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const result = await searchJobs(accessToken, {
        city: city || undefined,
        country: country || undefined
      });
      setCards(result.cards ?? []);
    } catch (error) {
      Alert.alert("Search error", (error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [accessToken, city, country]);

  const loadJobsRef = useRef(loadJobs);
  loadJobsRef.current = loadJobs;

  useFocusEffect(
    useCallback(() => {
      void loadJobsRef.current();
    }, [])
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

  const referText = (card: JobSearchCard) =>
    `Job on EOF Talent: ${card.title}\n${card.subtitle || ""}\nPosted by ${card.postedBy || "an employer"}`;

  const onWhatsApp = async (card: JobSearchCard) => {
    const text = referText(card);
    const encoded = encodeURIComponent(text);
    const native = `whatsapp://send?text=${encoded}`;
    const web = `https://api.whatsapp.com/send?text=${encoded}`;
    try {
      if (await Linking.canOpenURL(native)) {
        await Linking.openURL(native);
        return;
      }
      if (await Linking.canOpenURL(web)) {
        await Linking.openURL(web);
        return;
      }
    } catch {
      // fall through to share sheet
    }
    await Share.share({ message: text });
  };

  return (
    <ScreenLayout title="The board" subtitle="Open calls from stages that are hiring">
      <FilterDisclosure
        title="Where are you looking?"
        open={filtersOpen}
        onToggle={() => setFiltersOpen((v) => !v)}
        summary={city || country ? [city, country].filter(Boolean).join(", ") : "All cities"}
      >
        <LabeledInput label="City" value={city} onChangeText={setCity} placeholder="Mumbai" />
        <LabeledInput label="Country" value={country} onChangeText={setCountry} placeholder="India" />
        <PrimaryButton
          title="Show jobs"
          onPress={() => {
            setFiltersOpen(false);
            void loadJobs();
          }}
          loading={loading}
          disabled={loading}
        />
      </FilterDisclosure>

      {cards.length === 0 ? (
        <EmptyState message={loading ? "Collecting open calls…" : "No jobs found. Try another city."} />
      ) : (
        cards.map((card) => (
          <JobEditorialCard
            key={card.id}
            title={card.title}
            description={card.subtitle}
            location={card.location || "Location open"}
            pay={formatPay(card.payRange?.[0], card.payRange?.[1])}
            gender={card.gender ? formatGenderLabel(card.gender) : "Any gender"}
            age={formatAge(card.ageRange?.[0], card.ageRange?.[1])}
            tags={card.tags}
            validTill={
              card.validTill
                ? `Till ${new Date(card.validTill).toLocaleDateString()}`
                : "90-day listing"
            }
            postedBy={card.postedBy}
            postedByPhotoUrl={card.postedByPhotoUrl}
            postedByPhotoKey={card.postedByPhotoObjectKey}
            applied={card.hasApplied}
            applying={applyingId === card.id}
            onApply={() => onApply(card.id, card.title)}
            onEmployer={
              card.postedByUserId
                ? () => navigation.navigate("MemberProfile", { userId: card.postedByUserId! })
                : undefined
            }
            onWhatsApp={() => void onWhatsApp(card)}
            onReferInApp={() =>
              navigation.navigate("ReferJob", { jobId: card.id, jobTitle: card.title })
            }
          />
        ))
      )}

      {cards.length > 0 ? (
        <AppText variant="caption" style={{ color: colors.muted, textAlign: "center", marginTop: 4 }}>
          {cards.length} open {cards.length === 1 ? "call" : "calls"}
        </AppText>
      ) : null}
    </ScreenLayout>
  );
}
