import { apiGet, apiPost, apiPatch } from './api';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Conversation {
  id: number;
  otherUserId: number;
  otherUserName: string;
  otherUserInitials: string;
  otherUserPicture: string | null;
  lastMessage: string | null;
  lastMessageTime: string | null;
  unreadCount: number;
}

export interface ChatMessage {
  id: number;
  content: string;
  sentAt: string;
  isMe: boolean;
  senderId: number;
  senderName: string;
}

// ── Service ───────────────────────────────────────────────────────────────────

export const chatService = {
  getConversations(token: string): Promise<Conversation[]> {
    return apiGet<Conversation[]>('/api/chat/conversations', token);
  },

  startConversation(otherUserId: number, token: string): Promise<Conversation> {
    return apiPost<Conversation>('/api/chat/conversations', { otherUserId }, token);
  },

  getMessages(conversationId: number, token: string): Promise<ChatMessage[]> {
    return apiGet<ChatMessage[]>(`/api/chat/conversations/${conversationId}/messages`, token);
  },

  sendMessage(conversationId: number, content: string, token: string): Promise<ChatMessage> {
    return apiPost<ChatMessage>(`/api/chat/conversations/${conversationId}/messages`, { content }, token);
  },

  markRead(conversationId: number, token: string): Promise<void> {
    return apiPatch<void>(`/api/chat/conversations/${conversationId}/read`, {}, token);
  },
};
