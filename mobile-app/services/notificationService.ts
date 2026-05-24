import { apiGet, apiPatch } from './api';

export interface AppNotification {
  id: number;
  type: 'LIKE_POST' | 'COMMENT' | 'REPOST' | 'ML_MATCH' | 'LIKE_STORY' | 'STORY_REPLY' | 'LIKE_COMMENT' | 'COMMENT_REPLY' | 'CONNECTION_REQUEST' | 'CONNECTION_ACCEPTED' | 'POLL_VOTE' | 'POLL_VOTE_STORY' | 'SWAP_REQUEST' | 'SWAP_ACCEPTED' | 'MESSAGE' | string;
  message: string;
  read: boolean;
  createdAt: string;
  actorId: number | null;
  actorName: string | null;
  referenceId: number | null;
}

export const notificationService = {
  getAll(token: string): Promise<AppNotification[]> {
    return apiGet<AppNotification[]>('/api/notifications', token);
  },
  getUnreadCount(token: string): Promise<{ count: number }> {
    return apiGet<{ count: number }>('/api/notifications/count', token);
  },
  markRead(id: number, token: string): Promise<void> {
    return apiPatch<void>(`/api/notifications/${id}/read`, {}, token);
  },
  markAllRead(token: string): Promise<void> {
    return apiPatch<void>('/api/notifications/read-all', {}, token);
  },
};
