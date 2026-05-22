import React, { useState } from "react";
import { Alert, Button, ScrollView, Text, TextInput } from "react-native";
import { takeAdminAction } from "../../services/admin.service";
import { useAuth } from "../../state/auth-context";

export function UserActionsScreen() {
  const { accessToken } = useAuth();
  const [reportId, setReportId] = useState("");
  const [actionType, setActionType] = useState<"WARN" | "SUSPEND" | "DEACTIVATE" | "BAN" | "NOTE">("WARN");
  const [notes, setNotes] = useState("");

  const onApply = async () => {
    if (!accessToken || !reportId) return;
    try {
      await takeAdminAction(accessToken, {
        reportId,
        actionType,
        reportStatus: "ACTIONED",
        notes
      });
      Alert.alert("Action saved", "Moderation action has been recorded");
    } catch (error) {
      Alert.alert("Error", (error as Error).message);
    }
  };

  const cycleActionType = () => {
    setActionType((prev) => {
      if (prev === "WARN") return "SUSPEND";
      if (prev === "SUSPEND") return "DEACTIVATE";
      if (prev === "DEACTIVATE") return "BAN";
      if (prev === "BAN") return "NOTE";
      return "WARN";
    });
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
      <Text style={{ fontSize: 20, fontWeight: "700" }}>Admin User Actions</Text>
      <TextInput
        value={reportId}
        onChangeText={setReportId}
        placeholder="Report ID"
        style={{ borderWidth: 1, borderRadius: 8, padding: 10 }}
      />
      <Button title={`Action type: ${actionType}`} onPress={cycleActionType} />
      <TextInput
        value={notes}
        onChangeText={setNotes}
        placeholder="Notes"
        multiline
        style={{ borderWidth: 1, borderRadius: 8, padding: 10, minHeight: 120 }}
      />
      <Button title="Apply action" onPress={onApply} />
    </ScrollView>
  );
}
