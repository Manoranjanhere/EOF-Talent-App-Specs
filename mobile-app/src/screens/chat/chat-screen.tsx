import React, { useCallback, useEffect, useState } from "react";
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
  purchasePlanWithPlayStore
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
              backgroundColor: "#0095F6",
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 5
            }}
          >
            <Text style={{ color: "#fff", fontSize: 11, fontWeight: "800" }}>
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
  const [isTalentFree, setIsTalentFree] = useState(false);
  const [messagingPlanId, setMessagingPlanId] = useState<string | null>(null);
  const [messagingPlanCode, setMessagingPlanCode] = useState("MSG_EMPLOYER_300");
  const [planPrice, setPlanPrice] = useState(300);
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
        isEmployer && !isTalent ? listSubscriptionPlans() : Promise.resolve([])
      ]);
      setMessagingActive(Boolean(status.active));
      setIsTalentFree(Boolean((status as { isTalentFree?: boolean }).isTalentFree));
      setThreads(inbox as ThreadRow[]);
      await refreshUnread();
      if (isEmployer && !isTalent) {
        const planCode = messagingPlanForRoles(user?.roles ?? []);
        const plan = plans.find((p) => p.code === planCode);
        setMessagingPlanId(plan?.id ?? null);
        setMessagingPlanCode(plan?.code ?? planCode);
        setPlanPrice(plan?.monthlyPriceInr ?? 300);
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

  const openThread = (thread: ThreadRow) => {
    navigation.navigate("ChatConversation", {
      threadId: thread.id,
      recipientName: thread.otherUser?.fullName || "Chat",
      recipientUserId: thread.otherUser?.id,
      recipientPhotoUrl: thread.otherUser?.profilePhotoUrl,
      recipientPhotoObjectKey: thread.otherUser?.profilePhotoObjectKey
    });
  };

  const showSubscriptionGate = !messagingActive && isEmployer && !isTalent;

  return (
    <ScreenLayout
      title="Messages"
      subtitle={
        isTalentFree
          ? socketConnected
            ? "Free messaging for talent"
            : "Connecting…"
          : socketConnected
            ? "₹300/month · employers & agencies"
            : "Connecting…"
      }
    >
      {showSubscriptionGate ? (
        <Card>
          <SectionTitle title="Messaging subscription" />
          <Text style={{ color: colors.muted, fontSize: 13, marginBottom: 10 }}>
            Employers and agencies need an active subscription to message talent.
          </Text>
          <PrimaryButton
            title={purchasing ? "Purchasing..." : `Subscribe · ₹${planPrice}/month`}
            onPress={onPurchaseMessaging}
            disabled={purchasing || !messagingPlanId}
          />
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
