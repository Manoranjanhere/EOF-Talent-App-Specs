import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ChatScreen } from "../screens/chat/chat-screen";
import { ChatConversationScreen } from "../screens/chat/chat-conversation-screen";
import type { ChatStackParamList } from "./types";

const ChatStack = createNativeStackNavigator<ChatStackParamList>();

export function ChatStackNavigator() {
  return (
    <ChatStack.Navigator screenOptions={{ headerShown: false }}>
      <ChatStack.Screen name="ChatInbox" component={ChatScreen} />
      <ChatStack.Screen name="ChatConversation" component={ChatConversationScreen} />
    </ChatStack.Navigator>
  );
}
