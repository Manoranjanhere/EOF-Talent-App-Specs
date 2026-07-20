import React, { useMemo, useState } from "react";
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
import { AppColors, lightColors } from "../theme/colors";
import { useTheme } from "../theme/theme-context";
import { AppLogoIcon, EyeIcon, EyeOffIcon } from "./icons";

/** @deprecated Prefer useTheme().colors — kept for gradual migration */
export const colors = lightColors;

function useStyles() {
  const { colors: c } = useTheme();
  return useMemo(() => createStyles(c), [c]);
}

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
  const styles = useStyles();

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
            <View style={styles.brandRow}>
              <AppLogoIcon size={28} />
              <Text style={styles.brand}>EOF Talent</Text>
            </View>
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
  const styles = useStyles();
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ title }: { title: string }) {
  const styles = useStyles();
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

export function LabeledInput({
  label,
  hint,
  secureTextEntry,
  style,
  ...props
}: TextInputProps & { label: string; hint?: string }) {
  const { colors: c } = useTheme();
  const styles = useStyles();
  const [visible, setVisible] = useState(false);
  const isPassword = secureTextEntry === true;

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          placeholderTextColor={c.muted}
          {...props}
          style={[styles.input, isPassword && styles.inputWithToggle, style]}
          secureTextEntry={isPassword ? !visible : secureTextEntry}
        />
        {isPassword ? (
          <Pressable
            onPress={() => setVisible((v) => !v)}
            style={styles.eyeBtn}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={visible ? "Hide password" : "Show password"}
          >
            {visible ? (
              <EyeOffIcon color={c.muted} size={20} />
            ) : (
              <EyeIcon color={c.muted} size={20} />
            )}
          </Pressable>
        ) : null}
      </View>
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
  const { colors: c } = useTheme();
  const styles = useStyles();

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
        <ActivityIndicator color={c.primaryOn} />
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
  const styles = useStyles();

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
  const styles = useStyles();

  return (
    <Pressable onPress={onPress} style={styles.dangerBtn}>
      <Text style={styles.dangerBtnText}>{title}</Text>
    </Pressable>
  );
}

export function LinkButton({ title, onPress }: { title: string; onPress: () => void }) {
  const styles = useStyles();

  return (
    <Pressable onPress={onPress} style={styles.linkBtn}>
      <Text style={styles.linkBtnText}>{title}</Text>
    </Pressable>
  );
}

export { ThemeToggleButton } from "./theme-toggle-button";

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const styles = useStyles();

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
  const styles = useStyles();
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
  const styles = useStyles();
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
  const styles = useStyles();

  return (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

export function StatPill({ label, value }: { label: string; value: string }) {
  const styles = useStyles();

  return (
    <View style={styles.statPill}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    scroll: { flexGrow: 1, padding: 20, paddingBottom: 40, gap: 14 },
    headerRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
    headerText: { flex: 1, paddingRight: 12 },
    brandRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
    brand: {
      color: c.primary,
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 1.2,
      textTransform: "uppercase"
    },
    title: { color: c.text, fontSize: 26, fontWeight: "800" },
    subtitle: { color: c.muted, fontSize: 14, marginTop: 6, lineHeight: 20 },
    footer: {
      marginTop: 20,
      width: "100%",
      alignSelf: "stretch",
      gap: 10
    },
    card: {
      backgroundColor: c.card,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: 14,
      gap: 12,
      elevation: 2,
      shadowColor: "#0F172A",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8
    },
    sectionTitle: {
      color: c.text,
      fontSize: 16,
      fontWeight: "700",
      marginBottom: 4
    },
    field: { gap: 6 },
    label: { color: c.muted, fontSize: 13, fontWeight: "600" },
    hint: { color: c.muted, fontSize: 12 },
    inputWrap: { position: "relative", justifyContent: "center" },
    input: {
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.inputBg,
      color: c.text,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16
    },
    inputWithToggle: { paddingRight: 48 },
    eyeBtn: {
      position: "absolute",
      right: 12,
      height: "100%",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 4
    },
    primaryBtn: {
      backgroundColor: c.primary,
      borderRadius: 10,
      paddingVertical: 14,
      paddingHorizontal: 16,
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "stretch",
      minHeight: 48,
      marginTop: 4
    },
    primaryBtnPressed: { backgroundColor: c.primaryPressed },
    secondaryBtn: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 10,
      paddingVertical: 14,
      paddingHorizontal: 16,
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "stretch",
      minHeight: 48,
      backgroundColor: c.inset
    },
    secondaryBtnPressed: { backgroundColor: c.cardElevated },
    dangerBtn: {
      backgroundColor: c.dangerSoft,
      borderWidth: 1,
      borderColor: c.danger,
      borderRadius: 10,
      paddingVertical: 14,
      paddingHorizontal: 16,
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "stretch",
      minHeight: 48
    },
    dangerBtnText: { color: c.danger, fontWeight: "700" },
    btnDisabled: { opacity: 0.55 },
    primaryBtnText: { color: c.primaryOn, fontSize: 16, fontWeight: "700" },
    secondaryBtnText: { color: c.text, fontSize: 15, fontWeight: "600" },
    linkBtn: { paddingVertical: 10 },
    linkBtnText: { color: c.primary, fontSize: 15, fontWeight: "600" },
    segmentRow: { flexDirection: "row", gap: 8 },
    segment: {
      flex: 1,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 10,
      paddingVertical: 10,
      alignItems: "center",
      backgroundColor: c.inset
    },
    segmentActive: { borderColor: c.primary, backgroundColor: c.primarySoft },
    segmentText: { color: c.muted, fontWeight: "600", fontSize: 13 },
    segmentTextActive: { color: c.primary },
    roleCard: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      padding: 14,
      backgroundColor: c.inset
    },
    roleCardActive: { borderColor: c.primary, backgroundColor: c.primarySoft },
    roleTitle: { color: c.text, fontSize: 16, fontWeight: "700" },
    roleTitleActive: { color: c.accentText },
    roleDesc: { color: c.muted, fontSize: 13, marginTop: 4 },
    listCard: {
      backgroundColor: c.cardElevated,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: 10
    },
    listCardPressed: { opacity: 0.9 },
    listCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
    listCardTitle: { color: c.text, fontSize: 17, fontWeight: "700", flex: 1 },
    listCardSubtitle: { color: c.muted, fontSize: 14, marginTop: 4 },
    listCardMeta: { color: c.muted, fontSize: 12, marginTop: 4 },
    badge: {
      backgroundColor: c.primarySoft,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      marginLeft: 8
    },
    badgeText: { color: c.accentText, fontSize: 11, fontWeight: "700" },
    empty: {
      padding: 24,
      alignItems: "center",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      borderStyle: "dashed",
      backgroundColor: c.inset
    },
    emptyText: { color: c.muted, textAlign: "center" },
    statPill: {
      flex: 1,
      backgroundColor: c.card,
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: "center"
    },
    statValue: { color: c.text, fontSize: 18, fontWeight: "800" },
    statLabel: { color: c.muted, fontSize: 11, marginTop: 4 }
  });
}
