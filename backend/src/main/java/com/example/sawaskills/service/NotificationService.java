package com.example.sawaskills.service;

import com.example.sawaskills.entity.Notification;
import com.example.sawaskills.entity.Post;
import com.example.sawaskills.entity.Story;
import com.example.sawaskills.entity.User;
import com.example.sawaskills.repository.NotificationRepository;
import com.example.sawaskills.repository.UserRepository;
import com.example.sawaskills.repository.VolunteerSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final VolunteerSessionRepository volunteerSessionRepository;

    // ── Create notifications ──────────────────────────────────────────────────

    public void notifyPostLiked(User postAuthor, User actor, Long postId) {
        if (postAuthor.getId().equals(actor.getId())) return; // no self-notification
        save(Notification.builder()
                .user(postAuthor)
                .type("LIKE_POST")
                .message(actor.getName() + " liked your post")
                .actorId(actor.getId())
                .actorName(actor.getName())
                .referenceId(postId)
                .read(false)
                .createdAt(LocalDateTime.now())
                .build());
    }

    public void notifyCommented(User postAuthor, User actor, Long postId, String commentPreview) {
        if (postAuthor.getId().equals(actor.getId())) return;
        String preview = commentPreview != null && commentPreview.length() > 60
                ? commentPreview.substring(0, 60) + "…"
                : commentPreview;
        save(Notification.builder()
                .user(postAuthor)
                .type("COMMENT")
                .message(actor.getName() + " commented: \"" + preview + "\"")
                .actorId(actor.getId())
                .actorName(actor.getName())
                .referenceId(postId)
                .read(false)
                .createdAt(LocalDateTime.now())
                .build());
    }

    public void notifyCommentReply(User parentCommentAuthor, User actor, Long postId, String replyPreview) {
        if (parentCommentAuthor.getId().equals(actor.getId())) return;
        String preview = replyPreview != null && replyPreview.length() > 60
                ? replyPreview.substring(0, 60) + "…"
                : replyPreview;
        save(Notification.builder()
                .user(parentCommentAuthor)
                .type("COMMENT_REPLY")
                .message(actor.getName() + " replied to your comment: \"" + preview + "\"")
                .actorId(actor.getId())
                .actorName(actor.getName())
                .referenceId(postId)
                .read(false)
                .createdAt(LocalDateTime.now())
                .build());
    }

    public void notifyCommentLiked(User commentAuthor, User actor, Long postId) {
        if (commentAuthor.getId().equals(actor.getId())) return;
        save(Notification.builder()
                .user(commentAuthor)
                .type("LIKE_COMMENT")
                .message(actor.getName() + " liked your comment")
                .actorId(actor.getId())
                .actorName(actor.getName())
                .referenceId(postId)
                .read(false)
                .createdAt(LocalDateTime.now())
                .build());
    }

    public void notifyStoryLiked(User storyAuthor, User actor, Long storyId) {
        if (storyAuthor.getId().equals(actor.getId())) return;
        save(Notification.builder()
                .user(storyAuthor)
                .type("LIKE_STORY")
                .message(actor.getName() + " liked your story")
                .actorId(actor.getId())
                .actorName(actor.getName())
                .referenceId(storyId)
                .read(false)
                .createdAt(LocalDateTime.now())
                .build());
    }

    public void notifyStoryReply(User storyAuthor, User actor, Long storyId, String replyPreview) {
        if (storyAuthor.getId().equals(actor.getId())) return;
        String preview = replyPreview != null && replyPreview.length() > 60
                ? replyPreview.substring(0, 60) + "…"
                : replyPreview;
        save(Notification.builder()
                .user(storyAuthor)
                .type("STORY_REPLY")
                .message(actor.getName() + " replied to your story: \"" + preview + "\"")
                .actorId(actor.getId())
                .actorName(actor.getName())
                .referenceId(storyId)
                .read(false)
                .createdAt(LocalDateTime.now())
                .build());
    }

    public void notifyReposted(User originalAuthor, User actor, Long originalPostId) {
        if (originalAuthor.getId().equals(actor.getId())) return;
        save(Notification.builder()
                .user(originalAuthor)
                .type("REPOST")
                .message(actor.getName() + " reposted your post")
                .actorId(actor.getId())
                .actorName(actor.getName())
                .referenceId(originalPostId)
                .read(false)
                .createdAt(LocalDateTime.now())
                .build());
    }

    public void notifyPollVoted(User postAuthor, User actor, Long postId) {
        if (postAuthor.getId().equals(actor.getId())) return;
        save(Notification.builder()
                .user(postAuthor)
                .type("POLL_VOTE")
                .message(actor.getName() + " voted on your poll")
                .actorId(actor.getId())
                .actorName(actor.getName())
                .referenceId(postId)
                .read(false)
                .createdAt(LocalDateTime.now())
                .build());
    }

    public void notifyStoryPollVoted(User storyAuthor, User actor, Long storyId) {
        if (storyAuthor.getId().equals(actor.getId())) return;
        save(Notification.builder()
                .user(storyAuthor)
                .type("POLL_VOTE_STORY")
                .message(actor.getName() + " voted on your story poll")
                .actorId(actor.getId())
                .actorName(actor.getName())
                .referenceId(storyId)
                .read(false)
                .createdAt(LocalDateTime.now())
                .build());
    }

    public void notifyMLMatch(User recipient, Post post, String skillName) {
        if (!recipient.isSkillNewsNotificationsEnabled()) return;
        save(Notification.builder()
                .user(recipient)
                .type("ML_MATCH")
                .message("New post about " + skillName + ": \"" + truncate(post.getContent(), 60) + "\"")
                .actorId(post.getAuthor().getId())
                .actorName(post.getAuthor().getName())
                .referenceId(post.getId())
                .read(false)
                .createdAt(LocalDateTime.now())
                .build());
    }

    public void notifyConnectionRequest(User receiver, User requester, Long connectionId) {
        save(Notification.builder()
                .user(receiver)
                .type("CONNECTION_REQUEST")
                .message(requester.getName() + " wants to connect with you")
                .actorId(requester.getId())
                .actorName(requester.getName())
                .referenceId(connectionId)
                .read(false)
                .createdAt(LocalDateTime.now())
                .build());
    }

    public void notifyConnectionAccepted(User requester, User receiver) {
        save(Notification.builder()
                .user(requester)
                .type("CONNECTION_ACCEPTED")
                .message(receiver.getName() + " accepted your connection request")
                .actorId(receiver.getId())
                .actorName(receiver.getName())
                .read(false)
                .createdAt(LocalDateTime.now())
                .build());
    }

    public void notifySwapRequest(User receiver, User requester, Long swapId) {
        if (!receiver.isSwapNotificationsEnabled()) return;
        save(Notification.builder()
                .user(receiver)
                .type("SWAP_REQUEST")
                .message(requester.getName() + " sent you a swap request")
                .actorId(requester.getId())
                .actorName(requester.getName())
                .referenceId(swapId)
                .read(false)
                .createdAt(LocalDateTime.now())
                .build());
    }

    public void notifySwapAccepted(User requester, User receiver, Long swapId) {
        if (!requester.isSwapNotificationsEnabled()) return;
        save(Notification.builder()
                .user(requester)
                .type("SWAP_ACCEPTED")
                .message(receiver.getName() + " accepted your swap request")
                .actorId(receiver.getId())
                .actorName(receiver.getName())
                .referenceId(swapId)
                .read(false)
                .createdAt(LocalDateTime.now())
                .build());
    }

    public void notifyParentApproved(User minor, String actionType, Long referenceId) {
        String msg = switch (actionType) {
            case "SWAP_REQUEST"    -> "Your parent approved your swap request. The other user can now respond.";
            case "SWAP_ACCEPT"     -> "Your parent approved accepting the swap. It is now active!";
            case "SESSION_JOIN"    -> "Your parent approved joining the volunteer session. You are in!";
            case "VOLUNTEER_APPLY" -> "Your parent approved your volunteer application. It is now under admin review.";
            default                -> "Your parent approved your request.";
        };

        // For session joins, store the group chat ID so the frontend can open the chat directly
        String type = "PARENT_APPROVED";
        Long notifReferenceId = referenceId;
        if ("SESSION_JOIN".equals(actionType)) {
            type = "PARENT_APPROVED_SESSION";
            notifReferenceId = volunteerSessionRepository.findById(referenceId)
                    .map(s -> s.getGroupChat() != null ? s.getGroupChat().getId() : referenceId)
                    .orElse(referenceId);
        }

        save(Notification.builder()
                .user(minor)
                .type(type)
                .message(msg)
                .referenceId(notifReferenceId)
                .read(false)
                .createdAt(LocalDateTime.now())
                .build());
    }

    public void notifyParentDeclined(User minor, String actionType, Long referenceId) {
        String msg = switch (actionType) {
            case "SWAP_REQUEST"    -> "Your parent declined your swap request. The request has been cancelled.";
            case "SWAP_ACCEPT"     -> "Your parent declined accepting the swap. The request remains pending.";
            case "SESSION_JOIN"    -> "Your parent declined your request to join the volunteer session.";
            case "VOLUNTEER_APPLY" -> "Your parent declined your volunteer application.";
            default                -> "Your parent declined your request.";
        };
        save(Notification.builder()
                .user(minor)
                .type("PARENT_DECLINED")
                .message(msg)
                .referenceId(referenceId)
                .read(false)
                .createdAt(LocalDateTime.now())
                .build());
    }

    public void notifyMessage(User recipient, User sender, Long conversationId, String messagePreview) {
        if (recipient.getId().equals(sender.getId())) return;
        if (!recipient.isMessageNotificationsEnabled()) return;
        save(Notification.builder()
                .user(recipient)
                .type("MESSAGE")
                .message(sender.getName() + ": \"" + truncate(messagePreview, 60) + "\"")
                .actorId(sender.getId())
                .actorName(sender.getName())
                .referenceId(conversationId)
                .read(false)
                .createdAt(LocalDateTime.now())
                .build());
    }

    // ── Read / list ────────────────────────────────────────────────────────────

    public List<Map<String, Object>> getNotifications(String email) {
        User user = findUser(email);
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::toMap)
                .collect(Collectors.toList());
    }

    public long getUnreadCount(String email) {
        User user = findUser(email);
        return notificationRepository.countByUserIdAndReadFalse(user.getId());
    }

    @Transactional
    public void markRead(String email, Long notificationId) {
        User user = findUser(email);
        notificationRepository.findByIdAndUserId(notificationId, user.getId())
                .ifPresent(n -> {
                    n.setRead(true);
                    notificationRepository.save(n);
                });
    }

    @Transactional
    public void markAllRead(String email) {
        User user = findUser(email);
        notificationRepository.markAllReadByUserId(user.getId());
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private void save(Notification n) {
        try { notificationRepository.save(n); } catch (Exception ignored) {}
    }

    private Map<String, Object> toMap(Notification n) {
        java.util.LinkedHashMap<String, Object> m = new java.util.LinkedHashMap<>();
        m.put("id", n.getId());
        m.put("type", n.getType());
        m.put("message", n.getMessage());
        m.put("read", n.getRead());
        m.put("createdAt", n.getCreatedAt() != null ? n.getCreatedAt().toString() : null);
        m.put("actorId", n.getActorId());
        m.put("actorName", n.getActorName());
        m.put("referenceId", n.getReferenceId());
        return m;
    }

    private String truncate(String s, int max) {
        if (s == null) return "";
        return s.length() <= max ? s : s.substring(0, max) + "…";
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
