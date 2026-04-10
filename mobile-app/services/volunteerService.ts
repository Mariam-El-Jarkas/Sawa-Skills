import { apiGet, apiPost } from './api';

export interface VolunteerSession {
  id: number;
  title: string;
  description: string;
  date: string;
  organizer: string;
  status: string;
  participants: number;
  isJoined: boolean;
  location?: string;
  groupChatId?: number | null;
}

export interface CreateSessionData {
  name: string;
  description: string;
  date: string;
  time?: string;
  location?: string;
  skills?: string;
  createGroupChat?: boolean;
}

export const volunteerService = {
  getAllSessions(): Promise<VolunteerSession[]> {
    return apiGet<VolunteerSession[]>('/api/volunteer/sessions');
  },

  getMySessions(token: string): Promise<VolunteerSession[]> {
    return apiGet<VolunteerSession[]>('/api/volunteer/my-sessions', token);
  },

  createSession(data: CreateSessionData, token: string): Promise<VolunteerSession> {
    return apiPost<VolunteerSession>('/api/volunteer/sessions', {
      title: data.name,
      description: data.description,
      sessionDate: data.date,
      createGroupChat: data.createGroupChat
    }, token);
  },

  joinSession(sessionId: number, token: string): Promise<void> {
    return apiPost<void>(`/api/volunteer/sessions/${sessionId}/join`, {}, token);
  }
};
