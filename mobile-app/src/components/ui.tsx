import React from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle
} from "react-native";

export const colors = {
  bg: "#0f172a",
  card: "#1e293b",
  cardElevated: "#273449",
  border: "#334155",
  text: "#f8fafc",
  muted: "#94a3b8",
  primary: "#6366f1",
  primaryPressed: "#4f46e5",
  primarySoft: "#312e81",
  danger: "#f87171",
  dangerSoft: "#450a0a",
  success: "#34d399",
  warning: "#fbbf24"
};

export function ScreenLayout({
  title,
  subtitle,
  children,
  footer,
  headerRight
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  headerRight?: React.ReactNode;
}) {
  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.brand}>EOF Talent</Text>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          {headerRight}
        </View>
        {children}
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function Card({
  children,
  style
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

export function LabeledInput({
  label,
  hint,
  ...props
}: TextInputProps & { label: string; hint?: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor={colors.muted} style={styles.input} {...props} />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

export function PrimaryButton({
  title,
  onPress,
  disabled,
  loading
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.primaryBtn,
        (disabled || loading) && styles.btnDisabled,
        pressed && !disabled && styles.primaryBtnPressed
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.primaryBtnText}>{title}</Text>
      )}
    </Pressable>
  );
}

export function SecondaryButton({
  title,
  onPress,
  disabled
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.secondaryBtn,
        disabled && styles.btnDisabled,
        pressed && styles.secondaryBtnPressed
      ]}
    >
      <Text style={styles.secondaryBtnText}>{title}</Text>
    </Pressable>
  );
}

export function DangerButton({
  title,
  onPress
}: {
  title: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.dangerBtn}>
      <Text style={styles.dangerBtnText}>{title}</Text>
    </Pressable>
  );
}

export function LinkButton({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.linkBtn}>
      <Text style={styles.linkBtnText}>{title}</Text>
    </Pressable>
  );
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.segmentRow}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.segment, active && styles.segmentActive]}
          >
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function RoleSelector({
  value,
  onChange
}: {
  value: number;
  onChange: (groupId: number) => void;
}) {
  const roles = [
    { id: 1, title: "Talent", description: "Model, actor, artist, crew member" },
    { id: 2, title: "Employer / Agency", description: "Hire talent or post jobs" }
  ];

  return (
    <View style={styles.field}>
      <Text style={styles.label}>I am joining as</Text>
      {roles.map((role) => {
        const active = value === role.id;
        return (
          <Pressable
            key={role.id}
            onPress={() => onChange(role.id)}
            style={[styles.roleCard, active && styles.roleCardActive]}
          >
            <Text style={[styles.roleTitle, active && styles.roleTitleActive]}>
              {role.title}
            </Text>
            <Text style={styles.roleDesc}>{role.description}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ListCard({
  title,
  subtitle,
  meta,
  badge,
  onPress
}: {
  title: string;
  subtitle?: string;
  meta?: string[];
  badge?: string;
  onPress?: () => void;
}) {
  const content = (
    <>
      <View style={styles.listCardTop}>
        <Text style={styles.listCardTitle}>{title}</Text>
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      {subtitle ? <Text style={styles.listCardSubtitle}>{subtitle}</Text> : null}
      {meta?.map((line) => (
        <Text key={line} style={styles.listCardMeta}>
          {line}
        </Text>
      ))}
    </>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.listCard, pressed && styles.listCardPressed]}>
        {content}
      </Pressable>
    );
  }

  return <View style={styles.listCard}>{content}</View>;
}

export function EmptyState({ message }: { message: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

export function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statPill}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, padding: 20, paddingBottom: 40 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  headerText: { flex: 1 },
  brand: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 6
  },
  title: { color: colors.text, fontSize: 26, fontWeight: "800" },
  subtitle: { color: colors.muted, fontSize: 14, marginTop: 6, lineHeight: 20 },
  footer: { marginTop: 16, alignItems: "center" },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
    gap: 12
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4
  },
  field: { gap: 6 },
  label: { color: colors.muted, fontSize: 13, fontWeight: "600" },
  hint: { color: colors.muted, fontSize: 12 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#0b1220",
    color: colors.text,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center"
  },
  primaryBtnPressed: { backgroundColor: colors.primaryPressed },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#0b1220"
  },
  secondaryBtnPressed: { backgroundColor: colors.cardElevated },
  dangerBtn: {
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center"
  },
  dangerBtnText: { color: colors.danger, fontWeight: "700" },
  btnDisabled: { opacity: 0.55 },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  secondaryBtnText: { color: colors.text, fontSize: 15, fontWeight: "600" },
  linkBtn: { paddingVertical: 10 },
  linkBtnText: { color: colors.primary, fontSize: 15, fontWeight: "600" },
  segmentRow: { flexDirection: "row", gap: 8 },
  segment: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#0b1220"
  },
  segmentActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  segmentText: { color: colors.muted, fontWeight: "600", fontSize: 13 },
  segmentTextActive: { color: colors.text },
  roleCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    backgroundColor: "#0b1220"
  },
  roleCardActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  roleTitle: { color: colors.text, fontSize: 16, fontWeight: "700" },
  roleTitleActive: { color: "#e0e7ff" },
  roleDesc: { color: colors.muted, fontSize: 13, marginTop: 4 },
  listCard: {
    backgroundColor: colors.cardElevated,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10
  },
  listCardPressed: { opacity: 0.9 },
  listCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  listCardTitle: { color: colors.text, fontSize: 17, fontWeight: "700", flex: 1 },
  listCardSubtitle: { color: colors.muted, fontSize: 14, marginTop: 4 },
  listCardMeta: { color: colors.muted, fontSize: 12, marginTop: 4 },
  badge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8
  },
  badgeText: { color: "#c7d2fe", fontSize: 11, fontWeight: "700" },
  empty: {
    padding: 24,
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed"
  },
  emptyText: { color: colors.muted, textAlign: "center" },
  statPill: {
    flex: 1,
    backgroundColor: "#0b1220",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center"
  },
  statValue: { color: colors.text, fontSize: 18, fontWeight: "800" },
  statLabel: { color: colors.muted, fontSize: 11, marginTop: 4 }
});
