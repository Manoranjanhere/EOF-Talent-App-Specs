import React, { useEffect, useState } from "react";
import { Alert, View } from "react-native";
import {
  Card,
  DangerButton,
  EmptyState,
  LabeledInput,
  ListCard,
  PrimaryButton,
  ScreenLayout,
  SecondaryButton,
  SectionTitle
} from "../../components/ui";
import { blockUser, listThreads, markThreadSeen, sendMessage } from "../../services/chat.service";
import { useAuth } from "../../state/auth-context";

export function ChatScreen() {
  const { accessToken } = useAuth();
  const [threads, setThreads] = useState<any[]>([]);
  const [threadId, setThreadId] = useState("");
  const [messageText, setMessageText] = useState("");
  const [blockedUserId, setBlockedUserId] = useState("");
  const [loading, setLoading] = useState(false);

  const loadThreads = async () => {
    if (!accessToken) return;
    try {
      const result = await listThreads(accessToken);
      setThreads(result as any[]);
    } catch (error) {
      Alert.alert("Error", (error as Error).message);
    }
  };

  useEffect(() => {
    void loadThreads();
  }, [accessToken]);

  const onSend = async () => {
    if (!accessToken || !threadId || !messageText.trim()) return;
    try {
      setLoading(true);
      await sendMessage(accessToken, threadId, messageText.trim());
      setMessageText("");
      await markThreadSeen(accessToken, threadId);
      await loadThreads();
    } catch (error) {
      Alert.alert("Error", (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const onBlock = async () => {
    if (!accessToken || !blockedUserId) return;
    try {
      await blockUser(accessToken, blockedUserId, "Blocked from mobile app");
      Alert.alert("Done", "User has been blocked.");
      setBlockedUserId("");
    } catch (error) {
      Alert.alert("Error", (error as Error).message);
    }
  };

  return (
    <ScreenLayout title="Messages" subtitle="Chat with members · block and read receipts">
      <Card>
        <SectionTitle title="Send message" />
        <LabeledInput label="Thread ID" value={threadId} onChangeText={setThreadId} placeholder="Thread UUID" />
        <LabeledInput
          label="Message"
          value={messageText}
          onChangeText={setMessageText}
          placeholder="Type your message..."
          multiline
        />
        <PrimaryButton title="Send & mark seen" onPress={onSend} loading={loading} disabled={loading} />
      </Card>

      <Card>
        <SectionTitle title="Block user" />
        <LabeledInput
          label="User ID to block"
          value={blockedUserId}
          onChangeText={setBlockedUserId}
          placeholder="User UUID"
        />
        <DangerButton title="Block user" onPress={onBlock} />
      </Card>

      <Card>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <SectionTitle title="Inbox" />
          <SecondaryButton title="Refresh" onPress={loadThreads} />
        </View>
        {threads.length === 0 ? (
          <EmptyState message="No conversations yet." />
        ) : (
          threads.map((thread) => (
            <ListCard
              key={thread.id}
              title={thread.title || "Direct chat"}
              subtitle={
                thread.messages?.[0]?.messageText
                  ? String(thread.messages[0].messageText)
                  : "No messages yet"
              }
              meta={[`Thread: ${thread.id}`]}
              onPress={() => setThreadId(thread.id)}
              badge="CHAT"
            />
          ))
        )}
      </Card>
    </ScreenLayout>
  );
}
