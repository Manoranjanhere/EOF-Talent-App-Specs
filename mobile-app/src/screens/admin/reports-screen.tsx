import React, { useCallback, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import {
  Card,
  DangerButton,
  EmptyState,
  PrimaryButton,
  ScreenLayout,
  SecondaryButton,
  SectionTitle,
  SegmentedControl
} from "../../components/ui";
import { banUser, listFlagReports, takeAdminAction } from "../../services/admin.service";
import { useAuth } from "../../state/auth-context";
import { useTheme } from "../../theme/theme-context";

type StatusFilter = "ALL" | "OPEN" | "REVIEWING" | "ACTIONED" | "REJECTED";
type ActionType = "WARN" | "SUSPEND" | "BAN" | "NOTE";

function roleSummary(user: any) {
  const roles = (user?.roles ?? []) as Array<{ group?: { title?: string } }>;
  return roles.map((r) => r.group?.title).filter(Boolean).join(", ") || "Member";
}

function tagSummary(user: any) {
  const tags = ((user?.profileTags ?? []) as any[])
    .map((t) => t.tag?.title)
    .filter(Boolean);
  return tags.length ? tags.slice(0, 5).join(" · ") : "No tags";
}

export function ReportsScreen({ navigation }: { navigation?: any }) {
  const { accessToken } = useAuth();
  const { colors } = useTheme();
  const [status, setStatus] = useState<StatusFilter>("OPEN");
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const result = await listFlagReports(
        accessToken,
        status === "ALL" ? undefined : status
      );
      setReports(result as any[]);
    } catch (error) {
      Alert.alert("Error", (error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [accessToken, status]);

  useFocusEffect(
    useCallback(() => {
      void loadReports();
    }, [loadReports])
  );

  const onAction = async (
    reportId: string,
    actionType: ActionType,
    reportStatus: "REVIEWING" | "ACTIONED" | "REJECTED" = "ACTIONED"
  ) => {
    if (!accessToken) return;
    try {
      setBusyId(reportId);
      await takeAdminAction(accessToken, {
        reportId,
        actionType,
        reportStatus: actionType === "NOTE" ? "REVIEWING" : reportStatus,
        notes: `Admin ${actionType.toLowerCase()} from Reports tab`
      });
      Alert.alert("Done", `${actionType} recorded.`);
      await loadReports();
    } catch (error) {
      Alert.alert("Action failed", (error as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const onBlockUser = async (report: any) => {
    if (!accessToken) return;
    try {
      setBusyId(report.id);
      await banUser(accessToken, report.reportedUserId, `Blocked from report ${report.id}`);
      await takeAdminAction(accessToken, {
        reportId: report.id,
        actionType: "BAN",
        reportStatus: "ACTIONED",
        notes: "User blocked by admin"
      });
      Alert.alert("User blocked", `${report.reportedUser?.fullName ?? "User"} can no longer log in.`);
      await loadReports();
    } catch (error) {
      Alert.alert("Block failed", (error as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const openProfile = (userId: string) => {
    navigation?.navigate("MemberProfile", { userId });
  };

  return (
    <ScreenLayout
      title="Reported users"
      subtitle="Review flags · view profiles · see who reported"
    >
      <Card>
        <SectionTitle title="Queue filter" />
        <SegmentedControl
          value={status}
          onChange={setStatus}
          options={[
            { value: "OPEN", label: "Open" },
            { value: "REVIEWING", label: "Review" },
            { value: "ACTIONED", label: "Done" },
            { value: "ALL", label: "All" }
          ]}
        />
        <PrimaryButton title="Refresh reports" onPress={loadReports} loading={loading} disabled={loading} />
      </Card>

      {reports.length === 0 ? (
        <EmptyState message={loading ? "Loading reports..." : "No reports for this filter."} />
      ) : (
        reports.map((report) => {
          const busy = busyId === report.id;
          const reported = report.reportedUser;
          const reporter = report.raisedBy;
          return (
            <Card key={report.id}>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700" }}>
                {String(report.reason).replace(/_/g, " ")}
              </Text>
              <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>
                Reported {new Date(report.createdAt).toLocaleString()}
              </Text>

              <View style={{ marginTop: 10, gap: 4 }}>
                <Text style={{ color: colors.text, fontSize: 14, fontWeight: "600" }}>
                  Reported user
                </Text>
                <Text style={{ color: colors.muted, fontSize: 13 }}>
                  {reported?.fullName ?? report.reportedUserId}
                </Text>
                <Text style={{ color: colors.muted, fontSize: 12 }}>
                  {reported?.email ?? reported?.mobileNumber ?? "No contact"}
                </Text>
                <Text style={{ color: colors.muted, fontSize: 12 }}>
                  {[reported?.city, reported?.country].filter(Boolean).join(", ") || "No location"}
                </Text>
                <Text style={{ color: colors.muted, fontSize: 12 }}>{roleSummary(reported)}</Text>
                <Text style={{ color: colors.muted, fontSize: 12 }}>{tagSummary(reported)}</Text>
                <Text style={{ color: colors.muted, fontSize: 12 }}>
                  {reported?.isActive === false ? "BLOCKED" : "Active account"}
                </Text>
                <Pressable onPress={() => openProfile(report.reportedUserId)}>
                  <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "600", marginTop: 4 }}>
                    View full profile →
                  </Text>
                </Pressable>
              </View>

              <View style={{ marginTop: 12, gap: 4 }}>
                <Text style={{ color: colors.text, fontSize: 14, fontWeight: "600" }}>
                  Reported by
                </Text>
                <Text style={{ color: colors.muted, fontSize: 13 }}>
                  {reporter?.fullName ?? report.raisedByUserId}
                </Text>
                <Text style={{ color: colors.muted, fontSize: 12 }}>
                  {reporter?.email ?? reporter?.mobileNumber ?? "No contact"}
                </Text>
                <Text style={{ color: colors.muted, fontSize: 12 }}>{roleSummary(reporter)}</Text>
                <Pressable onPress={() => openProfile(report.raisedByUserId)}>
                  <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "600", marginTop: 4 }}>
                    View reporter profile →
                  </Text>
                </Pressable>
              </View>

              {report.details ? (
                <Text style={{ color: colors.muted, fontSize: 12, marginTop: 10 }}>
                  Details: {report.details}
                </Text>
              ) : null}

              <View
                style={{
                  alignSelf: "flex-start",
                  backgroundColor: colors.primarySoft,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 8,
                  marginTop: 8
                }}
              >
                <Text style={{ color: colors.accentText, fontSize: 11, fontWeight: "700" }}>
                  {report.status}
                </Text>
              </View>

              {report.status === "OPEN" || report.status === "REVIEWING" ? (
                <View style={{ gap: 8, marginTop: 10 }}>
                  <SecondaryButton
                    title="Mark reviewing"
                    onPress={() => void onAction(report.id, "NOTE", "REVIEWING")}
                    disabled={busy}
                  />
                  <SecondaryButton
                    title="Warn"
                    onPress={() => void onAction(report.id, "WARN")}
                    disabled={busy}
                  />
                  <SecondaryButton
                    title="Suspend"
                    onPress={() => void onAction(report.id, "SUSPEND")}
                    disabled={busy}
                  />
                  <SecondaryButton
                    title="Dismiss report"
                    onPress={() => void onAction(report.id, "NOTE", "REJECTED")}
                    disabled={busy}
                  />
                  <DangerButton
                    title={busy ? "Working..." : "Block user"}
                    onPress={() =>
                      Alert.alert(
                        "Block reported user?",
                        "They will be marked inactive and cannot log in.",
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Block",
                            style: "destructive",
                            onPress: () => void onBlockUser(report)
                          }
                        ]
                      )
                    }
                  />
                </View>
              ) : null}
            </Card>
          );
        })
      )}
    </ScreenLayout>
  );
}
