import { apiGet, apiPatch } from './api';

export interface AppNotification {
  id: number;
  type: 'LIKE_POST' | 'COMMENT' | 'REPOST' | 'ML_MATCH' | string;
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
