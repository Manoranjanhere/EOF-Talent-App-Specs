import React, { useCallback, useState } from "react";
import { Alert, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  Card,
  EmptyState,
  ListCard,
  PrimaryButton,
  ScreenLayout,
  SecondaryButton,
  SectionTitle
} from "../../components/ui";
import { getMyJob } from "../../services/jobs.service";
import { startDirectThread } from "../../services/chat.service";
import { useAuth } from "../../state/auth-context";
import { useTheme } from "../../theme/theme-context";
import { formatGenderLabel } from "../../constants/gender";
import type { PostJobStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<PostJobStackParamList, "JobDetail">;

type JobApplication = {
  id: string;
  message?: string | null;
  createdAt: string;
  applicant?: {
    id: string;
    fullName: string;
    city?: string | null;
    country?: string | null;
    email?: string | null;
    mobileNumber?: string | null;
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

export function JobDetailScreen({ route, navigation }: Props) {
  const { jobId } = route.params;
  const { accessToken } = useAuth();
  const { colors } = useTheme();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [messagingId, setMessagingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      setJob((await getMyJob(accessToken, jobId)) as JobDetail);
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

  const onMessageApplicant = async (applicant: NonNullable<JobApplication["applicant"]>) => {
    if (!accessToken) return;
    try {
      setMessagingId(applicant.id);
      const thread = (await startDirectThread(accessToken, applicant.id)) as { id: string };
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

  if (!job && loading) {
    return (
      <ScreenLayout title="Job" subtitle="Loading…">
        <EmptyState message="Loading job details…" />
      </ScreenLayout>
    );
  }

  if (!job) {
    return (
      <ScreenLayout title="Job" subtitle="Not found">
        <EmptyState message="Job not found." />
        <SecondaryButton title="Back" onPress={() => navigation.goBack()} />
      </ScreenLayout>
    );
  }

  const tagTitles = (job.tags ?? []).map((t) => t.tag?.title).filter(Boolean) as string[];
  const applications = job.applications ?? [];

  return (
    <ScreenLayout
      title={job.title}
      subtitle="Applicants · view profile · message"
      footer={<SecondaryButton title="Back to jobs" onPress={() => navigation.goBack()} />}
    >
      <Card>
        <SectionTitle title="Job details" />
        <Text style={{ color: colors.text, fontSize: 15, lineHeight: 22 }}>{job.miniDescription}</Text>
        <Text style={{ color: colors.muted, fontSize: 13, marginTop: 8 }}>
          {[job.city, job.country].filter(Boolean).join(", ") || "Location N/A"}
        </Text>
        <Text style={{ color: colors.muted, fontSize: 13 }}>
          {formatPay(job.payRangeMin, job.payRangeMax)} · Gender: {formatGenderLabel(job.gender)}
        </Text>
        <Text style={{ color: colors.muted, fontSize: 13 }}>
          Valid till {new Date(job.validTill).toLocaleDateString()}
        </Text>
        {tagTitles.length ? (
          <Text style={{ color: colors.muted, fontSize: 13 }}>Skills: {tagTitles.join(" · ")}</Text>
        ) : null}
      </Card>

      <SectionTitle title={`Applicants (${applications.length})`} />

      {applications.length === 0 ? (
        <EmptyState message="No applications yet. Share your job listing with talent." />
      ) : (
        applications.map((app) => {
          const applicant = app.applicant;
          if (!applicant) return null;
          const location =
            [applicant.city, applicant.country].filter(Boolean).join(", ") || "Location N/A";
          return (
            <View key={app.id} style={{ marginBottom: 12, gap: 8 }}>
              <ListCard
                title={applicant.fullName}
                subtitle={app.message || "Applied to your job"}
                meta={[location, `Applied ${new Date(app.createdAt).toLocaleDateString()}`]}
                badge="APPLICANT"
                onPress={() =>
                  navigation.navigate("MemberProfile", { userId: applicant.id })
                }
              />
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <SecondaryButton
                    title="View profile"
                    onPress={() =>
                      navigation.navigate("MemberProfile", { userId: applicant.id })
                    }
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
