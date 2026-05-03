import { useState, useCallback, useEffect, useRef } from 'react';
import { chatService, Conversation, ChatMessage } from '../services/chatService';
import { useAuth } from '../contexts/AuthContext';
import { DeviceEventEmitter } from 'react-native';

interface ChatState {
  conversations: Conversation[];
  activeConversationId: number | null;
  messages: ChatMessage[];
  isLoading: boolean;
  isMessagesLoading: boolean;
  error: string | null;
}

interface ChatActions {
  fetchConversations: () => Promise<void>;
  openConversation: (id: number) => Promise<void>;
  closeConversation: () => void;
  startConversation: (otherUserId: number) => Promise<Conversation>;
  sendMessage: (content: string) => Promise<void>;
  markRead: (conversationId: number) => Promise<void>;
  updatePermissions: (conversationId: number, everyoneCanMessage: boolean) => Promise<void>;
}

const POLL_INTERVAL = 5000; // 5 seconds

export function useChat(): ChatState & ChatActions {
  const { token } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Update permissions ──────────────────────────────────────────────────
  const updatePermissions = useCallback(async (conversationId: number, everyoneCanMessage: boolean) => {
    if (!token) return;
    await chatService.updatePermissions(conversationId, everyoneCanMessage, token);
    setConversations(prev =>
      prev.map(c => c.id === conversationId ? { ...c, everyoneCanMessage } : c)
    );
  }, [token]);

  // ── Fetch conversations ───────────────────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await chatService.getConversations(token);
      setConversations(data);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // ── Open a conversation and start polling ─────────────────────────────────
  const openConversation = useCallback(async (id: number) => {
    if (!token) return;
    setActiveConversationId(id);
    setIsMessagesLoading(true);
    try {
      const data = await chatService.getMessages(id, token);
      setMessages(data);
      // Mark as read silently and update local state so the badge disappears immediately
      chatService.markRead(id, token).then(() => {
        setConversations(prev =>
          prev.map(c => c.id === id ? { ...c, unreadCount: 0 } : c)
        );
        DeviceEventEmitter.emit('chat_read_event');
      }).catch(() => {});
    } catch (e: any) {
      setError(e.message ?? 'Failed to load messages');
    } finally {
      setIsMessagesLoading(false);
    }
  }, [token]);

  // ── Poll for new messages while a conversation is open ────────────────────
  useEffect(() => {
    if (!activeConversationId || !token) return;

    pollRef.current = setInterval(async () => {
      try {
        const data = await chatService.getMessages(activeConversationId, token);
        // Only update if messages actually changed to avoid spurious re-renders
        setMessages(prev => {
          const lastPrev = prev[prev.length - 1];
          const lastNew = data[data.length - 1];
          if (prev.length === data.length && lastPrev?.id === lastNew?.id) return prev;
          
          // If we got new messages, check if any are from others and mark as read
          const hasNewFromOthers = data.some(m => !m.isMe && (!lastPrev || m.id > lastPrev.id));
          if (hasNewFromOthers) {
            chatService.markRead(activeConversationId, token).then(() => {
              DeviceEventEmitter.emit('chat_read_event');
            }).catch(() => {});
          }

          return data;
        });
      } catch {
        // Silently fail poll — don't surface errors on background refresh
      }
    }, POLL_INTERVAL);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [activeConversationId, token]);

  const closeConversation = useCallback(() => {
    setActiveConversationId(null);
    setMessages([]);
    if (pollRef.current) clearInterval(pollRef.current);
  }, []);

  // ── Start or find a conversation ──────────────────────────────────────────
  const startConversation = useCallback(async (otherUserId: number): Promise<Conversation> => {
    if (!token) throw new Error('Not logged in');
    const conv = await chatService.startConversation(otherUserId, token);
    setConversations(prev => {
      const exists = prev.some(c => c.id === conv.id);
      return exists ? prev : [conv, ...prev];
    });
    return conv;
  }, [token]);

  // ── Send a message ────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (content: string) => {
    if (!token || !activeConversationId) throw new Error('No active conversation');
    const msg = await chatService.sendMessage(activeConversationId, content, token);
    setMessages(prev => [...prev, msg]);
    // Update conversation last message
    setConversations(prev => prev.map(c =>
      c.id === activeConversationId
        ? { ...c, lastMessage: content, lastMessageTime: msg.sentAt }
        : c
    ));
  }, [token, activeConversationId]);

  // ── Mark read ─────────────────────────────────────────────────────────────
  const markRead = useCallback(async (conversationId: number) => {
    if (!token) return;
    await chatService.markRead(conversationId, token);
    setConversations(prev =>
      prev.map(c => c.id === conversationId ? { ...c, unreadCount: 0 } : c)
    );
  }, [token]);

  return {
    conversations, activeConversationId, messages,
    isLoading, isMessagesLoading, error,
    fetchConversations, openConversation, closeConversation,
    startConversation, sendMessage, markRead, updatePermissions
  };
}
