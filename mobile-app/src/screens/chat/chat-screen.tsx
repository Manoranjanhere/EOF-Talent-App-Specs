import React, { useEffect, useState } from "react";
import { Alert, Button, ScrollView, Text, TextInput, View } from "react-native";
import { blockUser, listThreads, markThreadSeen, sendMessage } from "../../services/chat.service";
import { useAuth } from "../../state/auth-context";

export function ChatScreen() {
  const { accessToken } = useAuth();
  const [threads, setThreads] = useState<any[]>([]);
  const [threadId, setThreadId] = useState("");
  const [messageText, setMessageText] = useState("");
  const [blockedUserId, setBlockedUserId] = useState("");

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
    if (!accessToken || !threadId || !messageText) return;
    try {
      await sendMessage(accessToken, threadId, messageText);
      setMessageText("");
      await markThreadSeen(accessToken, threadId);
      await loadThreads();
    } catch (error) {
      Alert.alert("Error", (error as Error).message);
    }
  };

  const onBlock = async () => {
    if (!accessToken || !blockedUserId) return;
    try {
      await blockUser(accessToken, blockedUserId, "User blocked from app");
      Alert.alert("Done", "User blocked");
    } catch (error) {
      Alert.alert("Error", (error as Error).message);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
      <Text style={{ fontSize: 20, fontWeight: "700" }}>Chat</Text>
      <TextInput
        value={threadId}
        onChangeText={setThreadId}
        placeholder="Thread ID"
        style={{ borderWidth: 1, borderRadius: 8, padding: 10 }}
      />
      <TextInput
        value={messageText}
        onChangeText={setMessageText}
        placeholder="Message"
        style={{ borderWidth: 1, borderRadius: 8, padding: 10 }}
      />
      <Button title="Send message & mark seen" onPress={onSend} />
      <TextInput
        value={blockedUserId}
        onChangeText={setBlockedUserId}
        placeholder="Block user id"
        style={{ borderWidth: 1, borderRadius: 8, padding: 10 }}
      />
      <Button title="Block user" onPress={onBlock} />
      <Button title="Refresh threads" onPress={loadThreads} />

      {threads.map((thread) => (
        <View key={thread.id} style={{ borderWidth: 1, borderRadius: 10, padding: 10 }}>
          <Text style={{ fontWeight: "700" }}>{thread.title || "Direct Chat"}</Text>
          <Text>Thread: {thread.id}</Text>
          <Text>
            Last msg: {thread.messages?.[0]?.messageText ? String(thread.messages[0].messageText) : "No messages"}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}
