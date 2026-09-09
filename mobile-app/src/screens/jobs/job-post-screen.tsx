import { useCallback, useState } from "react";
import { Alert, View } from "react-native";
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
  SegmentedControl,
  SelectableChip
} from "../../components/ui";
import { AppText } from "../../components/app-text";
import { postJob, listMyJobs, repostJob, type EmployerJobSummary } from "../../services/jobs.service";
import { listPublishedTags } from "../../services/profile.service";
import {
  countAvailableJobSlots,
  listMySubscriptions,
  listSubscriptionPlans,
  purchasePlanWithPlayStore
} from "../../services/subscriptions.service";
import { useAuth } from "../../state/auth-context";
import { fonts } from "../../theme/typography";
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
  const [jobPlanCode, setJobPlanCode] = useState("JOB_POST_100_90");
  const [availableSlots, setAvailableSlots] = useState(0);
  const [myJobs, setMyJobs] = useState<EmployerJobSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [repostingId, setRepostingId] = useState<string | null>(null);

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
      const jobPlan =
        plans.find((p) => p.isJobPostingPlan && p.code === "JOB_POST_100_90") ||
        plans.find((p) => p.isJobPostingPlan);
      setJobPlanId(jobPlan?.id ?? null);
      setJobPlanCode(jobPlan?.code ?? "JOB_POST_100_90");
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
        code: jobPlanCode || "JOB_POST_100_90",
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
        "Purchase a job slot (₹100 per job, 90-day listing) before publishing.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Purchase ₹100 slot", onPress: () => void onPurchaseSlot() }
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

  const onRepost = async (jobId: string, title: string) => {
    if (!accessToken) return;
    if (availableSlots <= 0) {
      Alert.alert(
        "Job slot required",
        "Purchase a ₹100 slot (or use slots from messaging) to repost this job."
      );
      return;
    }
    try {
      setRepostingId(jobId);
      await repostJob(accessToken, jobId);
      Alert.alert("Reposted", `"${title}" is live again for 90 days.`);
      await loadMeta();
    } catch (error) {
      Alert.alert("Repost failed", (error as Error).message);
    } finally {
      setRepostingId(null);
    }
  };

  const now = Date.now();
  const activeJobs = myJobs.filter((job) => new Date(job.validTill).getTime() >= now);
  const expiredJobs = myJobs.filter((job) => new Date(job.validTill).getTime() < now);

  return (
    <ScreenLayout
      title="Post a job"
      subtitle="₹100 · 90 days on the board"
      headerStyle="slim"
    >
      <Card>
        <SectionTitle title="Pricing" />
        <AppText variant="meta" style={{ color: colors.muted, marginBottom: 8 }}>
          Each job costs ₹100 and stays on the board for 90 days. Employer messaging is ₹300/month and includes 2 free job slots.
        </AppText>
        <AppText style={{ color: colors.text, fontFamily: fonts.sansSemi, marginBottom: 10 }}>
          Available slots: {availableSlots}
        </AppText>
        <SecondaryButton
          title={purchasing ? "Purchasing..." : "Buy job slot · ₹100"}
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
        <AppText variant="meta" style={{ color: colors.muted, marginBottom: 6 }}>
          Gender
        </AppText>
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
          {tags.map((tag) => (
            <SelectableChip
              key={`p-${tag.id}`}
              label={tag.title}
              selected={primaryTagIds.includes(tag.id)}
              disabled={secondaryTagIds.includes(tag.id)}
              onPress={() => setPrimaryTagIds((prev) => toggleId(prev, tag.id, 5))}
            />
          ))}
        </View>
      </Card>

      <Card>
        <SectionTitle title="Secondary skills (max 5)" />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {tags.map((tag) => (
            <SelectableChip
              key={`s-${tag.id}`}
              label={tag.title}
              selected={secondaryTagIds.includes(tag.id)}
              disabled={primaryTagIds.includes(tag.id)}
              onPress={() => setSecondaryTagIds((prev) => toggleId(prev, tag.id, 5))}
            />
          ))}
        </View>
      </Card>

      <PrimaryButton
        title="Publish job"
        onPress={onPost}
        loading={loading}
        disabled={loading || purchasing}
      />

      {activeJobs.length > 0 ? (
        <Card>
          <SectionTitle title="Active jobs" />
          <AppText variant="meta" style={{ color: colors.muted, marginBottom: 10 }}>
            Tap a job to view applicants and update their status.
          </AppText>
          {activeJobs.map((job) => (
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

      {expiredJobs.length > 0 ? (
        <Card>
          <SectionTitle title="Expired jobs" />
          <AppText variant="meta" style={{ color: colors.muted, marginBottom: 10 }}>
            Repost uses one job slot and copies the same details.
          </AppText>
          {expiredJobs.map((job) => (
            <View key={job.id} style={{ marginBottom: 10, gap: 8 }}>
              <ListCard
                title={job.title}
                subtitle={job.miniDescription}
                meta={[
                  `Expired ${new Date(job.validTill).toLocaleDateString()}`,
                  [job.city, job.country].filter(Boolean).join(", ") || "Location N/A"
                ]}
                badge="EXPIRED"
                onPress={() => navigation.navigate("JobDetail", { jobId: job.id })}
              />
              <PrimaryButton
                title={repostingId === job.id ? "Reposting…" : "Repost this job"}
                onPress={() => void onRepost(job.id, job.title)}
                loading={repostingId === job.id}
                disabled={Boolean(repostingId)}
              />
            </View>
          ))}
        </Card>
      ) : null}
    </ScreenLayout>
  );
}
