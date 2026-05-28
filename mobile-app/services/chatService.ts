import { apiGet, apiPost, apiPatch, apiDelete } from './api';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ParticipantInfo {
  id: number;
  name: string;
  initials: string;
  picture: string | null;
  isAdmin: boolean;
}

export interface Conversation {
  id: number;
  otherUserId: number | null;  // null for group chats
  otherUserName: string;
  otherUserInitials: string;
  otherUserPicture: string | null;
  lastMessage: string | null;
  lastMessageTime: string | null;
  unreadCount: number;
  isGroup: boolean;
  adminId?: number;
  everyoneCanMessage?: boolean;
  participantsCount?: number;
  participants?: ParticipantInfo[];
  profilePicture?: string | null;
  isClosed?: boolean;
}

export interface ChatMessage {
  id: number;
  content: string;
  sentAt: string;
  isMe: boolean;
  senderId: number;
  senderName: string;
  replyToStoryId?: number | null;
  replyToStoryText?: string | null;
  replyToStoryMedia?: string | null;
  sharedPostId?: number | null;
  sharedPostAuthorId?: number | null;
  sharedPostAuthorName?: string | null;
  sharedPostContent?: string | null;
  sharedPostImage?: string | null;
  sharedPostPollOptions?: string | null;
}

// ── Service ───────────────────────────────────────────────────────────────────

export const chatService = {
  getConversations(token: string): Promise<Conversation[]> {
    return apiGet<Conversation[]>('/api/chat/conversations', token);
  },

  searchConversations(query: string, token: string): Promise<Conversation[]> {
    return apiGet<Conversation[]>(`/api/chat/search?query=${encodeURIComponent(query)}`, token);
  },

  startConversation(otherUserId: number, token: string): Promise<Conversation> {
    return apiPost<Conversation>('/api/chat/conversations', { otherUserId }, token);
  },

  getMessages(conversationId: number, token: string): Promise<ChatMessage[]> {
    return apiGet<ChatMessage[]>(`/api/chat/conversations/${conversationId}/messages`, token);
  },

  sendMessage(
    conversationId: number,
    content: string,
    token: string,
    storyReply?: { id: number; text: string | null; media: string | null },
    postShare?: { id: number; authorId: number; authorName: string; content: string; imageUrl: string | null; pollOptions?: string | null }
  ): Promise<ChatMessage> {
    return apiPost<ChatMessage>(`/api/chat/conversations/${conversationId}/messages`, {
      content,
      ...(storyReply && {
        replyToStoryId: storyReply.id,
        replyToStoryText: storyReply.text,
        replyToStoryMedia: storyReply.media,
      }),
      ...(postShare && {
        sharedPostId: postShare.id,
        sharedPostAuthorId: postShare.authorId,
        sharedPostAuthorName: postShare.authorName,
        sharedPostContent: postShare.content,
        sharedPostImage: postShare.imageUrl,
        sharedPostPollOptions: postShare.pollOptions ?? null,
      }),
    }, token);
  },

  markRead(conversationId: number, token: string): Promise<void> {
    return apiPatch<void>(`/api/chat/conversations/${conversationId}/read`, {}, token);
  },
  
  updatePermissions(conversationId: number, everyoneCanMessage: boolean, token: string): Promise<void> {
    return apiPatch<void>(`/api/chat/conversations/${conversationId}/permissions`, { everyoneCanMessage }, token);
  },

  clearConversation(conversationId: number, token: string): Promise<void> {
    return apiDelete<void>(`/api/chat/conversations/${conversationId}`, token);
  },

  clearMessages(conversationId: number, token: string): Promise<void> {
    return apiDelete<void>(`/api/chat/conversations/${conversationId}/messages`, token);
  },

  leaveGroup(conversationId: number, token: string): Promise<void> {
    return apiPost<void>(`/api/chat/conversations/${conversationId}/leave`, {}, token);
  },

  updateGroupInfo(conversationId: number, name: string | null, pictureBase64: string | null, token: string): Promise<void> {
    return apiPatch<void>(`/api/chat/conversations/${conversationId}/info`, { name, pictureBase64 }, token);
  },

  closeGroup(conversationId: number, token: string): Promise<void> {
    return apiPost<void>(`/api/chat/conversations/${conversationId}/close`, {}, token);
  },

  hideConversation(conversationId: number, token: string): Promise<void> {
    return apiPost<void>(`/api/chat/conversations/${conversationId}/hide`, {}, token);
  },
};
