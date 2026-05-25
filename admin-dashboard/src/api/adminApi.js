const BASE = `${import.meta.env.VITE_API_URL ?? 'http://localhost:8080'}/api`;

async function req(method, path, body, token) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) {
    // Token expired or invalid — clear session and redirect to login
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_data');
    window.location.href = '/login';
    throw new Error('Session expired. Please log in again.');
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }
  const text = await res.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return text; }
}

function qs(params) {
  const p = Object.fromEntries(
    Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );
  const s = new URLSearchParams(p).toString();
  return s ? `?${s}` : '';
}

export const adminApi = {
  // ── Stats & Analytics ──────────────────────────────────────────────────────
  getStats:      (token) => req('GET', '/admin/stats', undefined, token),
  getUserGrowth: (token) => req('GET', '/admin/analytics/user-growth', undefined, token),
  getSwapTrends: (token) => req('GET', '/admin/analytics/swap-trends', undefined, token),
  getSkillDemand:(token) => req('GET', '/admin/analytics/skill-demand', undefined, token),
  getTopUsers:   (token) => req('GET', '/admin/analytics/top-users', undefined, token),

  // ── Users ──────────────────────────────────────────────────────────────────
  getUsers:   (token, params) => req('GET', `/admin/users${qs(params)}`, undefined, token),
  banUser:    (token, id)     => req('PATCH', `/admin/users/${id}/ban`, null, token),
  unbanUser:  (token, id)     => req('PATCH', `/admin/users/${id}/unban`, null, token),
  suspendUser:(token, id)     => req('PATCH', `/admin/users/${id}/suspend`, null, token),
  verifyUser: (token, id)     => req('PATCH', `/admin/users/${id}/verify`, null, token),
  deleteUser: (token, id)     => req('DELETE', `/admin/users/${id}`, undefined, token),

  // ── Posts ──────────────────────────────────────────────────────────────────
  getPosts:        (token, params)              => req('GET', `/admin/posts${qs(params)}`, undefined, token),
  hidePost:        (token, id)                  => req('PATCH', `/admin/posts/${id}/visibility`, { hidden: true }, token),
  showPost:        (token, id)                  => req('PATCH', `/admin/posts/${id}/visibility`, { hidden: false }, token),
  deletePost:      (token, id)                  => req('DELETE', `/admin/posts/${id}`, undefined, token),
  getPostComments: (token, postId)              => req('GET', `/admin/posts/${postId}/comments`, undefined, token),
  deleteComment:   (token, postId, commentId)   => req('DELETE', `/admin/posts/${postId}/comments/${commentId}`, undefined, token),

  // ── Reports ────────────────────────────────────────────────────────────────
  getReports:    (token, params) => req('GET', `/admin/reports${qs(params)}`, undefined, token),
  resolveReport: (token, id)     => req('PATCH', `/admin/reports/${id}/resolve`, null, token),
  dismissReport: (token, id)     => req('PATCH', `/admin/reports/${id}/dismiss`, null, token),

  // ── Swaps ──────────────────────────────────────────────────────────────────
  getSwaps:   (token, params) => req('GET', `/admin/swaps${qs(params)}`, undefined, token),
  cancelSwap: (token, id)     => req('PATCH', `/admin/swaps/${id}/cancel`, null, token),

  // ── Volunteer ──────────────────────────────────────────────────────────────
  getVolunteerSessions: (token)    => req('GET', '/admin/volunteer/sessions', undefined, token),
  approveSession:       (token, id) => req('PATCH', `/admin/volunteer/sessions/${id}/approve`, null, token),
  rejectSession:        (token, id) => req('PATCH', `/admin/volunteer/sessions/${id}/reject`, null, token),

  // ── Badge revocation ───────────────────────────────────────────────────────
  revokeBadge: (token, userId, type) => req('PATCH', `/admin/users/${userId}/revoke-badge?type=${type}`, null, token),

  // ── Skills ─────────────────────────────────────────────────────────────────
  getSkillCategories:   (token)              => req('GET', '/admin/skills/categories', undefined, token),
  createSkillCategory:  (token, body)        => req('POST', '/admin/skills/categories', body, token),
  deleteSkillCategory:  (token, id)          => req('DELETE', `/admin/skills/categories/${id}`, undefined, token),
  addSkill:             (token, catId, name) => req('POST', `/admin/skills/categories/${catId}/skills`, { skillName: name }, token),
  removeSkill:          (token, skillId)     => req('DELETE', `/admin/skills/${skillId}`, undefined, token),

  // ── Notifications / Broadcasts ─────────────────────────────────────────────
  getBroadcasts:    (token)       => req('GET', '/admin/notifications/broadcasts', undefined, token),
  sendBroadcast:    (token, body) => req('POST', '/admin/notifications/broadcast', body, token),
  deleteBroadcast:  (token, id)   => req('DELETE', `/admin/notifications/broadcasts/${id}`, undefined, token),

  // ── Logs ───────────────────────────────────────────────────────────────────
  getLogs: (token, params) => req('GET', `/admin/logs${qs(params)}`, undefined, token),

  // ── Admin Profile ──────────────────────────────────────────────────────────
  updateAdminName:     (token, name)                           => req('PATCH', '/admin/profile/name', { name }, token),
  changeAdminPassword: (token, currentPassword, newPassword)   => req('PATCH', '/admin/profile/password', { currentPassword, newPassword }, token),

  // ── Settings ───────────────────────────────────────────────────────────────
  getSettings:  (token)       => req('GET', '/admin/settings', undefined, token),
  saveSettings: (token, body) => req('PUT', '/admin/settings', body, token),
};
