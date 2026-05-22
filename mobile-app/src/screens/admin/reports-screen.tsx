import React, { useState } from "react";
import { Alert, Button, ScrollView, Text, View } from "react-native";
import { listFlagReports } from "../../services/admin.service";
import { useAuth } from "../../state/auth-context";

export function ReportsScreen() {
  const { accessToken } = useAuth();
  const [reports, setReports] = useState<any[]>([]);

  const loadReports = async () => {
    if (!accessToken) return;
    try {
      const result = await listFlagReports(accessToken);
      setReports(result as any[]);
    } catch (error) {
      Alert.alert("Error", (error as Error).message);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
      <Text style={{ fontSize: 20, fontWeight: "700" }}>Reported Profiles</Text>
      <Button title="Refresh reports" onPress={loadReports} />
      {reports.map((report) => (
        <View key={report.id} style={{ borderWidth: 1, borderRadius: 10, padding: 10 }}>
          <Text style={{ fontWeight: "700" }}>{report.reason}</Text>
          <Text>Status: {report.status}</Text>
          <Text>Reported user: {report.reportedUser?.fullName ?? report.reportedUserId}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
