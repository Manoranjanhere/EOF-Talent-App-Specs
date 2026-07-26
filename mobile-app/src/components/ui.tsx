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
        <View style={styles.headerBand}>
          <View style={styles.headerRow}>
            <View style={styles.headerText}>
              <View style={styles.brandRow}>
                <View style={styles.logoBadge}>
                  <AppLogoIcon size={22} />
                </View>
                <Text style={styles.brand}>EOF Talent</Text>
              </View>
              <Text style={styles.title}>{title}</Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            {headerRight}
          </View>
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

/** Tiny legal / policy links (Privacy, Terms) — not bold primary CTAs. */
export function LegalFinePrint({
  onPrivacy,
  onTerms
}: {
  onPrivacy: () => void;
  onTerms: () => void;
}) {
  const { colors: c } = useTheme();

  return (
    <View style={{ alignItems: "center", paddingTop: 4, gap: 2 }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", alignItems: "center" }}>
        <Pressable onPress={onPrivacy} hitSlop={6}>
          <Text style={{ color: c.muted, fontSize: 11, fontWeight: "400" }}>Privacy Policy</Text>
        </Pressable>
        <Text style={{ color: c.muted, fontSize: 11, fontWeight: "400" }}>{"  ·  "}</Text>
        <Pressable onPress={onTerms} hitSlop={6}>
          <Text style={{ color: c.muted, fontSize: 11, fontWeight: "400" }}>Terms of Service</Text>
        </Pressable>
      </View>
    </View>
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
    <View style={styles.segmentWrap}>
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
  roleBadge,
  onPress
}: {
  title: string;
  subtitle?: string;
  meta?: string[];
  badge?: string;
  roleBadge?: string;
  onPress?: () => void;
}) {
  const { colors: c } = useTheme();
  const styles = useStyles();
  const roleBadgeStyle =
    roleBadge === "Employer"
      ? styles.roleBadgeEmployer
      : roleBadge === "Talent"
        ? styles.roleBadgeTalent
        : styles.roleBadgeNeutral;
  const roleBadgeTextStyle =
    roleBadge === "Employer"
      ? styles.roleBadgeEmployerText
      : roleBadge === "Talent"
        ? styles.roleBadgeTalentText
        : styles.roleBadgeNeutralText;
  const content = (
    <>
      <View style={styles.listCardTop}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={styles.listCardTitle}>{title}</Text>
          {subtitle ? <Text style={styles.listCardSubtitle}>{subtitle}</Text> : null}
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 0 }}>
          {roleBadge ? (
            <View style={roleBadgeStyle}>
              <Text style={roleBadgeTextStyle}>{roleBadge}</Text>
            </View>
          ) : null}
          {badge ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ) : null}
          {onPress ? (
            <Text style={{ color: c.primary, fontSize: 20, fontWeight: "300", marginTop: -2 }}>›</Text>
          ) : null}
        </View>
      </View>
      {meta?.length ? (
        <View style={styles.listCardMetaWrap}>
          {meta.map((line) => (
            <View key={line} style={styles.metaChip}>
              <Text style={styles.metaChipText}>{line}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.listCard, pressed && styles.listCardPressed]}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={styles.listCard}>{content}</View>;
}

export function TagChips({ tags }: { tags: string[] }) {
  const styles = useStyles();
  return (
    <View style={styles.tagRow}>
      {tags.map((tag) => (
        <View key={tag} style={styles.tagChip}>
          <Text style={styles.tagChipText}>{tag}</Text>
        </View>
      ))}
    </View>
  );
}

export function StarRatingPicker({
  value,
  onChange
}: {
  value: number | null;
  onChange: (value: number) => void;
}) {
  const { colors: c } = useTheme();
  return (
    <View style={{ flexDirection: "row", justifyContent: "center", gap: 6 }}>
      {[1, 2, 3, 4, 5].map((star) => {
        const active = value !== null && star <= value;
        return (
          <Pressable
            key={star}
            onPress={() => onChange(star)}
            accessibilityRole="button"
            accessibilityLabel={`Rate ${star} out of 5`}
            style={({ pressed }) => ({
              padding: 6,
              borderRadius: 12,
              backgroundColor: active ? c.primarySoft : "transparent",
              opacity: pressed ? 0.8 : 1
            })}
          >
            <Text
              style={{
                fontSize: 34,
                color: active ? c.primary : c.border,
                lineHeight: 38
              }}
            >
              ★
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function EmptyState({ message }: { message: string }) {
  const { colors: c } = useTheme();
  const styles = useStyles();

  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: c.primarySoft, borderColor: c.border }]}>
        <Text style={{ fontSize: 22, color: c.primary }}>✦</Text>
      </View>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

export function StatPill({ label, value }: { label: string; value: string }) {
  const styles = useStyles();

  return (
    <View style={styles.statPill}>
      <View style={styles.statAccent} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    scroll: { flexGrow: 1, padding: 20, paddingBottom: 56, gap: 14 },
    headerBand: {
      marginHorizontal: -20,
      marginTop: -20,
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 18,
      backgroundColor: c.heroTint,
      borderBottomLeftRadius: 28,
      borderBottomRightRadius: 28,
      marginBottom: 6
    },
    headerRow: { flexDirection: "row", justifyContent: "space-between" },
    headerText: { flex: 1, paddingRight: 12 },
    brandRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
    logoBadge: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: c.card,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: c.border,
      elevation: 1,
      shadowColor: "#0F172A",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4
    },
    brand: {
      color: c.primary,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 1.4,
      textTransform: "uppercase"
    },
    title: { color: c.text, fontSize: 28, fontWeight: "800", letterSpacing: -0.5, lineHeight: 34 },
    subtitle: { color: c.muted, fontSize: 14, marginTop: 6, lineHeight: 21 },
    footer: {
      marginTop: 20,
      width: "100%",
      alignSelf: "stretch",
      gap: 10
    },
    card: {
      backgroundColor: c.card,
      borderRadius: 20,
      padding: 18,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: 14,
      gap: 12,
      elevation: 4,
      shadowColor: "#0F172A",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.07,
      shadowRadius: 16
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
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 13,
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
      borderRadius: 14,
      paddingVertical: 15,
      paddingHorizontal: 16,
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "stretch",
      minHeight: 50,
      marginTop: 4,
      elevation: 3,
      shadowColor: c.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.28,
      shadowRadius: 10
    },
    primaryBtnPressed: { backgroundColor: c.primaryPressed },
    secondaryBtn: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 14,
      paddingVertical: 15,
      paddingHorizontal: 16,
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "stretch",
      minHeight: 50,
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
    segmentWrap: {
      backgroundColor: c.inset,
      borderRadius: 14,
      padding: 4,
      borderWidth: 1,
      borderColor: c.border,
      overflow: "hidden"
    },
    segmentRow: { flexDirection: "row", gap: 4 },
    segment: {
      flex: 1,
      borderRadius: 10,
      paddingVertical: 10,
      alignItems: "center",
      backgroundColor: "transparent",
      overflow: "hidden"
    },
    segmentActive: {
      backgroundColor: c.card,
      elevation: 1,
      shadowColor: "#0F172A",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      overflow: "hidden"
    },
    segmentText: { color: c.muted, fontWeight: "600", fontSize: 13 },
    segmentTextActive: { color: c.primary, fontWeight: "700" },
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
      backgroundColor: c.card,
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: 10,
      elevation: 2,
      shadowColor: "#0F172A",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.06,
      shadowRadius: 10
    },
    listCardPressed: { opacity: 0.94, transform: [{ scale: 0.995 }] },
    listCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
    listCardTitle: { color: c.text, fontSize: 17, fontWeight: "800", letterSpacing: -0.2 },
    listCardSubtitle: { color: c.muted, fontSize: 14, marginTop: 4, lineHeight: 20 },
    listCardMetaWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
    metaChip: {
      backgroundColor: c.chip,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: c.border,
      overflow: "hidden"
    },
    metaChipText: { color: c.chipText, fontSize: 11, fontWeight: "600" },
    badge: {
      backgroundColor: c.primarySoft,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: c.border,
      overflow: "hidden"
    },
    badgeText: { color: c.accentText, fontSize: 10, fontWeight: "800", letterSpacing: 0.3 },
    roleBadgeTalent: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
      borderWidth: 1,
      backgroundColor: "#E8F4FD",
      borderColor: "#B3D9F7",
      overflow: "hidden"
    },
    roleBadgeTalentText: { color: "#1565C0", fontSize: 10, fontWeight: "800", letterSpacing: 0.3 },
    roleBadgeEmployer: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
      borderWidth: 1,
      backgroundColor: "#FFF4E5",
      borderColor: "#FFD699",
      overflow: "hidden"
    },
    roleBadgeEmployerText: { color: "#B45309", fontSize: 10, fontWeight: "800", letterSpacing: 0.3 },
    roleBadgeNeutral: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
      borderWidth: 1,
      backgroundColor: c.chip,
      borderColor: c.border,
      overflow: "hidden"
    },
    roleBadgeNeutralText: { color: c.chipText, fontSize: 10, fontWeight: "800", letterSpacing: 0.3 },
    tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" },
    tagChip: {
      backgroundColor: c.chip,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: c.border
    },
    tagChipText: { color: c.chipText, fontSize: 12, fontWeight: "600" },
    empty: {
      padding: 32,
      alignItems: "center",
      borderRadius: 20,
      borderWidth: 1,
      borderColor: c.border,
      borderStyle: "dashed",
      backgroundColor: c.inset,
      gap: 12
    },
    emptyIcon: {
      width: 52,
      height: 52,
      borderRadius: 26,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      overflow: "hidden"
    },
    emptyText: { color: c.muted, textAlign: "center", fontSize: 14, lineHeight: 22 },
    statPill: {
      flex: 1,
      backgroundColor: c.card,
      borderRadius: 16,
      padding: 14,
      paddingTop: 16,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: "center",
      overflow: "hidden",
      elevation: 1,
      shadowColor: "#0F172A",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 6
    },
    statAccent: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 3,
      backgroundColor: c.primary
    },
    statValue: { color: c.text, fontSize: 18, fontWeight: "800" },
    statLabel: { color: c.muted, fontSize: 11, marginTop: 4, fontWeight: "600" }
  });
}
