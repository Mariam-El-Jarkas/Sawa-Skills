package com.example.sawaskills.service;

import com.example.sawaskills.entity.Notification;
import com.example.sawaskills.entity.Post;
import com.example.sawaskills.entity.User;
import com.example.sawaskills.repository.NotificationRepository;
import com.example.sawaskills.repository.UserRepository;
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

    public void notifyMLMatch(User recipient, Post post, String skillName) {
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
