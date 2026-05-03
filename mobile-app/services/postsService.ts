import { apiGet, apiPost, apiPatch, apiDelete } from './api';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Post {
  id: number;
  authorId: number;
  authorName: string;
  authorInitials: string;
  authorPicture: string | null;
  content: string;
  imageUrl: string | null;
  documentUrl: string | null;
  pollQuestion: string | null;
  pollOptions: string | null;
  visibility: 'EVERYONE' | 'FOLLOWERS';
  createdAt: string;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  isMine: boolean;
  isML: boolean;
  pollResults?: Record<string, number> | null;
  userPollVote?: string | null;
}

export interface SuggestedUser {
  id: number;
  name: string;
  initials: string;
  profilePicture: string | null;
  bio: string | null;
}

export interface Comment {
  id: number;
  authorId: number;
  authorName: string;
  authorInitials: string;
  content: string;
  createdAt: string;
  isMine: boolean;
  likeCount: number;
  isLiked: boolean;
}

export interface Story {
  id: number;
  userId: number;
  userName: string;
  userInitials: string;
  userPicture: string | null;
  textContent: string | null;
  mediaUrl: string | null;
  createdAt: string;
  expiresAt: string;
  hasViewed: boolean;
}

export interface LikeResult {
  liked: boolean;
  likeCount: number;
}

// ── Service ───────────────────────────────────────────────────────────────────

export const postsService = {
  // Posts feed
  getPosts(token?: string | null): Promise<Post[]> {
    return apiGet<Post[]>('/api/posts', token);
  },
  getFollowingPosts(token: string): Promise<Post[]> {
    return apiGet<Post[]>('/api/posts/following', token);
  },
  getMLPosts(token: string): Promise<Post[]> {
    return apiGet<Post[]>('/api/posts/ml', token);
  },
  getPostCount(token: string): Promise<number> {
    return apiGet<number>('/api/posts/post-count', token);
  },
  getSuggestedConnections(token: string): Promise<SuggestedUser[]> {
    return apiGet<SuggestedUser[]>('/api/posts/suggested-connections', token);
  },

  // Post CRUD
  createPost(
    content: string, 
    imageBase64: string | null, 
    token: string, 
    visibility: 'EVERYONE' | 'FOLLOWERS' = 'EVERYONE',
    documentBase64?: string | null,
    pollQuestion?: string | null,
    pollOptions?: string | null
  ): Promise<Post> {
    return apiPost<Post>('/api/posts', { 
      content, 
      imageBase64, 
      visibility, 
      documentBase64, 
      pollQuestion, 
      pollOptions 
    }, token);
  },
  deletePost(postId: number, token: string): Promise<void> {
    return apiDelete<void>(`/api/posts/${postId}`, token);
  },
  editPost(postId: number, content: string, token: string): Promise<Post> {
    return apiPatch<Post>(`/api/posts/${postId}`, { content }, token);
  },

  // Post interactions
  toggleLike(postId: number, token: string): Promise<LikeResult> {
    return apiPost<LikeResult>(`/api/posts/${postId}/like`, {}, token);
  },
  reportPost(postId: number, reason: string, token: string): Promise<void> {
    return apiPost<void>(`/api/posts/${postId}/report`, { reason }, token);
  },
  submitVote(postId: number, option: string, token: string): Promise<{ results: Record<string, number>, userVote: string }> {
    return apiPost<{ results: Record<string, number>, userVote: string }>(`/api/posts/${postId}/vote`, { option }, token);
  },

  // Comments
  getComments(postId: number, token?: string | null): Promise<Comment[]> {
    return apiGet<Comment[]>(`/api/posts/${postId}/comments`, token);
  },
  addComment(postId: number, content: string, token: string): Promise<Comment> {
    return apiPost<Comment>(`/api/posts/${postId}/comments`, { content }, token);
  },
  deleteComment(postId: number, commentId: number, token: string): Promise<void> {
    return apiDelete<void>(`/api/posts/${postId}/comments/${commentId}`, token);
  },
  editComment(postId: number, commentId: number, content: string, token: string): Promise<Comment> {
    return apiPatch<Comment>(`/api/posts/${postId}/comments/${commentId}`, { content }, token);
  },
  toggleCommentLike(postId: number, commentId: number, token: string): Promise<LikeResult> {
    return apiPost<LikeResult>(`/api/posts/${postId}/comments/${commentId}/like`, {}, token);
  },

  // Stories
  getStories(token?: string | null): Promise<Story[]> {
    return apiGet<Story[]>('/api/stories', token);
  },
  createStory(textContent: string | null, mediaBase64: string | null, token: string): Promise<Story> {
    return apiPost<Story>('/api/stories', { textContent, mediaBase64 }, token);
  },
  viewStory(storyId: number, token: string): Promise<void> {
    return apiPost<void>(`/api/stories/${storyId}/view`, {}, token);
  },
};
