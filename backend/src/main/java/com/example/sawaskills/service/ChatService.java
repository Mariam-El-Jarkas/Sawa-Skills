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
@Transactional(readOnly = true)
public class ChatService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("h:mm a");
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("MMM d");

    // ── Get all conversations for current user ────────────────────────────────

    public List<ConversationResponse> getConversations(String email) {
        User user = findUser(email);
        // Sort by last activity (last message or creation time if no messages)
        return conversationRepository.findByParticipantId(user.getId())
                .stream()
                .map(c -> toConversationResponse(c, user))
                .sorted(Comparator.comparing(ConversationResponse::getLastTimestamp, Comparator.reverseOrder()))
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

        // Enforce group chat permissions
        if (conversation.getName() != null && !conversation.isEveryoneCanMessage()) {
            boolean isAdmin = conversation.getAdmin() != null && conversation.getAdmin().getId().equals(user.getId());
            if (!isAdmin) {
                throw new RuntimeException("Only the administrator can send messages in this group.");
            }
        }

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
        Optional<Message> lastMsg = messageRepository
                .findTopByConversationIdOrderBySentAtDesc(c.getId());
        long unread = messageRepository
                .countByConversationIdAndReadFalseAndSenderIdNot(c.getId(), currentUser.getId());
        String lastMessageText = lastMsg.map(Message::getContent).orElse(null);
        String lastMessageTime = lastMsg.map(m -> formatTime(m.getSentAt())).orElse(null);
        LocalDateTime lastTimestamp = lastMsg.map(Message::getSentAt).orElse(c.getCreatedAt());

        // Group chat: conversation has a name (set when created with a volunteer session)
        boolean isGroup = c.getName() != null && !c.getName().isEmpty();
        if (isGroup) {
            List<ConversationResponse.ParticipantInfo> participants = c.getParticipants().stream()
                    .map(p -> ConversationResponse.ParticipantInfo.builder()
                            .id(p.getId())
                            .name(p.getName())
                            .initials(getInitials(p.getName()))
                            .picture(p.getProfilePicture())
                            .isAdmin(c.getAdmin() != null && c.getAdmin().getId().equals(p.getId()))
                            .build())
                    .collect(Collectors.toList());

            // If list is empty (e.g. sync issue), ensure admin is at least visible
            if (participants.isEmpty() && c.getAdmin() != null) {
                participants.add(ConversationResponse.ParticipantInfo.builder()
                        .id(c.getAdmin().getId())
                        .name(c.getAdmin().getName())
                        .initials(getInitials(c.getAdmin().getName()))
                        .isAdmin(true)
                        .build());
            }

            return ConversationResponse.builder()
                    .id(c.getId())
                    .otherUserId(null)
                    .otherUserName(c.getName())
                    .otherUserInitials(getGroupInitials(c.getName()))
                    .otherUserPicture(null)
                    .isGroup(true)
                    .lastMessage(lastMessageText)
                    .lastMessageTime(lastMessageTime)
                    .lastTimestamp(lastTimestamp)
                    .unreadCount(unread)
                    .adminId(c.getAdmin() != null ? c.getAdmin().getId() : null)
                    .everyoneCanMessage(c.isEveryoneCanMessage())
                    .participantsCount(c.getParticipants().size())
                    .participants(participants)
                    .build();
        }

        // 1:1 conversation
        User other = c.getParticipants().stream()
                .filter(p -> !p.getId().equals(currentUser.getId()))
                .findFirst()
                .orElse(currentUser);

        String initials = other.getName() == null ? "??" :
                Arrays.stream(other.getName().split(" "))
                        .map(w -> String.valueOf(w.charAt(0)).toUpperCase())
                        .limit(2)
                        .collect(Collectors.joining());

        return ConversationResponse.builder()
                .id(c.getId())
                .otherUserId(other.getId())
                .otherUserName(other.getName())
                .otherUserInitials(getInitials(other.getName()))
                .otherUserPicture(other.getProfilePicture())
                .isGroup(false)
                .lastMessage(lastMessageText)
                .lastMessageTime(lastMessageTime)
                .lastTimestamp(lastTimestamp)
                .unreadCount(unread)
                .build();
    }

    private String getInitials(String name) {
        if (name == null || name.isEmpty()) return "??";
        return Arrays.stream(name.split(" "))
                .map(w -> w.isEmpty() ? "" : String.valueOf(w.charAt(0)).toUpperCase())
                .limit(2)
                .collect(Collectors.joining());
    }

    @Transactional
    public void updatePermissions(String email, Long conversationId, boolean everyoneCanMessage) {
        User user = findUser(email);
        Conversation conversation = getConversationForUser(conversationId, user.getId());

        boolean isAdmin = conversation.getAdmin() != null && conversation.getAdmin().getId().equals(user.getId());
        if (!isAdmin) {
            throw new RuntimeException("Only the administrator can change group permissions");
        }

        conversation.setEveryoneCanMessage(everyoneCanMessage);
        conversationRepository.save(conversation);
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
