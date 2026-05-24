import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform, RefreshControl, Modal, Image, Alert } from 'react-native';
import { ArrowLeft, Search, Send, Info, Users, Shield, ShieldCheck, Lock, Unlock, X, Trash2 } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../hooks/useChat';
import { GuestGate } from '../../components/GuestGate';
import { VerificationGate } from '../../components/VerificationGate';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../components/modals/AppToast';
import { chatService } from '../../services/chatService';
import { resolveUrl } from '../../utils/helpers';

export default function ChatScreen() {
  const { C } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isLoggedIn, user, setShowLoginPrompt, token } = useAuth();
  const { openId, openUserId } = useLocalSearchParams<{ openId?: string, openUserId?: string }>();
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const {
    conversations, activeConversationId, messages,
    isLoading, isMessagesLoading,
    fetchConversations, openConversation, closeConversation,
    sendMessage, updatePermissions, startConversation, clearConversation, clearMessages, leaveGroup,
  } = useChat();

  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isAtBottom, setIsAtBottom] = useState(true);
  const scrollRef = useRef<ScrollView>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [confirmDeleteConvId, setConfirmDeleteConvId] = useState<number | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (isLoggedIn) fetchConversations();
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) {
      if (openId) {
        const id = Number(openId);
        if (id && id !== activeConversationId) openConversation(id);
      } else if (openUserId) {
        const uid = Number(openUserId);
        if (uid) {
          startConversation(uid).then(conv => {
            if (conv.id !== activeConversationId) openConversation(conv.id);
          }).catch(e => showToast(e.message, 'error'));
        }
      }
    }
  }, [isLoggedIn, openId, openUserId]);
  
  useEffect(() => {
    if (!isLoggedIn || !token) return;
    const delayDebounceFn = setTimeout(async () => {
      const query = searchText.trim();
      if (query.length > 0) {
        setIsSearching(true);
        try {
          const results = await chatService.searchConversations(query, token);
          setSearchResults(results);
        } catch (e) {
          console.error('Search error:', e);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [searchText, isLoggedIn, token]);

  useEffect(() => {
    if (messages.length > 0 && isAtBottom) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length, isAtBottom]);

  const handleSend = async () => {
    if (!isLoggedIn) { setShowLoginPrompt(true); return; }
    const text = message.trim();
    if (!text || isSending) return;
    setMessage('');
    setIsSending(true);
    try {
      await sendMessage(text);
    } catch (e: any) {
      setMessage(text);
      showToast(e.message ?? 'Failed to send', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleOpenConversation = async (chat: any) => {
    if (chat.id) {
      await openConversation(chat.id);
    } else if (chat.otherUserId) {
      try {
        const conv = await startConversation(chat.otherUserId);
        await openConversation(conv.id);
      } catch (e: any) {
        showToast(e.message ?? 'Failed to start chat', 'error');
      }
    }
  };

  const displayConversations = searchText.trim() ? searchResults : conversations;
  const activeConv = conversations.find(c => c.id === activeConversationId);
  const { user: currentUser } = useAuth();
  const isAdmin = activeConv?.isGroup && activeConv.adminId === currentUser?.id;
  const canSendMessage = !activeConv?.isGroup || activeConv?.everyoneCanMessage || isAdmin;

  const toggleEveryoneCanMessage = async () => {
    if (!activeConv || !isAdmin) return;
    try {
      await updatePermissions(activeConv.id, !activeConv.everyoneCanMessage);
      showToast('Permissions updated', 'success');
    } catch (e: any) {
      showToast(e.message ?? 'Failed to update permissions', 'error');
    }
  };

  const handleClearMessages = async () => {
    if (!activeConv) return;
    try {
      await clearMessages(activeConv.id);
      showToast('Chat history cleared', 'success');
    } catch (e: any) {
      showToast(e.message ?? 'Failed to clear chat', 'error');
    }
  };

  const handleLeaveGroup = async () => {
    if (!activeConv) return;
    try {
      await leaveGroup(activeConv.id);
      setShowInfo(false);
      closeConversation();
      showToast('You left the group', 'success');
    } catch (e: any) {
      showToast(e.message ?? 'Failed to leave group', 'error');
    }
  };

  const s = useMemo(() => StyleSheet.create({
    screen: { flex: 1, backgroundColor: C.white },
    body: { padding: 16, gap: 16, paddingBottom: 32 },
    title: { fontSize: 24, fontWeight: '700', color: C.gray900 },
    searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.white, borderRadius: 12, borderWidth: 1, borderColor: C.gray200, paddingHorizontal: 12, paddingVertical: 10 },
    searchInput: { flex: 1, fontSize: 14, color: C.gray800 },
    chatList: { gap: 4 },
    chatItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: C.gray100, backgroundColor: C.white },
    chatItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    avatarWrap: { position: 'relative' },
    avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.violet500, alignItems: 'center', justifyContent: 'center' },
    avatarTxt: { color: C.white, fontWeight: '700', fontSize: 16 },
    chatItemInfo: { flex: 1 },
    chatItemTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
    chatName: { fontWeight: '600', fontSize: 15, color: C.gray900 },
    chatTime: { fontSize: 12, color: C.gray400 },
    chatLastMsg: { fontSize: 13, color: C.gray500 },
    groupBadge: { alignSelf: 'flex-start', backgroundColor: C.violet100, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, marginBottom: 2 },
    groupBadgeTxt: { fontSize: 10, color: C.violet600, fontWeight: '600' },
    unreadBadge: { minWidth: 22, height: 22, borderRadius: 11, backgroundColor: C.violet600, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
    unreadTxt: { color: C.white, fontSize: 11, fontWeight: '700' },
    empty: { alignItems: 'center', paddingVertical: 40 },
    emptyTxt: { color: C.gray500, fontSize: 14, textAlign: 'center' },
    chatHdr: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.gray100, backgroundColor: C.white, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3 },
    backBtn: { padding: 4 },
    chatHdrInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
    chatHdrAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.violet600, alignItems: 'center', justifyContent: 'center' },
    chatHdrAvatarTxt: { color: C.white, fontWeight: '700', fontSize: 14 },
    chatHdrName: { fontWeight: '700', fontSize: 16, color: C.gray900 },
    chatHdrSub: { fontSize: 11, color: C.violet600, fontWeight: '600' },
    infoBtn: { padding: 8, backgroundColor: C.violet50, borderRadius: 12 },
    messages: { flex: 1, backgroundColor: C.gray50 },
    messagesContent: { padding: 16, gap: 12 },
    sharedPostCard: { maxWidth: '80%', borderRadius: 14, overflow: 'hidden', borderWidth: 1 },
    sharedPostCardMe: { borderColor: C.violet400, backgroundColor: C.violet600 },
    sharedPostCardThem: { borderColor: C.gray200, backgroundColor: C.white },
    sharedPostHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10 },
    sharedPostAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.violet100, alignItems: 'center', justifyContent: 'center' },
    sharedPostAvatarTxt: { fontSize: 10, fontWeight: '700', color: C.violet600 },
    sharedPostAuthorTxt: { fontSize: 13, fontWeight: '600', color: C.gray900, flex: 1 },
    sharedPostImg: { width: '100%', aspectRatio: 1 },
    sharedPostContentTxt: { fontSize: 13, color: C.gray700, paddingHorizontal: 10, paddingBottom: 6, lineHeight: 18 },
    sharedPostQuestionTxt: { fontSize: 14, fontWeight: '700', paddingHorizontal: 10, paddingTop: 8, paddingBottom: 6, color: C.gray900 },
    sharedPostPollOpt: { marginHorizontal: 10, marginBottom: 6, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1 },
    sharedPostPollOptThem: { borderColor: C.gray200, backgroundColor: C.white },
    sharedPostPollOptMe: { borderColor: 'rgba(255,255,255,0.35)', backgroundColor: 'rgba(255,255,255,0.15)' },
    sharedPostPollOptTxt: { fontSize: 13, fontWeight: '500', color: C.gray800 },
    storyReplyCard: { flexDirection: 'row', borderRadius: 10, overflow: 'hidden', marginBottom: 8, borderLeftWidth: 3, borderLeftColor: C.violet400 },
    storyReplyCardThem: { backgroundColor: 'rgba(0,0,0,0.06)' },
    storyReplyCardMe: { backgroundColor: 'rgba(255,255,255,0.15)' },
    storyReplyImg: { width: 48, height: 48 },
    storyReplyPlaceholder: { width: 48, height: 48, backgroundColor: C.violet100 },
    storyReplyInfo: { flex: 1, paddingHorizontal: 8, paddingVertical: 6, justifyContent: 'center' },
    storyReplyLabel: { fontSize: 10, fontWeight: '700', color: C.violet600, marginBottom: 2 },
    storyReplyText: { fontSize: 12, color: C.gray600, lineHeight: 16 },
    msgWrap: { flexDirection: 'row' },
    msgWrapMe: { justifyContent: 'flex-end' },
    msgWrapThem: { justifyContent: 'flex-start' },
    bubble: { maxWidth: '80%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
    bubbleMe: { backgroundColor: C.violet600, borderBottomRightRadius: 4, elevation: 1 },
    bubbleThem: { backgroundColor: C.white, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: C.gray100, elevation: 1 },
    bubbleTxt: { fontSize: 14, lineHeight: 20 },
    bubbleTxtMe: { color: C.white },
    bubbleTxtThem: { color: C.gray900 },
    msgTime: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
    msgTimeMe: { color: 'rgba(255,255,255,0.7)' },
    msgTimeThem: { color: C.gray400 },
    inputBar: { flexDirection: 'row', gap: 10, padding: 14, borderTopWidth: 1, borderTopColor: C.gray100, backgroundColor: C.white },
    msgInput: { flex: 1, backgroundColor: C.gray50, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: C.gray900, borderWidth: 1, borderColor: C.gray200 },
    sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.violet600, alignItems: 'center', justifyContent: 'center', elevation: 2 },
    sendBtnDisabled: { backgroundColor: C.gray200, elevation: 0 },
    lockedInput: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.gray100, borderRadius: 24, paddingVertical: 10, height: 44 },
    lockedInputTxt: { color: C.gray500, fontSize: 13, fontWeight: '600' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: C.white, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingBottom: 40, height: '80%', overflow: 'hidden' },
    modalHdr: { height: 32, alignItems: 'center', justifyContent: 'center', paddingTop: 12 },
    modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.gray200 },
    modalClose: { position: 'absolute', right: 20, top: 12, backgroundColor: C.gray100, borderRadius: 15, padding: 4 },
    groupInfoTop: { alignItems: 'center', paddingVertical: 32, gap: 12, borderBottomWidth: 1, borderBottomColor: C.gray50 },
    groupAvatarLarge: { width: 90, height: 90, borderRadius: 45, backgroundColor: C.violet600, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: C.violet600, shadowOpacity: 0.3, shadowRadius: 10 },
    groupAvatarTxtLarge: { color: C.white, fontSize: 32, fontWeight: '800' },
    groupNameLarge: { fontSize: 22, fontWeight: '700', color: C.gray900 },
    groupBadgeLarge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.violet50, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    groupBadgeTxtLarge: { fontSize: 13, color: C.violet600, fontWeight: '700' },
    section: { padding: 24 },
    adminSection: { padding: 24, backgroundColor: C.violet50, borderBottomWidth: 1, borderBottomColor: C.violet100 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: C.gray900, marginBottom: 16 },
    membersList: { gap: 14 },
    memberItem: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    memberAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.gray50, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.gray200 },
    memberAvatarTxt: { fontSize: 15, fontWeight: '700', color: C.gray700 },
    memberInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    memberName: { fontSize: 15, fontWeight: '600', color: C.gray900 },
    adminLabel: { fontSize: 11, color: C.violet600, fontWeight: '700', marginTop: 1 },
    adminBadge: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
    permissionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.white, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: C.violet200 },
    permissionInfo: { flex: 1, gap: 4 },
    permissionLabel: { fontSize: 15, fontWeight: '700', color: C.gray900 },
    permissionSub: { fontSize: 12, color: C.gray500 },
    toggle: { width: 50, height: 28, borderRadius: 14, padding: 3 },
    toggleOn: { backgroundColor: C.violet600 },
    toggleOff: { backgroundColor: C.gray300 },
    toggleKnob: { width: 22, height: 22, borderRadius: 11, backgroundColor: C.white, elevation: 2 },
    toggleKnobOn: { alignSelf: 'flex-end' },
    toggleKnobOff: { alignSelf: 'flex-start' },
    emptyMembers: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 12 },
    emptyMembersTxt: { color: C.gray400, fontSize: 13, textAlign: 'center' },
    infoAction: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, marginBottom: 12, borderWidth: 1 },
    infoActionIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    infoActionTxt: { fontSize: 15, fontWeight: '600' },
    modalOverlayCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    confirmModal: { backgroundColor: C.white, borderRadius: 24, padding: 24, width: '100%', maxWidth: 340, alignItems: 'center' },
    confirmIconBg: { width: 56, height: 56, borderRadius: 28, backgroundColor: C.violet50, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    confirmTitle: { fontSize: 18, fontWeight: '700', color: C.gray900, marginBottom: 8 },
    confirmSubtitle: { fontSize: 14, color: C.gray500, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
    confirmBtns: { flexDirection: 'row', gap: 12, width: '100%' },
    confirmCancelBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', backgroundColor: C.gray50, borderRadius: 16 },
    confirmCancelTxt: { fontSize: 14, fontWeight: '600', color: C.gray700 },
    confirmDeleteBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', backgroundColor: C.violet600, borderRadius: 16 },
    confirmDeleteTxt: { fontSize: 14, fontWeight: '700', color: C.white },
  }), [C]);

  const confirmModal = (
    <Modal visible={!!confirmDeleteConvId} transparent animationType="fade">
      <View style={s.modalOverlayCenter}>
        <View style={s.confirmModal}>
          <View style={s.confirmIconBg}><Trash2 size={24} color={C.violet600} /></View>
          <Text style={s.confirmTitle}>Delete Conversation?</Text>
          <Text style={s.confirmSubtitle}>Are you sure you want to permanently delete this conversation and all its messages?</Text>
          <View style={s.confirmBtns}>
            <TouchableOpacity style={s.confirmCancelBtn} onPress={() => setConfirmDeleteConvId(null)}>
              <Text style={s.confirmCancelTxt}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={s.confirmDeleteBtn} 
              onPress={async () => {
                const id = confirmDeleteConvId;
                setConfirmDeleteConvId(null);
                if (id) {
                  try {
                    await clearConversation(id);
                    showToast('Conversation deleted', 'success');
                  } catch (e: any) {
                    showToast(e.message ?? 'Failed to delete', 'error');
                  }
                }
              }}
            >
              <Text style={s.confirmDeleteTxt}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (activeConversationId) {
    return (
      <>
        <KeyboardAvoidingView
          style={s.screen}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={120}
        >
          <View style={s.chatHdr}>
            <TouchableOpacity style={s.backBtn} onPress={closeConversation}>
              <ArrowLeft size={22} color={C.gray900} />
            </TouchableOpacity>
            <TouchableOpacity
              style={s.chatHdrInfo}
              onPress={() => activeConv?.isGroup ? setShowInfo(true) : activeConv?.otherUserId && router.push(`/profile/${activeConv.otherUserId}`)}
              activeOpacity={0.7}
            >
              <View style={s.chatHdrAvatar}>
                {activeConv?.otherUserPicture ? (
                  <Image source={{ uri: resolveUrl(activeConv.otherUserPicture)! }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                ) : (
                  <Text style={s.chatHdrAvatarTxt}>{activeConv?.otherUserInitials ?? '??'}</Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.chatHdrName} numberOfLines={1}>{activeConv?.otherUserName ?? 'Chat'}</Text>
                {activeConv?.isGroup && (
                  <Text style={s.chatHdrSub}>{activeConv.participantsCount || 0} participants • Tap for info</Text>
                )}
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={s.infoBtn} onPress={() => setShowInfo(true)}>
              <Info size={22} color={C.violet600} />
            </TouchableOpacity>
          </View>

          {isMessagesLoading ? (
            <ActivityIndicator size="large" color={C.violet600} style={{ flex: 1 }} />
          ) : (
            <ScrollView
              ref={scrollRef}
              style={s.messages}
              contentContainerStyle={s.messagesContent}
              showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={false} onRefresh={() => activeConversationId && openConversation(activeConversationId)} colors={[C.violet600]} />}
              onScroll={({ nativeEvent }) => {
                const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
                setIsAtBottom(contentOffset.y + layoutMeasurement.height >= contentSize.height - 40);
              }}
              scrollEventThrottle={200}
            >
              {messages.map(msg => (
                <View key={msg.id} style={[s.msgWrap, msg.isMe ? s.msgWrapMe : s.msgWrapThem]}>
                  {msg.sharedPostId ? (
                    <TouchableOpacity activeOpacity={0.85} onPress={() => msg.sharedPostId && router.push({ pathname: '/(tabs)/news', params: { openPostId: String(msg.sharedPostId) } } as any)} style={[s.sharedPostCard, msg.isMe ? s.sharedPostCardMe : s.sharedPostCardThem]}>
                      <View style={s.sharedPostHeader}>
                        <View style={s.sharedPostAvatar}><Text style={s.sharedPostAvatarTxt}>{(msg.sharedPostAuthorName || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}</Text></View>
                        <Text style={[s.sharedPostAuthorTxt, msg.isMe && { color: 'rgba(255,255,255,0.9)' }]} numberOfLines={1}>{msg.sharedPostAuthorName}</Text>
                      </View>
                      {msg.sharedPostImage && <Image source={{ uri: resolveUrl(msg.sharedPostImage)! }} style={s.sharedPostImg} resizeMode="cover" />}
                      {msg.sharedPostPollOptions ? (
                        <View style={{ paddingBottom: 6 }}>
                          {msg.sharedPostContent && <Text style={[s.sharedPostQuestionTxt, msg.isMe && { color: C.white }]}>{msg.sharedPostContent}</Text>}
                          {msg.sharedPostPollOptions.split(',').map((opt, i) => (
                            <View key={i} style={[s.sharedPostPollOpt, msg.isMe ? s.sharedPostPollOptMe : s.sharedPostPollOptThem]}><Text style={[s.sharedPostPollOptTxt, msg.isMe && { color: 'rgba(255,255,255,0.95)' }]}>{opt.trim()}</Text></View>
                          ))}
                        </View>
                      ) : msg.sharedPostContent && <Text style={[s.sharedPostContentTxt, msg.isMe && { color: 'rgba(255,255,255,0.9)' }]} numberOfLines={3}>{msg.sharedPostContent}</Text>}
                      <Text style={[s.msgTime, { alignSelf: 'flex-end', marginTop: 4, marginRight: 8, marginBottom: 6 }, msg.isMe ? s.msgTimeMe : s.msgTimeThem]}>{msg.sentAt}</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={[s.bubble, msg.isMe ? s.bubbleMe : s.bubbleThem]}>
                      {msg.replyToStoryId && (
                        <View style={[s.storyReplyCard, msg.isMe ? s.storyReplyCardMe : s.storyReplyCardThem]}>
                          {msg.replyToStoryMedia ? <Image source={{ uri: resolveUrl(msg.replyToStoryMedia)! }} style={s.storyReplyImg} resizeMode="cover" /> : <View style={s.storyReplyPlaceholder} />}
                          <View style={s.storyReplyInfo}>
                            <Text style={[s.storyReplyLabel, msg.isMe && { color: 'rgba(255,255,255,0.8)' }]}>Story</Text>
                            <Text style={[s.storyReplyText, msg.isMe && { color: 'rgba(255,255,255,0.9)' }]} numberOfLines={2}>{msg.replyToStoryText || '📷 Photo'}</Text>
                          </View>
                        </View>
                      )}
                      <Text style={[s.bubbleTxt, msg.isMe ? s.bubbleTxtMe : s.bubbleTxtThem]}>{msg.content}</Text>
                      <Text style={[s.msgTime, msg.isMe ? s.msgTimeMe : s.msgTimeThem]}>{msg.sentAt}</Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          )}

          <View style={[s.inputBar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
            {!canSendMessage ? (
              <View style={s.lockedInput}><Lock size={16} color={C.gray400} /><Text style={s.lockedInputTxt}>Only admin can send messages</Text></View>
            ) : (
              <>
                <TextInput style={s.msgInput} value={message} onChangeText={setMessage} placeholder="Type a message..." placeholderTextColor={C.gray400} onSubmitEditing={handleSend} returnKeyType="send" editable={!isSending} />
                <TouchableOpacity style={[s.sendBtn, (!message.trim() || isSending) && s.sendBtnDisabled]} onPress={handleSend} disabled={!message.trim() || isSending}><Send size={18} color={C.white} /></TouchableOpacity>
              </>
            )}
          </View>

          <Modal visible={showInfo} animationType="slide" transparent={true} onRequestClose={() => setShowInfo(false)}>
            <View style={s.modalOverlay}>
              <View style={s.modalContent}>
                <View style={s.modalHdr}><View style={s.modalHandle} /><TouchableOpacity style={s.modalClose} onPress={() => setShowInfo(false)}><X size={24} color={C.gray400} /></TouchableOpacity></View>
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={s.groupInfoTop}>
                    <View style={s.groupAvatarLarge}><Text style={s.groupAvatarTxtLarge}>{activeConv?.otherUserInitials}</Text></View>
                    <Text style={s.groupNameLarge}>{activeConv?.otherUserName}</Text>
                    <View style={s.groupBadgeLarge}>{activeConv?.isGroup ? <Users size={14} color={C.violet600} /> : <Lock size={14} color={C.violet600} />}<Text style={s.groupBadgeTxtLarge}>{activeConv?.isGroup ? `${activeConv?.participantsCount} Members` : 'Private Chat'}</Text></View>
                  </View>
                  <View style={s.section}>
                    <TouchableOpacity style={[s.infoAction, { backgroundColor: C.violet50, borderColor: C.violet100, marginBottom: 12 }]} onPress={handleClearMessages}>
                      <View style={[s.infoActionIcon, { backgroundColor: C.violet100 }]}><Trash2 size={18} color={C.violet600} /></View>
                      <Text style={[s.infoActionTxt, { color: C.violet600 }]}>Clear History</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.infoAction, { backgroundColor: 'rgba(124, 58, 237, 0.05)', borderColor: C.violet100, marginBottom: 12 }]} onPress={() => { if (activeConv) { setConfirmDeleteConvId(activeConv.id); setShowInfo(false); } }}>
                      <View style={[s.infoActionIcon, { backgroundColor: C.violet100 }]}><Trash2 size={18} color={C.violet600} /></View>
                      <Text style={[s.infoActionTxt, { color: C.violet600 }]}>Delete Chat</Text>
                    </TouchableOpacity>
                    {activeConv?.isGroup && !isAdmin && (
                      <TouchableOpacity
                        style={[s.infoAction, { backgroundColor: C.violet50, borderColor: C.violet100 }]}
                        onPress={() => Alert.alert(
                          'Leave Group',
                          'Are you sure you want to leave? This will also remove you from the session and you will lose access to the group chat.',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Leave', style: 'destructive', onPress: handleLeaveGroup },
                          ]
                        )}
                      >
                        <View style={[s.infoActionIcon, { backgroundColor: C.violet100 }]}><X size={18} color={C.violet600} /></View>
                        <Text style={[s.infoActionTxt, { color: C.violet600 }]}>Leave Group</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  {isAdmin && (
                    <View style={s.adminSection}>
                      <Text style={s.sectionTitle}>Administrator Controls</Text>
                      <View style={s.permissionRow}>
                        <View style={s.permissionInfo}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Shield size={16} color={C.violet600} /><Text style={s.permissionLabel}>Open Messaging</Text></View><Text style={s.permissionSub}>Allow all members to send messages</Text></View>
                        <TouchableOpacity onPress={toggleEveryoneCanMessage} style={[s.toggle, activeConv?.everyoneCanMessage ? s.toggleOn : s.toggleOff]}><View style={[s.toggleKnob, activeConv?.everyoneCanMessage ? s.toggleKnobOn : s.toggleKnobOff]} /></TouchableOpacity>
                      </View>
                    </View>
                  )}
                  {activeConv?.isGroup && (
                    <View style={s.section}>
                      <Text style={s.sectionTitle}>Group Members ({activeConv?.participants?.length || 0})</Text>
                      <View style={s.membersList}>
                        {(!activeConv?.participants || activeConv.participants.length === 0) ? (
                          <View style={s.emptyMembers}><Users size={32} color={C.gray300} /><Text style={s.emptyMembersTxt}>No members found. Try refreshing the chat.</Text></View>
                        ) : (
                          activeConv.participants.map(p => (
                            <TouchableOpacity key={p.id} style={s.memberItem} onPress={() => { setShowInfo(false); router.push(`/profile/${p.id}`); }}>
                              <View style={[s.memberAvatar, p.isAdmin && { borderColor: C.violet500, borderWidth: 2 }]}><Text style={s.memberAvatarTxt}>{p.initials}</Text></View>
                              <View style={s.memberInfo}><View><Text style={s.memberName}>{p.name} {p.id === currentUser?.id && '(You)'}</Text>{p.isAdmin && <Text style={s.adminLabel}>Group Administrator</Text>}</View>{p.isAdmin && <View style={s.adminBadge}><ShieldCheck size={16} color={C.violet600} /></View>}</View>
                            </TouchableOpacity>
                          ))
                        )}
                      </View>
                    </View>
                  )}
                </ScrollView>
              </View>
            </View>
          </Modal>
        </KeyboardAvoidingView>
        {confirmModal}
      </>
    );
  }

  const chatIsVerified = !!(user?.isAgeVerified || user?.isMinorVerified);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={s.screen} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchConversations} colors={[C.violet600]} />}>
        <View style={s.body}>
          <Text style={s.title}>Messages</Text>
          <View style={s.searchBox}><Search size={18} color={C.gray400} /><TextInput style={s.searchInput} placeholder="Search conversations..." placeholderTextColor={C.gray400} value={searchText} onChangeText={setSearchText} onFocus={() => { if (!isLoggedIn) setShowLoginPrompt(true); }} editable={isLoggedIn} /></View>
          {(isLoading || isSearching) && isLoggedIn ? <ActivityIndicator size="large" color={C.violet600} style={{ marginTop: 32 }} /> : !isLoggedIn ? null : displayConversations.length === 0 ? (
            <View style={s.empty}><Text style={s.emptyTxt}>{searchText ? 'No contacts match your search.' : 'No conversations yet.'}</Text></View>
          ) : (
            <View style={s.chatList}>
              {displayConversations.map(chat => (
                <TouchableOpacity key={chat.id || `user-${chat.otherUserId}`} style={s.chatItem} onPress={() => handleOpenConversation(chat)} onLongPress={() => chat.id && setConfirmDeleteConvId(chat.id)}>
                  <View style={s.chatItemLeft}><View style={s.avatarWrap}><View style={s.avatar}>{chat.otherUserPicture ? <Image source={{ uri: resolveUrl(chat.otherUserPicture)! }} style={{ width: '100%', height: '100%', borderRadius: 22 }} resizeMode="cover" /> : <Text style={s.avatarTxt}>{chat.otherUserInitials}</Text>}</View></View>
                    <View style={s.chatItemInfo}><View style={s.chatItemTop}><Text style={s.chatName}>{chat.otherUserName}</Text><Text style={s.chatTime}>{chat.lastMessageTime ?? ''}</Text></View>
                      {chat.isGroup && <View style={s.groupBadge}><Text style={s.groupBadgeTxt}>Group</Text></View>}
                      <Text style={s.chatLastMsg} numberOfLines={1}>{chat.lastMessage ?? (chat.isGroup ? `${chat.participantsCount} members` : 'No messages yet')}</Text>
                    </View>
                  </View>
                  {chat.unreadCount > 0 && <View style={s.unreadBadge}><Text style={s.unreadTxt}>{chat.unreadCount > 99 ? '99+' : chat.unreadCount}</Text></View>}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
      {confirmModal}
      {isLoggedIn && !chatIsVerified && <VerificationGate feature="Chat" />}
      {!isLoggedIn && <GuestGate feature="Chat" />}
    </View>
  );
}
