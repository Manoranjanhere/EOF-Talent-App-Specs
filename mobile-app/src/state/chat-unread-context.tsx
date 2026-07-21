import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { listThreads } from "../services/chat.service";
import type { ChatPushNotification } from "../services/chat-socket";
import { useAuth } from "./auth-context";
import { useChatSocket } from "./chat-socket-context";

type ChatUnreadContextValue = {
  totalUnread: number;
  refreshUnread: () => Promise<void>;
};

const ChatUnreadContext = createContext<ChatUnreadContextValue | undefined>(undefined);

export function ChatUnreadProvider({ children }: { children: React.ReactNode }) {
  const { accessToken, isAuthenticated } = useAuth();
  const { onPushNotification } = useChatSocket();
  const [totalUnread, setTotalUnread] = useState(0);

  const refreshUnread = useCallback(async () => {
    if (!accessToken) {
      setTotalUnread(0);
      return;
    }
    try {
      const threads = (await listThreads(accessToken)) as Array<{ unreadCount?: number }>;
      const total = threads.reduce((sum, t) => sum + (t.unreadCount ?? 0), 0);
      setTotalUnread(total);
    } catch {
      // Keep last known count on transient errors.
    }
  }, [accessToken]);

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      void refreshUnread();
    } else {
      setTotalUnread(0);
    }
  }, [isAuthenticated, accessToken, refreshUnread]);

  useEffect(() => {
    return onPushNotification((payload: ChatPushNotification) => {
      if (payload.type === "CHAT_MESSAGE") {
        void refreshUnread();
      }
    });
  }, [onPushNotification, refreshUnread]);

  const value = useMemo(
    () => ({ totalUnread, refreshUnread }),
    [totalUnread, refreshUnread]
  );

  return <ChatUnreadContext.Provider value={value}>{children}</ChatUnreadContext.Provider>;
}

export function useChatUnread() {
  const context = useContext(ChatUnreadContext);
  if (!context) {
    throw new Error("useChatUnread must be used inside ChatUnreadProvider");
  }
  return context;
}
