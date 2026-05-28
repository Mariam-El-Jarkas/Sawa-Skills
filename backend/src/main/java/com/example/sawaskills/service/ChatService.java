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
    private final ConnectionRepository connectionRepository;
    private final SwapRequestRepository swapRequestRepository;
    private final NotificationService notificationService;
    private final StoryRepository storyRepository;
    private final VolunteerSessionRepository volunteerSessionRepository;
    private final VolunteerParticipantRepository volunteerParticipantRepository;
    private final B2StorageService b2StorageService;

    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("h:mm a");
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("MMM d");

    // ── Get all conversations for current user ────────────────────────────────

    @Transactional
    public List<ConversationResponse> getConversations(String email) {
        User user = findUser(email);

        // Get existing conversations where the user is a participant (exclude ones hidden by this user)
        List<Conversation> existing = conversationRepository.findByParticipantId(user.getId());

        return existing.stream()
                .filter(c -> {
                    try {
                        return c.getHiddenBy().stream().noneMatch(h -> h.getId().equals(user.getId()));
                    } catch (Exception e) {
                        return true; // show conversation if hidden-by check fails (e.g. table not yet migrated)
                    }
                })
                .map(c -> toConversationResponse(c, user))
                .sorted(Comparator.comparing(ConversationResponse::getLastTimestamp,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    @Transactional
    public void clearMessages(String email, Long conversationId) {
        User user = findUser(email);
        getConversationForUser(conversationId, user.getId()); // validates membership
        messageRepository.deleteByConversationId(conversationId);
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

        List<Conversation> existing1on1 = conversationRepository.findBetweenUsers(user.getId(), otherUserId);
        Conversation conversation = existing1on1.isEmpty()
                ? conversationRepository.save(Conversation.builder()
                        .createdAt(LocalDateTime.now())
                        .participants(new HashSet<>(Set.of(user, other)))
                        .build())
                : existing1on1.get(0);

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

        // Block messages in closed groups
        if (conversation.isClosed()) {
            throw new RuntimeException("This group has been closed and no longer accepts messages.");
        }

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
                .replyToStoryId(request.getReplyToStoryId())
                .replyToStoryText(request.getReplyToStoryText())
                .replyToStoryMedia(request.getReplyToStoryMedia())
                .sharedPostId(request.getSharedPostId())
                .sharedPostAuthorId(request.getSharedPostAuthorId())
                .sharedPostAuthorName(request.getSharedPostAuthorName())
                .sharedPostContent(request.getSharedPostContent())
                .sharedPostImage(request.getSharedPostImage())
                .sharedPostPollOptions(request.getSharedPostPollOptions())
                .build();

        messageRepository.save(message);

        // Notify all other participants of the new message
        conversation.getParticipants().stream()
                .filter(p -> !p.getId().equals(user.getId()))
                .forEach(p -> notificationService.notifyMessage(p, user, conversation.getId(), request.getContent()));

        // If this is a story reply, notify the story author
        if (request.getReplyToStoryId() != null) {
            storyRepository.findById(request.getReplyToStoryId()).ifPresent(story -> {
                notificationService.notifyStoryReply(story.getUser(), user, story.getId(), request.getContent());
            });
        }

        return toMessageResponse(message, user.getId());
    }

    // ── Mark messages as read ─────────────────────────────────────────────────

    @Transactional
    public void markRead(String email, Long conversationId) {
        User user = findUser(email);
        getConversationForUser(conversationId, user.getId()); // validates membership
        messageRepository.markAllReadInConversation(conversationId, user.getId());
    }

    @Transactional
    public void clearConversation(String email, Long conversationId) {
        User user = findUser(email);
        Conversation conversation = getConversationForUser(conversationId, user.getId());

        // Group chats linked to a volunteer session cannot be deleted independently —
        // the session holds a FK to this conversation. Clearing messages is safe; deletion is not.
        boolean isSessionGroupChat = volunteerSessionRepository.findByGroupChatId(conversationId).isPresent();
        if (isSessionGroupChat) {
            // Only clear messages — do not delete the conversation itself
            messageRepository.deleteByConversationId(conversationId);
            return;
        }

        // 1:1 or standalone group chat — safe to delete
        messageRepository.deleteByConversationId(conversationId);
        conversationRepository.delete(conversation);
    }

    @Transactional
    public void leaveGroup(String email, Long conversationId) {
        User user = findUser(email);
        Conversation conversation = getConversationForUser(conversationId, user.getId());

        if (conversation.getName() == null) {
            throw new RuntimeException("You can only leave group conversations");
        }

        conversation.getParticipants().remove(user);

        // Also remove the user from the linked volunteer session if one exists
        volunteerSessionRepository.findByGroupChatId(conversationId).ifPresent(session ->
            volunteerParticipantRepository.deleteBySessionIdAndParticipantId(session.getId(), user.getId())
        );

        // If the leaving user was the admin, transfer admin to the next participant
        if (conversation.getAdmin() != null && conversation.getAdmin().getId().equals(user.getId())) {
            conversation.getParticipants().stream()
                    .filter(p -> !p.getId().equals(user.getId()))
                    .findFirst()
                    .ifPresentOrElse(
                        conversation::setAdmin,
                        () -> conversationRepository.delete(conversation)
                    );
        }

        if (!conversation.getParticipants().isEmpty()) {
            conversationRepository.save(conversation);
        }
    }

    public List<ConversationResponse> searchConversations(String email, String query) {
        User user = findUser(email);
        if (query == null || query.isBlank()) return Collections.emptyList();
        String q = query.toLowerCase();

        // 1. Search existing conversations (groups and 1:1)
        List<Conversation> existing = conversationRepository.findByParticipantId(user.getId());
        List<ConversationResponse> results = existing.stream()
                .map(c -> toConversationResponse(c, user))
                .filter(cr -> (cr.getOtherUserName() != null && cr.getOtherUserName().toLowerCase().contains(q)))
                .collect(Collectors.toList());

        // 2. Search connections (to find users not currently in conversations list)
        List<Connection> connections = connectionRepository.findAcceptedByUserId(user.getId());
        for (Connection conn : connections) {
            User other = conn.getRequester().getId().equals(user.getId()) ? conn.getReceiver() : conn.getRequester();
            if (other.getName() != null && other.getName().toLowerCase().contains(q)) {
                // If this user is already in results (via an existing conversation), skip
                boolean alreadyPresent = results.stream().anyMatch(r -> Objects.equals(r.getOtherUserId(), other.getId()));
                if (!alreadyPresent) {
                    results.add(ConversationResponse.builder()
                            .id(null) // Signal that a conversation needs to be found/created
                            .otherUserId(other.getId())
                            .otherUserName(other.getName())
                            .otherUserInitials(getInitials(other.getName()))
                            .otherUserPicture(other.getProfilePicture())
                            .isGroup(false)
                            .lastMessage(null)
                            .build());
                }
            }
        }

        return results;
    }

    // ── Update group info (admin only) ────────────────────────────────────────

    @Transactional
    public ConversationResponse updateGroupInfo(String email, Long conversationId, UpdateGroupInfoRequest request) {
        User user = findUser(email);
        Conversation conversation = getConversationForUser(conversationId, user.getId());

        boolean isAdmin = conversation.getAdmin() != null && conversation.getAdmin().getId().equals(user.getId());
        if (!isAdmin) throw new RuntimeException("Only the administrator can update group info");

        if (request.getName() != null && !request.getName().isBlank()) {
            conversation.setName(request.getName().trim());
        }

        if (request.getPictureBase64() != null && !request.getPictureBase64().isBlank()) {
            try {
                byte[] imageBytes = Base64.getDecoder().decode(request.getPictureBase64());
                String key = "group-pictures/conv-" + conversationId + "-" + System.currentTimeMillis() + ".jpg";
                String url = b2StorageService.upload(imageBytes, key, "image/jpeg");
                conversation.setProfilePicture(url);
            } catch (Exception e) {
                throw new RuntimeException("Failed to upload group picture");
            }
        }

        conversationRepository.save(conversation);
        return toConversationResponse(conversation, user);
    }

    // ── Close group (admin only) ──────────────────────────────────────────────

    @Transactional
    public void closeGroup(String email, Long conversationId) {
        User user = findUser(email);
        Conversation conversation = getConversationForUser(conversationId, user.getId());

        boolean isAdmin = conversation.getAdmin() != null && conversation.getAdmin().getId().equals(user.getId());
        if (!isAdmin) throw new RuntimeException("Only the administrator can close this group");

        conversation.setClosed(true);
        conversationRepository.save(conversation);

        // Notify all non-admin participants
        conversation.getParticipants().stream()
                .filter(p -> !p.getId().equals(user.getId()))
                .forEach(p -> notificationService.notifyGroupClosed(p, user, conversationId, conversation.getName()));
    }

    // ── Hide conversation from user's feed ────────────────────────────────────

    @Transactional
    public void hideConversation(String email, Long conversationId) {
        User user = findUser(email);
        getConversationForUser(conversationId, user.getId()); // validates membership
        conversationRepository.insertHiddenBy(conversationId, user.getId());
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
                    .profilePicture(c.getProfilePicture())
                    .isClosed(c.isClosed())
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
                .replyToStoryId(m.getReplyToStoryId())
                .replyToStoryText(m.getReplyToStoryText())
                .replyToStoryMedia(m.getReplyToStoryMedia())
                .sharedPostId(m.getSharedPostId())
                .sharedPostAuthorId(m.getSharedPostAuthorId())
                .sharedPostAuthorName(m.getSharedPostAuthorName())
                .sharedPostContent(m.getSharedPostContent())
                .sharedPostImage(m.getSharedPostImage())
                .sharedPostPollOptions(m.getSharedPostPollOptions())
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
