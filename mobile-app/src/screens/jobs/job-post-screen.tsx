import React, { useCallback, useState } from "react";
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
  SectionTitle,
  SegmentedControl
} from "../../components/ui";
import { postJob, listMyJobs } from "../../services/jobs.service";
import { listPublishedTags } from "../../services/profile.service";
import {
  countAvailableJobSlots,
  listMySubscriptions,
  listSubscriptionPlans,
  purchasePlanWithPlayStore
} from "../../services/subscriptions.service";
import { useAuth } from "../../state/auth-context";
import { useTheme } from "../../theme/theme-context";
import type { JobGenderValue } from "../../constants/gender";
import { JOB_GENDER_OPTIONS } from "../../constants/gender";
import type { PostJobStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<PostJobStackParamList, "PostJobHome">;

type TagOption = { id: string; slug: string; title: string };

function toggleId(list: string[], id: string, max: number): string[] {
  if (list.includes(id)) return list.filter((item) => item !== id);
  if (list.length >= max) return list;
  return [...list, id];
}

function parseOptionalInt(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const n = Number.parseInt(trimmed, 10);
  return Number.isFinite(n) ? n : undefined;
}

export function JobPostScreen({ navigation }: Props) {
  const { accessToken } = useAuth();
  const { colors } = useTheme();

  const [title, setTitle] = useState("");
  const [miniDescription, setMiniDescription] = useState("");
  const [gender, setGender] = useState<JobGenderValue>("any");
  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [payMin, setPayMin] = useState("");
  const [payMax, setPayMax] = useState("");
  const [tags, setTags] = useState<TagOption[]>([]);
  const [primaryTagIds, setPrimaryTagIds] = useState<string[]>([]);
  const [secondaryTagIds, setSecondaryTagIds] = useState<string[]>([]);
  const [jobPlanId, setJobPlanId] = useState<string | null>(null);
  const [jobPlanCode, setJobPlanCode] = useState("JOB_POST_300_90");
  const [availableSlots, setAvailableSlots] = useState(0);
  const [myJobs, setMyJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  const loadMeta = useCallback(async () => {
    if (!accessToken) return;
    try {
      const [tagList, plans, subs, jobs] = await Promise.all([
        listPublishedTags(),
        listSubscriptionPlans(),
        listMySubscriptions(accessToken),
        listMyJobs(accessToken).catch(() => [])
      ]);
      setTags(tagList);
      const jobPlan = plans.find((p) => p.isJobPostingPlan);
      setJobPlanId(jobPlan?.id ?? null);
      setJobPlanCode(jobPlan?.code ?? "JOB_POST_300_90");
      setAvailableSlots(countAvailableJobSlots(subs));
      setMyJobs(Array.isArray(jobs) ? jobs : []);
    } catch (error) {
      Alert.alert("Load failed", (error as Error).message);
    }
  }, [accessToken]);

  useFocusEffect(
    useCallback(() => {
      void loadMeta();
    }, [loadMeta])
  );

  const onPurchaseSlot = async () => {
    if (!accessToken || !jobPlanId) {
      Alert.alert("Unavailable", "Job posting plan is not configured.");
      return;
    }
    try {
      setPurchasing(true);
      await purchasePlanWithPlayStore(accessToken, {
        id: jobPlanId,
        code: jobPlanCode || "JOB_POST_300_90",
        isJobPostingPlan: true
      });
      Alert.alert(
        "Slot purchased",
        "Google Play payment confirmed. You can publish one listing (90-day validity)."
      );
      await loadMeta();
    } catch (error) {
      Alert.alert("Purchase failed", (error as Error).message);
    } finally {
      setPurchasing(false);
    }
  };

  const onPost = async () => {
    if (!accessToken) return;
    if (!title.trim() || !miniDescription.trim()) {
      Alert.alert("Missing fields", "Title and mini description are required.");
      return;
    }
    if (primaryTagIds.length === 0) {
      Alert.alert("Skills required", "Select at least one primary skill tag.");
      return;
    }

    const ageRangeMin = parseOptionalInt(ageMin);
    const ageRangeMax = parseOptionalInt(ageMax);
    const payRangeMin = parseOptionalInt(payMin);
    const payRangeMax = parseOptionalInt(payMax);

    if (ageRangeMin != null && ageRangeMax != null && ageRangeMin > ageRangeMax) {
      Alert.alert("Invalid age range", "Minimum age cannot be greater than maximum.");
      return;
    }
    if (payRangeMin != null && payRangeMax != null && payRangeMin > payRangeMax) {
      Alert.alert("Invalid pay range", "Minimum pay cannot be greater than maximum.");
      return;
    }

    if (availableSlots <= 0) {
      Alert.alert(
        "Job slot required",
        "Purchase a job slot (₹300 per job, 90-day listing) before publishing.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Purchase ₹300 slot", onPress: () => void onPurchaseSlot() }
        ]
      );
      return;
    }

    try {
      setLoading(true);
      await postJob(accessToken, {
        title: title.trim(),
        miniDescription: miniDescription.trim(),
        gender: gender === "any" ? undefined : gender,
        ageRangeMin,
        ageRangeMax,
        city: city.trim() || undefined,
        country: country.trim() || undefined,
        payRangeMin,
        payRangeMax,
        primaryTagIds,
        secondaryTagIds
      });
      Alert.alert("Job published", "Your job is live on the board for 90 days.");
      setTitle("");
      setMiniDescription("");
      setAgeMin("");
      setAgeMax("");
      setPayMin("");
      setPayMax("");
      setPrimaryTagIds([]);
      setSecondaryTagIds([]);
      await loadMeta();
    } catch (error) {
      Alert.alert("Publish failed", (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout
      title="Post a job"
      subtitle="₹300 per job · 90-day listing · agencies & employers"
    >
      <Card>
        <SectionTitle title="Pricing" />
        <Text style={{ color: colors.muted, fontSize: 13, marginBottom: 8 }}>
          Each job costs ₹300 and stays on the job board for 3 months (90 days).
        </Text>
        <Text style={{ color: colors.text, fontSize: 14, fontWeight: "600", marginBottom: 10 }}>
          Available slots: {availableSlots}
        </Text>
        <SecondaryButton
          title={purchasing ? "Purchasing..." : "Buy job slot · ₹300"}
          onPress={onPurchaseSlot}
          disabled={purchasing || !jobPlanId}
        />
      </Card>

      <Card>
        <SectionTitle title="Job details" />
        <LabeledInput
          label="Title"
          value={title}
          onChangeText={setTitle}
          placeholder="Lead actor for web series"
        />
        <LabeledInput
          label="Mini description"
          value={miniDescription}
          onChangeText={setMiniDescription}
          placeholder="Shoot dates, requirements, role brief..."
          multiline
          style={{ minHeight: 100, textAlignVertical: "top" }}
        />
        <Text style={{ color: colors.muted, fontSize: 13, marginBottom: 6 }}>Gender</Text>
        <SegmentedControl value={gender} onChange={setGender} options={JOB_GENDER_OPTIONS} />
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <LabeledInput
              label="Age from"
              value={ageMin}
              onChangeText={setAgeMin}
              placeholder="18"
              keyboardType="number-pad"
            />
          </View>
          <View style={{ flex: 1 }}>
            <LabeledInput
              label="Age to"
              value={ageMax}
              onChangeText={setAgeMax}
              placeholder="35"
              keyboardType="number-pad"
            />
          </View>
        </View>
        <LabeledInput label="City" value={city} onChangeText={setCity} placeholder="Mumbai" />
        <LabeledInput label="Country" value={country} onChangeText={setCountry} placeholder="India" />
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <LabeledInput
              label="Pay min (₹)"
              value={payMin}
              onChangeText={setPayMin}
              placeholder="10000"
              keyboardType="number-pad"
            />
          </View>
          <View style={{ flex: 1 }}>
            <LabeledInput
              label="Pay max (₹)"
              value={payMax}
              onChangeText={setPayMax}
              placeholder="50000"
              keyboardType="number-pad"
            />
          </View>
        </View>
      </Card>

      <Card>
        <SectionTitle title="Primary skills (max 5)" />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {tags.map((tag) => {
            const selected = primaryTagIds.includes(tag.id);
            const disabled = secondaryTagIds.includes(tag.id);
            return (
              <Pressable
                key={`p-${tag.id}`}
                disabled={disabled}
                onPress={() => setPrimaryTagIds((prev) => toggleId(prev, tag.id, 5))}
                style={{
                  opacity: disabled ? 0.4 : 1,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: selected ? colors.primary : colors.border,
                  backgroundColor: selected ? colors.primarySoft : colors.card
                }}
              >
                <Text style={{ color: colors.text, fontSize: 13 }}>{tag.title}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card>
        <SectionTitle title="Secondary skills (max 5)" />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {tags.map((tag) => {
            const selected = secondaryTagIds.includes(tag.id);
            const disabled = primaryTagIds.includes(tag.id);
            return (
              <Pressable
                key={`s-${tag.id}`}
                disabled={disabled}
                onPress={() => setSecondaryTagIds((prev) => toggleId(prev, tag.id, 5))}
                style={{
                  opacity: disabled ? 0.4 : 1,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: selected ? colors.primary : colors.border,
                  backgroundColor: selected ? colors.primarySoft : colors.card
                }}
              >
                <Text style={{ color: colors.text, fontSize: 13 }}>{tag.title}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <PrimaryButton
        title="Publish job"
        onPress={onPost}
        loading={loading}
        disabled={loading || purchasing}
      />

      {myJobs.length > 0 ? (
        <Card>
          <SectionTitle title="Your job board" />
          <Text style={{ color: colors.muted, fontSize: 13, marginBottom: 10 }}>
            Tap a job to view details and applicants.
          </Text>
          {myJobs.map((job) => (
            <ListCard
              key={job.id}
              title={job.title}
              subtitle={job.miniDescription}
              meta={[
                `Valid till ${new Date(job.validTill).toLocaleDateString()}`,
                [job.city, job.country].filter(Boolean).join(", ") || "Location N/A",
                `${(job.applications ?? []).length} applicant${(job.applications ?? []).length === 1 ? "" : "s"}`
              ]}
              badge={(job.applications ?? []).length > 0 ? String((job.applications ?? []).length) : "JOB"}
              onPress={() => navigation.navigate("JobDetail", { jobId: job.id })}
            />
          ))}
        </Card>
      ) : (
        <EmptyState message="No active job listings yet." />
      )}
    </ScreenLayout>
  );
}
