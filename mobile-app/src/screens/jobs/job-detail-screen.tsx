import { useCallback, useMemo, useState } from "react";
import { Alert, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  Card,
  EmptyState,
  PrimaryButton,
  ScreenLayout,
  SecondaryButton,
  SectionTitle,
  SelectableChip,
  StarRatingPicker
} from "../../components/ui";
import { AppText } from "../../components/app-text";
import { PersonRowCard } from "../../components/person-row-card";
import {
  completeApplication,
  getMyJob,
  updateApplicationStatus
} from "../../services/jobs.service";
import { startDirectThread } from "../../services/chat.service";
import { useAuth } from "../../state/auth-context";
import { useTheme } from "../../theme/theme-context";
import { formatGenderLabel } from "../../constants/gender";
import {
  APPLICATION_STATUSES,
  applicationStatusLabel,
  type ApplicationStatusValue
} from "../../constants/casting";
import type { PostJobStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<PostJobStackParamList, "JobDetail">;

type JobApplication = {
  id: string;
  message?: string | null;
  status?: ApplicationStatusValue | string;
  jobCompleted?: boolean;
  createdAt: string;
  applicant?: {
    id: string;
    fullName: string;
    city?: string | null;
    country?: string | null;
    ratingAverage?: number | string | null;
    profileTags?: Array<{ tag?: { title?: string } }>;
    profilePhotoUrl?: string | null;
    profilePhotoObjectKey?: string | null;
  };
};

type JobDetail = {
  id: string;
  title: string;
  miniDescription: string;
  city?: string | null;
  country?: string | null;
  gender?: string | null;
  ageRangeMin?: number | null;
  ageRangeMax?: number | null;
  payRangeMin?: number | null;
  payRangeMax?: number | null;
  validTill: string;
  applications?: JobApplication[];
  tags?: Array<{ tag?: { title?: string } }>;
};

function formatPay(min?: number | null, max?: number | null) {
  if (min == null && max == null) return "Pay not specified";
  if (min != null && max != null) return `₹${min.toLocaleString()} – ₹${max.toLocaleString()}`;
  if (min != null) return `From ₹${min.toLocaleString()}`;
  return `Up to ₹${max!.toLocaleString()}`;
}

function skillTags(app: JobApplication) {
  return (app.applicant?.profileTags ?? [])
    .map((t) => t.tag?.title)
    .filter(Boolean) as string[];
}

export function JobDetailScreen({ route, navigation }: Props) {
  const { jobId } = route.params;
  const { accessToken } = useAuth();
  const { colors } = useTheme();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [messagingId, setMessagingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedHired, setSelectedHired] = useState<string[]>([]);
  const [completeRating, setCompleteRating] = useState<number | null>(null);
  const [rowRating, setRowRating] = useState<Record<string, number>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      setJob(await getMyJob(accessToken, jobId));
    } catch (error) {
      Alert.alert("Error", (error as Error).message);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [accessToken, jobId, navigation]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const applications = job?.applications ?? [];
  const counts = useMemo(() => {
    const map: Record<string, number> = { ALL: applications.length };
    for (const status of APPLICATION_STATUSES) {
      map[status.value] = applications.filter((a) => (a.status || "APPLIED") === status.value).length;
    }
    return map;
  }, [applications]);

  const visible = applications.filter((app) =>
    statusFilter === "ALL" ? true : (app.status || "APPLIED") === statusFilter
  );

  const onMessageApplicant = async (applicant: NonNullable<JobApplication["applicant"]>) => {
    if (!accessToken) return;
    try {
      setMessagingId(applicant.id);
      const thread = await startDirectThread(accessToken, applicant.id);
      navigation.getParent()?.navigate("Chat", {
        screen: "ChatConversation",
        params: {
          threadId: thread.id,
          recipientName: applicant.fullName,
          recipientUserId: applicant.id
        }
      });
    } catch (error) {
      Alert.alert("Message failed", (error as Error).message);
    } finally {
      setMessagingId(null);
    }
  };

  const onSetStatus = async (applicationId: string, status: string) => {
    if (!accessToken) return;
    try {
      setBusyId(applicationId);
      await updateApplicationStatus(accessToken, applicationId, status);
      await load();
    } catch (error) {
      Alert.alert("Status failed", (error as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const onCompleteOne = async (applicationId: string) => {
    const rating = rowRating[applicationId] ?? completeRating;
    if (!accessToken || !rating) {
      Alert.alert("Rating required", "Pick 1–5 stars before marking Job completed.");
      return;
    }
    try {
      setBusyId(applicationId);
      await completeApplication(accessToken, applicationId, { ratingValue: rating });
      setSelectedHired((prev) => prev.filter((id) => id !== applicationId));
      await load();
    } catch (error) {
      Alert.alert("Complete failed", (error as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const onCompleteSelected = async () => {
    if (!accessToken || selectedHired.length === 0) return;
    if (!completeRating) {
      Alert.alert("Rating required", "Pick a rating to apply to the selected hired candidates.");
      return;
    }
    try {
      setBusyId("bulk");
      for (const id of selectedHired) {
        await completeApplication(accessToken, id, { ratingValue: completeRating });
      }
      setSelectedHired([]);
      await load();
    } catch (error) {
      Alert.alert("Complete failed", (error as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  if (!job && loading) {
    return (
      <ScreenLayout title="Job" subtitle="Loading…" headerStyle="slim">
        <EmptyState message="Loading job details…" />
      </ScreenLayout>
    );
  }

  if (!job) {
    return (
      <ScreenLayout title="Job" subtitle="Not found" headerStyle="slim">
        <EmptyState message="Job not found." />
        <SecondaryButton title="Back" onPress={() => navigation.goBack()} />
      </ScreenLayout>
    );
  }

  const tagTitles = (job.tags ?? []).map((t) => t.tag?.title).filter(Boolean) as string[];
  const hiredOpen = applications.filter((a) => a.status === "HIRED" && !a.jobCompleted);

  return (
    <ScreenLayout
      title={job.title}
      subtitle="Applicants · status · complete & rate"
      headerStyle="slim"
      footer={<SecondaryButton title="Back to jobs" onPress={() => navigation.goBack()} />}
    >
      <Card>
        <SectionTitle title="Job details" />
        <AppText style={{ color: colors.text }}>{job.miniDescription}</AppText>
        <AppText variant="meta" style={{ color: colors.muted, marginTop: 8 }}>
          {[job.city, job.country].filter(Boolean).join(", ") || "Location N/A"}
        </AppText>
        <AppText variant="meta" style={{ color: colors.muted }}>
          {formatPay(job.payRangeMin, job.payRangeMax)} · {formatGenderLabel(job.gender)}
        </AppText>
        <AppText variant="meta" style={{ color: colors.muted }}>
          Valid till {new Date(job.validTill).toLocaleDateString()}
        </AppText>
        {tagTitles.length ? (
          <AppText variant="meta" style={{ color: colors.goldText }}>
            {tagTitles.join(" · ")}
          </AppText>
        ) : null}
      </Card>

      <Card>
        <SectionTitle title="Filter by status" />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {[{ value: "ALL", label: `All (${counts.ALL})` }, ...APPLICATION_STATUSES.map((s) => ({
            value: s.value,
            label: `${s.label} (${counts[s.value] ?? 0})`
          }))].map((chip) => (
            <SelectableChip
              key={chip.value}
              label={chip.label}
              selected={statusFilter === chip.value}
              onPress={() => setStatusFilter(chip.value)}
            />
          ))}
        </View>
      </Card>

      {hiredOpen.length > 0 ? (
        <Card>
          <SectionTitle title="Mark hired as Job completed" />
          <AppText variant="caption" style={{ color: colors.muted, marginBottom: 8 }}>
            Select one or more hired candidates, rate them, then complete.
          </AppText>
          <StarRatingPicker value={completeRating} onChange={setCompleteRating} />
          <PrimaryButton
            title={`Complete selected (${selectedHired.length})`}
            onPress={() => void onCompleteSelected()}
            loading={busyId === "bulk"}
            disabled={busyId === "bulk" || selectedHired.length === 0}
          />
        </Card>
      ) : null}

      <SectionTitle title={`Applicants (${visible.length})`} />

      {visible.length === 0 ? (
        <EmptyState message="No applications for this filter." />
      ) : (
        visible.map((app) => {
          const applicant = app.applicant;
          if (!applicant) return null;
          const location =
            [applicant.city, applicant.country].filter(Boolean).join(", ") || "Location N/A";
          const skills = skillTags(app);
          const status = (app.status || "APPLIED") as string;
          const hiredUnchecked = status === "HIRED" && !app.jobCompleted;
          const checked = selectedHired.includes(app.id);
          return (
            <View key={app.id} style={{ marginBottom: 12, gap: 8 }}>
              <PersonRowCard
                name={applicant.fullName}
                subtitle={`${app.message || "Applied"} · ${location}${
                  skills.length ? ` · ${skills.slice(0, 3).join(" · ")}` : ""
                }`}
                photoUrl={applicant.profilePhotoUrl}
                photoKey={applicant.profilePhotoObjectKey}
                badge={app.jobCompleted ? "Completed" : applicationStatusLabel(status)}
                rating={applicant.ratingAverage}
                onPress={() => navigation.navigate("MemberProfile", { userId: applicant.id })}
              />
              {hiredUnchecked ? (
                <SecondaryButton
                  title={checked ? "Selected for complete" : "Select for complete"}
                  onPress={() =>
                    setSelectedHired((prev) =>
                      prev.includes(app.id) ? prev.filter((id) => id !== app.id) : [...prev, app.id]
                    )
                  }
                />
              ) : null}
              <AppText variant="label" style={{ color: colors.muted }}>
                Status
              </AppText>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {APPLICATION_STATUSES.filter((s) => s.value !== "APPLIED").map((s) => (
                  <SelectableChip
                    key={s.value}
                    label={s.label}
                    selected={status === s.value}
                    onPress={() => void onSetStatus(app.id, s.value)}
                  />
                ))}
              </View>
              {hiredUnchecked ? (
                <>
                  <AppText variant="caption" style={{ color: colors.muted }}>
                    Rate this hire
                  </AppText>
                  <StarRatingPicker
                    value={rowRating[app.id] ?? null}
                    onChange={(value) => setRowRating((prev) => ({ ...prev, [app.id]: value }))}
                  />
                  <PrimaryButton
                    title="Job completed"
                    onPress={() => void onCompleteOne(app.id)}
                    loading={busyId === app.id}
                    disabled={busyId === app.id}
                  />
                </>
              ) : null}
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <SecondaryButton
                    title="View profile"
                    onPress={() => navigation.navigate("MemberProfile", { userId: applicant.id })}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <PrimaryButton
                    title={messagingId === applicant.id ? "Opening…" : "Message"}
                    onPress={() => onMessageApplicant(applicant)}
                    loading={messagingId === applicant.id}
                    disabled={messagingId === applicant.id}
                  />
                </View>
              </View>
            </View>
          );
        })
      )}
    </ScreenLayout>
  );
}
