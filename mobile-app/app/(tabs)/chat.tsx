import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { ArrowLeft, Search, Send, MessageCircle } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { InlineGuestLoginPrompt } from '../../components/InlineGuestLoginPrompt';
import { C } from '../../components/theme';

const mockChats = [
  { id: 1, user: 'Sarah M.', avatar: 'SM', lastMessage: "Great! Let's schedule our first session", time: '10:30 AM', unread: 2, online: true },
  { id: 2, user: 'John D.', avatar: 'JD', lastMessage: 'Thanks for accepting my swap request!', time: 'Yesterday', unread: 0, online: false },
  { id: 3, user: 'Maya K.', avatar: 'MK', lastMessage: 'The photography lesson was amazing!', time: '2 days ago', unread: 0, online: true },
];

const mockMessages = [
  { id: 1, text: 'Hi! I\'m excited about our cooking swap!', time: '10:15 AM', isMe: false },
  { id: 2, text: 'Me too! When would be a good time for you?', time: '10:20 AM', isMe: true },
  { id: 3, text: 'How about this Saturday at 2 PM?', time: '10:25 AM', isMe: false },
  { id: 4, text: 'Perfect! I\'ll bring my guitar', time: '10:28 AM', isMe: true },
  { id: 5, text: "Great! Let's schedule our first session", time: '10:30 AM', isMe: false },
];

export default function ChatScreen() {
  const { isLoggedIn, setShowLoginPrompt } = useAuth();
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState(mockMessages);

  const handleSend = () => {
    if (!isLoggedIn) { setShowLoginPrompt(true); return; }
    if (!message.trim()) return;
    setMessages(prev => [...prev, { id: Date.now(), text: message, time: 'Now', isMe: true }]);
    setMessage('');
  };

  if (selectedChat) {
    const chat = mockChats.find(c => c.id === selectedChat);
    return (
      <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={120}>
        <View style={s.chatHdr}>
          <TouchableOpacity style={s.backBtn} onPress={() => setSelectedChat(null)}>
            <ArrowLeft size={22} color={C.gray700} />
          </TouchableOpacity>
          <View style={s.chatHdrUser}>
            <View style={s.chatHdrAvatar}><Text style={s.chatHdrAvatarTxt}>{chat?.avatar}</Text></View>
            <View style={s.onlineDot} />
          </View>
          <View>
            <Text style={s.chatHdrName}>{chat?.user}</Text>
            <Text style={s.onlineTxt}>Online</Text>
          </View>
        </View>

        <ScrollView style={s.messages} contentContainerStyle={s.messagesContent} showsVerticalScrollIndicator={false}>
          {messages.map(msg => (
            <View key={msg.id} style={[s.msgWrap, msg.isMe ? s.msgWrapMe : s.msgWrapThem]}>
              <View style={[s.bubble, msg.isMe ? s.bubbleMe : s.bubbleThem]}>
                <Text style={[s.bubbleTxt, msg.isMe ? s.bubbleTxtMe : s.bubbleTxtThem]}>{msg.text}</Text>
                <Text style={[s.msgTime, msg.isMe ? s.msgTimeMe : s.msgTimeThem]}>{msg.time}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={s.inputBar}>
          <TextInput
            style={s.msgInput}
            value={message}
            onChangeText={setMessage}
            placeholder="Type a message..."
            placeholderTextColor={C.gray400}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <TouchableOpacity style={s.sendBtn} onPress={handleSend}>
            <Send size={18} color={C.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <ScrollView style={s.screen} showsVerticalScrollIndicator={false}>
      <View style={s.body}>
        <Text style={s.title}>Messages</Text>

        <View style={s.searchBox}>
          <Search size={18} color={C.gray400} />
          <TextInput
            style={s.searchInput}
            placeholder="Search conversations..."
            placeholderTextColor={C.gray400}
            onFocus={() => { if (!isLoggedIn) setShowLoginPrompt(true); }}
            editable={isLoggedIn}
          />
        </View>

        {!isLoggedIn ? (
          <InlineGuestLoginPrompt featureName="Chat" />
        ) : (
          <View style={s.chatList}>
            {mockChats.map(chat => (
              <TouchableOpacity key={chat.id} style={s.chatItem} onPress={() => setSelectedChat(chat.id)}>
                <View style={s.chatItemLeft}>
                  <View style={s.avatarWrap}>
                    <View style={s.avatar}><Text style={s.avatarTxt}>{chat.avatar}</Text></View>
                    {chat.online && <View style={s.onlineDotSmall} />}
                  </View>
                  <View style={s.chatItemInfo}>
                    <View style={s.chatItemTop}>
                      <Text style={s.chatName}>{chat.user}</Text>
                      <Text style={s.chatTime}>{chat.time}</Text>
                    </View>
                    <Text style={s.chatLastMsg} numberOfLines={1}>{chat.lastMessage}</Text>
                  </View>
                </View>
                {chat.unread > 0 && (
                  <View style={s.unreadBadge}><Text style={s.unreadTxt}>{chat.unread}</Text></View>
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
  onlineDotSmall: { position: 'absolute', bottom: 1, right: 1, width: 12, height: 12, borderRadius: 6, backgroundColor: C.green500, borderWidth: 2, borderColor: C.white },
  chatItemInfo: { flex: 1 },
  chatItemTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  chatName: { fontWeight: '600', fontSize: 15, color: C.gray900 },
  chatTime: { fontSize: 12, color: C.gray400 },
  chatLastMsg: { fontSize: 13, color: C.gray500 },
  unreadBadge: { width: 22, height: 22, borderRadius: 11, backgroundColor: C.violet600, alignItems: 'center', justifyContent: 'center' },
  unreadTxt: { color: C.white, fontSize: 11, fontWeight: '700' },
  chatHdr: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: C.gray100, backgroundColor: C.white },
  backBtn: { padding: 4 },
  chatHdrUser: { position: 'relative' },
  chatHdrAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.violet500, alignItems: 'center', justifyContent: 'center' },
  chatHdrAvatarTxt: { color: C.white, fontWeight: '700' },
  onlineDot: { position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: C.green500, borderWidth: 2, borderColor: C.white },
  chatHdrName: { fontWeight: '600', fontSize: 16, color: C.gray900 },
  onlineTxt: { fontSize: 12, color: C.green500 },
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
});
