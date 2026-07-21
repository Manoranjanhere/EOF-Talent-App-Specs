import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  connectChatSocket,
  disconnectChatSocket,
  isChatSocketConnected,
  joinChatThread,
  leaveChatThread,
  subscribeChatEvent,
  type ChatPushNotification,
  type ChatRealtimeMessage,
  type ThreadSeenEvent
} from "../services/chat-socket";
import { useAuth } from "./auth-context";

type ChatSocketContextValue = {
  connected: boolean;
  joinThread: (threadId: string) => void;
  leaveThread: (threadId: string) => void;
  onNewMessage: (handler: (message: ChatRealtimeMessage) => void) => () => void;
  onThreadSeen: (handler: (event: ThreadSeenEvent) => void) => () => void;
  onPushNotification: (handler: (event: ChatPushNotification) => void) => () => void;
};

const ChatSocketContext = createContext<ChatSocketContextValue | undefined>(undefined);

export function ChatSocketProvider({ children }: { children: React.ReactNode }) {
  const { accessToken, isAuthenticated } = useAuth();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      disconnectChatSocket();
      setConnected(false);
      return;
    }

    const active = connectChatSocket(accessToken);

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    active.on("connect", onConnect);
    active.on("disconnect", onDisconnect);
    setConnected(active.connected);

    return () => {
      active.off("connect", onConnect);
      active.off("disconnect", onDisconnect);
      disconnectChatSocket();
      setConnected(false);
    };
  }, [accessToken, isAuthenticated]);

  const value = useMemo<ChatSocketContextValue>(
    () => ({
      connected,
      joinThread: joinChatThread,
      leaveThread: leaveChatThread,
      onNewMessage: (handler) =>
        subscribeChatEvent("newMessage", handler as (...args: unknown[]) => void),
      onThreadSeen: (handler) =>
        subscribeChatEvent("threadSeen", handler as (...args: unknown[]) => void),
      onPushNotification: (handler) =>
        subscribeChatEvent("pushNotification", handler as (...args: unknown[]) => void)
    }),
    [connected]
  );

  return <ChatSocketContext.Provider value={value}>{children}</ChatSocketContext.Provider>;
}

export function useChatSocket() {
  const context = useContext(ChatSocketContext);
  if (!context) {
    throw new Error("useChatSocket must be used inside ChatSocketProvider");
  }
  return context;
}

/** Subscribe to real-time events for a single thread while the screen is mounted. */
export function useChatThreadRealtime(
  threadId: string | null,
  handlers: {
    onMessage?: (message: ChatRealtimeMessage) => void;
    onSeen?: (event: ThreadSeenEvent) => void;
  }
) {
  const chatSocket = useChatSocket();
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!threadId) return;
    chatSocket.joinThread(threadId);
    return () => chatSocket.leaveThread(threadId);
  }, [threadId, chatSocket]);

  useEffect(() => {
    if (!threadId) return;
    return chatSocket.onNewMessage((message) => {
      if (message.threadId === threadId) {
        handlersRef.current.onMessage?.(message);
      }
    });
  }, [threadId, chatSocket]);

  useEffect(() => {
    if (!threadId) return;
    return chatSocket.onThreadSeen((event) => {
      if (event.threadId === threadId) {
        handlersRef.current.onSeen?.(event);
      }
    });
  }, [threadId, chatSocket]);
}

export { isChatSocketConnected };
