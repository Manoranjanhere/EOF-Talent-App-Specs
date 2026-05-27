import React, { useState } from "react";
import { Alert } from "react-native";
import {
  Card,
  EmptyState,
  ListCard,
  PrimaryButton,
  ScreenLayout,
  SectionTitle
} from "../../components/ui";
import { listFlagReports } from "../../services/admin.service";
import { useAuth } from "../../state/auth-context";

export function ReportsScreen() {
  const { accessToken } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadReports = async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const result = await listFlagReports(accessToken);
      setReports(result as any[]);
    } catch (error) {
      Alert.alert("Error", (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout title="Moderation queue" subtitle="Review flagged profiles and take action">
      <Card>
        <PrimaryButton title="Refresh reports" onPress={loadReports} loading={loading} disabled={loading} />
      </Card>

      {reports.length === 0 ? (
        <EmptyState message="No open reports. Tap refresh to load." />
      ) : (
        reports.map((report) => (
          <ListCard
            key={report.id}
            title={report.reason}
            subtitle={report.reportedUser?.fullName ?? report.reportedUserId}
            badge={report.status}
            meta={[
              `Report ID: ${report.id}`,
              `Raised by: ${report.raisedBy?.fullName ?? report.raisedByUserId}`
            ]}
          />
        ))
      )}
    </ScreenLayout>
  );
}
