package com.example.sawaskills.service;

import com.example.sawaskills.dto.story.*;
import com.example.sawaskills.entity.*;
import com.example.sawaskills.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StoryService {

    @Value("${app.uploads.dir:uploads}")
    private String uploadsDir;

    private final StoryRepository storyRepository;
    private final StoryViewRepository storyViewRepository;
    private final UserRepository userRepository;
    private final PostService postService; // reuse saveImage helper

    // ── Active stories (not expired) ─────────────────────────────────────────────

    public List<StoryResponse> getActiveStories(String email) {
        Long userId = resolveUserId(email);
        return storyRepository.findByExpiresAtAfterOrderByCreatedAtDesc(LocalDateTime.now()).stream()
                .map(s -> toStoryResponse(s, userId))
                .collect(Collectors.toList());
    }

    // ── Create story ──────────────────────────────────────────────────────────────

    @Transactional
    public StoryResponse createStory(String email, CreateStoryRequest request) {
        User user = findUser(email);
        if ((request.getTextContent() == null || request.getTextContent().isBlank()) &&
                (request.getMediaBase64() == null || request.getMediaBase64().isBlank())) {
            throw new RuntimeException("Story must have text or media");
        }
        String mediaUrl = postService.saveImage(request.getMediaBase64(), "story-media", "story_" + user.getId());
        Story story = Story.builder()
                .textContent(request.getTextContent())
                .mediaUrl(mediaUrl)
                .user(user)
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusHours(24))
                .build();
        story = storyRepository.save(story);
        return toStoryResponse(story, user.getId());
    }

    // ── Mark story viewed ─────────────────────────────────────────────────────────

    @Transactional
    public void viewStory(String email, Long storyId) {
        User user = findUser(email);
        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new RuntimeException("Story not found"));
        if (!storyViewRepository.existsByStoryIdAndViewerId(storyId, user.getId())) {
            storyViewRepository.save(StoryView.builder()
                    .story(story)
                    .viewer(user)
                    .viewedAt(LocalDateTime.now())
                    .build());
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────────

    private StoryResponse toStoryResponse(Story s, Long currentUserId) {
        boolean hasViewed = currentUserId != null &&
                storyViewRepository.existsByStoryIdAndViewerId(s.getId(), currentUserId);
        return StoryResponse.builder()
                .id(s.getId())
                .userId(s.getUser().getId())
                .userName(s.getUser().getName())
                .userInitials(initials(s.getUser().getName()))
                .userPicture(s.getUser().getProfilePicture())
                .textContent(s.getTextContent())
                .mediaUrl(s.getMediaUrl())
                .createdAt(s.getCreatedAt().toString())
                .expiresAt(s.getExpiresAt().toString())
                .hasViewed(hasViewed)
                .build();
    }

    private String initials(String name) {
        if (name == null || name.isBlank()) return "??";
        return Arrays.stream(name.split(" "))
                .filter(w -> !w.isEmpty())
                .map(w -> String.valueOf(w.charAt(0)).toUpperCase())
                .limit(2)
                .collect(Collectors.joining());
    }

    private Long resolveUserId(String email) {
        if (email == null) return null;
        return userRepository.findByEmail(email).map(User::getId).orElse(null);
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
