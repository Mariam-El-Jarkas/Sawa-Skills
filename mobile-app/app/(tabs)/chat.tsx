import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform, RefreshControl } from 'react-native';
import { ArrowLeft, Search, Send } from 'lucide-react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../hooks/useChat';
import { InlineGuestLoginPrompt } from '../../components/InlineGuestLoginPrompt';
import { C } from '../../components/theme';

export default function ChatScreen() {
  const { isLoggedIn, setShowLoginPrompt } = useAuth();
  const { openId } = useLocalSearchParams<{ openId?: string }>();
  const {
    conversations, activeConversationId, messages,
    isLoading, isMessagesLoading,
    fetchConversations, openConversation, closeConversation,
    sendMessage,
  } = useChat();

  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isAtBottom, setIsAtBottom] = useState(true);
  const scrollRef = useRef<ScrollView>(null);

  // Load conversations when logged in
  useEffect(() => {
    if (isLoggedIn) fetchConversations();
  }, [isLoggedIn]);

  // Auto-open conversation when navigated from Swaps
  useEffect(() => {
    if (isLoggedIn && openId) {
      const id = Number(openId);
      if (id && id !== activeConversationId) {
        openConversation(id);
      }
    }
  }, [isLoggedIn, openId]);

  // Scroll to bottom only when user is already at the bottom
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
    } catch {
      setMessage(text); // restore on failure
    } finally {
      setIsSending(false);
    }
  };

  // openConversation already marks read internally
  const handleOpenConversation = async (id: number) => {
    await openConversation(id);
  };

  const filteredConversations = conversations.filter(c =>
    !searchText || c.otherUserName.toLowerCase().includes(searchText.toLowerCase())
  );

  const activeConv = conversations.find(c => c.id === activeConversationId);

  // ── Detail / message thread view ─────────────────────────────────────────
  if (activeConversationId) {
    return (
      <KeyboardAvoidingView
        style={s.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={120}
      >
        <View style={s.chatHdr}>
          <TouchableOpacity style={s.backBtn} onPress={closeConversation}>
            <ArrowLeft size={22} color={C.gray700} />
          </TouchableOpacity>
          <View style={s.chatHdrUser}>
            <View style={s.chatHdrAvatar}>
              <Text style={s.chatHdrAvatarTxt}>{activeConv?.otherUserInitials ?? '??'}</Text>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.chatHdrName}>{activeConv?.otherUserName ?? 'Chat'}</Text>
          </View>
        </View>

        {isMessagesLoading ? (
          <ActivityIndicator size="large" color={C.violet600} style={{ flex: 1 }} />
        ) : (
          <ScrollView
            ref={scrollRef}
            style={s.messages}
            contentContainerStyle={s.messagesContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={false}
                onRefresh={() => activeConversationId && openConversation(activeConversationId)}
                colors={[C.violet600]}
                tintColor={C.violet600}
              />
            }
            onScroll={({ nativeEvent }) => {
              const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
              setIsAtBottom(contentOffset.y + layoutMeasurement.height >= contentSize.height - 40);
            }}
            scrollEventThrottle={200}
          >
            {messages.map(msg => (
              <View key={msg.id} style={[s.msgWrap, msg.isMe ? s.msgWrapMe : s.msgWrapThem]}>
                <View style={[s.bubble, msg.isMe ? s.bubbleMe : s.bubbleThem]}>
                  <Text style={[s.bubbleTxt, msg.isMe ? s.bubbleTxtMe : s.bubbleTxtThem]}>{msg.content}</Text>
                  <Text style={[s.msgTime, msg.isMe ? s.msgTimeMe : s.msgTimeThem]}>{msg.sentAt}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        )}

        <View style={s.inputBar}>
          <TextInput
            style={s.msgInput}
            value={message}
            onChangeText={setMessage}
            placeholder="Type a message..."
            placeholderTextColor={C.gray400}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            editable={!isSending}
          />
          <TouchableOpacity style={[s.sendBtn, (!message.trim() || isSending) && s.sendBtnDisabled]} onPress={handleSend} disabled={!message.trim() || isSending}>
            <Send size={18} color={C.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // ── Conversation list view ────────────────────────────────────────────────
  return (
    <ScrollView
      style={s.screen}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={fetchConversations} colors={[C.violet600]} tintColor={C.violet600} />
      }
    >
      <View style={s.body}>
        <Text style={s.title}>Messages</Text>

        <View style={s.searchBox}>
          <Search size={18} color={C.gray400} />
          <TextInput
            style={s.searchInput}
            placeholder="Search conversations..."
            placeholderTextColor={C.gray400}
            value={searchText}
            onChangeText={setSearchText}
            onFocus={() => { if (!isLoggedIn) setShowLoginPrompt(true); }}
            editable={isLoggedIn}
          />
        </View>

        {!isLoggedIn ? (
          <InlineGuestLoginPrompt featureName="Chat" />
        ) : isLoading ? (
          <ActivityIndicator size="large" color={C.violet600} style={{ marginTop: 32 }} />
        ) : filteredConversations.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyTxt}>
              {searchText ? 'No conversations match your search.' : 'No conversations yet. Start a swap to begin chatting!'}
            </Text>
          </View>
        ) : (
          <View style={s.chatList}>
            {filteredConversations.map(chat => (
              <TouchableOpacity key={chat.id} style={s.chatItem} onPress={() => handleOpenConversation(chat.id)}>
                <View style={s.chatItemLeft}>
                  <View style={s.avatarWrap}>
                    <View style={s.avatar}>
                      <Text style={s.avatarTxt}>{chat.otherUserInitials}</Text>
                    </View>
                  </View>
                  <View style={s.chatItemInfo}>
                    <View style={s.chatItemTop}>
                      <Text style={s.chatName}>{chat.otherUserName}</Text>
                      <Text style={s.chatTime}>{chat.lastMessageTime ?? ''}</Text>
                    </View>
                    <Text style={s.chatLastMsg} numberOfLines={1}>
                      {chat.lastMessage ?? 'No messages yet'}
                    </Text>
                  </View>
                </View>
                {chat.unreadCount > 0 && (
                  <View style={s.unreadBadge}>
                    <Text style={s.unreadTxt}>{chat.unreadCount > 99 ? '99+' : chat.unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
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
  unreadBadge: { minWidth: 22, height: 22, borderRadius: 11, backgroundColor: C.violet600, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  unreadTxt: { color: C.white, fontSize: 11, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyTxt: { color: C.gray500, fontSize: 14, textAlign: 'center' },
  // Chat thread styles
  chatHdr: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: C.gray100, backgroundColor: C.white },
  backBtn: { padding: 4 },
  chatHdrUser: { position: 'relative' },
  chatHdrAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.violet500, alignItems: 'center', justifyContent: 'center' },
  chatHdrAvatarTxt: { color: C.white, fontWeight: '700' },
  chatHdrName: { fontWeight: '600', fontSize: 16, color: C.gray900 },
  messages: { flex: 1, backgroundColor: C.gray50 },
  messagesContent: { padding: 16, gap: 12 },
  msgWrap: { flexDirection: 'row' },
  msgWrapMe: { justifyContent: 'flex-end' },
  msgWrapThem: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '75%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMe: { backgroundColor: C.violet600, borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: C.white, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: C.gray100 },
  bubbleTxt: { fontSize: 14 },
  bubbleTxtMe: { color: C.white },
  bubbleTxtThem: { color: C.gray800 },
  msgTime: { fontSize: 11, marginTop: 4 },
  msgTimeMe: { color: 'rgba(255,255,255,0.7)' },
  msgTimeThem: { color: C.gray400 },
  inputBar: { flexDirection: 'row', gap: 10, padding: 12, borderTopWidth: 1, borderTopColor: C.gray100, backgroundColor: C.white },
  msgInput: { flex: 1, backgroundColor: C.gray100, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: C.gray900 },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.violet600, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.5 },
});
