import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Image,
  Modal, StyleSheet, ActivityIndicator, RefreshControl,
  KeyboardAvoidingView, Platform, Share, Alert,
  Animated, PanResponder, Linking, Keyboard,
} from 'react-native';
import {
  Heart, MessageCircle, Share2, Plus, Trash2, X, Send,
  Camera, ChevronLeft, ChevronRight, Repeat2, MessageSquare,
  ExternalLink, MoreHorizontal, Edit3, Flag, Check,
  Globe, Users, FileText, BarChart3, PlusCircle, UserPlus,
  Type, Layout, Sparkles, ChevronDown,
  Star, ArrowRight, Palette,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import ReAnimated, {
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/modals/AppToast';
import { postsService, Post, Comment, Story, SuggestedUser } from '../../services/postsService';
import { profileService } from '../../services/profileService';
import { chatService, Conversation } from '../../services/chatService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { resolveUrl, relativeTime, getInitials } from '../../utils/helpers';
import type { ThemeColors } from '../../components/theme';

// ── Constants ─────────────────────────────────────────────────────────────────

const REPORT_REASONS = [
  'Spam', 'Harassment', 'Misinformation',
  'Inappropriate content', 'Hate speech', 'Other',
];

const STORY_BACKGROUNDS: { colors: readonly [string, string]; label: string; textDark?: boolean }[] = [
  { colors: ['#000000', '#000000'], label: 'Black' },
  { colors: ['#1a1a2e', '#16213e'], label: 'Dark Navy' },
  { colors: ['#7C3AED', '#8B5CF6'], label: 'Violet' },
  { colors: ['#3B82F6', '#2DD4BF'], label: 'Ocean' },
  { colors: ['#F59E0B', '#EF4444'], label: 'Sunset' },
  { colors: ['#10B981', '#3B82F6'], label: 'Nature' },
  { colors: ['#FF6B6B', '#FF8E53'], label: 'Coral' },
];
// Keep the old alias for viewer which uses it by index
const STORY_GRADIENTS = STORY_BACKGROUNDS.map(b => b.colors);

const STORY_FONTS = [
  { name: 'Modern', family: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif-medium', weight: '500' },
  { name: 'Classic', family: Platform.OS === 'ios' ? 'Georgia' : 'serif', weight: '400' },
  { name: 'Bold', family: Platform.OS === 'ios' ? 'Arial-BoldMT' : 'sans-serif-condensed', weight: '900' },
  { name: 'Serif', family: Platform.OS === 'ios' ? 'Times New Roman' : 'serif', weight: '700' },
  { name: 'Mono', family: Platform.OS === 'ios' ? 'Courier' : 'monospace', weight: '400' },
] as const;


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
  const { C } = useTheme();
  const insets = useSafeAreaInsets();
  const s = useMemo(() => createStyles(C), [C]);
  const router = useRouter();
  const { openPostId } = useLocalSearchParams<{ openPostId?: string }>();
  const { isLoggedIn, user, token, setShowLoginPrompt } = useAuth();
  const { showToast } = useToast();
  const currentUserInitials = getInitials(user?.name);

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
  const [viewingUserStories, setViewingUserStories] = useState<Story[] | null>(null);
  const [viewingUserStoryPos, setViewingUserStoryPos] = useState(0);
  const viewingStory = viewingUserStories?.[viewingUserStoryPos] ?? null;
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [lastGalleryPhoto, setLastGalleryPhoto] = useState<string | null>(null);
  const [storyTextItems, setStoryTextItems] = useState<{ id: number; text: string; fontIdx: number; initialTop: number }[]>([]);
  const nextTextId = useRef(0);
  const textPositions     = useRef<Map<number, Animated.ValueXY>>(new Map());
  const textPanResponders = useRef<Map<number, any>>(new Map());
  const [selectedTextId, setSelectedTextId] = useState<number | null>(null);
  const selectedTextIdRef = useRef<number | null>(null);
  const [storyImage, setStoryImage] = useState<string | null>(null);

  // ── Story image gesture values (pinch + pan) ─────────────────────────────
  const imgScale    = useSharedValue(1);
  const imgTransX   = useSharedValue(0);
  const imgTransY   = useSharedValue(0);
  const savedScale  = useSharedValue(1);
  const savedX      = useSharedValue(0);
  const savedY      = useSharedValue(0);

  const imgAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: imgTransX.value },
      { translateY: imgTransY.value },
      { scale: imgScale.value },
    ],
  }));

  const pinchGesture = Gesture.Pinch()
    .onBegin(() => { savedScale.value = imgScale.value; })
    .onUpdate(e => {
      imgScale.value = Math.max(0.3, Math.min(savedScale.value * e.scale, 6));
    });

  const panGesture = Gesture.Pan()
    .onBegin(() => { savedX.value = imgTransX.value; savedY.value = imgTransY.value; })
    .onUpdate(e => {
      imgTransX.value = savedX.value + e.translationX;
      imgTransY.value = savedY.value + e.translationY;
    });

  const storyImgGesture = Gesture.Simultaneous(pinchGesture, panGesture);
  const [isPostingStory, setIsPostingStory] = useState(false);
  const [storyBgIdx, setStoryBgIdx] = useState(0); // Default to black
  const [storyFontIdx, setStoryFontIdx] = useState(0);
  const [isStoryPollMode, setIsStoryPollMode] = useState(false);
  const [storyPollQuestion, setStoryPollQuestion] = useState('');
  const [storyPollOptions, setStoryPollOptions] = useState(['Yes', 'No']);
  const [showStorySettings, setShowStorySettings] = useState(false);
  const [storyNotice, setStoryNotice] = useState<string | null>(null);
  const [storyReplyText, setStoryReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [showStoryShareModal, setShowStoryShareModal] = useState(false);
  const [shareConversations, setShareConversations] = useState<Conversation[]>([]);
  const [sharingConvId, setSharingConvId] = useState<number | null>(null);
  const [sharingPostForChat, setSharingPostForChat] = useState<Post | null>(null);
  const noticeAnim = useRef(new Animated.Value(-100)).current;

  // Draggable + pinch-to-scale Poll
  const pollTransX    = useSharedValue(0);
  const pollTransY    = useSharedValue(0);
  const pollSavedX    = useSharedValue(0);
  const pollSavedY    = useSharedValue(0);
  const pollScale     = useSharedValue(1);
  const pollBaseScale = useSharedValue(1);

  const pollPanGesture = Gesture.Pan()
    .activeOffsetX([-8, 8])
    .activeOffsetY([-8, 8])
    .onUpdate(e => {
      pollTransX.value = pollSavedX.value + e.translationX;
      pollTransY.value = pollSavedY.value + e.translationY;
    })
    .onEnd(() => {
      pollSavedX.value = pollTransX.value;
      pollSavedY.value = pollTransY.value;
    });

  const pollPinchGesture = Gesture.Pinch()
    .onUpdate(e => {
      pollScale.value = Math.max(0.5, Math.min(1.8, pollBaseScale.value * e.scale));
    })
    .onEnd(() => {
      pollBaseScale.value = pollScale.value;
    });

  const pollGesture = Gesture.Simultaneous(pollPanGesture, pollPinchGesture);

  const pollAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: pollTransX.value },
      { translateY: pollTransY.value },
      { scale: pollScale.value },
    ],
  }));

  useEffect(() => {
    if (!showStoryModal) return;
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') return;
      const { assets } = await MediaLibrary.getAssetsAsync({
        mediaType: 'photo',
        first: 1,
        sortBy: [[MediaLibrary.SortBy.creationTime, false]],
      });
      if (!assets[0]) return;
      const info = await MediaLibrary.getAssetInfoAsync(assets[0].id);
      if (info.localUri) setLastGalleryPhoto(info.localUri);
    })();
  }, [showStoryModal]);

  const showStoryNotice = (msg: string) => {
    setStoryNotice(msg);
    Animated.sequence([
      Animated.timing(noticeAnim, { toValue: 20, duration: 400, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.timing(noticeAnim, { toValue: -100, duration: 400, useNativeDriver: true }),
    ]).start(() => setStoryNotice(null));
  };

  const resetStoryCreator = () => {
    setStoryImage(null);
    setStoryBgIdx(0);
    setStoryFontIdx(0);
    setIsStoryPollMode(false);
    setStoryPollQuestion('');
    setStoryPollOptions(['Yes', 'No']);
    pollTransX.value = 0; pollTransY.value = 0;
    pollSavedX.value = 0; pollSavedY.value = 0;
    pollScale.value = 1;  pollBaseScale.value = 1;
    setStoryTextItems([]);
    nextTextId.current = 0;
    textPositions.current.clear();
    textPanResponders.current.clear();
    setSelectedTextId(null);
    // Reset image gesture transforms
    imgScale.value  = 1;
    imgTransX.value = 0;
    imgTransY.value = 0;
    savedScale.value = 1;
    savedX.value = 0;
    savedY.value = 0;
  };

  const removeTextItem = (id: number) => {
    textPositions.current.delete(id);
    textPanResponders.current.delete(id);
    setStoryTextItems(prev => prev.filter(t => t.id !== id));
    setSelectedTextId(prev => prev === id ? null : prev);
  };

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
  const [viewerImageUrl, setViewerImageUrl] = useState<string | null>(null);

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
  const [replyToCommentId, setReplyToCommentId] = useState<number | null>(null);
  const [replyingToName, setReplyingToName] = useState<string | null>(null);

  // ── Post interactions state ──────────────────────────────────────────────────
  const [likingIds, setLikingIds] = useState<Set<number>>(new Set());
  const [sharingPost, setSharingPost] = useState<Post | null>(null);
  const [repostOptionsPost, setRepostOptionsPost] = useState<Post | null>(null);
  const [spotlightPost, setSpotlightPost] = useState<Post | null>(null);
  const [spotlightLoading, setSpotlightLoading] = useState(false);
  const [reportingPost, setReportingPost] = useState<Post | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [postOptionsPost, setPostOptionsPost] = useState<Post | null>(null);
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editPostText, setEditPostText] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  
  const [confirmDeleteType, setConfirmDeleteType] = useState<'post' | 'comment' | 'story' | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<{ postId?: number, commentId?: number, storyId?: number } | null>(null);
  const [storyOptionsStory, setStoryOptionsStory] = useState<Story | null>(null);

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

  useFocusEffect(
    useCallback(() => {
      loadFeed(true); // Silent refresh on focus
    }, [loadFeed])
  );

  useEffect(() => {
    if (!openPostId) return;
    setSpotlightLoading(true);
    postsService.getPostById(Number(openPostId), token)
      .then(setSpotlightPost)
      .catch(() => {})
      .finally(() => setSpotlightLoading(false));
  }, [openPostId]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadFeed(true);
  }, [loadFeed]);

  // ── Post actions ──────────────────────────────────────────────────────────────

  const handleCreatePost = async () => {
    if (!isLoggedIn) { setShowLoginPrompt(true); return; }
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

        const MAX_DOC_BYTES = 15 * 1024 * 1024; // 15 MB
        if (asset.size && asset.size > MAX_DOC_BYTES) {
          showToast('File too large. Maximum size is 15 MB.', 'error');
          return;
        }

        if (Platform.OS === 'web') {
          // On web, we can use FileReader with the File object
          const file = (asset as any).file as File;
          if (file) {
            const reader = new FileReader();
            reader.onload = () => {
              setNewPostDoc({
                uri: asset.uri,
                name: asset.name,
                base64: reader.result as string
              });
            };
            reader.readAsDataURL(file);
          } else {
            // Fallback for some browsers/configs
            const response = await fetch(asset.uri);
            const blob = await response.blob();
            const reader = new FileReader();
            reader.onload = () => {
              setNewPostDoc({
                uri: asset.uri,
                name: asset.name,
                base64: reader.result as string
              });
            };
            reader.readAsDataURL(blob);
          }
        } else {
          // Read file as base64 using FileSystem for native
          const rawBase64 = await FileSystem.readAsStringAsync(asset.uri, {
            encoding: 'base64',
          });
          // iOS encodes with line breaks every 76 chars — strip them so the
          // backend's strict Base64 decoder doesn't reject the payload.
          const base64Clean = rawBase64.replace(/\s/g, '');
          const mimeType = asset.mimeType || 'application/pdf';
          setNewPostDoc({
            uri: asset.uri,
            name: asset.name,
            base64: `data:${mimeType};base64,${base64Clean}`
          });
        }
      }
    } catch (e: any) {
      console.error('[pickDocument]', e?.message ?? e);
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

  const handleDeleteStory = async (storyId: number) => {
    if (!token) return;
    try {
      await postsService.deleteStory(storyId, token);
      setStories(prev => prev.filter(s => s.id !== storyId));
      showToast('Story deleted', 'success');
      closeStoryViewer();
    } catch (e: any) {
      showToast(e.message ?? 'Failed to delete story', 'error');
    }
  };

  const requestDeleteStory = (storyId: number) => {
    setDeleteTargetId({ storyId });
    setConfirmDeleteType('story');
  };

  const executeDelete = async () => {
    if (!deleteTargetId) return;
    if (confirmDeleteType === 'post' && deleteTargetId.postId) {
      await handleDeletePost(deleteTargetId.postId);
    } else if (confirmDeleteType === 'comment' && deleteTargetId.postId && deleteTargetId.commentId) {
      await handleDeleteComment(deleteTargetId.postId, deleteTargetId.commentId);
    } else if (confirmDeleteType === 'story' && deleteTargetId.storyId) {
      await handleDeleteStory(deleteTargetId.storyId);
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
    if (!isLoggedIn) { setShowLoginPrompt(true); return; }
    if (!token) return;
    try {
      const finalContent = `🔁 ${post.authorName}:\n"${post.content}"\n\n`;
      // Pass sharedPostId so the backend copies the original post's image/document
      const created = await postsService.createPost(finalContent, null, token, 'EVERYONE', null, null, null, post.id);
      setPosts(prev => [created, ...prev]);
      showToast('Reposted!', 'success');
    } catch (e: any) {
      showToast(e.message ?? 'Failed to repost', 'error');
    }
  };

  const handleShareToChat = (post: Post) => {
    setSharingPost(null);
    chatService.getConversations(token!).then(setShareConversations).catch(() => {});
    setSharingPostForChat(post);
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
    if (!isLoggedIn) {
      setReportingPost(null);
      setReportReason('');
      setTimeout(() => setShowLoginPrompt(true), 300);
      return;
    }
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
    if (openComments === postId) {
      setOpenComments(null);
      setReplyToCommentId(null);
      setReplyingToName(null);
      return;
    }
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
      const comment = await postsService.addComment(postId, text, token, replyToCommentId);
      
      if (replyToCommentId) {
        // Find the parent comment and add the reply
        setCommentsMap(prev => ({
          ...prev,
          [postId]: (prev[postId] ?? []).map(c => 
            c.id === replyToCommentId 
              ? { ...c, replies: [...(c.replies ?? []), comment] } 
              : c
          )
        }));
      } else {
        setCommentsMap(prev => ({ ...prev, [postId]: [...(prev[postId] ?? []), comment] }));
      }
      
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p));
      setFollowingPosts(prev => prev.map(p => p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p));
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      setReplyToCommentId(null);
      setReplyingToName(null);
    } catch (e: any) {
      showToast(e.message ?? 'Failed to add comment', 'error');
    } finally { setSubmittingCommentId(null); }
  };

  const updateComment = (comments: Comment[], targetId: number, updater: (c: Comment) => Comment): Comment[] =>
    comments.map(c => {
      if (c.id === targetId) return updater(c);
      if (c.replies?.length) return { ...c, replies: updateComment(c.replies, targetId, updater) };
      return c;
    });

  const removeComment = (comments: Comment[], id: number): Comment[] =>
    comments
      .filter(c => c.id !== id)
      .map(c => c.replies?.length ? { ...c, replies: removeComment(c.replies, id) } : c);

  const handleDeleteComment = async (postId: number, commentId: number) => {
    if (!token) return;
    try {
      await postsService.deleteComment(postId, commentId, token);
      setCommentsMap(prev => ({ ...prev, [postId]: removeComment(prev[postId] ?? [], commentId) }));
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
        [postId]: updateComment(prev[postId] ?? [], commentId, () => updated),
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

    const toggleLike = (c: Comment) => ({ ...c, isLiked: !c.isLiked, likeCount: c.isLiked ? c.likeCount - 1 : c.likeCount + 1 });

    setCommentsMap(prev => ({
      ...prev,
      [postId]: updateComment(prev[postId] ?? [], commentId, toggleLike),
    }));
    try {
      const result = await postsService.toggleCommentLike(postId, commentId, token);
      setCommentsMap(prev => ({
        ...prev,
        [postId]: updateComment(prev[postId] ?? [], commentId, c => ({ ...c, isLiked: result.liked, likeCount: result.likeCount })),
      }));
    } catch {
      setCommentsMap(prev => ({
        ...prev,
        [postId]: updateComment(prev[postId] ?? [], commentId, toggleLike),
      }));
    } finally {
      setLikingCommentIds(prev => { const s = new Set(prev); s.delete(commentId); return s; });
    }
  };

  // ── Stories ───────────────────────────────────────────────────────────────────

  const closeStoryViewer = () => { setViewingUserStories(null); setViewingUserStoryPos(0); };

  const openUserStories = async (userId: number, startPos = 0) => {
    const userStories = stories.filter(s => s.userId === userId);
    if (!userStories.length) return;
    const pos = Math.min(startPos, userStories.length - 1);
    setViewingUserStories(userStories);
    setViewingUserStoryPos(pos);
    const story = userStories[pos];
    if (!story.hasViewed && token) {
      postsService.viewStory(story.id, token).catch(() => {});
      setStories(prev => prev.map(s => s.id === story.id ? { ...s, hasViewed: true } : s));
    }
  };

  const handleCreateStory = async () => {
    if (!isLoggedIn) { setShowLoginPrompt(true); return; }
    const hasText = storyTextItems.some(t => t.text.trim());
    if (!hasText && !storyImage && !isStoryPollMode) return;
    if (!token) return;
    setIsPostingStory(true);
    try {
      const opts = isStoryPollMode ? storyPollOptions.filter(o => o.trim()).join(',') : null;
      const itemsWithPos = storyTextItems.filter(t => t.text.trim()).map(item => {
        const pos = textPositions.current.get(item.id);
        const dx = pos ? (pos as any).x._value + (pos as any).x._offset : 0;
        const dy = pos ? (pos as any).y._value + (pos as any).y._offset : 0;
        return { text: item.text.trim(), fontIdx: item.fontIdx, topPct: item.initialTop, dx, dy };
      });
      const textContent = itemsWithPos.length
        ? JSON.stringify({ v: 1, items: itemsWithPos })
        : null;
      const created = await postsService.createStory(
        textContent,
        storyImage,
        token,
        isStoryPollMode ? storyPollQuestion : null,
        opts,
        storyBgIdx
      );
      setStories(prev => [created, ...prev]);
      resetStoryCreator();
      setShowStoryModal(false);
      showToast('Story posted!', 'success');
    } catch (e: any) {
      showToast(e.message ?? 'Failed to post story', 'error');
    } finally { setIsPostingStory(false); }
  };

  const nextStoryBg = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStoryBgIdx(prev => (prev + 1) % STORY_BACKGROUNDS.length);
  };


  const handleStoryPollVote = async (storyId: number, option: string) => {
    if (!isLoggedIn) { setShowLoginPrompt(true); return; }
    if (!token) return;
    try {
      await postsService.submitStoryVote(storyId, option, token);
      loadFeed(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLikeStory = async (storyId: number) => {
    if (!isLoggedIn) { setShowLoginPrompt(true); return; }
    if (!token) return;
    const toggle = (s: Story) => s.id === storyId
      ? { ...s, liked: !s.liked, likeCount: s.likeCount + (s.liked ? -1 : 1) }
      : s;
    setStories(prev => prev.map(toggle));
    setViewingUserStories(prev => prev ? prev.map(toggle) : prev);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await postsService.likeStory(storyId, token);
    } catch {
      setStories(prev => prev.map(toggle));
      setViewingUserStories(prev => prev ? prev.map(toggle) : prev);
    }
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


  const forYouFeed = mergeWithML(posts, mlPosts);

  // ── Post card renderer ────────────────────────────────────────────────────────

  const renderPost = (post: Post) => (
    <View key={post.id} style={s.postCard}>
      {/* Header */}
      <View style={s.postHdr}>
        <TouchableOpacity style={s.avatar} onPress={() => router.push(`/profile/${post.authorId}`)}>
          {post.authorPicture
            ? <Image source={{ uri: resolveUrl(post.authorPicture)! }} style={s.avatarImg} resizeMode="cover" />
            : <Text style={s.avatarTxt}>{post.authorInitials}</Text>}
        </TouchableOpacity>
        <View style={s.postHdrInfo}>
          <TouchableOpacity onPress={() => router.push(`/profile/${post.authorId}`)}>
            <Text style={s.authorName}>{post.authorName}</Text>
          </TouchableOpacity>
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
      ) : (() => {
        // Detect repost: content starts with the repost emoji
        const isRepost = post.content?.startsWith('🔁');
        if (isRepost) {
          // Extract any user-added comment above the repost line
          const lines = (post.content || '').split('\n');
          // Lines before the "🔁 AuthorName:" line are the reposter's own comment
          const repostLineIdx = lines.findIndex(l => l.startsWith('🔁'));
          const userComment = repostLineIdx > 0 ? lines.slice(0, repostLineIdx).join('\n').trim() : '';
          return (
            <View>
              {!!userComment && <Text style={s.postContent}>{userComment}</Text>}
              <View style={s.repostBadge}>
                <Repeat2 size={13} color={C.violet500} strokeWidth={2.2} />
                <Text style={s.repostBadgeTxt}>Reposted</Text>
              </View>
            </View>
          );
        }
        return <Text style={s.postContent}>{post.content}</Text>;
      })()}

      {post.imageUrl && (
        <TouchableOpacity activeOpacity={0.92} onPress={() => setViewerImageUrl(resolveUrl(post.imageUrl)!)}>
          <Image source={{ uri: resolveUrl(post.imageUrl)! }} style={s.postImage} resizeMode="cover" />
        </TouchableOpacity>
      )}

      {post.documentUrl && (
        <TouchableOpacity
          style={s.docCard}
          activeOpacity={0.75}
          onPress={() => {
            const url = resolveUrl(post.documentUrl!);
            if (url) Linking.openURL(url).catch(() => showToast('Could not open document', 'error'));
          }}
        >
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
                  <TouchableOpacity style={s.commentAvatar} onPress={() => router.push(`/profile/${c.authorId}`)}>
                    <Text style={s.commentAvatarTxt}>{c.authorInitials}</Text>
                  </TouchableOpacity>
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
                        <TouchableOpacity onPress={() => router.push(`/profile/${c.authorId}`)}>
                          <Text style={s.commentAuthor}>{c.authorName}</Text>
                        </TouchableOpacity>
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
                          {/* Reply button */}
                          <TouchableOpacity 
                            style={s.replyBtn} 
                            onPress={() => {
                              setReplyToCommentId(c.id);
                              setReplyingToName(c.authorName);
                              setCommentInputs(prev => ({ ...prev, [post.id]: '' }));
                            }}
                          >
                            <Text style={s.replyBtnTxt}>Reply</Text>
                          </TouchableOpacity>
                          {/* Edit/Delete own comment */}
                          {(c.isMine || (user && c.authorId === user.id)) && (
                            <View style={s.commentActions}>
                              <TouchableOpacity onPress={() => { setEditingCommentId(c.id); setEditCommentText(c.content); }} style={s.commentMenuBtn}>
                                <Edit3 size={16} color={C.gray600} />
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => requestDeleteComment(post.id, c.id)} style={[s.commentMenuBtn, { marginLeft: 6 }]}>
                                <Trash2 size={16} color={C.violet600} />
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      </View>
                    )}

                    {/* Render Replies */}
                    {c.replies && c.replies.length > 0 && (
                      <View style={s.repliesContainer}>
                        {c.replies.map(r => (
                          <View key={r.id} style={s.replyRow}>
                            <TouchableOpacity style={s.replyAvatar} onPress={() => router.push(`/profile/${r.authorId}`)}>
                              <Text style={s.replyAvatarTxt}>{r.authorInitials}</Text>
                            </TouchableOpacity>
                            <View style={s.replyBubble}>
                              {editingCommentId === r.id ? (
                                <View style={s.editCommentWrap}>
                                  <TextInput
                                    style={[s.editCommentInput, { fontSize: 13 }]}
                                    value={editCommentText}
                                    onChangeText={setEditCommentText}
                                    autoFocus
                                    multiline
                                  />
                                  <View style={s.editCommentBtns}>
                                    <TouchableOpacity onPress={() => setEditingCommentId(null)} style={s.editCancelBtn}>
                                      <Text style={s.editCancelTxt}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleSaveCommentEdit(post.id, r.id)} style={s.editSaveBtn}>
                                      <Check size={14} color={C.white} />
                                      <Text style={s.editSaveTxt}>Save</Text>
                                    </TouchableOpacity>
                                  </View>
                                </View>
                              ) : (
                                <>
                                  <TouchableOpacity onPress={() => router.push(`/profile/${r.authorId}`)}>
                                    <Text style={s.commentAuthor}>{r.authorName}</Text>
                                  </TouchableOpacity>
                                  <Text style={s.commentTxt}>{r.content}</Text>
                                  <View style={s.commentFooter}>
                                    <Text style={s.commentTime}>{relativeTime(r.createdAt)}</Text>
                                    <TouchableOpacity
                                      style={s.commentLikeBtn}
                                      onPress={() => handleCommentLike(post.id, r.id)}
                                      disabled={likingCommentIds.has(r.id)}
                                    >
                                      <Heart size={10} color={r.isLiked ? C.red600 : C.gray400} fill={r.isLiked ? C.red600 : 'transparent'} />
                                      {r.likeCount > 0 && <Text style={[s.commentLikeCount, r.isLiked && { color: C.red600, fontSize: 10 }]}>{r.likeCount}</Text>}
                                    </TouchableOpacity>

                                    {/* Reply button */}
                                    <TouchableOpacity
                                      style={s.replyBtn}
                                      onPress={() => {
                                        setReplyToCommentId(c.id);
                                        setReplyingToName(r.authorName);
                                        setCommentInputs(prev => ({ ...prev, [post.id]: '' }));
                                      }}
                                    >
                                      <Text style={s.replyBtnTxt}>Reply</Text>
                                    </TouchableOpacity>

                                    {/* Edit/Delete own reply */}
                                    {(r.isMine || (user && r.authorId === user.id)) && (
                                      <View style={[s.commentActions, { marginLeft: 8 }]}>
                                        <TouchableOpacity onPress={() => { setEditingCommentId(r.id); setEditCommentText(r.content); }} style={s.commentMenuBtn}>
                                          <Edit3 size={14} color={C.gray600} />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => requestDeleteComment(post.id, r.id)} style={[s.commentMenuBtn, { marginLeft: 6 }]}>
                                          <Trash2 size={14} color={C.violet600} />
                                        </TouchableOpacity>
                                      </View>
                                    )}
                                  </View>
                                </>
                              )}
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
          <View style={s.commentInputContainer}>
            {replyToCommentId && (
              <View style={s.replyIndicator}>
                <Text style={s.replyIndicatorTxt}>Replying to {replyingToName}</Text>
                <TouchableOpacity onPress={() => { setReplyToCommentId(null); setReplyingToName(null); }}>
                  <X size={14} color={C.gray500} />
                </TouchableOpacity>
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
        </View>
      )}
    </View>
  );

  // ── Stories row ───────────────────────────────────────────────────────────────

  const renderStoriesRow = () => {
    if (stories.length === 0 && !isLoggedIn) return null;

    // Group other users' stories
    const otherUsersMap = new Map<number, { story: Story; index: number }>();
    stories.forEach((s, idx) => {
      if (s.userId === user?.id) return;
      if (!otherUsersMap.has(s.userId) || (otherUsersMap.get(s.userId)!.story.hasViewed && !s.hasViewed)) {
        otherUsersMap.set(s.userId, { story: s, index: idx });
      }
    });

    const myStories = stories.filter(s => s.userId === user?.id);
    const hasMyStories = myStories.length > 0;
    const allMyStoriesViewed = hasMyStories && myStories.every(s => s.hasViewed);
    const myFirstStoryIdx = stories.findIndex(s => s.userId === user?.id);

    return (
      <View style={s.storiesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.storiesRow} contentContainerStyle={s.storiesContent}>
          {isLoggedIn && (
            <TouchableOpacity
              style={s.storyItem}
              onPress={() => hasMyStories ? openUserStories(user!.id) : setShowStoryModal(true)}
            >
              <View style={s.storyCard}>
                <View style={{ width: 68, height: 68 }}>
                  {hasMyStories ? (
                    !allMyStoriesViewed ? (
                      <LinearGradient
                        colors={['#f09433', '#e6683c', '#dc2743', '#cc2366', '#bc1888']}
                        start={{x: 0, y: 0}} end={{x: 1, y: 1}}
                        style={s.storyGradientBorder}
                      >
                        <View style={s.storyAvatarInside}>
                          {user?.profilePicture ? (
                            <Image source={{ uri: resolveUrl(user.profilePicture)! }} style={s.storyAvatarImg} resizeMode="cover" />
                          ) : (
                            <Text style={s.storyAvatarTxt}>{currentUserInitials}</Text>
                          )}
                        </View>
                      </LinearGradient>
                    ) : (
                      <View style={[s.storyAvatarInside, { borderColor: C.gray300, borderWidth: 1, margin: 2 }]}>
                        {user?.profilePicture ? (
                          <Image source={{ uri: resolveUrl(user.profilePicture)! }} style={s.storyAvatarImg} resizeMode="cover" />
                        ) : (
                          <Text style={s.storyAvatarTxt}>{currentUserInitials}</Text>
                        )}
                      </View>
                    )
                  ) : (
                    <View style={s.storyAvatarWrap}>
                      {user?.profilePicture ? (
                        <Image source={{ uri: resolveUrl(user.profilePicture)! }} style={[s.storyAvatarImg, { width: 60, height: 60, borderRadius: 30 }]} resizeMode="cover" />
                      ) : (
                        <Text style={s.storyAvatarTxt}>{currentUserInitials}</Text>
                      )}
                    </View>
                  )}
                  <TouchableOpacity style={s.storyAddBadge} onPress={() => setShowStoryModal(true)}>
                    <Plus size={10} color={C.white} />
                  </TouchableOpacity>
                </View>
                <Text style={s.storyName}>{hasMyStories ? 'Your Story' : 'Add Story'}</Text>
              </View>
            </TouchableOpacity>
          )}

          {Array.from(otherUsersMap.values()).map(({ story, index }) => (
            <TouchableOpacity key={story.id} style={s.storyItem} onPress={() => openUserStories(story.userId)}>
              <View style={s.storyCard}>
                {!story.hasViewed ? (
                  <LinearGradient 
                    colors={['#f09433', '#e6683c', '#dc2743', '#cc2366', '#bc1888']} 
                    start={{x: 0, y: 0}} end={{x: 1, y: 1}}
                    style={s.storyGradientBorder}
                  >
                    <View style={s.storyAvatarInside}>
                      {story.userPicture ? (
                        <Image source={{ uri: resolveUrl(story.userPicture)! }} style={s.storyAvatarImg} resizeMode="cover" />
                      ) : (
                        <Text style={s.storyAvatarTxt}>{story.userInitials}</Text>
                      )}
                    </View>
                  </LinearGradient>
                ) : (
                  <View style={[s.storyAvatarInside, { borderColor: C.gray300, borderWidth: 1, margin: 2 }]}>
                    {story.userPicture ? (
                      <Image source={{ uri: resolveUrl(story.userPicture)! }} style={s.storyAvatarImg} resizeMode="cover" />
                    ) : (
                      <Text style={s.storyAvatarTxt}>{story.userInitials}</Text>
                    )}
                  </View>
                )}
                <Text style={s.storyName} numberOfLines={1}>{story.userName}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

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
              <TouchableOpacity style={s.suggestedAvatar} onPress={() => router.push(`/profile/${u.id}`)}>
                {u.profilePicture ? (
                  <Image source={{ uri: resolveUrl(u.profilePicture)! }} style={s.suggestedAvatarImg} resizeMode="cover" />
                ) : (
                  <Text style={s.suggestedAvatarTxt}>{u.initials}</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push(`/profile/${u.id}`)}>
                <Text style={s.suggestedName} numberOfLines={1}>{u.name}</Text>
              </TouchableOpacity>
              <Text style={s.suggestedBio} numberOfLines={1}>{u.bio ?? 'Suggested for you'}</Text>
              <TouchableOpacity
                style={[s.suggestedBtn, requestedUserIds.has(u.id) && s.suggestedBtnRequested]}
                onPress={async () => {
                  if (!isLoggedIn) { setShowLoginPrompt(true); return; }
                  try {
                    await profileService.sendConnectionRequest(u.id, token!);
                    setRequestedUserIds(prev => new Set(prev).add(u.id));
                    showToast(`Request sent to ${u.name}`, 'success');
                  } catch (e: any) {
                    showToast(e.message ?? 'Failed to send request', 'error');
                  }
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
              {t === 'for_you' ? 'Explore' : 'Following'}
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

      {/* FAB menu — bottom offset accounts for tab bar height + home indicator */}
      <View style={[s.fabContainer, { bottom: 80 + insets.bottom }]}>
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
          activeOpacity={0.7}
          style={[s.fab, showFabMenu && s.fabActive]}
          onPress={() => { 
            if (!isLoggedIn) { setShowLoginPrompt(true); return; } 
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setShowFabMenu(v => !v); 
          }}
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
                  <Image source={{ uri: newPostImage }} style={s.selectedImg} resizeMode="cover" />
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

      <Modal visible={showStoryModal} transparent animationType="fade" onRequestClose={() => { resetStoryCreator(); setShowStoryModal(false); }}>
        <View style={s.storyCreator}>
          <LinearGradient colors={STORY_GRADIENTS[storyBgIdx]} style={StyleSheet.absoluteFill}>
            {storyImage && (
              <View style={StyleSheet.absoluteFill}>
                <GestureDetector gesture={storyImgGesture}>
                  <ReAnimated.View style={[s.storyPreviewImg, imgAnimStyle]}>
                    <Image
                      source={{ uri: storyImage }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                  </ReAnimated.View>
                </GestureDetector>

                <TouchableOpacity style={s.removeImageBtn} onPress={() => {
                  setStoryImage(null);
                  imgScale.value = 1; imgTransX.value = 0; imgTransY.value = 0;
                }}>
                  <Trash2 size={20} color={C.white} />
                </TouchableOpacity>
              </View>
            )}
          </LinearGradient>

          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            {storyNotice && (
              <Animated.View style={[s.storyNoticeBanner, { top: insets.top + 90, transform: [{ translateY: noticeAnim }] }]}>
                <Sparkles size={16} color="#FFFFFF" />
                <Text style={s.storyNoticeTxt}>{storyNotice}</Text>
              </Animated.View>
            )}

            <View style={[s.storyCreatorHdr, { paddingTop: insets.top + 20 }]}>
              <TouchableOpacity onPress={() => { resetStoryCreator(); setShowStoryModal(false); }} style={s.storyCreatorClose}>
                <X size={32} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={{ flex: 1 }} />
            </View>

            <View style={s.storyCreatorBody}>
              {/* Sidebar Tools */}
              {!storyImage && (
                <View style={s.storyLeftSidebar}>
                  <TouchableOpacity style={s.storySideTool} onPress={() => {
                    const id = nextTextId.current++;
                    const pos = new Animated.ValueXY({ x: 0, y: 0 });
                    const panR = PanResponder.create({
                      // Allow drag only when this item is NOT being edited
                      onStartShouldSetPanResponder: (_, gs) => selectedTextIdRef.current !== id && (Math.abs(gs.dx) > 2 || Math.abs(gs.dy) > 2),
                      onMoveShouldSetPanResponder:  (_, gs) => selectedTextIdRef.current !== id && (Math.abs(gs.dx) > 2 || Math.abs(gs.dy) > 2),
                      onPanResponderGrant: () => { pos.extractOffset(); },
                      onPanResponderMove: Animated.event([null, { dx: pos.x, dy: pos.y }], { useNativeDriver: false }),
                      onPanResponderRelease: () => { pos.flattenOffset(); },
                    });
                    textPositions.current.set(id, pos);
                    textPanResponders.current.set(id, panR);
                    const initialTop = 35 + (storyTextItems.length * 12);
                    setStoryTextItems(prev => [...prev, { id, text: '', fontIdx: storyFontIdx, initialTop }]);
                    selectedTextIdRef.current = id;
                    setSelectedTextId(id);
                  }}>
                    <Type size={24} color="#FFFFFF" />
                    <Text style={s.storySideToolTxt}>Add Text</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.storySideTool} onPress={() => {
                    const nextIdx = (storyFontIdx + 1) % STORY_FONTS.length;
                    setStoryFontIdx(nextIdx);
                    if (selectedTextId !== null) {
                      setStoryTextItems(prev => prev.map(t =>
                        t.id === selectedTextId ? { ...t, fontIdx: nextIdx } : t
                      ));
                    }
                  }}>
                    <Text style={[s.storySideToolTxt, { fontSize: 13, fontFamily: STORY_FONTS[storyFontIdx].family }]}>Aa</Text>
                    <Text style={s.storySideToolTxt}>{STORY_FONTS[storyFontIdx].name}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.storySideTool} onPress={() => showStoryNotice('Layouts are coming soon!')}>
                    <Layout size={24} color="#FFFFFF" />
                    <Text style={s.storySideToolTxt}>Layout</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.storySideTool} onPress={() => setIsStoryPollMode(!isStoryPollMode)}>
                    <BarChart3 size={24} color={isStoryPollMode ? C.violet400 : '#FFFFFF'} />
                    <Text style={s.storySideToolTxt}>Poll</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.storySideTool} onPress={nextStoryBg}>
                    <Palette size={24} color="#FFFFFF" />
                    <Text style={s.storySideToolTxt}>Background</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Settings Menu Modal */}

              <View style={s.storyPreviewContainer}>
                <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => { selectedTextIdRef.current = null; setSelectedTextId(null); Keyboard.dismiss(); }} />

                <View style={s.storyOverlayContent} pointerEvents="box-none">
                  {isStoryPollMode && (
                    <GestureDetector gesture={pollGesture}>
                      <ReAnimated.View style={[s.storyPollOverlay, pollAnimStyle, { position: 'absolute', top: '30%', alignSelf: 'center' }]}>
                        <TextInput
                          style={s.storyPollQuestionInput}
                          placeholder="Ask a question..."
                          placeholderTextColor="rgba(0,0,0,0.5)"
                          value={storyPollQuestion}
                          onChangeText={setStoryPollQuestion}
                          multiline
                        />
                        {storyPollOptions.map((opt, i) => (
                          <View key={i} style={s.storyPollOptWrap}>
                            <TextInput
                              style={s.storyPollOptInput}
                              placeholder={`Option ${i + 1}`}
                              placeholderTextColor="rgba(0,0,0,0.3)"
                              value={opt}
                              onChangeText={txt => {
                                const n = [...storyPollOptions];
                                n[i] = txt;
                                setStoryPollOptions(n);
                              }}
                            />
                            {storyPollOptions.length > 2 && (
                              <TouchableOpacity style={s.storyPollOptRemove} onPress={() => setStoryPollOptions(storyPollOptions.filter((_, idx) => idx !== i))}>
                                <X size={14} color='#7C3AED' />
                              </TouchableOpacity>
                            )}
                          </View>
                        ))}
                        {storyPollOptions.length < 5 && (
                          <TouchableOpacity style={s.storyAddPollOpt} onPress={() => setStoryPollOptions([...storyPollOptions, ''])}>
                            <Plus size={14} color='#7C3AED' />
                            <Text style={s.storyAddPollOptTxt}>Add Option</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity style={s.storyPollDismiss} onPress={() => setIsStoryPollMode(false)}>
                          <X size={14} color='#FFFFFF' />
                        </TouchableOpacity>
                      </ReAnimated.View>
                    </GestureDetector>
                  )}
                  
                  {storyTextItems.map((item) => {
                    const pos  = textPositions.current.get(item.id);
                    const panR = textPanResponders.current.get(item.id);
                    if (!pos || !panR) return null;
                    const isSelected = selectedTextId === item.id;
                    return (
                      <Animated.View
                        key={item.id}
                        style={[
                          { position: 'absolute', top: `${item.initialTop}%` as any, alignSelf: 'center', minWidth: 120 },
                          { transform: pos.getTranslateTransform() },
                          isSelected && { borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', borderRadius: 8 },
                        ]}
                        {...panR.panHandlers}
                      >
                        {/* TextInput only receives touches when selected */}
                        <View pointerEvents={isSelected ? 'auto' : 'none'}>
                          <TextInput
                            style={[
                              s.storyCreatorInput,
                              { fontFamily: STORY_FONTS[item.fontIdx].family, fontWeight: STORY_FONTS[item.fontIdx].weight as any }
                            ]}
                            placeholder="Type something..."
                            placeholderTextColor="rgba(255,255,255,0.4)"
                            value={item.text}
                            onChangeText={txt => setStoryTextItems(prev => prev.map(t => t.id === item.id ? { ...t, text: txt } : t))}
                            multiline
                            editable={isSelected}
                            autoFocus={item.id === nextTextId.current - 1}
                            onFocus={() => { selectedTextIdRef.current = item.id; setSelectedTextId(item.id); }}
                          />
                        </View>
                        {/* Tap to enter edit mode when not selected */}
                        {!isSelected && (
                          <TouchableOpacity
                            style={StyleSheet.absoluteFill}
                            activeOpacity={0.7}
                            onPress={() => { selectedTextIdRef.current = item.id; setSelectedTextId(item.id); }}
                          />
                        )}
                        <TouchableOpacity style={s.storyTextItemDelete} onPress={() => removeTextItem(item.id)}>
                          <X size={14} color="#FFFFFF" />
                        </TouchableOpacity>
                      </Animated.View>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Bottom Controls */}
            <View style={s.storyCreatorFooter}>
              {!storyImage && !storyTextItems.some(t => t.text.trim()) ? (
                <View style={s.storyCaptureRow}>
                  <TouchableOpacity style={s.storyGalleryBtn} onPress={() => pickImage(true)}>
                    {lastGalleryPhoto
                      ? <Image source={{ uri: lastGalleryPhoto }} style={{ flex: 1 }} />
                      : <View style={s.storyGalleryThumb} />}
                  </TouchableOpacity>
                  <TouchableOpacity style={s.storyCaptureBtn}>
                    <View style={s.storyCaptureBtnInner} />
                  </TouchableOpacity>
                  <View style={{ width: 44 }} />
                </View>
              ) : (
                <View style={s.storyPostRow}>
                  <TouchableOpacity 
                    style={s.storyPostToggle} 
                    onPress={handleCreateStory}
                  >
                    <View style={s.storyPostAvatar}>
                      {user?.profilePicture
                        ? <Image source={{ uri: resolveUrl(user.profilePicture)! }} style={{ width: '100%', height: '100%', borderRadius: 12 }} resizeMode="cover" />
                        : <Text style={{ fontSize: 10, fontWeight: '700', color: '#FFFFFF' }}>{currentUserInitials}</Text>
                      }
                    </View>
                    <Text style={s.storyPostToggleTxt}>Your story</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.storySendBtn, { backgroundColor: C.violet600 }]} onPress={handleCreateStory}>
                    <ArrowRight size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              )}
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
                  <View style={[s.shareOptionIcon, { backgroundColor: C.violet100 }]}><Trash2 size={20} color={C.violet600} /></View>
                  <View><Text style={[s.shareOptionTitle, { color: C.red600, fontWeight: '700' }]}>DELETE POST</Text><Text style={s.shareOptionSub}>Permanently remove this post</Text></View>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity style={s.shareOption} onPress={() => {
                const p = postOptionsPost;
                setPostOptionsPost(null);
                if (!isLoggedIn) { setShowLoginPrompt(true); return; }
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

      {/* ── Full-screen image viewer ────────────────────────────────────────── */}
      <Modal visible={!!viewerImageUrl} transparent animationType="fade" onRequestClose={() => setViewerImageUrl(null)} statusBarTranslucent>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', alignItems: 'center', justifyContent: 'center' }}
          activeOpacity={1}
          onPress={() => setViewerImageUrl(null)}
        >
          {viewerImageUrl && (
            <Image
              source={{ uri: viewerImageUrl }}
              style={{ width: '100%', height: '80%' }}
              resizeMode="contain"
            />
          )}
          <TouchableOpacity
            style={{ position: 'absolute', top: 56, right: 20, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}
            onPress={() => setViewerImageUrl(null)}
          >
            <X size={20} color="#fff" />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal visible={viewingUserStories !== null} transparent animationType="fade" onRequestClose={closeStoryViewer} statusBarTranslucent>
        <KeyboardAvoidingView
          style={s.storyViewer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          {viewingStory && viewingUserStories !== null && (() => {
            const idx = viewingUserStoryPos;
            const handleSendStoryReply = async () => {
              if (!storyReplyText.trim()) return;
              if (!isLoggedIn) { setShowLoginPrompt(true); return; }
              setIsSendingReply(true);
              try {
                const conv = await chatService.startConversation(viewingStory.userId, token!);
                await chatService.sendMessage(conv.id, storyReplyText, token!, {
                    id: viewingStory.id,
                    text: viewingStory.textContent,
                    media: viewingStory.mediaUrl,
                  });
                showToast('Reply sent', 'success');
                setStoryReplyText('');
                closeStoryViewer();
              } catch (e: any) {
                showToast(e.message || 'Failed to send reply', 'error');
              } finally {
                setIsSendingReply(false);
              }
            };
            return (
              <>
                {/* ── Fullscreen background — renders behind everything ── */}
                {viewingStory.mediaUrl
                  ? <Image source={{ uri: resolveUrl(viewingStory.mediaUrl)! }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                  : <LinearGradient colors={STORY_GRADIENTS[viewingStory.bgIndex ?? 0]} style={StyleSheet.absoluteFill} />
                }

                {/* Progress bar */}
                <View style={s.storyProgress}>
                  {viewingUserStories.map((_, i) => (
                    <View key={i} style={[s.storyProgressBar, i === idx && s.storyProgressBarActive]} />
                  ))}
                </View>

                {/* Header */}
                <View style={s.storyViewerHdr}>
                  <View style={s.storyViewerAvatar}>
                    {viewingStory.userPicture ? (
                      <Image source={{ uri: resolveUrl(viewingStory.userPicture)! }} style={s.storyViewerAvatarImg} />
                    ) : (
                      <Text style={s.storyViewerAvatarTxt}>{viewingStory.userInitials}</Text>
                    )}
                  </View>
                  <View>
                    <Text style={s.storyViewerName}>{viewingStory.userName}</Text>
                    <Text style={s.storyViewerTime}>{relativeTime(viewingStory.createdAt)}</Text>
                  </View>
                  <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center' }}>
                    {viewingStory.userId === user?.id && (
                      <TouchableOpacity onPress={() => setStoryOptionsStory(viewingStory)} style={{ padding: 8 }}>
                        <MoreHorizontal size={24} color="#FFFFFF" />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={closeStoryViewer} style={{ padding: 8 }}>
                      <X size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Centre overlay — text + poll float here */}
                <View style={s.storyOverlay}>
                  {viewingStory.textContent ? (() => {
                    type StoryTextItem = { text: string; fontIdx: number; topPct: number; dx: number; dy: number };
                    let parsed: { v: number; items: StoryTextItem[] } | null = null;
                    try { const p = JSON.parse(viewingStory.textContent!); if (p.v === 1) parsed = p; } catch {}
                    if (parsed) {
                      return parsed.items.map((item, i) => (
                        <View key={i} style={{
                          position: 'absolute',
                          top: `${item.topPct}%` as any,
                          alignSelf: 'center',
                          transform: [{ translateX: item.dx }, { translateY: item.dy }],
                        }}>
                          <Text style={[
                            viewingStory.mediaUrl ? s.storyTextOnMedia : s.storyFullText,
                            { fontFamily: STORY_FONTS[item.fontIdx]?.family, fontWeight: STORY_FONTS[item.fontIdx]?.weight as any },
                          ]}>{item.text}</Text>
                        </View>
                      ));
                    }
                    return (
                      <Text style={viewingStory.mediaUrl ? s.storyTextOnMedia : s.storyFullText}>
                        {viewingStory.textContent}
                      </Text>
                    );
                  })() : null}

                  {viewingStory.pollQuestion && (
                    <View style={s.storyPollViewer}>
                      <Text style={s.storyPollQ}>{viewingStory.pollQuestion}</Text>
                      {viewingStory.pollOptions?.split(',').map((opt, i) => {
                        const trimmed = opt.trim();
                        const votes = viewingStory.pollResults?.[trimmed] || 0;
                        const total = Object.values(viewingStory.pollResults || {}).reduce((a, b) => a + (Number(b) || 0), 0);
                        const pct = total > 0 ? Math.round((votes / total) * 100) : 0;
                        const isVoted = viewingStory.userPollVote === trimmed;
                        return (
                          <TouchableOpacity
                            key={i}
                            style={s.storyPollOption}
                            onPress={() => handleStoryPollVote(viewingStory.id, trimmed)}
                          >
                            {(viewingStory.userPollVote || viewingStory.userId === user?.id) && (
                              <View style={[s.storyPollOptBg, { width: `${pct}%` }]} />
                            )}
                            <View style={s.storyPollOptContent}>
                              <Text style={s.storyPollOptLabel}>{trimmed} {isVoted && '✓'}</Text>
                              {(viewingStory.userPollVote || viewingStory.userId === user?.id) && (
                                <Text style={s.storyPollOptPct}>{pct}%</Text>
                              )}
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
                <View style={s.storyNav} pointerEvents="box-none">
                  <TouchableOpacity style={s.storyNavTouch} onPress={() => idx > 0 ? openUserStories(viewingStory.userId, idx - 1) : closeStoryViewer()} />
                  <TouchableOpacity style={s.storyNavTouch} onPress={() => idx < viewingUserStories.length - 1 ? openUserStories(viewingStory.userId, idx + 1) : closeStoryViewer()} />
                </View>
                
                <View style={s.storyViewerFooter}>
                  {viewingStory.userId !== user?.id && (
                    <>
                      <View style={s.storyMsgInputWrapper}>
                        <TextInput
                          style={s.storyMsgInputField}
                          placeholder="Send message..."
                          placeholderTextColor={C.gray400}
                          value={storyReplyText}
                          onChangeText={setStoryReplyText}
                          editable={!isSendingReply}
                          onSubmitEditing={handleSendStoryReply}
                          returnKeyType="send"
                        />
                        {storyReplyText.trim().length > 0 && (
                          <TouchableOpacity
                            style={s.storyInlineSendBtn}
                            disabled={isSendingReply}
                            onPress={handleSendStoryReply}
                          >
                            {isSendingReply ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Send size={14} color="#FFFFFF" />}
                          </TouchableOpacity>
                        )}
                      </View>
                      <TouchableOpacity style={s.storyActionBtn} onPress={() => handleLikeStory(viewingStory.id)}>
                        <Heart size={24} color={viewingStory.liked ? C.red600 : '#FFFFFF'} fill={viewingStory.liked ? C.red600 : 'transparent'} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={s.storyActionBtn}
                        onPress={() => {
                          if (!isLoggedIn) { setShowLoginPrompt(true); return; }
                          chatService.getConversations(token!).then(setShareConversations).catch(() => {});
                          setShowStoryShareModal(true);
                        }}
                      >
                        <Send size={24} color="#FFFFFF" />
                      </TouchableOpacity>
                    </>
                  )}
                </View>

                {/* Story Options Modal — moved inside for better layering */}
                <Modal visible={!!storyOptionsStory} transparent animationType="slide" onRequestClose={() => setStoryOptionsStory(null)}>
                  <TouchableOpacity style={s.shareOverlay} activeOpacity={1} onPress={() => setStoryOptionsStory(null)}>
                    <View style={s.shareSheet}>
                      <View style={s.shareHandleBar} />
                      <Text style={s.shareTitle}>Story Options</Text>
                      <TouchableOpacity style={s.shareOption} onPress={() => {
                        const s = storyOptionsStory;
                        setStoryOptionsStory(null);
                        if (s) requestDeleteStory(s.id);
                      }}>
                        <View style={[s.shareOptionIcon, { backgroundColor: C.violet100 }]}><Trash2 size={20} color={C.violet600} /></View>
                        <View><Text style={[s.shareOptionTitle, { color: C.red600, fontWeight: '700' }]}>DELETE STORY</Text><Text style={s.shareOptionSub}>Permanently remove this story</Text></View>
                      </TouchableOpacity>
                      <TouchableOpacity style={s.shareCancelBtn} onPress={() => setStoryOptionsStory(null)}>
                        <Text style={s.shareCancelTxt}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                </Modal>

                {/* Story-specific Delete Confirmation — ensures it's on top of story viewer */}
                <Modal visible={confirmDeleteType === 'story'} transparent animationType="fade">
                  <View style={s.modalOverlayCenter}>
                    <View style={s.confirmModal}>
                      <Text style={s.confirmTitle}>Delete Story</Text>
                      <Text style={s.confirmSubtitle}>Are you sure you want to delete this story? This action cannot be undone.</Text>
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
              </>
            );
          })()}
        </KeyboardAvoidingView>
      </Modal>

      {/* Story Share Contact Picker */}
      <Modal visible={showStoryShareModal} transparent animationType="slide" onRequestClose={() => setShowStoryShareModal(false)}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowStoryShareModal(false)} />
        <View style={s.storyShareSheet}>
          <View style={s.storyShareHandle} />
          <Text style={s.storyShareTitle}>Share Story</Text>
          <ScrollView style={{ maxHeight: 320 }} keyboardShouldPersistTaps="handled">
            {shareConversations.map(conv => (
              <TouchableOpacity
                key={conv.id}
                style={s.storyShareRow}
                disabled={sharingConvId !== null}
                onPress={async () => {
                  if (!viewingStory) return;
                  setSharingConvId(conv.id);
                  try {
                    await chatService.sendMessage(conv.id, `Check out ${viewingStory.userName}'s story!`, token!, {
                      id: viewingStory.id,
                      text: viewingStory.textContent,
                      media: viewingStory.mediaUrl,
                    });
                    showToast(`Shared with ${conv.otherUserName}`, 'success');
                    setShowStoryShareModal(false);
                  } catch {
                    showToast('Failed to share', 'error');
                  } finally {
                    setSharingConvId(null);
                  }
                }}
              >
                <View style={s.storyShareAvatar}>
                  <Text style={s.storyShareAvatarTxt}>{conv.otherUserInitials}</Text>
                </View>
                <Text style={s.storyShareName}>{conv.otherUserName}</Text>
                {sharingConvId === conv.id && <ActivityIndicator size="small" color={C.violet600} />}
              </TouchableOpacity>
            ))}
            {shareConversations.length === 0 && (
              <Text style={s.storyShareEmpty}>No conversations yet</Text>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Post Share Contact Picker */}
      <Modal visible={!!sharingPostForChat} transparent animationType="slide" onRequestClose={() => setSharingPostForChat(null)}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setSharingPostForChat(null)} />
        <View style={s.storyShareSheet}>
          <View style={s.storyShareHandle} />
          <Text style={s.storyShareTitle}>Share Post</Text>
          <ScrollView style={{ maxHeight: 320 }} keyboardShouldPersistTaps="handled">
            {shareConversations.map(conv => (
              <TouchableOpacity
                key={conv.id}
                style={s.storyShareRow}
                disabled={sharingConvId !== null}
                onPress={async () => {
                  if (!sharingPostForChat) return;
                  setSharingConvId(conv.id);
                  try {
                    const shareContent = sharingPostForChat.content || sharingPostForChat.pollQuestion || '';
                    await chatService.sendMessage(conv.id, '', token!, undefined, {
                      id: sharingPostForChat.id,
                      authorId: sharingPostForChat.authorId,
                      authorName: sharingPostForChat.authorName,
                      content: shareContent,
                      imageUrl: sharingPostForChat.imageUrl,
                      pollOptions: sharingPostForChat.pollOptions ?? null,
                    });
                    showToast(`Shared with ${conv.otherUserName}`, 'success');
                    setSharingPostForChat(null);
                  } catch {
                    showToast('Failed to share', 'error');
                  } finally {
                    setSharingConvId(null);
                  }
                }}
              >
                <View style={s.storyShareAvatar}>
                  <Text style={s.storyShareAvatarTxt}>{conv.otherUserInitials}</Text>
                </View>
                <Text style={s.storyShareName}>{conv.otherUserName}</Text>
                {sharingConvId === conv.id && <ActivityIndicator size="small" color={C.violet600} />}
              </TouchableOpacity>
            ))}
            {shareConversations.length === 0 && (
              <Text style={s.storyShareEmpty}>No conversations yet</Text>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Spotlight Post Modal */}
      <Modal visible={!!spotlightPost || spotlightLoading} transparent animationType="slide" onRequestClose={() => setSpotlightPost(null)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} activeOpacity={1} onPress={() => setSpotlightPost(null)} />
        <View style={s.spotlightSheet}>
          <View style={s.spotlightHandle} />
          {spotlightLoading ? (
            <ActivityIndicator color={C.violet600} style={{ marginVertical: 40 }} />
          ) : spotlightPost ? (
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {renderPost(spotlightPost)}
            </ScrollView>
          ) : null}
        </View>
      </Modal>
      {/* Confirmation Modal — defined last to be on top */}
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
    </View>
  );
}

function createStyles(C: ThemeColors) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.gray50 },

  // Tabs
  tabs: { flexDirection: 'row', backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.gray200 },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', position: 'relative' },
  tabTxt: { fontSize: 14, fontWeight: '500', color: C.gray600 },
  tabTxtActive: { color: C.violet600, fontWeight: '700' },
  tabUnder: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, backgroundColor: C.violet600 },

  // Stories row
  storiesContainer: { backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.gray100 },
  storiesRow: { backgroundColor: C.white },
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
  repostBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8, alignSelf: 'flex-start', backgroundColor: C.violet50, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  repostBadgeTxt: { fontSize: 12, color: C.violet500, fontWeight: '600' },
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
  fabContainer: { position: 'absolute', right: 16, alignItems: 'flex-end', gap: 10 },
  fab: { width: 56, height: 56, borderRadius: 28, backgroundColor: C.violet600, alignItems: 'center', justifyContent: 'center', elevation: 8, shadowColor: C.violet600, shadowOpacity: 0.5, shadowRadius: 10 },
  fabActive: { backgroundColor: C.violet500, transform: [{ scale: 1.1 }] },
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
  storyProgressBarActive: { backgroundColor: '#FFFFFF' },
  storyViewerHdr: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 12, zIndex: 10 },
  storyViewerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.violet500, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  storyViewerAvatarImg: { width: '100%', height: '100%' },
  storyViewerAvatarTxt: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  storyViewerName: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  storyViewerTime: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
  storyOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, gap: 20 },
  storyTextOverlay: { position: 'absolute', bottom: 40, left: 20, right: 20, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 12, padding: 16 },
  storyTextContent: { color: '#FFFFFF', fontSize: 16, fontWeight: '500', textAlign: 'center' },
  storyFullText: { color: '#FFFFFF', fontSize: 32, fontWeight: '800', textAlign: 'center', lineHeight: 42, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 6 },
  storyTextOnMedia: { color: '#FFFFFF', fontSize: 22, fontWeight: '700', textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14, overflow: 'hidden' },
  // Nav constrained to stop ABOVE the footer so it never steals footer taps
  storyNav: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 90, flexDirection: 'row', zIndex: 1 },
  storyNavTouch: { flex: 1 },
  storyViewerFooter: { paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 16 : 12, paddingTop: 10, flexDirection: 'row', alignItems: 'center', gap: 12, zIndex: 20 },
  storyMsgInputWrapper: { flex: 1, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', flexDirection: 'row', alignItems: 'center' },
  storyMsgInputField: { flex: 1, color: '#FFFFFF', fontSize: 14, fontWeight: '500', ...(Platform.OS === 'web' ? { outlineWidth: 0, boxShadow: 'none' } : {}) },
  storyInlineSendBtn: { marginLeft: 8, backgroundColor: C.violet600, borderRadius: 12, alignItems: 'center', justifyContent: 'center', width: 24, height: 24 },
  storyActionBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  spotlightSheet: { backgroundColor: C.gray50, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '85%', paddingTop: 12 },
  spotlightHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.gray300, alignSelf: 'center', marginBottom: 8 },
  storyShareSheet: { backgroundColor: C.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 34, paddingHorizontal: 20, paddingTop: 12 },
  storyShareHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.gray300, alignSelf: 'center', marginBottom: 16 },
  storyShareTitle: { fontSize: 16, fontWeight: '700', color: C.gray900, marginBottom: 12 },
  storyShareRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  storyShareAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.violet100, alignItems: 'center', justifyContent: 'center' },
  storyShareAvatarTxt: { fontSize: 16, fontWeight: '700', color: C.violet600 },
  storyShareName: { flex: 1, fontSize: 15, color: C.gray900, fontWeight: '500' },
  storyShareEmpty: { textAlign: 'center', color: C.gray400, fontSize: 14, paddingVertical: 24 },

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
  storyCard: { width: 72, alignItems: 'center', gap: 6 },
  storyGradientBorder: { width: 68, height: 68, borderRadius: 34, padding: 2, alignItems: 'center', justifyContent: 'center' },
  storyAvatarInside: { width: 64, height: 64, borderRadius: 32, backgroundColor: C.gray200, padding: 2, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  storyAvatarImg: { width: '100%', height: '100%', borderRadius: 30 },
  storyAvatarWrap: { width: 68, height: 68, borderRadius: 34, backgroundColor: C.gray200, alignItems: 'center', justifyContent: 'center', position: 'relative', borderWidth: 1, borderColor: C.gray300 },
  storyAvatarTxt: { fontSize: 18, fontWeight: '700', color: C.gray600 },
  storyAddBadge: { position: 'absolute', bottom: 0, right: 0, width: 20, height: 20, borderRadius: 10, backgroundColor: C.violet600, borderWidth: 2, borderColor: C.white, alignItems: 'center', justifyContent: 'center' },
  storyName: { fontSize: 11, color: C.gray700, fontWeight: '500', marginTop: 2 },


  // Replies
  replyBtn: { marginLeft: 10 },
  replyBtnTxt: { fontSize: 11, color: C.violet600, fontWeight: '700' },
  replyIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 6, backgroundColor: C.gray100, borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  replyIndicatorTxt: { fontSize: 11, color: C.gray600, fontWeight: '600' },
  repliesContainer: { marginTop: 10, paddingLeft: 10, borderLeftWidth: 1, borderLeftColor: C.gray200 },
  replyRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  replyAvatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: C.violet50, alignItems: 'center', justifyContent: 'center' },
  replyAvatarTxt: { fontSize: 9, fontWeight: '700', color: C.violet600 },
  replyBubble: { flex: 1, backgroundColor: C.white, borderRadius: 10, padding: 8, borderWidth: 1, borderColor: C.gray100 },
  commentInputContainer: { marginTop: 4 },

  storyCreator: { flex: 1, backgroundColor: '#000' },
  storyCreatorHdr: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 10, zIndex: 10 },
  storyCreatorClose: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  storyCreatorBody: { flex: 1, position: 'relative' },
  
  storyLeftSidebar: { position: 'absolute', left: 20, top: '20%', gap: 24, zIndex: 10 },
  storyRightSidebar: { position: 'absolute', right: 20, top: '15%', gap: 24, zIndex: 10 },
  storySideTool: { alignItems: 'center', gap: 6 },
  storySideToolTxt: { color: '#FFFFFF', fontSize: 11, fontWeight: '500' },
  storySideBgDot: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: 'rgba(255,255,255,0.8)' },
  bgPickerPanel: { position: 'absolute', left: 48, top: 0, flexDirection: 'row', flexWrap: 'wrap', gap: 8, width: 176, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 16, padding: 10 },
  bgSwatch: { width: 44, height: 44, borderRadius: 10, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
  bgSwatchActive: { borderColor: C.white },
  bgSwatchGrad: { width: '100%', height: '100%' },
  bgSwatchCheck: { position: 'absolute', bottom: 3, right: 3, width: 16, height: 16, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },

  storyPreviewContainer: { ...StyleSheet.absoluteFillObject },
  storyPreviewImgWrap: { width: '100%', height: '100%' },
  storyPreviewImg: { width: '100%', height: '100%' },
  storyTextBg: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  storyCameraPlaceholder: { width: '100%', height: '100%', backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' },
  
  storyOverlayContent: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', padding: 40 },
  storyCreatorInput: {
    color: '#FFFFFF',
    fontSize: 32, 
    textAlign: 'center', 
    width: '100%', 
    textShadowColor: 'rgba(0,0,0,0.5)', 
    textShadowOffset: {width: 1, height: 1}, 
    textShadowRadius: 8, 
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
    borderWidth: 0,
    ...(Platform.OS === 'web' ? { outlineWidth: 0, boxShadow: 'none' } : {}),
  },

  storyTextItemDelete: { position: 'absolute', top: -10, right: -10, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', zIndex: 5 },

  storyCreatorFooter: { paddingBottom: 40, paddingHorizontal: 20 },
  storyCaptureRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  storyCaptureBtn: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  storyCaptureBtnInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFFFFF' },
  storyGalleryBtn: { width: 44, height: 44, borderRadius: 8, borderWidth: 2, borderColor: '#FFFFFF', overflow: 'hidden' },
  storyGalleryThumb: { flex: 1, backgroundColor: 'rgba(255,255,255,0.2)' },

  storyPostRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  storyPostToggle: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.2)', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 24 },
  storyPostAvatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  storyPostToggleTxt: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  storySendBtn: { width: 54, height: 54, borderRadius: 27, backgroundColor: C.violet600, alignItems: 'center', justifyContent: 'center', elevation: 5, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 5 },

  storyModeSelector: { alignItems: 'center' },
  storyModeTxtActive: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', letterSpacing: 1 },

  // Story Poll — always white regardless of theme
  storyPollOverlay: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, width: '100%', marginBottom: 20, elevation: 10, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 15, overflow: 'visible' },
  storyPollQuestionInput: { color: '#000000', fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 15 },
  storyPollOptWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 15, marginBottom: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  storyPollOptInput: { flex: 1, color: '#000000', fontSize: 14, paddingVertical: 12, textAlign: 'center' },
  storyPollOptRemove: { padding: 4 },
  storyPollDismiss: { position: 'absolute', top: -12, right: -12, width: 26, height: 26, borderRadius: 13, backgroundColor: '#000000', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  storyAddPollOpt: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, marginBottom: 12, alignSelf: 'center' },
  storyAddPollOptTxt: { color: '#7C3AED', fontSize: 13, fontWeight: '600' },
  storyPollRemove: { marginTop: 10, alignSelf: 'center' },
  storyPollRemoveTxt: { color: '#9CA3AF', fontSize: 12 },

  storyPollViewer: { width: '80%', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
  storyPollQ: { color: '#000000', fontSize: 16, fontWeight: '700', textAlign: 'center', marginBottom: 16 },
  storyPollOption: { backgroundColor: '#F3F4F6', borderRadius: 12, padding: 14, marginBottom: 8, overflow: 'hidden', position: 'relative', borderWidth: 1, borderColor: '#F3F4F6' },
  storyPollOptBg: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: 'rgba(124, 58, 237, 0.1)' },
  storyPollOptContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 },
  storyPollOptLabel: { color: '#000000', fontSize: 14, fontWeight: '600' },
  storyPollOptPct: { color: '#7C3AED', fontSize: 13, fontWeight: '700' },

  // Settings & Layout Menus
  settingsModal: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  settingsContent: { backgroundColor: C.white, borderRadius: 24, padding: 24, width: '85%', gap: 15 },
  settingsTitle: { fontSize: 20, fontWeight: '700', color: C.gray900, marginBottom: 5 },
  settingsOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.gray100 },
  settingsOptionTxt: { fontSize: 16, color: C.gray800, fontWeight: '500' },
  settingsClose: { backgroundColor: C.violet600, paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  settingsCloseTxt: { color: C.white, fontWeight: '700' },

  layoutMenu: { position: 'absolute', left: 80, top: '20%', backgroundColor: 'rgba(0,0,0,0.8)', padding: 10, borderRadius: 12, gap: 10, zIndex: 20 },
  layoutOpt: { width: 44, height: 60, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', borderRadius: 4, padding: 2 },
  layoutBox: { flex: 1, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2 },

  storyGridLayout: { flex: 1, width: '100%', flexDirection: 'row', flexWrap: 'wrap' },
  storyGridSlot: { width: '50%', height: '50%', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  removeImageBtn: { position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },


  storyNoticeBanner: { position: 'absolute', top: 0, left: '10%', right: '10%', backgroundColor: 'rgba(124, 58, 237, 0.9)', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, zIndex: 1000, elevation: 10, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10 },
  storyNoticeTxt: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
}); }
