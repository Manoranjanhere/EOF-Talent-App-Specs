import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ChatScreen } from "../screens/chat/chat-screen";
import { ChatConversationScreen } from "../screens/chat/chat-conversation-screen";
import { MemberProfileScreen } from "../screens/search/member-profile-screen";
import { MemberAlbumScreen } from "../screens/search/member-album-screen";
import type { ChatStackParamList } from "./types";

const ChatStack = createNativeStackNavigator<ChatStackParamList>();

export function ChatStackNavigator() {
  return (
    <ChatStack.Navigator screenOptions={{ headerShown: false }}>
      <ChatStack.Screen name="ChatInbox" component={ChatScreen} />
      <ChatStack.Screen name="ChatConversation" component={ChatConversationScreen} />
      <ChatStack.Screen name="MemberProfile" component={MemberProfileScreen} />
      <ChatStack.Screen name="MemberAlbum" component={MemberAlbumScreen} />
    </ChatStack.Navigator>
  );
}
