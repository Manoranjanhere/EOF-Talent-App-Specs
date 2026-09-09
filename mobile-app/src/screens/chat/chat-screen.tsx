import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { GroupId } from "@eof/shared";
import {
  Card,
  EmptyState,
  PrimaryButton,
  ScreenLayout,
  SecondaryButton,
  SectionTitle
} from "../../components/ui";
import { ChatUserAvatar } from "../../components/chat-user-avatar";
import { getMessagingStatus, listThreads } from "../../services/chat.service";
import type { ChatPushNotification } from "../../services/chat-socket";
import {
  listSubscriptionPlans,
  messagingPlanForRoles,
  purchasePlanWithPlayStore,
  talentSeriousPlanCode
} from "../../services/subscriptions.service";
import { useAuth } from "../../state/auth-context";
import { useChatSocket } from "../../state/chat-socket-context";
import { useChatUnread } from "../../state/chat-unread-context";
import { useTheme } from "../../theme/theme-context";
import type { ChatStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<ChatStackParamList, "ChatInbox">;

type ThreadRow = {
  id: string;
  otherUser?: {
    id: string;
    fullName: string;
    profilePhotoUrl?: string | null;
    profilePhotoObjectKey?: string | null;
  };
  lastMessage?: { messageText?: string; createdAt?: string; senderUserId?: string };
  unreadCount?: number;
  updatedAt?: string;
};

function formatRelativeTime(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function InboxRow({
  thread,
  onPress
}: {
  thread: ThreadRow;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const unread = (thread.unreadCount ?? 0) > 0;
  const name = thread.otherUser?.fullName || "Direct chat";
  const preview = thread.lastMessage?.messageText || "No messages yet";
  const time = formatRelativeTime(thread.lastMessage?.createdAt || thread.updatedAt);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        opacity: pressed ? 0.85 : 1
      })}
    >
      <ChatUserAvatar
        name={name}
        uri={thread.otherUser?.profilePhotoUrl}
        cacheKey={thread.otherUser?.profilePhotoObjectKey}
        size={56}
      />

      <View style={{ flex: 1, paddingRight: 8, marginLeft: 12 }}>
        <Text
          style={{
            color: colors.text,
            fontSize: 15,
            fontWeight: unread ? "800" : "600"
          }}
          numberOfLines={1}
        >
          {name}
        </Text>
        <Text
          style={{
            color: unread ? colors.text : colors.muted,
            fontSize: 14,
            marginTop: 3,
            fontWeight: unread ? "600" : "400"
          }}
          numberOfLines={1}
        >
          {preview}
        </Text>
      </View>

      <View style={{ alignItems: "flex-end", gap: 6, minWidth: 36 }}>
        <Text style={{ color: colors.muted, fontSize: 12 }}>{time}</Text>
        {unread ? (
          <View
            style={{
              minWidth: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: colors.primary,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 5
            }}
          >
            <Text style={{ color: colors.primaryOn, fontSize: 11, fontWeight: "800" }}>
              {(thread.unreadCount ?? 0) > 99 ? "99+" : thread.unreadCount}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

export function ChatScreen({ navigation }: Props) {
  const { accessToken, user } = useAuth();
  const { colors } = useTheme();
  const { connected: socketConnected } = useChatSocket();
  const { refreshUnread } = useChatUnread();
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [messagingActive, setMessagingActive] = useState(true);
  const [hasTalentMessaging, setHasTalentMessaging] = useState(true);
  const [hasEmployerMessaging, setHasEmployerMessaging] = useState(true);
  const [seriousAboutJob, setSeriousAboutJob] = useState(false);
  const [messagingPlanId, setMessagingPlanId] = useState<string | null>(null);
  const [messagingPlanCode, setMessagingPlanCode] = useState("MSG_EMPLOYER_300");
  const [planPrice, setPlanPrice] = useState(300);
  const [seriousPlanId, setSeriousPlanId] = useState<string | null>(null);
  const [employerPlanId, setEmployerPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  const isEmployer = (user?.roles ?? []).includes(GroupId.TalentEmployerOrAgency);
  const isTalent = (user?.roles ?? []).includes(GroupId.Talent);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const [status, inbox, plans] = await Promise.all([
        getMessagingStatus(accessToken),
        listThreads(accessToken),
        listSubscriptionPlans()
      ]);
      setMessagingActive(Boolean(status.active));
      setHasTalentMessaging(Boolean(status.hasTalentMessaging ?? status.active));
      setHasEmployerMessaging(Boolean(status.hasEmployerMessaging));
      setSeriousAboutJob(Boolean(status.seriousAboutJob));
      setThreads(inbox as ThreadRow[]);
      await refreshUnread();
      const employerPlan = plans.find((p) => p.code === "MSG_EMPLOYER_300");
      const talentMsg = plans.find((p) => p.code === "MSG_MEMBER_100");
      const serious = plans.find((p) => p.code === talentSeriousPlanCode());
      setEmployerPlanId(employerPlan?.id ?? null);
      if (isTalent) {
        setMessagingPlanId(talentMsg?.id ?? null);
        setMessagingPlanCode(talentMsg?.code ?? "MSG_MEMBER_100");
        setPlanPrice(talentMsg?.monthlyPriceInr ?? 100);
        setSeriousPlanId(serious?.id ?? null);
      } else {
        setMessagingPlanId(employerPlan?.id ?? null);
        setMessagingPlanCode(employerPlan?.code ?? messagingPlanForRoles(user?.roles ?? []));
        setPlanPrice(employerPlan?.monthlyPriceInr ?? 300);
      }
    } catch (error) {
      Alert.alert("Error", (error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [accessToken, user?.roles, isEmployer, isTalent, refreshUnread]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const { onPushNotification } = useChatSocket();

  useEffect(() => {
    return onPushNotification((payload: ChatPushNotification) => {
      if (payload.type !== "CHAT_MESSAGE") return;
      setThreads((prev) => {
        const idx = prev.findIndex((t) => t.id === payload.threadId);
        if (idx === -1) {
          void load();
          return prev;
        }
        const thread = { ...prev[idx] };
        thread.lastMessage = payload.message;
        thread.unreadCount = (thread.unreadCount ?? 0) + 1;
        const rest = prev.filter((_, i) => i !== idx);
        return [thread, ...rest];
      });
      void refreshUnread();
    });
  }, [onPushNotification, load, refreshUnread]);

  const onPurchaseMessaging = async () => {
    if (!accessToken || !messagingPlanId) {
      Alert.alert("Unavailable", "Messaging plan is not configured.");
      return;
    }
    try {
      setPurchasing(true);
      await purchasePlanWithPlayStore(accessToken, {
        id: messagingPlanId,
        code: messagingPlanCode,
        isJobPostingPlan: false
      });
      Alert.alert(
        "Messaging activated",
        `Google Play payment confirmed. You can message talent for 30 days (₹${planPrice}/month).`
      );
      await load();
    } catch (error) {
      Alert.alert("Purchase failed", (error as Error).message);
    } finally {
      setPurchasing(false);
    }
  };

  const onPurchaseEmployerMessaging = async () => {
    if (!accessToken || !employerPlanId) {
      Alert.alert("Unavailable", "Employer messaging plan is not configured.");
      return;
    }
    try {
      setPurchasing(true);
      await purchasePlanWithPlayStore(accessToken, {
        id: employerPlanId,
        code: "MSG_EMPLOYER_300",
        isJobPostingPlan: false
      });
      Alert.alert(
        "Messaging activated",
        "Google Play payment confirmed. Two job slots are included for 90 days."
      );
      await load();
    } catch (error) {
      Alert.alert("Purchase failed", (error as Error).message);
    } finally {
      setPurchasing(false);
    }
  };

  const onPurchaseSerious = async () => {
    if (!accessToken || !seriousPlanId) {
      Alert.alert("Unavailable", "Serious about job plan is not configured.");
      return;
    }
    try {
      setPurchasing(true);
      await purchasePlanWithPlayStore(accessToken, {
        id: seriousPlanId,
        code: talentSeriousPlanCode(),
        isJobPostingPlan: false
      });
      Alert.alert(
        "Serious about job",
        "Messaging is included and the Serious about job badge is now on your profile."
      );
      await load();
    } catch (error) {
      Alert.alert("Purchase failed", (error as Error).message);
    } finally {
      setPurchasing(false);
    }
  };

  const openThread = (thread: ThreadRow) => {
    navigation.navigate("ChatConversation", {
      threadId: thread.id,
      recipientName: thread.otherUser?.fullName || "Chat",
      recipientUserId: thread.otherUser?.id,
      recipientPhotoUrl: thread.otherUser?.profilePhotoUrl,
      recipientPhotoObjectKey: thread.otherUser?.profilePhotoObjectKey
    });
  };

  const showSerious = isTalent && !seriousAboutJob;
  const showTalentMsg = isTalent && !hasTalentMessaging && !hasEmployerMessaging;
  const showEmployerPlan = isEmployer && !hasEmployerMessaging;
  const showSubscriptionGate = showSerious || showTalentMsg || showEmployerPlan;

  return (
    <ScreenLayout
      title="Messages"
      subtitle={
        messagingActive
          ? socketConnected
            ? "Private, in-app."
            : "Connecting…"
          : isTalent
            ? "Messaging ₹100 · Serious about job ₹200"
            : "₹300/month · includes 2 job slots"
      }
      headerStyle="slim"
    >
      {showSubscriptionGate ? (
        <Card>
          <SectionTitle title="Choose a plan" />
          {showSerious || showTalentMsg ? (
            <>
              <Text style={{ color: colors.muted, fontSize: 13, marginBottom: 10 }}>
                Messaging (₹100) is talent-to-talent, including in-app job referrals. Serious about job (₹200) includes messaging, employer chat, and a public badge.
              </Text>
              {showSerious ? (
                <PrimaryButton
                  title={purchasing ? "Purchasing..." : "Serious about job · ₹200/month"}
                  onPress={onPurchaseSerious}
                  disabled={purchasing || !seriousPlanId}
                />
              ) : null}
              {showTalentMsg ? (
                <SecondaryButton
                  title={purchasing ? "Purchasing..." : "Messaging only · ₹100/month"}
                  onPress={onPurchaseMessaging}
                  disabled={purchasing || !messagingPlanId}
                />
              ) : null}
            </>
          ) : null}
          {showEmployerPlan ? (
            <>
              <Text style={{ color: colors.muted, fontSize: 13, marginBottom: 10, marginTop: isTalent ? 12 : 0 }}>
                Employers: messaging is ₹300/month and includes 2 free job slots.
              </Text>
              <PrimaryButton
                title={purchasing ? "Purchasing..." : "Employer messaging · ₹300/month"}
                onPress={onPurchaseEmployerMessaging}
                disabled={purchasing || !employerPlanId}
              />
            </>
          ) : null}
        </Card>
      ) : null}

      <Card style={{ paddingTop: 8, paddingBottom: 4 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 4
          }}
        >
          <SectionTitle title="Inbox" />
          <SecondaryButton title="Refresh" onPress={load} />
        </View>

        {threads.length === 0 ? (
          <EmptyState
            message={
              loading
                ? "Loading conversations..."
                : "No messages yet. Message someone from their profile."
            }
          />
        ) : (
          threads.map((thread) => (
            <InboxRow key={thread.id} thread={thread} onPress={() => openThread(thread)} />
          ))
        )}
      </Card>
    </ScreenLayout>
  );
}
