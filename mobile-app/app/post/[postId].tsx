import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, SafeAreaView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Heart, MessageCircle, Share2, BarChart3 } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { postsService, Post, Comment } from '../../services/postsService';
import { BASE_URL } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';

function resolveUrl(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `${BASE_URL}${url}`;
}

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

export default function PostDetailScreen() {
  const { C } = useTheme();
  const router = useRouter();
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const { token } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!postId) return;
    const id = Number(postId);
    Promise.all([
      postsService.getPostById(id, token),
      postsService.getComments(id, token),
    ])
      .then(([p, c]) => { setPost(p); setComments(c); })
      .catch(() => setError('Failed to load post'))
      .finally(() => setLoading(false));
  }, [postId, token]);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: C.gray50 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.gray100 },
    backBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 17, fontWeight: '700', color: C.gray900 },
    errorTxt: { textAlign: 'center', color: C.gray400, marginTop: 60, fontSize: 15 },
    postCard: { backgroundColor: C.white, margin: 12, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
    authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.violet100, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    avatarImg: { width: 40, height: 40, borderRadius: 20 },
    avatarTxt: { fontSize: 14, fontWeight: '700', color: C.violet600 },
    authorName: { fontSize: 14, fontWeight: '700', color: C.gray900 },
    postTime: { fontSize: 11, color: C.gray400 },
    content: { fontSize: 15, color: C.gray800, lineHeight: 22, marginBottom: 12 },
    pollSection: { marginBottom: 12 },
    pollQuestion: { fontSize: 15, fontWeight: '700', color: C.gray900, marginBottom: 10 },
    pollOpt: { borderWidth: 1, borderColor: C.gray200, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    pollOptVoted: { borderColor: C.violet600, backgroundColor: C.violet50 ?? '#f5f3ff' },
    pollOptTxt: { fontSize: 14, color: C.gray700, fontWeight: '500' },
    pollOptTxtVoted: { color: C.violet600, fontWeight: '700' },
    pollPct: { fontSize: 12, color: C.gray400, fontWeight: '600' },
    postImg: { width: '100%', borderRadius: 12, aspectRatio: 1, marginBottom: 12 },
    actions: { flexDirection: 'row', gap: 20, paddingTop: 8, borderTopWidth: 1, borderTopColor: C.gray100 },
    actionItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    actionTxt: { fontSize: 13, color: C.gray500 },
    commentsSection: { backgroundColor: C.white, marginHorizontal: 12, borderRadius: 16, padding: 16 },
    commentsSectionTitle: { fontSize: 15, fontWeight: '700', color: C.gray900, marginBottom: 14 },
    commentRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
    commentAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.violet100, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    commentAvatarTxt: { fontSize: 11, fontWeight: '700', color: C.violet600 },
    commentBubble: { flex: 1, backgroundColor: C.gray50, borderRadius: 12, padding: 10 },
    commentAuthor: { fontSize: 13, fontWeight: '700', color: C.gray900, marginBottom: 2 },
    commentTxt: { fontSize: 13, color: C.gray700, lineHeight: 18 },
    commentTime: { fontSize: 10, color: C.gray400, marginTop: 4 },
    replyRow: { flexDirection: 'row', gap: 8, marginTop: 10, paddingLeft: 8, borderLeftWidth: 2, borderLeftColor: C.gray200 },
    replyAvatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: C.violet100, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  }), [C]);

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ArrowLeft size={22} color={C.gray900} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Post</Text>
        <View style={{ width: 38 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={C.violet600} style={{ marginTop: 60 }} />
      ) : error ? (
        <Text style={s.errorTxt}>{error}</Text>
      ) : post ? (
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Post card */}
          <View style={s.postCard}>
            {/* Author row */}
            <TouchableOpacity style={s.authorRow} onPress={() => router.push(`/profile/${post.authorId}` as any)}>
              <View style={s.avatar}>
                {post.authorPicture
                  ? <Image source={{ uri: resolveUrl(post.authorPicture)! }} style={s.avatarImg} resizeMode="cover" />
                  : <Text style={s.avatarTxt}>{post.authorInitials}</Text>
                }
              </View>
              <View>
                <Text style={s.authorName}>{post.authorName}</Text>
                <Text style={s.postTime}>{relativeTime(post.createdAt)}</Text>
              </View>
            </TouchableOpacity>

            {/* Content */}
            {post.content ? <Text style={s.content}>{post.content}</Text> : null}

            {/* Poll */}
            {post.pollQuestion && (
              <View style={s.pollSection}>
                <Text style={s.pollQuestion}>{post.pollQuestion}</Text>
                {post.pollOptions?.split(',').map((opt, i) => (
                  <View key={i} style={[s.pollOpt, post.userPollVote === opt.trim() && s.pollOptVoted]}>
                    <Text style={[s.pollOptTxt, post.userPollVote === opt.trim() && s.pollOptTxtVoted]}>
                      {opt.trim()}
                    </Text>
                    {post.pollResults && (
                      <Text style={s.pollPct}>
                        {Math.round(((post.pollResults[opt.trim()] ?? 0) / Math.max(Object.values(post.pollResults).reduce((a, b) => a + Number(b), 0), 1)) * 100)}%
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Image */}
            {post.imageUrl ? (
              <Image source={{ uri: resolveUrl(post.imageUrl)! }} style={s.postImg} resizeMode="cover" />
            ) : null}

            {/* Actions */}
            <View style={s.actions}>
              <View style={s.actionItem}>
                <Heart size={18} color={post.isLiked ? C.red600 : C.gray400} fill={post.isLiked ? C.red600 : 'transparent'} />
                <Text style={s.actionTxt}>{post.likeCount}</Text>
              </View>
              <View style={s.actionItem}>
                <MessageCircle size={18} color={C.gray400} />
                <Text style={s.actionTxt}>{post.commentCount}</Text>
              </View>
            </View>
          </View>

          {/* Comments */}
          {comments.length > 0 && (
            <View style={s.commentsSection}>
              <Text style={s.commentsSectionTitle}>Comments</Text>
              {comments.map(c => (
                <View key={c.id} style={s.commentRow}>
                  <View style={s.commentAvatar}>
                    <Text style={s.commentAvatarTxt}>{c.authorInitials}</Text>
                  </View>
                  <View style={s.commentBubble}>
                    <Text style={s.commentAuthor}>{c.authorName}</Text>
                    <Text style={s.commentTxt}>{c.content}</Text>
                    <Text style={s.commentTime}>{relativeTime(c.createdAt)}</Text>
                    {c.replies?.map(r => (
                      <View key={r.id} style={s.replyRow}>
                        <View style={s.replyAvatar}>
                          <Text style={s.commentAvatarTxt}>{r.authorInitials}</Text>
                        </View>
                        <View style={s.commentBubble}>
                          <Text style={s.commentAuthor}>{r.authorName}</Text>
                          <Text style={s.commentTxt}>{r.content}</Text>
                          <Text style={s.commentTime}>{relativeTime(r.createdAt)}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

