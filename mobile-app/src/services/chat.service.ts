import { apiRequest } from "./api-client";

export function getMessagingStatus(token: string) {
  return apiRequest<{
    active: boolean;
    isAdmin: boolean;
    isTalentFree?: boolean;
    planCode: string | null;
    expiresAt: string | null;
  }>("/chat/messaging-status", { token });
}

export function listThreads(token: string) {
  return apiRequest("/chat/threads", { token });
}

export function startDirectThread(token: string, recipientUserId: string) {
  return apiRequest("/chat/direct", {
    method: "POST",
    token,
    body: { recipientUserId }
  });
}

export function listMessages(token: string, threadId: string) {
  return apiRequest(`/chat/threads/${threadId}/messages`, { token });
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

export function getBlockStatus(token: string, otherUserId: string) {
  return apiRequest<{ blocked: boolean; blockedByMe: boolean; blockedByThem: boolean }>(
    `/chat/block-status/${otherUserId}`,
    { token }
  );
}

export function unblockUser(token: string, blockedUserId: string) {
  return apiRequest(`/chat/unblock/${blockedUserId}`, {
    method: "PATCH",
    token
  });
}
