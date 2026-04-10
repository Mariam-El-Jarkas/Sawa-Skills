package com.example.sawaskills.service;

import com.example.sawaskills.dto.chat.*;
import com.example.sawaskills.entity.*;
import com.example.sawaskills.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("h:mm a");
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("MMM d");

    // ── Get all conversations for current user ────────────────────────────────

    public List<ConversationResponse> getConversations(String email) {
        User user = findUser(email);
        return conversationRepository.findByParticipantId(user.getId())
                .stream()
                .map(c -> toConversationResponse(c, user))
                .sorted(Comparator.comparing(ConversationResponse::getLastMessageTime,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    // ── Find or create a conversation between two users ───────────────────────

    @Transactional
    public ConversationResponse findOrCreateConversation(String email, Long otherUserId) {
        User user = findUser(email);

        if (user.getId().equals(otherUserId)) {
            throw new RuntimeException("You cannot start a conversation with yourself");
        }

        User other = userRepository.findById(otherUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Conversation conversation = conversationRepository
                .findBetweenUsers(user.getId(), otherUserId)
                .orElseGet(() -> {
                    Set<User> participants = new HashSet<>();
                    participants.add(user);
                    participants.add(other);
                    Conversation c = Conversation.builder()
                            .createdAt(LocalDateTime.now())
                            .participants(participants)
                            .build();
                    return conversationRepository.save(c);
                });

        return toConversationResponse(conversation, user);
    }

    // ── Get messages for a conversation ──────────────────────────────────────

    public List<MessageResponse> getMessages(String email, Long conversationId) {
        User user = findUser(email);
        Conversation conversation = getConversationForUser(conversationId, user.getId());

        return messageRepository.findByConversationIdOrderBySentAtAsc(conversation.getId())
                .stream()
                .map(m -> toMessageResponse(m, user.getId()))
                .collect(Collectors.toList());
    }

    // ── Send a message ────────────────────────────────────────────────────────

    @Transactional
    public MessageResponse sendMessage(String email, Long conversationId, SendMessageRequest request) {
        User user = findUser(email);
        Conversation conversation = getConversationForUser(conversationId, user.getId());

        Message message = Message.builder()
                .conversation(conversation)
                .sender(user)
                .content(sanitize(request.getContent()))
                .read(false)
                .sentAt(LocalDateTime.now())
                .build();

        messageRepository.save(message);
        return toMessageResponse(message, user.getId());
    }

    // ── Mark messages as read ─────────────────────────────────────────────────

    @Transactional
    public void markRead(String email, Long conversationId) {
        User user = findUser(email);
        getConversationForUser(conversationId, user.getId()); // validates membership
        messageRepository.markAllReadInConversation(conversationId, user.getId());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Conversation getConversationForUser(Long conversationId, Long userId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        boolean isMember = conversation.getParticipants().stream()
                .anyMatch(p -> p.getId().equals(userId));
        if (!isMember) {
            throw new RuntimeException("You are not a member of this conversation");
        }
        return conversation;
    }

    private ConversationResponse toConversationResponse(Conversation c, User currentUser) {
        User other = c.getParticipants().stream()
                .filter(p -> !p.getId().equals(currentUser.getId()))
                .findFirst()
                .orElse(currentUser);

        String initials = other.getName() == null ? "??" :
                Arrays.stream(other.getName().split(" "))
                        .map(w -> String.valueOf(w.charAt(0)).toUpperCase())
                        .limit(2)
                        .collect(Collectors.joining());

        Optional<Message> lastMsg = messageRepository
                .findTopByConversationIdOrderBySentAtDesc(c.getId());

        long unread = messageRepository
                .countByConversationIdAndReadFalseAndSenderIdNot(c.getId(), currentUser.getId());

        String lastMessageText = lastMsg.map(Message::getContent).orElse(null);
        String lastMessageTime = lastMsg.map(m -> formatTime(m.getSentAt())).orElse(null);

        return ConversationResponse.builder()
                .id(c.getId())
                .otherUserId(c.isGroup() ? null : other.getId())
                .otherUserName(c.isGroup() ? c.getName() : other.getName())
                .otherUserInitials(c.isGroup() ? getGroupInitials(c.getName()) : initials)
                .otherUserPicture(c.isGroup() ? null : other.getProfilePicture())
                .isGroup(c.isGroup())
                .lastMessage(lastMessageText)
                .lastMessageTime(lastMessageTime)
                .unreadCount(unread)
                .build();
    }

    private MessageResponse toMessageResponse(Message m, Long currentUserId) {
        return MessageResponse.builder()
                .id(m.getId())
                .content(m.getContent())
                .sentAt(m.getSentAt() != null ? m.getSentAt().format(TIME_FMT) : null)
                .isMe(m.getSender().getId().equals(currentUserId))
                .senderId(m.getSender().getId())
                .senderName(m.getSender().getName())
                .build();
    }

    private String formatTime(LocalDateTime dt) {
        if (dt == null) return null;
        LocalDateTime now = LocalDateTime.now();
        if (dt.toLocalDate().equals(now.toLocalDate())) {
            return dt.format(TIME_FMT);
        } else if (dt.toLocalDate().equals(now.toLocalDate().minusDays(1))) {
            return "Yesterday";
        }
        return dt.format(DATE_FMT);
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private String sanitize(String input) {
        if (input == null) return null;
        return input.trim().replaceAll("<[^>]*>", "");
    }

    private String getGroupInitials(String name) {
        if (name == null || name.isEmpty()) return "GC";
        return Arrays.stream(name.split(" "))
                .map(w -> w.isEmpty() ? "" : String.valueOf(w.charAt(0)).toUpperCase())
                .limit(2)
                .collect(Collectors.joining());
    }
}
