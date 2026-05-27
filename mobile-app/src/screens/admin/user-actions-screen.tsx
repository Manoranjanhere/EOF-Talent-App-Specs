import React, { useState } from "react";
import { Alert } from "react-native";
import {
  Card,
  LabeledInput,
  PrimaryButton,
  ScreenLayout,
  SectionTitle,
  SegmentedControl
} from "../../components/ui";
import { takeAdminAction } from "../../services/admin.service";
import { useAuth } from "../../state/auth-context";

type ActionType = "WARN" | "SUSPEND" | "DEACTIVATE" | "BAN" | "NOTE";

export function UserActionsScreen() {
  const { accessToken } = useAuth();
  const [reportId, setReportId] = useState("");
  const [actionType, setActionType] = useState<ActionType>("WARN");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const onApply = async () => {
    if (!accessToken || !reportId.trim()) {
      Alert.alert("Missing report", "Enter a report ID from the moderation queue.");
      return;
    }
    try {
      setLoading(true);
      await takeAdminAction(accessToken, {
        reportId: reportId.trim(),
        actionType,
        reportStatus: "ACTIONED",
        notes
      });
      Alert.alert("Action saved", "Moderation action recorded successfully.");
      setReportId("");
      setNotes("");
    } catch (error) {
      Alert.alert("Error", (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout title="Admin actions" subtitle="Warn, suspend, or deactivate reported users">
      <Card>
        <SectionTitle title="Take action" />
        <LabeledInput
          label="Report ID"
          value={reportId}
          onChangeText={setReportId}
          placeholder="Copy from Reports tab"
        />
        <SegmentedControl
          value={actionType}
          onChange={setActionType}
          options={[
            { value: "WARN", label: "Warn" },
            { value: "SUSPEND", label: "Suspend" },
            { value: "DEACTIVATE", label: "Off" }
          ]}
        />
        <LabeledInput
          label="Admin notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="Reason for this action..."
          multiline
          style={{ minHeight: 100, textAlignVertical: "top" }}
        />
        <PrimaryButton title="Apply action" onPress={onApply} loading={loading} disabled={loading} />
      </Card>
    </ScreenLayout>
  );
}
