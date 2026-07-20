import React, { useCallback, useState } from "react";
import { Alert, Text, View } from "react-native";
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
import { listFlagReports, takeAdminAction } from "../../services/admin.service";
import { useAuth } from "../../state/auth-context";
import { useTheme } from "../../theme/theme-context";

type StatusFilter = "ALL" | "OPEN" | "ACTIONED" | "REJECTED";
type ActionType = "WARN" | "SUSPEND" | "BAN" | "NOTE";

export function ReportsScreen() {
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

  const onAction = async (reportId: string, actionType: ActionType) => {
    if (!accessToken) return;
    try {
      setBusyId(reportId);
      await takeAdminAction(accessToken, {
        reportId,
        actionType,
        reportStatus: actionType === "NOTE" ? "REVIEWING" : "ACTIONED",
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

  return (
    <ScreenLayout title="Moderation queue" subtitle="Review flagged profiles and take action">
      <Card>
        <SectionTitle title="Queue filter" />
        <SegmentedControl
          value={status}
          onChange={setStatus}
          options={[
            { value: "OPEN", label: "Open" },
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
          return (
            <Card key={report.id}>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700" }}>
                {String(report.reason).replace(/_/g, " ")}
              </Text>
              <Text style={{ color: colors.muted, fontSize: 13 }}>
                Against: {report.reportedUser?.fullName ?? report.reportedUserId}
              </Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>
                Raised by: {report.raisedBy?.fullName ?? report.raisedByUserId}
              </Text>
              {report.details ? (
                <Text style={{ color: colors.muted, fontSize: 12 }}>{report.details}</Text>
              ) : null}
              <View
                style={{
                  alignSelf: "flex-start",
                  backgroundColor: colors.primarySoft,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 8,
                  marginTop: 4
                }}
              >
                <Text style={{ color: colors.accentText, fontSize: 11, fontWeight: "700" }}>
                  {report.status}
                </Text>
              </View>

              {report.status === "OPEN" || report.status === "REVIEWING" ? (
                <View style={{ gap: 8, marginTop: 8 }}>
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
                  <DangerButton
                    title={busy ? "Working..." : "Ban user"}
                    onPress={() =>
                      Alert.alert("Ban reported user?", "Account will be marked inactive.", [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Ban",
                          style: "destructive",
                          onPress: () => void onAction(report.id, "BAN")
                        }
                      ])
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
