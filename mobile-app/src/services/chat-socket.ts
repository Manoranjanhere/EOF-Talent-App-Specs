import { io, Socket } from "socket.io-client";
import { getSocketBaseUrl } from "./api-client";

export type ChatRealtimeMessage = {
  id: string;
  threadId: string;
  senderUserId: string;
  messageText: string;
  createdAt: string;
  isSeen?: boolean;
  seenAt?: string | null;
  sender?: { id: string; fullName: string };
};

export type ChatPushNotification = {
  type: "CHAT_MESSAGE";
  threadId: string;
  message: ChatRealtimeMessage;
};

export type ThreadSeenEvent = {
  threadId: string;
  userId: string;
};

type Listener = (...args: unknown[]) => void;

let socket: Socket | null = null;
let connectedToken: string | null = null;
const pendingListeners = new Map<string, Set<Listener>>();

function attachPendingListeners(active: Socket) {
  for (const [event, handlers] of pendingListeners.entries()) {
    for (const handler of handlers) {
      active.on(event, handler);
    }
  }
}

export function connectChatSocket(token: string): Socket {
  if (socket?.connected && connectedToken === token) {
    return socket;
  }

  disconnectChatSocket();
  connectedToken = token;

  socket = io(`${getSocketBaseUrl()}/chat`, {
    auth: { token },
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 8000
  });

  attachPendingListeners(socket);

  socket.on("connect_error", (err) => {
    console.warn("[chat-socket] connect_error:", err.message);
  });

  return socket;
}

export function disconnectChatSocket() {
  if (socket) {
    for (const [event, handlers] of pendingListeners.entries()) {
      for (const handler of handlers) {
        socket.off(event, handler);
      }
    }
    socket.disconnect();
  }
  socket = null;
  connectedToken = null;
}

export function getChatSocket(): Socket | null {
  return socket;
}

export function isChatSocketConnected(): boolean {
  return Boolean(socket?.connected);
}

export function joinChatThread(threadId: string) {
  socket?.emit("joinThread", { threadId });
}

export function leaveChatThread(threadId: string) {
  socket?.emit("leaveThread", { threadId });
}

export function subscribeChatEvent(event: string, handler: Listener): () => void {
  if (!pendingListeners.has(event)) {
    pendingListeners.set(event, new Set());
  }
  pendingListeners.get(event)!.add(handler);
  socket?.on(event, handler);

  return () => {
    pendingListeners.get(event)?.delete(handler);
    socket?.off(event, handler);
  };
}
