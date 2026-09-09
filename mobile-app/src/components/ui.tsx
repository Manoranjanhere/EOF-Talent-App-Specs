import { useMemo, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { AppColors } from "../theme/colors";
import { useTheme } from "../theme/theme-context";
import { fonts } from "../theme/typography";
import { AppLogoIcon, EyeIcon, EyeOffIcon, FilterIcon, StarIcon } from "./icons";
import { AppText } from "./app-text";

function useStyles() {
  const { colors: c } = useTheme();
  return useMemo(() => createStyles(c), [c]);
}

export function ScreenLayout({
  title,
  subtitle,
  children,
  footer,
  headerRight,
  headerStyle = "full",
  showTitle = true
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  headerRight?: ReactNode;
  headerStyle?: "full" | "slim";
  showTitle?: boolean;
}) {
  const { colors: c } = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={c.heroFrom} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[c.heroFrom, c.heroTo]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.headerBand,
            headerStyle === "slim" && styles.headerBandSlim,
            { paddingTop: Math.max(insets.top, 8) + (headerStyle === "slim" ? 2 : 4) }
          ]}
        >
          <View style={styles.headerGoldLine} />
          <View style={styles.headerRow}>
            <View style={styles.headerText}>
              <View style={[styles.brandRow, headerStyle === "slim" && { marginBottom: showTitle ? 6 : 0 }]}>
                <View style={styles.logoBadge}>
                  <AppLogoIcon size={headerStyle === "slim" ? 18 : 22} />
                </View>
                <View>
                  <Text style={styles.brand}>EOF Talent</Text>
                  {headerStyle === "full" ? <Text style={styles.brandTag}>Casting marketplace</Text> : null}
                </View>
              </View>
              {showTitle ? (
                <>
                  <Text style={[styles.title, headerStyle === "slim" && styles.titleSlim]}>{title}</Text>
                  {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
                </>
              ) : null}
            </View>
            {headerRight}
          </View>
        </LinearGradient>
        <View style={styles.body}>{children}</View>
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function Card({
  children,
  style
}: {
  children: ReactNode;
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

function badgeKind(badge?: string): "ok" | "warn" | "bad" | "gold" | "default" {
  const value = (badge ?? "").toUpperCase();
  if (["HIRED", "VERIFIED", "LIVE", "ACTIVE"].includes(value)) return "ok";
  if (["REJECTED", "BLOCKED"].includes(value)) return "bad";
  if (["PENDING", "REVIEWING", "INVITED"].includes(value)) return "gold";
  if (["APPLIED", "SHORTLIST", "SHORTLISTED"].includes(value)) return "warn";
  return "default";
}

function badgeStyleFor(badge: string, styles: ReturnType<typeof createStyles>) {
  const kind = badgeKind(badge);
  if (kind === "ok") return styles.badgeOk;
  if (kind === "bad") return styles.badgeBad;
  if (kind === "gold") return styles.badgeGold;
  if (kind === "warn") return styles.badgeWarn;
  return null;
}

function badgeTextStyleFor(badge: string, styles: ReturnType<typeof createStyles>) {
  const kind = badgeKind(badge);
  if (kind === "ok") return styles.badgeOkText;
  if (kind === "bad") return styles.badgeBadText;
  if (kind === "gold") return styles.badgeGoldText;
  if (kind === "warn") return styles.badgeWarnText;
  return null;
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
      <View
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          backgroundColor: c.gold
        }}
      />
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
            <View style={[styles.badge, badgeStyleFor(badge, styles)]}>
              <Text style={[styles.badgeText, badgeTextStyleFor(badge, styles)]}>{badge}</Text>
            </View>
          ) : null}
          {onPress ? (
            <Text style={{ color: c.gold, fontSize: 22, fontWeight: "300", marginTop: -2, fontFamily: fonts.serif }}>›</Text>
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
            <StarIcon
              size={32}
              color={active ? c.gold : c.border}
              filled={active}
            />
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
      <View style={[styles.emptyIcon, { backgroundColor: c.goldSoft, borderColor: c.gold }]}>
        <AppText style={{ color: c.goldText, fontFamily: fonts.serifBold, fontSize: 28, lineHeight: 32 }}>
          E
        </AppText>
      </View>
      <AppText style={styles.emptyText}>{message}</AppText>
    </View>
  );
}

export function SelectableChip({
  label,
  selected,
  disabled,
  onPress
}: {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  const { colors: c } = useTheme();
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={{
        opacity: disabled ? 0.4 : 1,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: selected ? c.primary : c.border,
        backgroundColor: selected ? c.primarySoft : c.inset
      }}
    >
      <AppText
        variant="meta"
        style={{ color: selected ? c.accentText : c.text, fontFamily: selected ? fonts.sansBold : fonts.sansMedium }}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

export function FilterDisclosure({
  title,
  open,
  onToggle,
  children,
  summary
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
  summary?: string;
}) {
  const { colors: c } = useTheme();

  return (
    <View
      style={{
        backgroundColor: c.card,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: c.border,
        overflow: "hidden",
        marginBottom: 4
      }}
    >
      <Pressable
        onPress={onToggle}
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 14,
          gap: 12
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            backgroundColor: c.goldSoft,
            borderWidth: 1,
            borderColor: c.gold,
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <FilterIcon color={c.goldText} size={18} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.text, fontFamily: fonts.sansBold, fontSize: 15, fontWeight: "700" }}>
            {title}
          </Text>
          {summary ? (
            <Text style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 12, marginTop: 2 }}>
              {summary}
            </Text>
          ) : null}
        </View>
        <Text style={{ color: c.gold, fontFamily: fonts.serifBold, fontSize: 20 }}>
          {open ? "–" : "+"}
        </Text>
      </Pressable>
      {open ? <View style={{ paddingHorizontal: 16, paddingBottom: 16, gap: 12 }}>{children}</View> : null}
    </View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    scroll: { flexGrow: 1, paddingBottom: 48 },
    headerBand: {
      paddingHorizontal: 22,
      paddingBottom: 18,
      marginBottom: 2,
      overflow: "hidden",
      borderBottomLeftRadius: 28,
      borderBottomRightRadius: 28
    },
    headerBandSlim: {
      paddingBottom: 12,
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20
    },
    headerGoldLine: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 3,
      backgroundColor: c.gold
    },
    headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
    headerText: { flex: 1, paddingRight: 12 },
    brandRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
    logoBadge: {
      width: 34,
      height: 34,
      borderRadius: 12,
      backgroundColor: "rgba(255,251,247,0.1)",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: "rgba(198,163,106,0.45)"
    },
    brand: {
      color: c.gold,
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 2.4,
      textTransform: "uppercase",
      fontFamily: fonts.sansBold
    },
    brandTag: {
      color: c.heroMuted,
      fontSize: 12,
      marginTop: 2,
      letterSpacing: 0.2,
      fontFamily: fonts.serifItalic
    },
    title: {
      color: c.heroText,
      fontSize: 34,
      fontWeight: "700",
      letterSpacing: -0.7,
      lineHeight: 38,
      fontFamily: fonts.serifBold
    },
    titleSlim: {
      fontSize: 24,
      lineHeight: 28
    },
    subtitle: {
      color: c.heroMuted,
      fontSize: 14,
      marginTop: 8,
      lineHeight: 21,
      fontFamily: fonts.sans
    },
    body: { paddingHorizontal: 20, paddingTop: 18, gap: 14 },
    footer: {
      marginTop: 8,
      paddingHorizontal: 20,
      width: "100%",
      alignSelf: "stretch",
      gap: 10,
      paddingBottom: 8
    },
    card: {
      backgroundColor: c.card,
      borderRadius: 22,
      padding: 18,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: 4,
      gap: 12,
      elevation: 3,
      shadowColor: c.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 18
    },
    sectionTitle: {
      color: c.text,
      fontSize: 13,
      fontWeight: "700",
      letterSpacing: 1.2,
      textTransform: "uppercase",
      marginBottom: 2,
      fontFamily: fonts.sansBold
    },
    field: { gap: 6 },
    label: {
      color: c.muted,
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 1,
      textTransform: "uppercase",
      fontFamily: fonts.sansBold
    },
    hint: { color: c.muted, fontSize: 12, fontFamily: fonts.sans },
    inputWrap: { position: "relative", justifyContent: "center" },
    input: {
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.inputBg,
      color: c.text,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 14,
      fontSize: 16,
      fontFamily: fonts.sans
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
      borderRadius: 16,
      paddingVertical: 15,
      paddingHorizontal: 16,
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "stretch",
      minHeight: 52,
      marginTop: 4,
      elevation: 3,
      shadowColor: c.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.28,
      shadowRadius: 12
    },
    primaryBtnPressed: { backgroundColor: c.primaryPressed },
    secondaryBtn: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      paddingVertical: 15,
      paddingHorizontal: 16,
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "stretch",
      minHeight: 52,
      backgroundColor: c.card
    },
    secondaryBtnPressed: { backgroundColor: c.inset },
    dangerBtn: {
      backgroundColor: c.dangerSoft,
      borderWidth: 1,
      borderColor: c.danger,
      borderRadius: 16,
      paddingVertical: 14,
      paddingHorizontal: 16,
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "stretch",
      minHeight: 50
    },
    dangerBtnText: { color: c.danger, fontWeight: "700", fontFamily: fonts.sansBold },
    btnDisabled: { opacity: 0.55 },
    primaryBtnText: {
      color: c.primaryOn,
      fontSize: 16,
      fontWeight: "700",
      letterSpacing: 0.2,
      fontFamily: fonts.sansBold
    },
    secondaryBtnText: { color: c.text, fontSize: 15, fontWeight: "700", fontFamily: fonts.sansBold },
    linkBtn: { paddingVertical: 10 },
    linkBtnText: { color: c.accentText, fontSize: 15, fontWeight: "700", fontFamily: fonts.sansBold },
    segmentWrap: {
      backgroundColor: c.inset,
      borderRadius: 16,
      padding: 4,
      borderWidth: 1,
      borderColor: c.border,
      overflow: "hidden"
    },
    segmentRow: { flexDirection: "row", gap: 4 },
    segment: {
      flex: 1,
      borderRadius: 12,
      paddingVertical: 10,
      alignItems: "center",
      backgroundColor: "transparent",
      overflow: "hidden"
    },
    segmentActive: {
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.gold,
      elevation: 1,
      shadowColor: c.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      overflow: "hidden"
    },
    segmentText: { color: c.muted, fontWeight: "600", fontSize: 13, fontFamily: fonts.sansSemi },
    segmentTextActive: { color: c.accentText, fontWeight: "700", fontFamily: fonts.sansBold },
    roleCard: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      padding: 14,
      backgroundColor: c.inset
    },
    roleCardActive: { borderColor: c.gold, backgroundColor: c.goldSoft },
    roleTitle: { color: c.text, fontSize: 18, fontWeight: "700", fontFamily: fonts.serifBold },
    roleTitleActive: { color: c.goldText },
    roleDesc: { color: c.muted, fontSize: 13, marginTop: 4, fontFamily: fonts.sans },
    listCard: {
      backgroundColor: c.card,
      borderRadius: 20,
      padding: 16,
      paddingLeft: 18,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: 10,
      overflow: "hidden",
      elevation: 2,
      shadowColor: c.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.07,
      shadowRadius: 12
    },
    listCardPressed: { opacity: 0.94, transform: [{ scale: 0.995 }] },
    listCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
    listCardTitle: {
      color: c.text,
      fontSize: 20,
      fontWeight: "700",
      letterSpacing: -0.3,
      fontFamily: fonts.serifBold
    },
    listCardSubtitle: { color: c.muted, fontSize: 14, marginTop: 4, lineHeight: 20, fontFamily: fonts.sans },
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
    metaChipText: { color: c.chipText, fontSize: 11, fontWeight: "600", fontFamily: fonts.sansSemi },
    badge: {
      backgroundColor: c.primarySoft,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: c.border,
      overflow: "hidden"
    },
    badgeText: {
      color: c.accentText,
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 0.4,
      fontFamily: fonts.sansBold
    },
    badgeOk: { backgroundColor: c.primarySoft, borderColor: c.success },
    badgeOkText: { color: c.success },
    badgeBad: { backgroundColor: c.dangerSoft, borderColor: c.danger },
    badgeBadText: { color: c.danger },
    badgeGold: { backgroundColor: c.goldSoft, borderColor: c.gold },
    badgeGoldText: { color: c.goldText },
    badgeWarn: { backgroundColor: c.goldSoft, borderColor: c.warning },
    badgeWarnText: { color: c.warning },
    roleBadgeTalent: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
      borderWidth: 1,
      backgroundColor: c.primarySoft,
      borderColor: c.border,
      overflow: "hidden"
    },
    roleBadgeTalentText: { color: c.accentText, fontSize: 10, fontWeight: "800", letterSpacing: 0.3 },
    roleBadgeEmployer: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
      borderWidth: 1,
      backgroundColor: c.goldSoft,
      borderColor: c.gold,
      overflow: "hidden"
    },
    roleBadgeEmployerText: { color: c.goldText, fontSize: 10, fontWeight: "800", letterSpacing: 0.3 },
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
      backgroundColor: c.goldSoft,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: c.gold
    },
    tagChipText: { color: c.goldText, fontSize: 12, fontWeight: "700", fontFamily: fonts.sansBold },
    empty: {
      padding: 32,
      alignItems: "center",
      borderRadius: 22,
      borderWidth: 1,
      borderColor: c.border,
      borderStyle: "dashed",
      backgroundColor: c.inset,
      gap: 12
    },
    emptyIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      overflow: "hidden"
    },
    emptyText: {
      color: c.muted,
      textAlign: "center",
      fontSize: 15,
      lineHeight: 22,
      fontFamily: fonts.serifItalic
    }
  });
}
