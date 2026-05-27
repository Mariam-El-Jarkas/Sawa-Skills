import { BASE_URL } from '../services/api';

/** Resolves a relative server path to an absolute URL for use in <Image source={{uri}}> */
export function resolveUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `${BASE_URL}${url}`;
}

/** Converts an ISO timestamp to a human-readable relative string ("5m ago", "2h ago") */
export function relativeTime(iso: string): string {
  // Append 'Z' if no timezone info — backend sends UTC LocalDateTime without suffix
  const utcIso = iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z';
  const diff = Date.now() - new Date(utcIso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/** Returns up to 2 uppercase initials from a display name */
export function getInitials(name?: string): string {
  if (!name) return '??';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}
