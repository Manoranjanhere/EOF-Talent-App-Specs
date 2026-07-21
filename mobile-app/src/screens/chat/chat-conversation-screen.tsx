import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronBackIcon, SendIcon } from "../../components/icons";
import {
  blockUser,
  getBlockStatus,
  listMessages,
  markThreadSeen,
  sendMessage,
  unblockUser
} from "../../services/chat.service";
import type { ChatRealtimeMessage, ThreadSeenEvent } from "../../services/chat-socket";
import { useAuth } from "../../state/auth-context";
import { useChatSocket, useChatThreadRealtime } from "../../state/chat-socket-context";
import { useChatUnread } from "../../state/chat-unread-context";
import { useTheme } from "../../theme/theme-context";
import type { ChatStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<ChatStackParamList, "ChatConversation">;

const IG_BLUE = "#0095F6";
const IG_SENT_LIGHT = "#EFEFEF";

function appendMessage(prev: ChatRealtimeMessage[], message: ChatRealtimeMessage) {
  if (prev.some((m) => m.id === message.id)) return prev;
  return [...prev, message];
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function MessageBubble({
  msg,
  mine,
  showSeen
}: {
  msg: ChatRealtimeMessage;
  mine: boolean;
  showSeen: boolean;
}) {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={{
        alignSelf: mine ? "flex-end" : "flex-start",
        maxWidth: "78%",
        marginBottom: 4,
        alignItems: mine ? "flex-end" : "flex-start"
      }}
    >
      <View
        style={{
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderRadius: 22,
          borderBottomRightRadius: mine ? 6 : 22,
          borderBottomLeftRadius: mine ? 22 : 6,
          backgroundColor: mine ? IG_BLUE : isDark ? colors.inset : IG_SENT_LIGHT,
          borderWidth: mine ? 0 : 1,
          borderColor: colors.border
        }}
      >
        <Text
          style={{
            color: mine ? "#fff" : colors.text,
            fontSize: 15,
            lineHeight: 20
          }}
        >
          {msg.messageText}
        </Text>
      </View>
      {mine && showSeen ? (
        <Text style={{ color: colors.muted, fontSize: 11, marginTop: 4, marginRight: 4 }}>
          {msg.isSeen ? "Seen" : "Delivered"}
        </Text>
      ) : null}
      {!mine ? (
        <Text style={{ color: colors.muted, fontSize: 10, marginTop: 3, marginLeft: 6 }}>
          {formatTime(msg.createdAt)}
        </Text>
      ) : null}
    </View>
  );
}

export function ChatConversationScreen({ route, navigation }: Props) {
  const { threadId, recipientName, recipientUserId } = route.params;
  const { accessToken, user } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { connected: socketConnected } = useChatSocket();
  const { refreshUnread } = useChatUnread();
  const scrollRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<ChatRealtimeMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  }, []);

  const loadMessages = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const [result, blockStatus] = await Promise.all([
        listMessages(accessToken, threadId),
        recipientUserId
          ? getBlockStatus(accessToken, recipientUserId).catch(() => ({ blockedByMe: false }))
          : Promise.resolve({ blockedByMe: false })
      ]);
      setMessages(result as ChatRealtimeMessage[]);
      setBlocked(Boolean((blockStatus as { blockedByMe?: boolean }).blockedByMe));
      await markThreadSeen(accessToken, threadId);
      await refreshUnread();
      scrollToBottom();
    } catch (error) {
      Alert.alert("Error", (error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [accessToken, threadId, recipientUserId, scrollToBottom, refreshUnread]);

  useFocusEffect(
    useCallback(() => {
      void loadMessages();
    }, [loadMessages])
  );

  useChatThreadRealtime(threadId, {
    onMessage: useCallback(
      (message: ChatRealtimeMessage) => {
        setMessages((prev) => appendMessage(prev, message));
        scrollToBottom();
        if (accessToken && message.senderUserId !== user?.id) {
          void markThreadSeen(accessToken, threadId).then(() => refreshUnread());
        }
      },
      [accessToken, threadId, user?.id, scrollToBottom, refreshUnread]
    ),
    onSeen: useCallback(
      (event: ThreadSeenEvent) => {
        if (event.userId === user?.id) return;
        setMessages((prev) =>
          prev.map((msg) => (msg.senderUserId === user?.id ? { ...msg, isSeen: true } : msg))
        );
      },
      [user?.id]
    )
  });

  const onSend = async () => {
    if (!accessToken || !messageText.trim() || blocked || sending) return;
    const text = messageText.trim();
    setMessageText("");
    try {
      setSending(true);
      await sendMessage(accessToken, threadId, text);
    } catch (error) {
      setMessageText(text);
      Alert.alert("Send failed", (error as Error).message);
    } finally {
      setSending(false);
    }
  };

  const onBlock = () => {
    if (!accessToken || !recipientUserId) return;
    setMenuOpen(false);
    Alert.alert("Block user?", `${recipientName || "This user"} won't be able to message you.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Block",
        style: "destructive",
        onPress: async () => {
          try {
            await blockUser(accessToken, recipientUserId, "Blocked from chat");
            setBlocked(true);
          } catch (error) {
            Alert.alert("Block failed", (error as Error).message);
          }
        }
      }
    ]);
  };

  const onUnblock = async () => {
    if (!accessToken || !recipientUserId) return;
    setMenuOpen(false);
    try {
      await unblockUser(accessToken, recipientUserId);
      setBlocked(false);
    } catch (error) {
      Alert.alert("Unblock failed", (error as Error).message);
    }
  };

  const lastOutgoingId = [...messages].reverse().find((m) => m.senderUserId === user?.id)?.id;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 4,
          paddingBottom: 10,
          paddingHorizontal: 12,
          flexDirection: "row",
          alignItems: "center",
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
          backgroundColor: colors.card
        }}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          style={{ padding: 6, marginRight: 4 }}
        >
          <ChevronBackIcon color={colors.text} size={26} />
        </Pressable>

        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.primarySoft,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 10
          }}
        >
          <Text style={{ color: colors.primary, fontWeight: "800", fontSize: 16 }}>
            {(recipientName || "?").slice(0, 1).toUpperCase()}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700" }} numberOfLines={1}>
            {recipientName || "Chat"}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 12 }}>
            {socketConnected ? "Active now" : "Connecting…"}
          </Text>
        </View>

        {recipientUserId ? (
          <Pressable onPress={() => setMenuOpen((v) => !v)} hitSlop={12} style={{ padding: 8 }}>
            <Text style={{ color: colors.text, fontSize: 22, fontWeight: "700" }}>⋯</Text>
          </Pressable>
        ) : null}
      </View>

      {menuOpen && recipientUserId ? (
        <View
          style={{
            position: "absolute",
            top: insets.top + 52,
            right: 12,
            zIndex: 20,
            backgroundColor: colors.card,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            overflow: "hidden",
            elevation: 8,
            shadowColor: "#000",
            shadowOpacity: 0.12,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 }
          }}
        >
          <Pressable
            onPress={blocked ? onUnblock : onBlock}
            style={{ paddingHorizontal: 16, paddingVertical: 12 }}
          >
            <Text style={{ color: blocked ? colors.primary : colors.danger, fontWeight: "600" }}>
              {blocked ? "Unblock" : "Block"}
            </Text>
          </Pressable>
        </View>
      ) : null}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 14,
            paddingVertical: 16,
            flexGrow: 1,
            justifyContent: messages.length === 0 ? "center" : "flex-end"
          }}
          onContentSizeChange={scrollToBottom}
          keyboardShouldPersistTaps="handled"
        >
          {loading && messages.length === 0 ? (
            <Text style={{ color: colors.muted, textAlign: "center" }}>Loading…</Text>
          ) : messages.length === 0 ? (
            <View style={{ alignItems: "center", gap: 8 }}>
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  backgroundColor: colors.primarySoft,
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <Text style={{ fontSize: 28, color: colors.primary }}>
                  {(recipientName || "?").slice(0, 1).toUpperCase()}
                </Text>
              </View>
              <Text style={{ color: colors.text, fontWeight: "700", fontSize: 16 }}>
                {recipientName}
              </Text>
              <Text style={{ color: colors.muted, fontSize: 13 }}>Say hello 👋</Text>
            </View>
          ) : (
            messages.map((msg) => {
              const mine = msg.senderUserId === user?.id;
              return (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  mine={mine}
                  showSeen={mine && msg.id === lastOutgoingId}
                />
              );
            })
          )}
        </ScrollView>

        {/* Composer */}
        <View
          style={{
            paddingHorizontal: 12,
            paddingTop: 8,
            paddingBottom: Math.max(insets.bottom, 10),
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: colors.border,
            backgroundColor: colors.card
          }}
        >
          {blocked ? (
            <Text style={{ color: colors.muted, textAlign: "center", paddingVertical: 12, fontSize: 13 }}>
              You blocked this user. Unblock from ⋯ menu to message again.
            </Text>
          ) : (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 24,
                paddingLeft: 16,
                paddingRight: 6,
                paddingVertical: 6,
                backgroundColor: colors.inset
              }}
            >
              <TextInput
                value={messageText}
                onChangeText={setMessageText}
                placeholder="Message…"
                placeholderTextColor={colors.muted}
                multiline
                maxLength={2000}
                style={{
                  flex: 1,
                  maxHeight: 100,
                  minHeight: 36,
                  paddingVertical: 8,
                  fontSize: 16,
                  color: colors.text,
                  lineHeight: 20
                }}
              />
              <Pressable
                onPress={onSend}
                disabled={!messageText.trim() || sending}
                hitSlop={8}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: messageText.trim() ? IG_BLUE : colors.border,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: sending ? 0.6 : 1
                }}
              >
                <SendIcon color="#fff" size={18} />
              </Pressable>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
