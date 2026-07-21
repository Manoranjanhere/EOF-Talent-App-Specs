import React, { useCallback, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { GroupId } from "@eof/shared";
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
  ADMIN_ROLE_OPTIONS,
  AdminUser,
  banUser,
  listAdminUsers,
  setUserAdminRole,
  setUserLoginEnabled,
  unbanUser
} from "../../services/admin.service";
import { useAuth } from "../../state/auth-context";
import { useTheme } from "../../theme/theme-context";

type StatusFilter = "all" | "active" | "banned";

export function UserActionsScreen({ navigation }: { navigation?: any }) {
  const { accessToken, user } = useAuth();
  const { colors } = useTheme();
  const [status, setStatus] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  const isSuperAdmin = (user?.roles ?? []).includes(GroupId.SuperAdmin);

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
    target: AdminUser,
    action: "ban" | "unban" | "login_on" | "login_off"
  ) => {
    if (!accessToken) return;
    try {
      setBusyUserId(target.id);
      if (action === "ban") {
        await banUser(accessToken, target.id, "Blocked from admin panel");
      } else if (action === "unban") {
        await unbanUser(accessToken, target.id, "Unblocked from admin panel");
      } else if (action === "login_on") {
        await setUserLoginEnabled(accessToken, target.id, true);
      } else {
        await setUserLoginEnabled(accessToken, target.id, false);
      }
      await loadUsers();
    } catch (error) {
      Alert.alert("Action failed", (error as Error).message);
    } finally {
      setBusyUserId(null);
    }
  };

  const toggleAdminRole = async (target: AdminUser, groupId: number, grant: boolean) => {
    if (!accessToken) return;
    const label = ADMIN_ROLE_OPTIONS.find((r) => r.groupId === groupId)?.label ?? "Admin role";
    try {
      setBusyUserId(target.id);
      await setUserAdminRole(accessToken, target.id, { groupId, grant });
      Alert.alert("Role updated", grant ? `${label} granted.` : `${label} removed.`);
      await loadUsers();
    } catch (error) {
      Alert.alert("Role update failed", (error as Error).message);
    } finally {
      setBusyUserId(null);
    }
  };

  const hasRole = (target: AdminUser, groupId: number) =>
    target.roles.some((r) => r.groupId === groupId);

  return (
    <ScreenLayout
      title="Admin users"
      subtitle={
        isSuperAdmin
          ? "Block users · Super Admin can grant/revoke admin roles"
          : "Block users and manage login access"
      }
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
            { value: "banned", label: "Blocked" }
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
        users.map((target) => {
          const busy = busyUserId === target.id;
          const roleLabels = target.roles.map((r) => r.title).join(", ") || "No roles";
          return (
            <Card key={target.id}>
              <View style={{ gap: 4 }}>
                <Text style={{ color: colors.text, fontSize: 17, fontWeight: "700" }}>
                  {target.fullName}
                </Text>
                <Text style={{ color: colors.muted, fontSize: 13 }}>
                  {target.email ?? target.mobileNumber ?? target.id}
                </Text>
                <Text style={{ color: colors.muted, fontSize: 12 }}>
                  {roleLabels}
                  {target.city ? ` · ${target.city}` : ""}
                  {target.country ? `, ${target.country}` : ""}
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
                  <StatusChip
                    label={target.isActive ? "ACTIVE" : "BLOCKED"}
                    tone={target.isActive ? "ok" : "bad"}
                  />
                  <StatusChip
                    label={target.loginEnabled ? "LOGIN ON" : "LOGIN OFF"}
                    tone={target.loginEnabled ? "ok" : "warn"}
                  />
                </View>
                <Pressable onPress={() => navigation?.navigate("MemberProfile", { userId: target.id })}>
                  <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "600", marginTop: 6 }}>
                    View full profile →
                  </Text>
                </Pressable>
              </View>

              <View style={{ gap: 8, marginTop: 10 }}>
                {target.isActive ? (
                  <DangerButton
                    title={busy ? "Working..." : "Block user"}
                    onPress={() =>
                      Alert.alert("Block user?", `${target.fullName} will be marked inactive.`, [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Block",
                          style: "destructive",
                          onPress: () => void runUserAction(target, "ban")
                        }
                      ])
                    }
                  />
                ) : (
                  <PrimaryButton
                    title={busy ? "Working..." : "Unblock user"}
                    onPress={() => void runUserAction(target, "unban")}
                    disabled={busy}
                    loading={busy}
                  />
                )}
                <SecondaryButton
                  title={
                    busy
                      ? "Working..."
                      : target.loginEnabled
                        ? "Disable login"
                        : "Enable login"
                  }
                  onPress={() =>
                    void runUserAction(target, target.loginEnabled ? "login_off" : "login_on")
                  }
                  disabled={busy}
                />
              </View>

              {isSuperAdmin ? (
                <View style={{ marginTop: 12, gap: 8 }}>
                  <SectionTitle title="Admin roles (Super Admin)" />
                  {ADMIN_ROLE_OPTIONS.map((role) => {
                    const assigned = hasRole(target, role.groupId);
                    return (
                      <SecondaryButton
                        key={role.groupId}
                        title={
                          busy
                            ? "Working..."
                            : assigned
                              ? `Remove ${role.label}`
                              : `Make ${role.label}`
                        }
                        onPress={() =>
                          Alert.alert(
                            assigned ? `Remove ${role.label}?` : `Grant ${role.label}?`,
                            assigned
                              ? `${target.fullName} will lose ${role.label} access.`
                              : `${target.fullName} will get ${role.label} access.`,
                            [
                              { text: "Cancel", style: "cancel" },
                              {
                                text: assigned ? "Remove" : "Grant",
                                style: assigned ? "destructive" : "default",
                                onPress: () => void toggleAdminRole(target, role.groupId, !assigned)
                              }
                            ]
                          )
                        }
                        disabled={busy}
                      />
                    );
                  })}
                </View>
              ) : null}
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
