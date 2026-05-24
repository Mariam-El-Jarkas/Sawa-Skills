import { apiGet, apiPost } from './api';

export interface VolunteerSession {
  id: number;
  title: string;
  description: string;
  date: string;
  time?: string | null;
  organizer: string;
  status: string;
  participants: number;
  isJoined: boolean;
  isOrganizer: boolean;
  /** "REMOTE" or "IN_PERSON" */
  locationType?: string | null;
  location?: string | null;
  groupChatId?: number | null;
  organizerAge?: number | null;
  organizerGender?: string | null;
}

export interface CreateSessionData {
  name: string;
  description?: string;
  skills?: string;
  /** Full ISO-8601 datetime, e.g. "2025-06-15T15:30:00" */
  isoDateTime: string;
  /** "REMOTE" or "IN_PERSON" */
  locationType: 'REMOTE' | 'IN_PERSON';
  /** Required when locationType is IN_PERSON */
  location?: string;
}

export const volunteerService = {
  getAllSessions(token?: string): Promise<VolunteerSession[]> {
    return apiGet<VolunteerSession[]>('/api/volunteer/sessions', token);
  },

  getMySessions(token: string): Promise<VolunteerSession[]> {
    return apiGet<VolunteerSession[]>('/api/volunteer/my-sessions', token);
  },

  createSession(data: CreateSessionData, token: string): Promise<VolunteerSession> {
    return apiPost<VolunteerSession>('/api/volunteer/sessions', {
      title: data.name,
      description: data.description ?? '',
      sessionDate: data.isoDateTime,
      locationType: data.locationType,
      location: data.location ?? null,
    }, token);
  },

  joinSession(sessionId: number, token: string): Promise<void> {
    return apiPost<void>(`/api/volunteer/sessions/${sessionId}/join`, {}, token);
  }
};
