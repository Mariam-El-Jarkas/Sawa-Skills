import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Image,
  Modal, StyleSheet, ActivityIndicator, RefreshControl,
  KeyboardAvoidingView, Platform, Share,
} from 'react-native';
import {
  Heart, MessageCircle, Share2, Plus, Trash2, X, Send,
  Camera, ChevronLeft, ChevronRight, Repeat2, MessageSquare,
  ExternalLink, MoreHorizontal, Edit3, Flag, Check,
  Globe, Users, FileText, BarChart3, PlusCircle, UserPlus,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/modals/AppToast';
import { postsService, Post, Comment, Story, SuggestedUser } from '../../services/postsService';
import { BASE_URL } from '../../services/api';
import { C } from '../../components/theme';

// ── Constants ─────────────────────────────────────────────────────────────────

const REPORT_REASONS = [
  'Spam', 'Harassment', 'Misinformation',
  'Inappropriate content', 'Hate speech', 'Other',
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function resolveUrl(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `${BASE_URL}${url}`;
}

function mergeWithML(posts: Post[], mlPosts: Post[]): Post[] {
  if (!mlPosts.length) return posts;
  const result: Post[] = [];
  const usedMLIds = new Set<number>();
  mlPosts.forEach(m => usedMLIds.add(m.id));
  let mlIdx = 0;
  posts.forEach((p, i) => {
    result.push(p);
    // Inject one ML post every 4 regular posts
    if ((i + 1) % 4 === 0 && mlIdx < mlPosts.length) {
      result.push(mlPosts[mlIdx++]);
    }
  });
  // Append remaining ML posts
  while (mlIdx < mlPosts.length) result.push(mlPosts[mlIdx++]);
  return result;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function NewsScreen() {
  const router = useRouter();
  const { isLoggedIn, user, token, setShowLoginPrompt } = useAuth();
  const { showToast } = useToast();

  // ── Tab ─────────────────────────────────────────────────────────────────────
  const [tab, setTab] = useState<'for_you' | 'following'>('for_you');

  // ── Posts state ─────────────────────────────────────────────────────────────
  const [posts, setPosts] = useState<Post[]>([]);
  const [followingPosts, setFollowingPosts] = useState<Post[]>([]);
  const [mlPosts, setMLPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ── Stories state ───────────────────────────────────────────────────────────
  const [stories, setStories] = useState<Story[]>([]);
  const [viewingStoryIndex, setViewingStoryIndex] = useState<number | null>(null);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [storyText, setStoryText] = useState('');
  const [storyImage, setStoryImage] = useState<string | null>(null);
  const [isPostingStory, setIsPostingStory] = useState(false);

  // ── Create post state ────────────────────────────────────────────────────────
  const [showPostModal, setShowPostModal] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImage, setNewPostImage] = useState<string | null>(null);
  const [newPostDoc, setNewPostDoc] = useState<{ uri: string, name: string, base64?: string } | null>(null);
  const [postVisibility, setPostVisibility] = useState<'EVERYONE' | 'FOLLOWERS'>('EVERYONE');
  const [isPollMode, setIsPollMode] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [isPosting, setIsPosting] = useState(false);
  const [repostContent, setRepostContent] = useState('');

  // ── Suggested Connections ───────────────────────────────────────────────────
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [showSuggestedPrompt, setShowSuggestedPrompt] = useState(false);

  // ── Comments state ───────────────────────────────────────────────────────────
  const [openComments, setOpenComments] = useState<number | null>(null);
  const [commentsMap, setCommentsMap] = useState<Record<number, Comment[]>>({});
  const [loadingCommentIds, setLoadingCommentIds] = useState<Set<number>>(new Set());
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  const [submittingCommentId, setSubmittingCommentId] = useState<number | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [likingCommentIds, setLikingCommentIds] = useState<Set<number>>(new Set());

  // ── Post interactions state ──────────────────────────────────────────────────
  const [likingIds, setLikingIds] = useState<Set<number>>(new Set());
  const [sharingPost, setSharingPost] = useState<Post | null>(null);
  const [repostOptionsPost, setRepostOptionsPost] = useState<Post | null>(null);
  const [reportingPost, setReportingPost] = useState<Post | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [postOptionsPost, setPostOptionsPost] = useState<Post | null>(null);
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editPostText, setEditPostText] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  
  const [confirmDeleteType, setConfirmDeleteType] = useState<'post' | 'comment' | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<{ postId: number, commentId?: number } | null>(null);

  // ── Suggested connections state ─────────────────────────────────────────────
  const [requestedUserIds, setRequestedUserIds] = useState<Set<number>>(new Set());

  // ── FAB state ────────────────────────────────────────────────────────────────
  const [showFabMenu, setShowFabMenu] = useState(false);

  // ── Load data ─────────────────────────────────────────────────────────────────

  const loadFeed = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const promises: Promise<any>[] = [
        postsService.getPosts(token),
        postsService.getStories(token),
      ];
      if (token) {
        promises.push(postsService.getFollowingPosts(token));
        promises.push(postsService.getMLPosts(token));
      }
      const [fetchedPosts, fetchedStories, fetchedFollowing, fetchedML] = await Promise.all(promises);
      setPosts(fetchedPosts ?? []);
      setStories(fetchedStories ?? []);
      setFollowingPosts(fetchedFollowing ?? []);
      setMLPosts(fetchedML ?? []);

      // Check for suggested connections trigger
      if (token && fetchedPosts?.length > 0) {
        const count = await postsService.getPostCount(token);
        if (count >= 2) {
          const suggested = await postsService.getSuggestedConnections(token);
          if (suggested?.length > 0) {
            setSuggestedUsers(suggested);
            setShowSuggestedPrompt(true);
          }
        }
      }
    } catch {
      if (!silent) showToast('Failed to load feed', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [token]);

  useEffect(() => { loadFeed(); }, [loadFeed]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadFeed(true);
  }, [loadFeed]);

  // ── Post actions ──────────────────────────────────────────────────────────────

  const handleCreatePost = async () => {
    if (!newPostContent.trim() && !newPostImage && !repostContent && !isPollMode && !newPostDoc) return;
    if (!token) return;
    setIsPosting(true);
    try {
      const finalContent = repostContent ? (newPostContent.trim() ? newPostContent.trim() + '\n\n' + repostContent.trim() : repostContent.trim()) : newPostContent.trim();
      
      const pollOptionsStr = isPollMode ? pollOptions.filter(o => o.trim()).join(',') : null;
      const pollQ = isPollMode ? pollQuestion.trim() : null;

      const created = await postsService.createPost(
        finalContent, 
        newPostImage, 
        token, 
        postVisibility,
        newPostDoc?.base64,
        pollQ,
        pollOptionsStr
      );
      
      setPosts(prev => [created, ...prev]);
      setNewPostContent(''); setNewPostImage(null); setRepostContent('');
      setNewPostDoc(null); setPollQuestion(''); setPollOptions(['', '']);
      setIsPollMode(false);
      setShowPostModal(false);
      showToast(repostContent ? 'Reposted!' : 'Post shared!', 'success');
    } catch (e: any) {
      showToast(e.message ?? 'Failed to post', 'error');
    } finally {
      setIsPosting(false);
    }
  };

  const pickDocument = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'text/plain'],
        copyToCacheDirectory: true,
      });
      if (res.assets && res.assets.length > 0) {
        const asset = res.assets[0];
        setNewPostDoc({ uri: asset.uri, name: asset.name, base64: 'data:application/pdf;base64,DEBUG_DOC_CONTENT' });
      }
    } catch (e) {
      showToast('Error picking document', 'error');
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!token) return;
    try {
      await postsService.deletePost(postId, token);
      setPosts(prev => prev.filter(p => p.id !== postId));
      setFollowingPosts(prev => prev.filter(p => p.id !== postId));
      setMLPosts(prev => prev.filter(p => p.id !== postId));
      showToast('Post deleted', 'success');
    } catch (e: any) {
      showToast(e.message ?? 'Failed to delete post', 'error');
    }
  };

  const requestDeletePost = (postId: number) => {
    setDeleteTargetId({ postId });
    setConfirmDeleteType('post');
  };

  const requestDeleteComment = (postId: number, commentId: number) => {
    setDeleteTargetId({ postId, commentId });
    setConfirmDeleteType('comment');
  };

  const executeDelete = async () => {
    if (!deleteTargetId) return;
    if (confirmDeleteType === 'post') {
      await handleDeletePost(deleteTargetId.postId);
    } else if (confirmDeleteType === 'comment' && deleteTargetId.commentId) {
      await handleDeleteComment(deleteTargetId.postId, deleteTargetId.commentId);
    }
    setConfirmDeleteType(null);
    setDeleteTargetId(null);
  };

  const handleSavePostEdit = async () => {
    if (!token || !editingPostId || !editPostText.trim()) return;
    setIsSavingEdit(true);
    try {
      const updated = await postsService.editPost(editingPostId, editPostText.trim(), token);
      const sync = (list: Post[]) => list.map(p => p.id === editingPostId ? updated : p);
      setPosts(sync); setFollowingPosts(sync); setMLPosts(sync);
      setEditingPostId(null);
      setEditPostText('');
      showToast('Post updated successfully', 'success');
    } catch (e: any) {
      showToast(e.message ?? 'Failed to edit post', 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleLike = async (postId: number) => {
    if (!isLoggedIn) { setShowLoginPrompt(true); return; }
    if (!token || likingIds.has(postId)) return;
    setLikingIds(prev => new Set(prev).add(postId));
    const togglePost = (list: Post[]) => list.map(p =>
      p.id === postId ? { ...p, isLiked: !p.isLiked, likeCount: p.isLiked ? p.likeCount - 1 : p.likeCount + 1 } : p
    );
    setPosts(togglePost); setFollowingPosts(togglePost); setMLPosts(togglePost);
    try {
      const result = await postsService.toggleLike(postId, token);
      const syncPost = (list: Post[]) => list.map(p =>
        p.id === postId ? { ...p, isLiked: result.liked, likeCount: result.likeCount } : p
      );
      setPosts(syncPost); setFollowingPosts(syncPost); setMLPosts(syncPost);
    } catch {
      const revertPost = (list: Post[]) => list.map(p =>
        p.id === postId ? { ...p, isLiked: !p.isLiked, likeCount: p.isLiked ? p.likeCount - 1 : p.likeCount + 1 } : p
      );
      setPosts(revertPost); setFollowingPosts(revertPost); setMLPosts(revertPost);
    } finally {
      setLikingIds(prev => { const s = new Set(prev); s.delete(postId); return s; });
    }
  };

  const handleVote = async (postId: number, option: string) => {
    if (!isLoggedIn) { setShowLoginPrompt(true); return; }
    if (!token) return;
    try {
      const { results, userVote } = await postsService.submitVote(postId, option, token);
      const update = (list: Post[]) => list.map(p =>
        p.id === postId ? { ...p, pollResults: results, userPollVote: userVote } : p
      );
      setPosts(update); setFollowingPosts(update); setMLPosts(update);
      showToast('Vote recorded!', 'success');
    } catch (e: any) {
      showToast(e.message ?? 'Failed to vote', 'error');
    }
  };

  // ── Share / Repost ────────────────────────────────────────────────────────────

  const handleInstantRepost = async (post: Post) => {
    if (!token) return;
    try {
      const finalContent = `🔁 ${post.authorName}:\n"${post.content}"\n\n`;
      const created = await postsService.createPost(finalContent, null, token);
      setPosts(prev => [created, ...prev]);
      showToast('Reposted!', 'success');
    } catch (e: any) {
      showToast(e.message ?? 'Failed to repost', 'error');
    }
  };

  const handleShareToChat = (post: Post) => {
    setSharingPost(null);
    router.push({ pathname: '/(tabs)/chat', params: { shareText: `${post.authorName}: "${post.content}"` } } as any);
  };
  const handleShareExternal = async (post: Post) => {
    setSharingPost(null);
    try { await Share.share({ message: `${post.authorName} on Sawa:\n"${post.content}"` }); } catch { }
  };
  const handleOpenRepost = (post: Post) => {
    setSharingPost(null);
    setRepostContent(`🔁 ${post.authorName}:\n"${post.content}"\n\n`);
    setNewPostContent('');
    setShowPostModal(true);
  };

  // ── Report ────────────────────────────────────────────────────────────────────

  const handleSubmitReport = async () => {
    if (!reportReason || !reportingPost || !token) return;
    setIsSubmittingReport(true);
    try {
      await postsService.reportPost(reportingPost.id, reportReason, token);
      setReportingPost(null);
      setReportReason('');
      showToast('Report submitted. Thank you!', 'success');
    } catch (e: any) {
      showToast(e.message ?? 'Failed to submit report', 'error');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // ── Comments ──────────────────────────────────────────────────────────────────

  const toggleComments = async (postId: number) => {
    if (openComments === postId) { setOpenComments(null); return; }
    setOpenComments(postId);
    if (!commentsMap[postId]) {
      setLoadingCommentIds(prev => new Set(prev).add(postId));
      try {
        const fetched = await postsService.getComments(postId, token);
        setCommentsMap(prev => ({ ...prev, [postId]: fetched }));
      } catch { } finally {
        setLoadingCommentIds(prev => { const s = new Set(prev); s.delete(postId); return s; });
      }
    }
  };

  const handleAddComment = async (postId: number) => {
    if (!isLoggedIn) { setShowLoginPrompt(true); return; }
    if (!token) return;
    const text = (commentInputs[postId] ?? '').trim();
    if (!text || submittingCommentId === postId) return;
    setSubmittingCommentId(postId);
    try {
      const comment = await postsService.addComment(postId, text, token);
      setCommentsMap(prev => ({ ...prev, [postId]: [...(prev[postId] ?? []), comment] }));
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p));
      setFollowingPosts(prev => prev.map(p => p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p));
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    } catch (e: any) {
      showToast(e.message ?? 'Failed to add comment', 'error');
    } finally { setSubmittingCommentId(null); }
  };

  const handleDeleteComment = async (postId: number, commentId: number) => {
    if (!token) return;
    try {
      await postsService.deleteComment(postId, commentId, token);
      setCommentsMap(prev => ({ ...prev, [postId]: (prev[postId] ?? []).filter(c => c.id !== commentId) }));
      const dec = (list: Post[]) => list.map(p => p.id === postId ? { ...p, commentCount: p.commentCount - 1 } : p);
      setPosts(dec); setFollowingPosts(dec);
      showToast('Comment deleted', 'success');
    } catch (e: any) {
      showToast(e.message ?? 'Failed to delete comment', 'error');
    }
  };

  const handleSaveCommentEdit = async (postId: number, commentId: number) => {
    if (!token || !editCommentText.trim()) return;
    try {
      const updated = await postsService.editComment(postId, commentId, editCommentText.trim(), token);
      setCommentsMap(prev => ({
        ...prev,
        [postId]: (prev[postId] ?? []).map(c => c.id === commentId ? updated : c),
      }));
      setEditingCommentId(null);
      setEditCommentText('');
    } catch (e: any) {
      showToast(e.message ?? 'Failed to edit comment', 'error');
    }
  };

  const handleCommentLike = async (postId: number, commentId: number) => {
    if (!isLoggedIn) { setShowLoginPrompt(true); return; }
    if (!token || likingCommentIds.has(commentId)) return;
    setLikingCommentIds(prev => new Set(prev).add(commentId));
    setCommentsMap(prev => ({
      ...prev,
      [postId]: (prev[postId] ?? []).map(c =>
        c.id === commentId ? { ...c, isLiked: !c.isLiked, likeCount: c.isLiked ? c.likeCount - 1 : c.likeCount + 1 } : c
      ),
    }));
    try {
      const result = await postsService.toggleCommentLike(postId, commentId, token);
      setCommentsMap(prev => ({
        ...prev,
        [postId]: (prev[postId] ?? []).map(c =>
          c.id === commentId ? { ...c, isLiked: result.liked, likeCount: result.likeCount } : c
        ),
      }));
    } catch {
      setCommentsMap(prev => ({
        ...prev,
        [postId]: (prev[postId] ?? []).map(c =>
          c.id === commentId ? { ...c, isLiked: !c.isLiked, likeCount: c.isLiked ? c.likeCount - 1 : c.likeCount + 1 } : c
        ),
      }));
    } finally {
      setLikingCommentIds(prev => { const s = new Set(prev); s.delete(commentId); return s; });
    }
  };

  // ── Stories ───────────────────────────────────────────────────────────────────

  const openStory = async (index: number) => {
    setViewingStoryIndex(index);
    const story = stories[index];
    if (!story.hasViewed && token) {
      postsService.viewStory(story.id, token).catch(() => {});
      setStories(prev => prev.map((s, i) => i === index ? { ...s, hasViewed: true } : s));
    }
  };

  const handleCreateStory = async () => {
    if (!storyText.trim() && !storyImage) return;
    if (!token) return;
    setIsPostingStory(true);
    try {
      const created = await postsService.createStory(storyText.trim() || null, storyImage, token);
      setStories(prev => [created, ...prev]);
      setStoryText(''); setStoryImage(null); setShowStoryModal(false);
      showToast('Story posted!', 'success');
    } catch (e: any) {
      showToast(e.message ?? 'Failed to post story', 'error');
    } finally { setIsPostingStory(false); }
  };

  const pickImage = async (forStory = false) => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, base64: true });
    if (!res.canceled && res.assets[0]) {
      const asset = res.assets[0];
      const b64 = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
      if (forStory) setStoryImage(b64); else setNewPostImage(b64);
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────────

  const currentUserInitials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '??';

  const forYouFeed = mergeWithML(posts, mlPosts);
  const viewingStory = viewingStoryIndex !== null ? stories[viewingStoryIndex] : null;

  // ── Post card renderer ────────────────────────────────────────────────────────

  const renderPost = (post: Post) => (
    <View key={post.id} style={s.postCard}>
      {/* Header */}
      <View style={s.postHdr}>
        <View style={s.avatar}>
          {post.authorPicture
            ? <Image source={{ uri: resolveUrl(post.authorPicture)! }} style={s.avatarImg} />
            : <Text style={s.avatarTxt}>{post.authorInitials}</Text>}
        </View>
        <View style={s.postHdrInfo}>
          <Text style={s.authorName}>{post.authorName}</Text>
          <View style={s.metaRow}>
            <Text style={s.timeTxt}>{relativeTime(post.createdAt)}</Text>
            {post.isML && (
              <View style={s.mlBadge}><Text style={s.mlBadgeTxt}>✨ Suggested</Text></View>
            )}
          </View>
        </View>
        <TouchableOpacity 
          onPress={() => setPostOptionsPost(post)} 
          style={s.menuBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MoreHorizontal size={22} color={C.gray600} />
        </TouchableOpacity>
      </View>

      {editingPostId === post.id ? (
        <View style={s.editPostWrap}>
          <TextInput
            style={s.editPostInput}
            value={editPostText}
            onChangeText={setEditPostText}
            autoFocus
            multiline
          />
          <View style={s.editPostBtns}>
            <TouchableOpacity onPress={() => setEditingPostId(null)} style={s.editCancelBtn}>
              <Text style={s.editCancelTxt}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSavePostEdit} style={s.editSaveBtn} disabled={isSavingEdit}>
              {isSavingEdit ? <ActivityIndicator size="small" color={C.white} /> : (
                <>
                  <Check size={14} color={C.white} />
                  <Text style={s.editSaveTxt}>Save</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <Text style={s.postContent}>{post.content}</Text>
      )}

      {post.imageUrl && (
        <Image source={{ uri: resolveUrl(post.imageUrl)! }} style={s.postImage} resizeMode="cover" />
      )}

      {post.documentUrl && (
        <TouchableOpacity style={s.docCard} onPress={() => { /* Open doc */ }}>
          <View style={s.docIconWrap}><FileText size={20} color={C.violet600} /></View>
          <View style={{ flex: 1 }}>
            <Text style={s.docName} numberOfLines={1}>Document Attachment</Text>
            <Text style={s.docSize}>Tap to view</Text>
          </View>
          <ExternalLink size={16} color={C.gray400} />
        </TouchableOpacity>
      )}

      {post.pollQuestion && (
        <View style={s.pollCard}>
          <Text style={s.pollQuestion}>{post.pollQuestion}</Text>
          {(() => {
            const options = post.pollOptions?.split(',') || [];
            const results = post.pollResults || {};
            const totalVotes = Object.values(results).reduce((a, b) => a + b, 0);
            
            return options.map((opt, i) => {
              const cleanOpt = opt.trim();
              const votes = results[cleanOpt] || 0;
              const percent = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
              const isSelected = post.userPollVote === cleanOpt;
              
              return (
                <TouchableOpacity
                  key={i}
                  style={[s.pollOpt, isSelected && { borderColor: C.violet600, borderWidth: 1.5 }]}
                  onPress={() => handleVote(post.id, cleanOpt)}
                >
                  <View style={[s.pollOptBg, { width: `${percent}%` }]} />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', zIndex: 1, paddingHorizontal: 12, paddingVertical: 12 }}>
                    <Text style={[s.pollOptTxt, isSelected && { color: C.violet600, fontWeight: '700' }]}>{cleanOpt}</Text>
                    {totalVotes > 0 && <Text style={s.pollPercent}>{percent}%</Text>}
                  </View>
                </TouchableOpacity>
              );
            });
          })()}
          {post.pollResults && (
            <Text style={{ fontSize: 11, color: C.gray400, marginTop: 4 }}>
              {Object.values(post.pollResults).reduce((a, b) => a + b, 0)} votes
            </Text>
          )}
        </View>
      )}

      {/* Interaction bar */}
      <View style={s.interBar}>
        <View style={s.interLeft}>
          <TouchableOpacity 
            style={s.interBtn} 
            onPress={() => handleLike(post.id)}
            disabled={likingIds.has(post.id)}
          >
            <Heart size={20} color={post.isLiked ? C.red600 : C.gray600} fill={post.isLiked ? C.red600 : 'transparent'} />
            <Text style={[s.interTxt, post.isLiked && { color: C.red600 }]}>{post.likeCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.interBtn} onPress={() => toggleComments(post.id)}>
            <MessageCircle size={20} color={C.gray600} />
            <Text style={s.interTxt}>{post.commentCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.interBtn} onPress={() => { if (!isLoggedIn) { setShowLoginPrompt(true); return; } setRepostOptionsPost(post); }}>
            <Repeat2 size={20} color={C.gray600} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={s.interBtn} onPress={() => { if (!isLoggedIn) { setShowLoginPrompt(true); return; } setSharingPost(post); }}>
          <Share2 size={20} color={C.gray600} />
        </TouchableOpacity>
      </View>

      {/* Comments section */}
      {openComments === post.id && (
        <View style={s.commentsSection}>
          {loadingCommentIds.has(post.id) ? (
            <ActivityIndicator size="small" color={C.violet600} style={{ marginVertical: 10 }} />
          ) : (commentsMap[post.id] ?? []).length === 0 ? (
            <Text style={s.noCommentsTxt}>No comments yet. Be the first!</Text>
          ) : (
            <View style={s.commentsSection}>
              {(commentsMap[post.id] ?? []).map(c => (
                <View key={c.id} style={s.commentRow}>
                  <View style={s.commentAvatar}><Text style={s.commentAvatarTxt}>{c.authorInitials}</Text></View>
                  <View style={s.commentBody}>
                    {editingCommentId === c.id ? (
                      <View style={s.editCommentWrap}>
                        <TextInput
                          style={s.editCommentInput}
                          value={editCommentText}
                          onChangeText={setEditCommentText}
                          autoFocus
                          multiline
                        />
                        <View style={s.editCommentBtns}>
                          <TouchableOpacity onPress={() => setEditingCommentId(null)} style={s.editCancelBtn}>
                            <Text style={s.editCancelTxt}>Cancel</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleSaveCommentEdit(post.id, c.id)} style={s.editSaveBtn}>
                            <Check size={14} color={C.white} />
                            <Text style={s.editSaveTxt}>Save</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <View style={s.commentBubble}>
                        <Text style={s.commentAuthor}>{c.authorName}</Text>
                        <Text style={s.commentTxt}>{c.content}</Text>
                        <View style={s.commentFooter}>
                          <Text style={s.commentTime}>{relativeTime(c.createdAt)}</Text>
                          {/* Comment like */}
                          <TouchableOpacity
                            style={s.commentLikeBtn}
                            onPress={() => handleCommentLike(post.id, c.id)}
                            disabled={likingCommentIds.has(c.id)}
                          >
                            <Heart size={12} color={c.isLiked ? C.red600 : C.gray400} fill={c.isLiked ? C.red600 : 'transparent'} />
                            {c.likeCount > 0 && <Text style={[s.commentLikeCount, c.isLiked && { color: C.red600 }]}>{c.likeCount}</Text>}
                          </TouchableOpacity>
                          {/* Edit/Delete own comment */}
                          {(c.isMine || (user && c.authorId === user.id)) && (
                            <View style={s.commentActions}>
                              <TouchableOpacity onPress={() => { setEditingCommentId(c.id); setEditCommentText(c.content); }} style={s.commentMenuBtn}>
                                <Edit3 size={16} color={C.gray600} />
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => requestDeleteComment(post.id, c.id)} style={[s.commentMenuBtn, { marginLeft: 6 }]}>
                                <Trash2 size={16} color={C.red600} />
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
          <View style={s.commentInput}>
            <TextInput
              style={s.commentField}
              placeholder="Add a comment..."
              placeholderTextColor={C.gray400}
              value={commentInputs[post.id] ?? ''}
              onChangeText={v => setCommentInputs(prev => ({ ...prev, [post.id]: v }))}
              onSubmitEditing={() => handleAddComment(post.id)}
              returnKeyType="send"
              editable={submittingCommentId !== post.id}
            />
            <TouchableOpacity onPress={() => handleAddComment(post.id)} disabled={submittingCommentId === post.id}>
              {submittingCommentId === post.id
                ? <ActivityIndicator size="small" color={C.violet600} />
                : <Send size={18} color={C.violet600} />}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  // ── Stories row ───────────────────────────────────────────────────────────────

  const renderStoriesRow = () => (
    <View style={s.storiesContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.storiesRow} contentContainerStyle={s.storiesContent}>
        {isLoggedIn && (
          <TouchableOpacity style={s.storyItem} onPress={() => setShowStoryModal(true)}>
            <View style={s.storyCard}>
              <View style={s.storyAvatarWrap}>
                <Text style={s.storyAvatarTxt}>{currentUserInitials}</Text>
                <View style={s.storyAddBadge}><Plus size={10} color={C.white} /></View>
              </View>
              <Text style={s.storyName}>Your Story</Text>
            </View>
          </TouchableOpacity>
        )}
        {stories.map((story, index) => (
          <TouchableOpacity key={story.id} style={s.storyItem} onPress={() => openStory(index)}>
            <View style={[s.storyCard, !story.hasViewed && s.storyCardUnread]}>
              <View style={s.storyAvatarWrap}>
                {story.userPicture ? (
                  <Image source={{ uri: resolveUrl(story.userPicture)! }} style={s.storyAvatarImg} />
                ) : (
                  <Text style={s.storyAvatarTxt}>{story.userInitials}</Text>
                )}
              </View>
              <Text style={s.storyName} numberOfLines={1}>{story.userName}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderSuggestedConnections = () => {
    if (!showSuggestedPrompt || suggestedUsers.length === 0) return null;
    return (
      <View style={s.suggestedCard}>
        <View style={s.suggestedHdr}>
          <Text style={s.suggestedTitle}>Suggested for you</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.suggestedListContent}>
          {suggestedUsers.map(u => (
            <View key={u.id} style={s.suggestedItem}>
              <TouchableOpacity style={s.suggestedItemClose} onPress={() => setSuggestedUsers(prev => prev.filter(user => user.id !== u.id))}>
                <X size={14} color={C.gray400} />
              </TouchableOpacity>
              <View style={s.suggestedAvatar}>
                {u.profilePicture ? (
                  <Image source={{ uri: resolveUrl(u.profilePicture)! }} style={s.suggestedAvatarImg} />
                ) : (
                  <Text style={s.suggestedAvatarTxt}>{u.initials}</Text>
                )}
              </View>
              <Text style={s.suggestedName} numberOfLines={1}>{u.name}</Text>
              <Text style={s.suggestedBio} numberOfLines={1}>{u.bio ?? 'Suggested for you'}</Text>
              <TouchableOpacity
                style={[s.suggestedBtn, requestedUserIds.has(u.id) && s.suggestedBtnRequested]}
                onPress={() => {
                  setRequestedUserIds(prev => new Set(prev).add(u.id));
                  showToast(`Request sent to ${u.name}`, 'success');
                }}
                disabled={requestedUserIds.has(u.id)}
              >
                <Text style={[s.suggestedBtnTxt, requestedUserIds.has(u.id) && s.suggestedBtnTxtRequested]}>
                  {requestedUserIds.has(u.id) ? 'Requested' : 'Connect'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────────

  return (
    <View style={s.screen}>
      {/* Tabs */}
      <View style={s.tabs}>
        {(['for_you', 'following'] as const).map(t => (
          <TouchableOpacity
            key={t}
            style={s.tabBtn}
            onPress={() => {
              if (t === 'following' && !isLoggedIn) { setShowLoginPrompt(true); return; }
              setTab(t);
            }}
          >
            <Text style={[s.tabTxt, tab === t && s.tabTxtActive]}>
              {t === 'for_you' ? 'For You' : 'Following'}
            </Text>
            {tab === t && <View style={s.tabUnder} />}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[C.violet600]} tintColor={C.violet600} />}
      >


        {/* Feed */}
        {isLoading ? (
          <ActivityIndicator size="large" color={C.violet600} style={{ marginTop: 48 }} />
        ) : tab === 'for_you' ? (
          forYouFeed.length === 0
            ? <View style={s.empty}><Text style={s.emptyTxt}>No posts yet. Be the first!</Text></View>
            : forYouFeed.map((p, i) => (
                <React.Fragment key={p.id}>
                  {renderPost(p)}
                  {i === 1 && renderSuggestedConnections()}
                </React.Fragment>
              ))
        ) : (
          <>
            {renderStoriesRow()}
            {!isLoggedIn
              ? <View style={s.empty}><Text style={s.emptyTxt}>Log in to see posts from people you follow.</Text></View>
              : followingPosts.length === 0
                ? <View style={s.empty}><Text style={s.emptyTxt}>No posts yet from your connections.{'\n'}Connect with people to see their posts here.</Text></View>
                : followingPosts.map((p, i) => (
                    <React.Fragment key={p.id}>
                      {renderPost(p)}
                      {i === 1 && renderSuggestedConnections()}
                    </React.Fragment>
                  ))}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB menu */}
      <View style={s.fabContainer}>
        {showFabMenu && (
          <>
            <TouchableOpacity style={s.fabMenuItem} onPress={() => { setShowFabMenu(false); setShowStoryModal(true); }}>
              <Camera size={15} color={C.violet600} />
              <Text style={s.fabMenuTxt}>Add Story</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.fabMenuItem} onPress={() => { setShowFabMenu(false); setRepostContent(''); setShowPostModal(true); }}>
              <MessageCircle size={15} color={C.violet600} />
              <Text style={s.fabMenuTxt}>Create Post</Text>
            </TouchableOpacity>
          </>
        )}
        <TouchableOpacity
          style={[s.fab, showFabMenu && s.fabActive]}
          onPress={() => { if (!isLoggedIn) { setShowLoginPrompt(true); return; } setShowFabMenu(v => !v); }}
        >
          <Plus size={24} color={C.white} style={{ transform: [{ rotate: showFabMenu ? '45deg' : '0deg' }] }} />
        </TouchableOpacity>
      </View>

      {/* Modals */}
      <Modal visible={showPostModal} transparent animationType="slide" onRequestClose={() => { setShowPostModal(false); setRepostContent(''); setNewPostContent(''); setNewPostImage(null); setNewPostDoc(null); setIsPollMode(false); }}>
        <KeyboardAvoidingView style={s.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => { setShowPostModal(false); setRepostContent(''); setNewPostContent(''); setNewPostImage(null); setNewPostDoc(null); setIsPollMode(false); }} />
          <View style={s.postModal}>
            <View style={s.postModalHdr}>
              <TouchableOpacity onPress={() => { setShowPostModal(false); setRepostContent(''); setNewPostContent(''); setNewPostImage(null); setNewPostDoc(null); setIsPollMode(false); }}>
                <X size={22} color={C.gray700} />
              </TouchableOpacity>
              <Text style={s.postModalTitle}>{repostContent ? 'Repost' : 'Create Post'}</Text>
              <TouchableOpacity
                style={[s.postBtn, ((!newPostContent.trim() && !newPostImage && !repostContent && !isPollMode && !newPostDoc) || isPosting) && s.postBtnDisabled]}
                onPress={handleCreatePost}
                disabled={(!newPostContent.trim() && !newPostImage && !repostContent && !isPollMode && !newPostDoc) || isPosting}
              >
                {isPosting ? <ActivityIndicator size="small" color={C.white} /> : <Text style={s.postBtnTxt}>{repostContent ? 'Repost' : 'Post'}</Text>}
              </TouchableOpacity>
            </View>
            <ScrollView style={s.postModalBody}>
              <View style={s.postAuthorHeader}>
                <View style={s.postAuthorAvatar}><Text style={s.postAuthorTxt}>{currentUserInitials}</Text></View>
                <View>
                  <Text style={s.postAuthorName}>{user?.name ?? 'You'}</Text>
                  <TouchableOpacity style={s.audienceBtn} onPress={() => setPostVisibility(postVisibility === 'EVERYONE' ? 'FOLLOWERS' : 'EVERYONE')}>
                    {postVisibility === 'EVERYONE' ? <Globe size={12} color={C.violet600} /> : <Users size={12} color={C.violet600} />}
                    <Text style={s.audienceBtnTxt}>{postVisibility === 'EVERYONE' ? 'Everyone' : 'Followers only'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {repostContent ? (
                <View style={s.repostPreview}><Text style={s.repostPreviewTxt} numberOfLines={3}>{repostContent}</Text></View>
              ) : null}

              <TextInput 
                style={s.postTextInput} 
                placeholder={repostContent ? 'Add your comment (optional)...' : "What's on your mind?"} 
                placeholderTextColor={C.gray400} 
                value={newPostContent} 
                onChangeText={setNewPostContent} 
                multiline 
                autoFocus={!repostContent} 
              />

              {newPostImage && (
                <View style={s.selectedImgWrap}>
                  <Image source={{ uri: newPostImage }} style={s.selectedImg} />
                  <TouchableOpacity style={s.removeImg} onPress={() => setNewPostImage(null)}><X size={16} color={C.white} /></TouchableOpacity>
                </View>
              )}

              {newPostDoc && (
                <View style={s.selectedDocWrap}>
                  <FileText size={24} color={C.violet600} />
                  <Text style={s.selectedDocName} numberOfLines={1}>{newPostDoc.name}</Text>
                  <TouchableOpacity onPress={() => setNewPostDoc(null)}><X size={18} color={C.gray500} /></TouchableOpacity>
                </View>
              )}

              {isPollMode && (
                <View style={s.pollEditor}>
                  <Text style={s.pollEditorTitle}>Create Poll</Text>
                  <TextInput
                    style={s.pollQuestionInput}
                    placeholder="Ask a question..."
                    value={pollQuestion}
                    onChangeText={setPollQuestion}
                  />
                  {pollOptions.map((opt, i) => (
                    <View key={i} style={s.pollOptRow}>
                      <TextInput
                        style={s.pollOptInput}
                        placeholder={`Option ${i + 1}`}
                        value={opt}
                        onChangeText={text => {
                          const next = [...pollOptions];
                          next[i] = text;
                          setPollOptions(next);
                        }}
                      />
                      {pollOptions.length > 2 && (
                        <TouchableOpacity onPress={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))}>
                          <X size={16} color={C.gray400} />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                  {pollOptions.length < 5 && (
                    <TouchableOpacity style={s.addPollOpt} onPress={() => setPollOptions([...pollOptions, ''])}>
                      <PlusCircle size={16} color={C.violet600} />
                      <Text style={s.addPollOptTxt}>Add Option</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={s.removePoll} onPress={() => setIsPollMode(false)}>
                    <Text style={s.removePollTxt}>Remove Poll</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
            <View style={s.postModalFooter}>
              <View style={s.mediaTools}>
                <TouchableOpacity onPress={() => pickImage(false)} style={s.mediaToolBtn}>
                  <Camera size={20} color={C.violet600} />
                </TouchableOpacity>
                <TouchableOpacity onPress={pickDocument} style={s.mediaToolBtn}>
                  <FileText size={20} color={C.violet600} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setIsPollMode(true)} style={s.mediaToolBtn}>
                  <BarChart3 size={20} color={C.violet600} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showStoryModal} transparent animationType="fade" onRequestClose={() => { setShowStoryModal(false); setStoryText(''); setStoryImage(null); }}>
        <View style={s.storyCreator}>
          <LinearGradient colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)']} style={StyleSheet.absoluteFill} />
          
          <View style={s.storyCreatorHdr}>
            <TouchableOpacity onPress={() => { setShowStoryModal(false); setStoryText(''); setStoryImage(null); }} style={s.storyCreatorClose}>
              <X size={28} color={C.white} />
            </TouchableOpacity>
            <Text style={s.storyCreatorTitle}>New Story</Text>
            <TouchableOpacity
              style={[s.storyCreatorPostBtn, ((!storyText.trim() && !storyImage) || isPostingStory) && s.postBtnDisabled]}
              onPress={handleCreateStory}
              disabled={(!storyText.trim() && !storyImage) || isPostingStory}
            >
              {isPostingStory ? <ActivityIndicator size="small" color={C.white} /> : <Text style={s.storyCreatorPostTxt}>Share</Text>}
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={s.storyCreatorContent}>
              <View style={s.storyPreviewContainer}>
                {storyImage ? (
                  <View style={s.storyPreviewImgWrap}>
                    <Image source={{ uri: storyImage }} style={s.storyPreviewImg} resizeMode="cover" />
                    <TouchableOpacity style={s.storyPreviewRemove} onPress={() => setStoryImage(null)}><X size={20} color={C.white} /></TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={s.storyPlaceholder} onPress={() => pickImage(true)}>
                    <Camera size={48} color={C.white} style={{ opacity: 0.6 }} />
                    <Text style={s.storyPlaceholderTxt}>Tap to add photo</Text>
                  </TouchableOpacity>
                )}
                
                <TextInput
                  style={s.storyCreatorInput}
                  placeholder="Type a caption..."
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  value={storyText}
                  onChangeText={setStoryText}
                  multiline
                  maxLength={200}
                />
              </View>
            </ScrollView>
            
            <View style={s.storyCreatorFooter}>
              <TouchableOpacity style={s.storyCreatorTool} onPress={() => pickImage(true)}>
                <View style={s.storyCreatorToolIcon}><Camera size={22} color={C.white} /></View>
                <Text style={s.storyCreatorToolTxt}>Camera</Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }} />
              <Text style={s.storyCreatorExpiry}>Visible for 24 hours</Text>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal visible={!!sharingPost} transparent animationType="slide" onRequestClose={() => setSharingPost(null)}>
        <TouchableOpacity style={s.shareOverlay} activeOpacity={1} onPress={() => setSharingPost(null)}>
          <View style={s.shareSheet}>
            <View style={s.shareHandleBar} />
            <Text style={s.shareTitle}>Share Post</Text>
            <TouchableOpacity style={s.shareOption} onPress={() => sharingPost && handleShareToChat(sharingPost)}>
              <View style={s.shareOptionIcon}><MessageSquare size={20} color={C.violet600} /></View>
              <View><Text style={s.shareOptionTitle}>Share to Chat</Text><Text style={s.shareOptionSub}>Send inside the app</Text></View>
            </TouchableOpacity>
            <TouchableOpacity style={s.shareOption} onPress={() => {
              const post = sharingPost;
              setSharingPost(null);
              if (post) setRepostOptionsPost(post);
            }}>
              <View style={s.shareOptionIcon}><Repeat2 size={20} color={C.violet600} /></View>
              <View><Text style={s.shareOptionTitle}>Repost</Text><Text style={s.shareOptionSub}>Share to your feed</Text></View>
            </TouchableOpacity>
            <TouchableOpacity style={s.shareOption} onPress={() => sharingPost && handleShareExternal(sharingPost)}>
              <View style={s.shareOptionIcon}><ExternalLink size={20} color={C.violet600} /></View>
              <View><Text style={s.shareOptionTitle}>Share via...</Text><Text style={s.shareOptionSub}>Other apps</Text></View>
            </TouchableOpacity>
            <TouchableOpacity style={s.shareCancelBtn} onPress={() => setSharingPost(null)}>
              <Text style={s.shareCancelTxt}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={!!postOptionsPost} transparent animationType="fade" onRequestClose={() => setPostOptionsPost(null)}>
        <TouchableOpacity style={s.shareOverlay} activeOpacity={1} onPress={() => setPostOptionsPost(null)}>
          <View style={s.shareSheet}>
            <View style={s.shareHandleBar} />
            <Text style={s.shareTitle}>Post Options</Text>
            { (postOptionsPost?.isMine || (user && postOptionsPost?.authorId === user.id)) ? (
              <>
                <TouchableOpacity style={s.shareOption} onPress={() => {
                  const p = postOptionsPost;
                  setPostOptionsPost(null);
                  if (p) { setEditingPostId(p.id); setEditPostText(p.content); }
                }}>
                  <View style={s.shareOptionIcon}><Edit3 size={20} color={C.violet600} /></View>
                  <View><Text style={s.shareOptionTitle}>Edit Post</Text><Text style={s.shareOptionSub}>Update your content</Text></View>
                </TouchableOpacity>
                <TouchableOpacity style={s.shareOption} onPress={() => {
                  const p = postOptionsPost;
                  setPostOptionsPost(null);
                  if (p) requestDeletePost(p.id);
                }}>
                  <View style={[s.shareOptionIcon, { backgroundColor: '#FEE2E2' }]}><Trash2 size={20} color={C.red600} /></View>
                  <View><Text style={[s.shareOptionTitle, { color: C.red600, fontWeight: '700' }]}>DELETE POST</Text><Text style={s.shareOptionSub}>Permanently remove this post</Text></View>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity style={s.shareOption} onPress={() => {
                const p = postOptionsPost;
                setPostOptionsPost(null);
                if (p) setReportingPost(p);
              }}>
                <View style={s.shareOptionIcon}><Flag size={20} color={C.violet600} /></View>
                <View><Text style={s.shareOptionTitle}>Report Post</Text><Text style={s.shareOptionSub}>Flag inappropriate content</Text></View>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={!!repostOptionsPost} transparent animationType="slide" onRequestClose={() => setRepostOptionsPost(null)}>
        <TouchableOpacity style={s.shareOverlay} activeOpacity={1} onPress={() => setRepostOptionsPost(null)}>
          <View style={s.shareSheet}>
            <View style={s.shareHandleBar} />
            <Text style={s.shareTitle}>Repost</Text>
            <TouchableOpacity style={s.shareOption} onPress={() => {
              const post = repostOptionsPost;
              setRepostOptionsPost(null);
              if (post) handleInstantRepost(post);
            }}>
              <View style={s.shareOptionIcon}><Repeat2 size={20} color={C.violet600} /></View>
              <View><Text style={s.shareOptionTitle}>Repost</Text><Text style={s.shareOptionSub}>Instantly share to your feed</Text></View>
            </TouchableOpacity>
            <TouchableOpacity style={s.shareOption} onPress={() => {
              const post = repostOptionsPost;
              setRepostOptionsPost(null);
              if (post) handleOpenRepost(post);
            }}>
              <View style={s.shareOptionIcon}><Edit3 size={20} color={C.violet600} /></View>
              <View><Text style={s.shareOptionTitle}>Quote</Text><Text style={s.shareOptionSub}>Repost with your thoughts</Text></View>
            </TouchableOpacity>
            <TouchableOpacity style={s.shareCancelBtn} onPress={() => setRepostOptionsPost(null)}>
              <Text style={s.shareCancelTxt}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={!!confirmDeleteType} transparent animationType="fade">
        <View style={s.modalOverlayCenter}>
          <View style={s.confirmModal}>
            <Text style={s.confirmTitle}>Delete {confirmDeleteType === 'post' ? 'Post' : 'Comment'}</Text>
            <Text style={s.confirmSubtitle}>Are you sure you want to delete this {confirmDeleteType === 'post' ? 'post' : 'comment'}? This action cannot be undone.</Text>
            <View style={s.confirmBtns}>
              <TouchableOpacity style={s.confirmCancelBtn} onPress={() => { setConfirmDeleteType(null); setDeleteTargetId(null); }}>
                <Text style={s.confirmCancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.confirmDeleteBtn} onPress={executeDelete}>
                <Text style={s.confirmDeleteTxt}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!reportingPost} transparent animationType="slide" onRequestClose={() => setReportingPost(null)}>
        <TouchableOpacity style={s.shareOverlay} activeOpacity={1} onPress={() => setReportingPost(null)}>
          <View style={s.reportSheet}>
            <View style={s.shareHandleBar} />
            <Text style={s.reportHeaderTitle}>Report Post</Text>
            <Text style={s.reportHeaderSubtitle}>Please select a reason for reporting this post. This helps us keep the community safe.</Text>
            
            <ScrollView style={s.reportList}>
              {REPORT_REASONS.map(reason => (
                <TouchableOpacity
                  key={reason}
                  style={[s.reportItem, reportReason === reason && s.reportItemSelected]}
                  onPress={() => setReportReason(reason)}
                >
                  <Text style={[s.reportItemTxt, reportReason === reason && s.reportItemTxtSelected]}>{reason}</Text>
                  <View style={[s.reportItemCircle, reportReason === reason && s.reportItemCircleSelected]}>
                    {reportReason === reason && <Check size={12} color={C.white} />}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <View style={s.reportFooter}>
              <TouchableOpacity style={s.reportCancelBtn} onPress={() => setReportingPost(null)}>
                <Text style={s.reportCancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.reportActionBtn, (!reportReason || isSubmittingReport) && s.postBtnDisabled]}
                onPress={handleSubmitReport}
                disabled={!reportReason || isSubmittingReport}
              >
                {isSubmittingReport ? <ActivityIndicator size="small" color={C.white} /> : <Text style={s.reportActionTxt}>Submit Report</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={viewingStoryIndex !== null} transparent animationType="fade" onRequestClose={() => setViewingStoryIndex(null)}>
        <View style={s.storyViewer}>
          {viewingStory && viewingStoryIndex !== null && (() => {
            const idx = viewingStoryIndex;
            return (
              <>
                <View style={s.storyProgress}>
                  {stories.map((_, i) => (
                    <View key={i} style={[s.storyProgressBar, i === idx && s.storyProgressBarActive]} />
                  ))}
                </View>
                <View style={s.storyViewerHdr}>
                  <View style={s.storyViewerAvatar}><Text style={s.storyViewerAvatarTxt}>{viewingStory.userInitials}</Text></View>
                  <View>
                    <Text style={s.storyViewerName}>{viewingStory.userName}</Text>
                    <Text style={s.storyViewerTime}>{relativeTime(viewingStory.createdAt)}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setViewingStoryIndex(null)} style={{ marginLeft: 'auto' }}>
                    <X size={24} color={C.white} />
                  </TouchableOpacity>
                </View>
                <View style={s.storyContent}>
                  {viewingStory.mediaUrl && (
                    <Image source={{ uri: resolveUrl(viewingStory.mediaUrl)! }} style={s.storyMedia} resizeMode="contain" />
                  )}
                  {viewingStory.textContent && (
                    <View style={s.storyTextWrap}><Text style={s.storyTextContent}>{viewingStory.textContent}</Text></View>
                  )}
                </View>
                <View style={s.storyNav}>
                  <TouchableOpacity style={s.storyNavBtn} onPress={() => idx > 0 && openStory(idx - 1)} disabled={idx === 0}>
                    {idx > 0 && <ChevronLeft size={32} color={C.white} />}
                  </TouchableOpacity>
                  <TouchableOpacity style={s.storyNavBtn} onPress={() => idx < stories.length - 1 ? openStory(idx + 1) : setViewingStoryIndex(null)}>
                    {idx < stories.length - 1 ? <ChevronRight size={32} color={C.white} /> : <X size={32} color={C.white} />}
                  </TouchableOpacity>
                </View>
              </>
            );
          })()}
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.gray50 },

  // Tabs
  tabs: { flexDirection: 'row', backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.gray200 },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', position: 'relative' },
  tabTxt: { fontSize: 14, fontWeight: '500', color: C.gray600 },
  tabTxtActive: { color: C.violet600, fontWeight: '700' },
  tabUnder: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, backgroundColor: C.violet600 },

  // Stories row
  storiesRow: { backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.gray100 },
  storiesContent: { paddingHorizontal: 12, paddingVertical: 12, gap: 12 },
  storyItem: { alignItems: 'center', gap: 4, width: 64 },

  // Post card
  postCard: { backgroundColor: C.white, marginBottom: 8, padding: 16, borderBottomWidth: 1, borderBottomColor: C.gray100 },
  postHdr: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.violet600, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg: { width: 40, height: 40, borderRadius: 20 },
  avatarTxt: { color: C.white, fontWeight: '700', fontSize: 14 },
  postHdrInfo: { flex: 1 },
  authorName: { fontSize: 14, fontWeight: '700', color: C.gray900 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  timeTxt: { fontSize: 11, color: C.gray500 },
  mlBadge: { backgroundColor: C.violet50, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8 },
  mlBadgeTxt: { fontSize: 10, color: C.violet600, fontWeight: '600' },
  menuBtn: { padding: 4 },
  postContent: { fontSize: 14, color: C.gray800, lineHeight: 20, marginBottom: 10 },
  postImage: { width: '100%', height: 220, borderRadius: 12, marginBottom: 10 },

  // Interaction bar
  interBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 },
  interLeft: { flexDirection: 'row', gap: 4 },
  interBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  interTxt: { fontSize: 12, fontWeight: '700', color: C.gray600 },

  // Comments
  commentsSection: { marginTop: 10, borderTopWidth: 1, borderTopColor: C.gray100, paddingTop: 10, gap: 8 },
  noCommentsTxt: { fontSize: 13, color: C.gray400, textAlign: 'center', paddingVertical: 8 },
  commentRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  commentAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.violet100, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  commentAvatarTxt: { fontSize: 11, fontWeight: '700', color: C.violet600 },
  commentBody: { flex: 1 },
  commentBubble: { backgroundColor: C.gray50, borderRadius: 12, padding: 9 },
  commentAuthor: { fontSize: 12, fontWeight: '700', color: C.gray900 },
  commentTxt: { fontSize: 13, color: C.gray700, marginTop: 2 },
  commentFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 5, gap: 10 },
  commentTime: { fontSize: 10, color: C.gray400, flex: 1 },
  commentLikeBtn: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  commentLikeCount: { fontSize: 11, color: C.gray400 },
  commentActions: { flexDirection: 'row', gap: 8 },
  commentMenuBtn: { padding: 4 },
  editCommentWrap: { gap: 6 },
  editCommentInput: { backgroundColor: C.gray50, borderRadius: 10, padding: 8, fontSize: 13, color: C.gray900, borderWidth: 1, borderColor: C.violet300, minHeight: 40 },
  editCommentBtns: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  editCancelBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10, backgroundColor: C.gray100 },
  editCancelTxt: { fontSize: 12, color: C.gray600, fontWeight: '600' },
  editSaveBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10, backgroundColor: C.violet600 },
  editSaveTxt: { fontSize: 12, color: C.white, fontWeight: '600' },
  editPostWrap: { gap: 8, marginBottom: 10 },
  editPostInput: { backgroundColor: C.gray50, borderRadius: 12, padding: 12, fontSize: 14, color: C.gray900, borderWidth: 1, borderColor: C.violet300, minHeight: 80, textAlignVertical: 'top' },
  editPostBtns: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  commentInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.gray50, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, gap: 8, marginTop: 4 },
  commentField: { flex: 1, fontSize: 13, color: C.gray900 },

  // FAB
  fabContainer: { position: 'absolute', bottom: 80, right: 16, alignItems: 'flex-end', gap: 10 },
  fab: { width: 56, height: 56, borderRadius: 28, backgroundColor: C.violet600, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: C.violet600, shadowOpacity: 0.4, shadowRadius: 8 },
  fabActive: { backgroundColor: C.gray700 },
  fabMenuItem: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.white, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, borderWidth: 1, borderColor: C.gray100 },
  fabMenuTxt: { fontSize: 13, fontWeight: '600', color: C.gray800 },

  // Empty state
  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  emptyTxt: { fontSize: 14, color: C.gray500, textAlign: 'center', lineHeight: 22 },

  // Modals shared
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  postModal: { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' },
  postModalHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: C.gray100 },
  postModalTitle: { fontSize: 16, fontWeight: '700', color: C.gray900 },
  postBtn: { backgroundColor: C.violet600, paddingHorizontal: 20, paddingVertical: 6, borderRadius: 20, minWidth: 64, alignItems: 'center' },
  postBtnDisabled: { opacity: 0.4 },
  postBtnTxt: { color: C.white, fontWeight: '700', fontSize: 13 },
  postModalBody: { padding: 16 },
  postAuthorAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.violet600, alignItems: 'center', justifyContent: 'center' },
  postAuthorTxt: { color: C.white, fontWeight: '700' },
  postAuthorName: { fontSize: 14, fontWeight: '700', color: C.gray900 },
  postTextInput: { fontSize: 15, color: C.gray900, minHeight: 100, textAlignVertical: 'top', marginBottom: 12 },
  selectedImgWrap: { position: 'relative' },
  selectedImg: { width: '100%', height: 200, borderRadius: 12 },
  removeImg: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 12, padding: 4 },
  postModalFooter: { flexDirection: 'row', alignItems: 'center', padding: 12, borderTopWidth: 1, borderTopColor: C.gray100, gap: 12 },
  mediaBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: C.gray50, borderRadius: 20 },
  mediaBtnTxt: { fontSize: 13, color: C.gray700, fontWeight: '500' },
  storyExpiry: { fontSize: 11, color: C.gray400, marginLeft: 'auto' },
  repostPreview: { backgroundColor: C.violet50, borderLeftWidth: 3, borderLeftColor: C.violet400, borderRadius: 8, padding: 10, marginBottom: 10 },
  repostPreviewTxt: { fontSize: 13, color: C.gray700, lineHeight: 18 },

  // Share sheet
  shareOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  shareSheet: { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 32, gap: 4 },
  shareHandleBar: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.gray200, alignSelf: 'center', marginBottom: 12 },
  shareTitle: { fontSize: 16, fontWeight: '700', color: C.gray900, marginBottom: 8 },
  shareOption: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.gray100 },
  shareOptionIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.violet50, alignItems: 'center', justifyContent: 'center' },
  shareOptionTitle: { fontSize: 15, fontWeight: '600', color: C.gray900 },
  shareOptionSub: { fontSize: 12, color: C.gray500, marginTop: 2 },
  shareCancelBtn: { marginTop: 8, paddingVertical: 14, alignItems: 'center', backgroundColor: C.gray100, borderRadius: 14 },
  shareCancelTxt: { fontSize: 15, fontWeight: '600', color: C.gray700 },

  // Report modal
  reportSheet: { backgroundColor: C.white, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40, maxHeight: '85%', elevation: 20, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 15 },
  reportHeaderTitle: { fontSize: 22, fontWeight: '800', color: C.gray900, marginBottom: 8 },
  reportHeaderSubtitle: { fontSize: 15, color: C.gray500, marginBottom: 24, lineHeight: 22 },
  reportList: { maxHeight: 350 },
  reportItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, paddingHorizontal: 16, marginBottom: 8, borderRadius: 14, backgroundColor: C.gray50 },
  reportItemSelected: { backgroundColor: C.violet50, borderWidth: 1, borderColor: C.violet200 },
  reportItemTxt: { fontSize: 15, color: C.gray700, fontWeight: '600' },
  reportItemTxtSelected: { color: C.violet600 },
  reportItemCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: C.gray300, alignItems: 'center', justifyContent: 'center' },
  reportItemCircleSelected: { backgroundColor: C.violet600, borderColor: C.violet600 },
  reportFooter: { flexDirection: 'row', gap: 14, marginTop: 24 },
  reportCancelBtn: { flex: 1, paddingVertical: 16, alignItems: 'center', backgroundColor: C.gray100, borderRadius: 16 },
  reportCancelTxt: { fontSize: 16, fontWeight: '600', color: C.gray700 },
  reportActionBtn: { flex: 1, paddingVertical: 16, alignItems: 'center', backgroundColor: C.violet600, borderRadius: 16 },
  reportActionTxt: { fontSize: 16, fontWeight: '700', color: C.white },

  // Confirm Delete Modal
  modalOverlayCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  confirmModal: { backgroundColor: C.white, borderRadius: 16, padding: 24, width: '100%', maxWidth: 340, alignItems: 'center' },
  confirmTitle: { fontSize: 18, fontWeight: '700', color: C.gray900, marginBottom: 10 },
  confirmSubtitle: { fontSize: 14, color: C.gray600, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  confirmBtns: { flexDirection: 'row', gap: 12, width: '100%' },
  confirmCancelBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: C.gray100, borderRadius: 12 },
  confirmCancelTxt: { fontSize: 14, fontWeight: '600', color: C.gray700 },
  confirmDeleteBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: C.red600, borderRadius: 12 },
  confirmDeleteTxt: { fontSize: 14, fontWeight: '700', color: C.white },

  // Story viewer
  storyViewer: { flex: 1, backgroundColor: '#000' },
  storyProgress: { flexDirection: 'row', gap: 4, paddingHorizontal: 12, paddingTop: 52, paddingBottom: 8 },
  storyProgressBar: { flex: 1, height: 2, backgroundColor: 'rgba(255,255,255,0.35)', borderRadius: 2 },
  storyProgressBarActive: { backgroundColor: C.white },
  storyViewerHdr: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 12 },
  storyViewerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.violet500, alignItems: 'center', justifyContent: 'center' },
  storyViewerAvatarTxt: { color: C.white, fontWeight: '700', fontSize: 13 },
  storyViewerName: { color: C.white, fontWeight: '700', fontSize: 14 },
  storyViewerTime: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
  storyContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  storyMedia: { width: '100%', height: '70%', borderRadius: 12 },
  storyTextWrap: { backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 16, padding: 20, marginTop: 16, width: '100%' },
  storyTextContent: { color: C.white, fontSize: 20, fontWeight: '600', textAlign: 'center', lineHeight: 28 },
  storyNav: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 40 },
  storyNavBtn: { padding: 12 },

  // Suggested Connections (Instagram Style)
  suggestedCard: { marginVertical: 8, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.gray100, paddingBottom: 16 },
  suggestedHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  suggestedTitle: { fontSize: 14, fontWeight: '700', color: C.gray900 },
  suggestedListContent: { paddingLeft: 16, paddingRight: 8 },
  suggestedItem: { width: 160, backgroundColor: C.white, borderRadius: 12, padding: 16, marginRight: 8, alignItems: 'center', borderWidth: 1, borderColor: C.gray100, position: 'relative' },
  suggestedItemClose: { position: 'absolute', top: 8, right: 8, padding: 4 },
  suggestedAvatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: C.violet100, alignItems: 'center', justifyContent: 'center', marginBottom: 12, overflow: 'hidden' },
  suggestedAvatarImg: { width: '100%', height: '100%' },
  suggestedAvatarTxt: { fontSize: 24, fontWeight: '700', color: C.violet600 },
  suggestedName: { fontSize: 13, fontWeight: '700', color: C.gray900, marginBottom: 2, textAlign: 'center' },
  suggestedBio: { fontSize: 11, color: C.gray500, marginBottom: 14, textAlign: 'center' },
  suggestedBtn: { backgroundColor: C.violet600, paddingHorizontal: 24, paddingVertical: 8, borderRadius: 8, width: '100%', alignItems: 'center' },
  suggestedBtnRequested: { backgroundColor: C.gray100 },
  suggestedBtnTxt: { color: C.white, fontSize: 13, fontWeight: '700' },
  suggestedBtnTxtRequested: { color: C.gray500 },

  // New Post Modal enhancements
  postAuthorHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  audienceBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.violet50, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginTop: 4 },
  audienceBtnTxt: { fontSize: 11, color: C.violet600, fontWeight: '600' },
  mediaTools: { flexDirection: 'row', gap: 16, padding: 8 },
  mediaToolBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.violet50, alignItems: 'center', justifyContent: 'center' },
  selectedDocWrap: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.gray50, padding: 12, borderRadius: 12, marginTop: 12 },
  selectedDocName: { flex: 1, fontSize: 14, color: C.gray700, fontWeight: '500' },
  
  // Poll Editor
  pollEditor: { backgroundColor: C.gray50, borderRadius: 16, padding: 16, marginTop: 16 },
  pollEditorTitle: { fontSize: 14, fontWeight: '700', color: C.gray900, marginBottom: 12 },
  pollQuestionInput: { backgroundColor: C.white, borderRadius: 10, padding: 12, fontSize: 14, color: C.gray900, marginBottom: 12, borderWidth: 1, borderColor: C.gray200 },
  pollOptRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  pollOptInput: { flex: 1, backgroundColor: C.white, borderRadius: 10, padding: 10, fontSize: 13, color: C.gray800, borderWidth: 1, borderColor: C.gray200 },
  addPollOpt: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  addPollOptTxt: { fontSize: 13, color: C.violet600, fontWeight: '600' },
  removePoll: { marginTop: 16, alignSelf: 'center' },
  removePollTxt: { fontSize: 12, color: C.red600, fontWeight: '500' },

  // Poll Display
  pollCard: { marginTop: 12, backgroundColor: C.gray50, borderRadius: 16, padding: 16 },
  pollQuestion: { fontSize: 15, fontWeight: '700', color: C.gray900, marginBottom: 12 },
  pollOpt: { backgroundColor: C.white, borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: C.gray200, position: 'relative', overflow: 'hidden' },
  pollOptTxt: { fontSize: 14, color: C.gray800, fontWeight: '500', zIndex: 1 },
  pollPercent: { fontSize: 13, fontWeight: '700', color: C.violet600, zIndex: 1 },
  pollOptBg: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: C.violet50, width: '0%' }, 

  // Doc Display
  docCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.gray50, padding: 12, borderRadius: 12, marginTop: 12 },
  docIconWrap: { width: 40, height: 40, borderRadius: 10, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
  docName: { fontSize: 14, fontWeight: '600', color: C.gray900 },
  docSize: { fontSize: 12, color: C.gray500 },



  // Story Redesign
  storiesContainer: { backgroundColor: C.white, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.gray100 },
  storyCard: { width: 72, alignItems: 'center', gap: 6 },
  storyCardUnread: { transform: [{ scale: 1.05 }] },
  storyAvatarWrap: { width: 64, height: 64, borderRadius: 32, borderWidth: 3, borderColor: C.violet600, padding: 3, backgroundColor: C.white },
  storyAvatarImg: { width: '100%', height: '100%', borderRadius: 30 },
  storyAvatarTxt: { fontSize: 18, fontWeight: '700', color: C.gray400, textAlign: 'center', marginTop: 15 },
  storyAddBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: C.violet600, borderRadius: 10, width: 20, height: 20, borderWidth: 2, borderColor: C.white, alignItems: 'center', justifyContent: 'center' },
  storyName: { fontSize: 11, color: C.gray700, fontWeight: '600' },

  // Story Creator
  storyCreator: { flex: 1, backgroundColor: '#000' },
  storyCreatorHdr: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, zIndex: 10 },
  storyCreatorClose: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  storyCreatorTitle: { color: C.white, fontSize: 17, fontWeight: '700' },
  storyCreatorPostBtn: { backgroundColor: C.white, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  storyCreatorPostTxt: { color: '#000', fontWeight: '700', fontSize: 13 },
  storyCreatorContent: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 20 },
  storyPreviewContainer: { flex: 1, gap: 24, alignItems: 'center' },
  storyPreviewImgWrap: { width: '100%', height: 450, borderRadius: 24, overflow: 'hidden', backgroundColor: C.gray900, elevation: 10, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 15 },
  storyPreviewImg: { width: '100%', height: '100%' },
  storyPreviewRemove: { position: 'absolute', top: 16, right: 16, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 8 },
  storyPlaceholder: { width: '100%', height: 450, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.1)', borderStyle: 'dashed', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center', gap: 12 },
  storyPlaceholderTxt: { color: C.white, fontSize: 16, fontWeight: '600', opacity: 0.8 },
  storyCreatorInput: { color: C.white, fontSize: 24, fontWeight: '700', textAlign: 'center', width: '100%', maxHeight: 150 },
  storyCreatorFooter: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingBottom: 50, paddingTop: 20 },
  storyCreatorTool: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  storyCreatorToolIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  storyCreatorToolTxt: { color: C.white, fontSize: 15, fontWeight: '600' },
  storyCreatorExpiry: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '500' },
});
