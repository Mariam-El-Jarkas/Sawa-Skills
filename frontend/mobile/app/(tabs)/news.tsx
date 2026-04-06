import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Modal, StyleSheet, Alert } from 'react-native';
import { Heart, MessageCircle, Share2, Plus, MoreHorizontal, Trash2, MapPin, X, Users, UserPlus, UserCheck, Send } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { C } from '../../components/theme';

interface Post { id: number; type: 'ml' | 'user'; author: string; avatar: string; time: string; content: string; image?: string; likes: number; userLiked?: boolean; comments: number; shares: number; isConnected?: boolean; location?: string; }

const initialPosts: Post[] = [
  { id: 1, type: 'user', author: 'Sarah M.', avatar: 'SM', time: '3 hours ago', content: 'Just completed an amazing cooking swap with John! Learned how to make traditional Lebanese dishes. Highly recommend skill swapping!', likes: 24, comments: 8, shares: 3, userLiked: false, isConnected: true, location: 'Beirut, Lebanon' },
  { id: 2, type: 'ml', author: 'Sawa AI', avatar: '🤖', time: '5 hours ago', content: 'New skill exchange opportunities detected in your area! Photography workshops are trending this week.', image: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=600', likes: 45, comments: 15, shares: 12 },
  { id: 3, type: 'user', author: 'John D.', avatar: 'JD', time: '8 hours ago', content: 'Looking for someone to help me improve my photography skills. I can offer web development lessons in return!', likes: 12, comments: 4, shares: 1, isConnected: false, location: 'Tripoli, Lebanon' },
];

const communityUsers = [
  { id: 1, name: 'Sarah M.', skills: 'Cooking • Music', avatar: 'SM', isConnected: true },
  { id: 2, name: 'Maya K.', skills: 'Languages • Writing', avatar: 'MK', isConnected: false },
  { id: 3, name: 'Omar T.', skills: 'Tech • Design', avatar: 'OT', isConnected: false },
  { id: 4, name: 'David C.', skills: 'UI/UX • Figma', avatar: 'DC', isConnected: false },
];

export default function NewsScreen() {
  const router = useRouter();
  const { isLoggedIn, setShowLoginPrompt } = useAuth();
  const [tab, setTab] = useState<'for_you' | 'following'>('for_you');
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [users, setUsers] = useState(communityUsers);
  const [newPost, setNewPost] = useState('');
  const [showPostModal, setShowPostModal] = useState(false);
  const [openComments, setOpenComments] = useState<number | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  const [commentsMap, setCommentsMap] = useState<Record<number, { author: string; avatar: string; text: string }[]>>({});
  const [showActions, setShowActions] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleLike = (id: number) => {
    if (!isLoggedIn) { setShowLoginPrompt(true); return; }
    setPosts(ps => ps.map(p => p.id === id ? { ...p, likes: p.userLiked ? p.likes - 1 : p.likes + 1, userLiked: !p.userLiked } : p));
  };

  const handleComment = (id: number) => {
    if (!isLoggedIn) { setShowLoginPrompt(true); return; }
    const txt = commentInputs[id]?.trim();
    if (!txt) return;
    setCommentsMap(prev => ({ ...prev, [id]: [...(prev[id] || []), { author: 'Alex M.', avatar: 'AM', text: txt }] }));
    setPosts(ps => ps.map(p => p.id === id ? { ...p, comments: p.comments + 1 } : p));
    setCommentInputs(prev => ({ ...prev, [id]: '' }));
  };

  const handleCreatePost = async () => {
    if (!newPost.trim() && !selectedImage) return;
    const newP: Post = { id: Date.now(), type: 'user', author: 'Alex M.', avatar: 'AM', time: 'Just now', content: newPost, image: selectedImage || undefined, likes: 0, comments: 0, shares: 0, isConnected: true };
    setPosts(ps => [newP, ...ps]);
    setNewPost(''); setSelectedImage(null); setShowPostModal(false);
  };

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!res.canceled) setSelectedImage(res.assets[0].uri);
  };

  const toggleConnect = (userId: number) => {
    if (!isLoggedIn) { setShowLoginPrompt(true); return; }
    setUsers(us => us.map(u => u.id === userId ? { ...u, isConnected: !u.isConnected } : u));
  };

  const PostCard = ({ post }: { post: Post }) => (
    <View style={ps.postCard}>
      <View style={ps.postHdr}>
        <View style={[ps.avatar, post.type === 'ml' && ps.aiAvatar]}>
          <Text style={ps.avatarTxt}>{post.avatar}</Text>
        </View>
        <View style={ps.postHdrInfo}>
          <View style={ps.nameRow}>
            <Text style={ps.authorName}>{post.author}</Text>
            {post.type === 'ml' && <View style={ps.aiBadge}><Text style={ps.aiBadgeTxt}>AI</Text></View>}
          </View>
          <View style={ps.metaRow}>
            <Text style={ps.timeTxt}>{post.time}</Text>
            {post.location && <><Text style={ps.dot}>·</Text><MapPin size={10} color={C.gray400} /><Text style={ps.locationTxt}>{post.location}</Text></>}
          </View>
        </View>
        {post.author === 'Alex M.' && (
          <TouchableOpacity onPress={() => setPosts(prev => prev.filter(p => p.id !== post.id))}>
            <Trash2 size={16} color={C.gray400} />
          </TouchableOpacity>
        )}
      </View>

      <Text style={ps.postContent}>{post.content}</Text>

      {post.image && <Image source={{ uri: post.image }} style={ps.postImage} resizeMode="cover" />}

      <View style={ps.interBar}>
        <View style={ps.interLeft}>
          <TouchableOpacity style={[ps.interBtn, post.userLiked && ps.interBtnActive]} onPress={() => handleLike(post.id)}>
            <Heart size={16} color={post.userLiked ? C.red600 : C.gray600} fill={post.userLiked ? C.red600 : 'transparent'} />
            <Text style={[ps.interCount, post.userLiked && ps.interCountActive]}>{post.likes}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[ps.interBtn, openComments === post.id && ps.interBtnViolet]} onPress={() => setOpenComments(openComments === post.id ? null : post.id)}>
            <MessageCircle size={16} color={openComments === post.id ? C.violet600 : C.gray600} />
            <Text style={[ps.interCount, openComments === post.id && ps.interCountViolet]}>{post.comments}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => { if (!isLoggedIn) { setShowLoginPrompt(true); return; } Alert.alert('Shared!'); }}>
          <Share2 size={16} color={C.gray500} />
        </TouchableOpacity>
      </View>

      {openComments === post.id && (
        <View style={ps.commentsSection}>
          {(commentsMap[post.id] || []).map((c, i) => (
            <View key={i} style={ps.commentRow}>
              <View style={ps.commentAvatar}><Text style={ps.commentAvatarTxt}>{c.avatar}</Text></View>
              <View style={ps.commentBubble}>
                <Text style={ps.commentAuthor}>{c.author}</Text>
                <Text style={ps.commentTxt}>{c.text}</Text>
              </View>
            </View>
          ))}
          <View style={ps.commentInput}>
            <TextInput style={ps.commentField} placeholder="Add a comment..." placeholderTextColor={C.gray400} value={commentInputs[post.id] || ''} onChangeText={v => setCommentInputs(prev => ({ ...prev, [post.id]: v }))} onSubmitEditing={() => handleComment(post.id)} />
            <TouchableOpacity onPress={() => handleComment(post.id)}>
              <Send size={18} color={C.violet600} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <View style={ps.screen}>
      {/* Tabs */}
      <View style={ps.tabs}>
        {(['for_you', 'following'] as const).map(t => (
          <TouchableOpacity key={t} style={ps.tabBtn} onPress={() => { if (t === 'following' && !isLoggedIn) { setShowLoginPrompt(true); return; } setTab(t); }}>
            <Text style={[ps.tabTxt, tab === t && ps.tabTxtActive]}>{t === 'for_you' ? 'For You' : 'Following'}</Text>
            {tab === t && <View style={ps.tabUnder} />}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {tab === 'following' && (
          <View style={ps.suggestSection}>
            <Text style={ps.suggestTitle}>Suggested Connections</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {users.map(u => (
                <View key={u.id} style={ps.userCard}>
                  <View style={ps.userAvatar}><Text style={ps.userAvatarTxt}>{u.avatar}</Text></View>
                  <Text style={ps.userName}>{u.name}</Text>
                  <Text style={ps.userSkills} numberOfLines={1}>{u.skills}</Text>
                  <TouchableOpacity style={[ps.connectBtn, u.isConnected && ps.connectBtnDone]} onPress={() => toggleConnect(u.id)}>
                    {u.isConnected ? <UserCheck size={14} color={C.gray500} /> : <UserPlus size={14} color={C.white} />}
                    <Text style={[ps.connectBtnTxt, u.isConnected && ps.connectBtnTxtDone]}>{u.isConnected ? 'Connected' : 'Connect'}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {posts
          .filter(p => tab === 'for_you' ? true : p.isConnected || p.author === 'Alex M.')
          .map(p => <PostCard key={p.id} post={p} />)}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <View style={ps.fab}>
        {showActions && (
          <View style={ps.fabMenu}>
            <TouchableOpacity style={ps.fabMenuItem} onPress={() => { setShowPostModal(true); setShowActions(false); }}>
              <Text style={ps.fabMenuTxt}>Create Post</Text>
            </TouchableOpacity>
          </View>
        )}
        <TouchableOpacity style={ps.fabBtn} onPress={() => { if (!isLoggedIn) { setShowLoginPrompt(true); return; } setShowActions(!showActions); }}>
          <Plus size={24} color={C.white} />
        </TouchableOpacity>
      </View>

      {/* Create Post Modal */}
      <Modal visible={showPostModal} transparent animationType="slide">
        <View style={ps.modalOverlay}>
          <View style={ps.postModal}>
            <View style={ps.postModalHdr}>
              <TouchableOpacity onPress={() => setShowPostModal(false)}><X size={22} color={C.gray700} /></TouchableOpacity>
              <Text style={ps.postModalTitle}>Create Post</Text>
              <TouchableOpacity style={[ps.postBtn, (!newPost.trim() && !selectedImage) && ps.postBtnDisabled]} onPress={handleCreatePost} disabled={!newPost.trim() && !selectedImage}>
                <Text style={ps.postBtnTxt}>Post</Text>
              </TouchableOpacity>
            </View>
            <View style={ps.postModalBody}>
              <View style={ps.authorRow}>
                <View style={ps.postAuthorAvatar}><Text style={ps.postAuthorTxt}>AM</Text></View>
                <View>
                  <Text style={ps.postAuthorName}>Alex Morgan</Text>
                  <View style={ps.publicBadge}><Users size={10} color={C.gray500} /><Text style={ps.publicTxt}>Public</Text></View>
                </View>
              </View>
              <TextInput style={ps.postTextInput} placeholder="What's on your mind?" placeholderTextColor={C.gray400} value={newPost} onChangeText={setNewPost} multiline autoFocus />
              {selectedImage && <Image source={{ uri: selectedImage }} style={ps.selectedImg} />}
            </View>
            <View style={ps.postModalFooter}>
              <TouchableOpacity onPress={pickImage} style={ps.mediaBtn}>
                <Text style={ps.mediaBtnTxt}>📷 Photo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const ps = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.gray50 },
  tabs: { flexDirection: 'row', backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.gray200 },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', position: 'relative' },
  tabTxt: { fontSize: 14, fontWeight: '500', color: C.gray600 },
  tabTxtActive: { color: C.violet600, fontWeight: '600' },
  tabUnder: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, backgroundColor: C.violet600 },
  suggestSection: { backgroundColor: C.white, padding: 16, borderBottomWidth: 1, borderBottomColor: C.gray100 },
  suggestTitle: { fontSize: 14, fontWeight: '600', marginBottom: 12, color: C.gray900 },
  userCard: { width: 130, backgroundColor: C.white, borderRadius: 16, padding: 14, alignItems: 'center', marginRight: 10, borderWidth: 1, borderColor: C.gray100 },
  userAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.violet100, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  userAvatarTxt: { fontSize: 16, fontWeight: '700', color: C.violet600 },
  userName: { fontSize: 12, fontWeight: '700', color: C.gray900, marginBottom: 2 },
  userSkills: { fontSize: 10, color: C.gray500, marginBottom: 10, textAlign: 'center' },
  connectBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.violet600, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  connectBtnDone: { backgroundColor: C.gray100 },
  connectBtnTxt: { color: C.white, fontSize: 11, fontWeight: '700' },
  connectBtnTxtDone: { color: C.gray500 },
  postCard: { backgroundColor: C.white, marginBottom: 8, padding: 16, borderBottomWidth: 1, borderBottomColor: C.gray100 },
  postHdr: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.violet600, alignItems: 'center', justifyContent: 'center' },
  aiAvatar: { backgroundColor: C.violet500 },
  avatarTxt: { color: C.white, fontWeight: '700', fontSize: 14 },
  postHdrInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  authorName: { fontSize: 14, fontWeight: '700', color: C.gray900 },
  aiBadge: { backgroundColor: C.violet50, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  aiBadgeTxt: { fontSize: 9, fontWeight: '700', color: C.violet600 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  timeTxt: { fontSize: 11, color: C.gray500 },
  dot: { fontSize: 11, color: C.gray400 },
  locationTxt: { fontSize: 11, color: C.gray400 },
  postContent: { fontSize: 14, color: C.gray800, lineHeight: 20, marginBottom: 10 },
  postImage: { width: '100%', height: 220, borderRadius: 12, marginBottom: 10 },
  interBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 },
  interLeft: { flexDirection: 'row', gap: 4 },
  interBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  interBtnActive: { backgroundColor: '#FEE2E2' },
  interBtnViolet: { backgroundColor: C.violet50 },
  interCount: { fontSize: 12, fontWeight: '700', color: C.gray600 },
  interCountActive: { color: C.red600 },
  interCountViolet: { color: C.violet600 },
  commentsSection: { marginTop: 10, borderTopWidth: 1, borderTopColor: C.gray100, paddingTop: 10, gap: 8 },
  commentRow: { flexDirection: 'row', gap: 8 },
  commentAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.violet100, alignItems: 'center', justifyContent: 'center' },
  commentAvatarTxt: { fontSize: 10, fontWeight: '700', color: C.violet600 },
  commentBubble: { flex: 1, backgroundColor: C.gray50, borderRadius: 12, padding: 8 },
  commentAuthor: { fontSize: 11, fontWeight: '700', color: C.gray900 },
  commentTxt: { fontSize: 12, color: C.gray700, marginTop: 2 },
  commentInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.gray50, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, gap: 8 },
  commentField: { flex: 1, fontSize: 13, color: C.gray900 },
  fab: { position: 'absolute', bottom: 80, right: 16, alignItems: 'flex-end', gap: 8 },
  fabMenu: { gap: 6, marginBottom: 4 },
  fabMenuItem: { backgroundColor: C.white, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8 },
  fabMenuTxt: { fontSize: 13, fontWeight: '600', color: C.gray800 },
  fabBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: C.violet600, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: C.violet600, shadowOpacity: 0.4, shadowRadius: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  postModal: { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%' },
  postModalHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: C.gray100 },
  postModalTitle: { fontSize: 16, fontWeight: '700' },
  postBtn: { backgroundColor: C.violet600, paddingHorizontal: 20, paddingVertical: 6, borderRadius: 20 },
  postBtnDisabled: { opacity: 0.4 },
  postBtnTxt: { color: C.white, fontWeight: '700', fontSize: 13 },
  postModalBody: { padding: 16, gap: 12 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  postAuthorAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.violet600, alignItems: 'center', justifyContent: 'center' },
  postAuthorTxt: { color: C.white, fontWeight: '700' },
  postAuthorName: { fontSize: 14, fontWeight: '700' },
  publicBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: C.gray100, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, marginTop: 2 },
  publicTxt: { fontSize: 10, color: C.gray500 },
  postTextInput: { fontSize: 16, color: C.gray900, minHeight: 100, textAlignVertical: 'top' },
  selectedImg: { width: '100%', height: 200, borderRadius: 12 },
  postModalFooter: { padding: 16, borderTopWidth: 1, borderTopColor: C.gray100 },
  mediaBtn: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: C.gray50, borderRadius: 20, alignSelf: 'flex-start' },
  mediaBtnTxt: { fontSize: 13, color: C.gray700 },
});
