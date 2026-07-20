import React, { useCallback, useState } from "react";
import { Alert, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import {
  Card,
  DangerButton,
  EmptyState,
  LabeledInput,
  PrimaryButton,
  ScreenLayout,
  SecondaryButton,
  SectionTitle,
  SegmentedControl
} from "../../components/ui";
import {
  AdminUser,
  banUser,
  listAdminUsers,
  setUserLoginEnabled,
  unbanUser
} from "../../services/admin.service";
import { useAuth } from "../../state/auth-context";
import { useTheme } from "../../theme/theme-context";

type StatusFilter = "all" | "active" | "banned";

export function UserActionsScreen() {
  const { accessToken } = useAuth();
  const { colors } = useTheme();
  const [status, setStatus] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const result = await listAdminUsers(accessToken, {
        q: query.trim() || undefined,
        status
      });
      setUsers(result.items ?? []);
      setTotal(result.total ?? 0);
    } catch (error) {
      Alert.alert("Error", (error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [accessToken, query, status]);

  useFocusEffect(
    useCallback(() => {
      void loadUsers();
    }, [loadUsers])
  );

  const runUserAction = async (
    user: AdminUser,
    action: "ban" | "unban" | "login_on" | "login_off"
  ) => {
    if (!accessToken) return;
    try {
      setBusyUserId(user.id);
      if (action === "ban") {
        await banUser(accessToken, user.id, "Banned from admin panel");
      } else if (action === "unban") {
        await unbanUser(accessToken, user.id, "Unbanned from admin panel");
      } else if (action === "login_on") {
        await setUserLoginEnabled(accessToken, user.id, true);
      } else {
        await setUserLoginEnabled(accessToken, user.id, false);
      }
      await loadUsers();
    } catch (error) {
      Alert.alert("Action failed", (error as Error).message);
    } finally {
      setBusyUserId(null);
    }
  };

  return (
    <ScreenLayout
      title="Admin users"
      subtitle="All members including banned accounts — soft-delete only"
    >
      <Card>
        <SectionTitle title="Filters" />
        <LabeledInput
          label="Search"
          value={query}
          onChangeText={setQuery}
          placeholder="Name, email, mobile, city"
        />
        <SegmentedControl
          value={status}
          onChange={setStatus}
          options={[
            { value: "all", label: "Everyone" },
            { value: "active", label: "Active" },
            { value: "banned", label: "Banned" }
          ]}
        />
        <PrimaryButton title="Refresh list" onPress={loadUsers} loading={loading} disabled={loading} />
        <Text style={{ color: colors.muted, fontSize: 12 }}>
          Showing {users.length} of {total} users
        </Text>
      </Card>

      {users.length === 0 ? (
        <EmptyState message={loading ? "Loading users..." : "No users found for this filter."} />
      ) : (
        users.map((user) => {
          const busy = busyUserId === user.id;
          const roleLabels = user.roles.map((r) => r.title).join(", ") || "No roles";
          return (
            <Card key={user.id}>
              <View style={{ gap: 4 }}>
                <Text style={{ color: colors.text, fontSize: 17, fontWeight: "700" }}>
                  {user.fullName}
                </Text>
                <Text style={{ color: colors.muted, fontSize: 13 }}>
                  {user.email ?? user.mobileNumber ?? user.id}
                </Text>
                <Text style={{ color: colors.muted, fontSize: 12 }}>
                  {roleLabels}
                  {user.city ? ` · ${user.city}` : ""}
                  {user.country ? `, ${user.country}` : ""}
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
                  <StatusChip
                    label={user.isActive ? "ACTIVE" : "BANNED"}
                    tone={user.isActive ? "ok" : "bad"}
                  />
                  <StatusChip
                    label={user.loginEnabled ? "LOGIN ON" : "LOGIN OFF"}
                    tone={user.loginEnabled ? "ok" : "warn"}
                  />
                </View>
              </View>

              <View style={{ gap: 8, marginTop: 4 }}>
                {user.isActive ? (
                  <DangerButton
                    title={busy ? "Working..." : "Ban user"}
                    onPress={() =>
                      Alert.alert("Ban user?", `${user.fullName} will be marked inactive.`, [
                        { text: "Cancel", style: "cancel" },
                        { text: "Ban", style: "destructive", onPress: () => void runUserAction(user, "ban") }
                      ])
                    }
                  />
                ) : (
                  <PrimaryButton
                    title={busy ? "Working..." : "Unban user"}
                    onPress={() => void runUserAction(user, "unban")}
                    disabled={busy}
                    loading={busy}
                  />
                )}
                <SecondaryButton
                  title={
                    busy
                      ? "Working..."
                      : user.loginEnabled
                        ? "Disable login"
                        : "Enable login"
                  }
                  onPress={() =>
                    void runUserAction(user, user.loginEnabled ? "login_off" : "login_on")
                  }
                  disabled={busy}
                />
              </View>
            </Card>
          );
        })
      )}
    </ScreenLayout>
  );
}

function StatusChip({
  label,
  tone
}: {
  label: string;
  tone: "ok" | "warn" | "bad";
}) {
  const { colors } = useTheme();
  const bg =
    tone === "ok" ? colors.primarySoft : tone === "warn" ? colors.inset : colors.dangerSoft;
  const fg = tone === "ok" ? colors.accentText : tone === "warn" ? colors.warning : colors.danger;

  return (
    <View
      style={{
        backgroundColor: bg,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8
      }}
    >
      <Text style={{ color: fg, fontSize: 11, fontWeight: "700" }}>{label}</Text>
    </View>
  );
}
