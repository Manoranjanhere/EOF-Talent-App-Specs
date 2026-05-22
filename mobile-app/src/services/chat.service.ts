import { apiRequest } from "./api-client";

export function listThreads(token: string) {
  return apiRequest("/chat/threads", { token });
}

export function sendMessage(token: string, threadId: string, messageText: string) {
  return apiRequest(`/chat/threads/${threadId}/messages`, {
    method: "POST",
    token,
    body: { messageText }
  });
}

export function markThreadSeen(token: string, threadId: string) {
  return apiRequest(`/chat/threads/${threadId}/seen`, {
    method: "PATCH",
    token
  });
}

export function blockUser(token: string, blockedUserId: string, reason?: string) {
  return apiRequest("/chat/block", {
    method: "POST",
    token,
    body: { blockedUserId, reason }
  });
}
