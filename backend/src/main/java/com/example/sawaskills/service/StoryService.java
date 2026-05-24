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
    private final StoryPollVoteRepository storyPollVoteRepository;
    private final StoryLikeRepository storyLikeRepository;
    private final ConnectionRepository connectionRepository;
    private final PostService postService; // reuse saveImage helper
    private final NotificationService notificationService;

    // ── Active stories (not expired) ─────────────────────────────────────────────

    public List<StoryResponse> getActiveStories(String email) {
        List<Story> allActive = storyRepository.findByExpiresAtAfterOrderByCreatedAtDesc(LocalDateTime.now());

        // Guest: no connection context — show all active stories
        if (email == null) {
            return allActive.stream()
                    .map(s -> toStoryResponse(s, null))
                    .collect(Collectors.toList());
        }

        User user = findUser(email);
        List<Long> connectedIds = connectionRepository.findAcceptedByUserId(user.getId())
                .stream()
                .map(c -> c.getRequester().getId().equals(user.getId())
                        ? c.getReceiver().getId()
                        : c.getRequester().getId())
                .collect(Collectors.toList());
        connectedIds.add(user.getId());

        return allActive.stream()
                .filter(s -> connectedIds.contains(s.getUser().getId()))
                .map(s -> toStoryResponse(s, user.getId()))
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
                .pollQuestion(request.getPollQuestion())
                .pollOptions(request.getPollOptions())
                .bgIndex(request.getBgIndex())
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

    @Transactional
    public void toggleLike(String email, Long storyId) {
        User user = findUser(email);
        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new RuntimeException("Story not found"));
        
        storyLikeRepository.findByStoryAndUser(story, user)
            .ifPresentOrElse(
                storyLikeRepository::delete,
                () -> {
                    storyLikeRepository.save(StoryLike.builder()
                            .story(story)
                            .user(user)
                            .createdAt(LocalDateTime.now())
                            .build());
                    notificationService.notifyStoryLiked(story.getUser(), user, storyId);
                }
            );
    }

    @Transactional
    public void submitVote(String email, Long storyId, String option) {
        User user = findUser(email);
        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new RuntimeException("Story not found"));
        
        storyPollVoteRepository.findByStoryAndUser(story, user)
            .ifPresentOrElse(
                v -> { v.setSelectedOption(option); storyPollVoteRepository.save(v); },
                () -> {
                    storyPollVoteRepository.save(StoryPollVote.builder()
                            .story(story)
                            .user(user)
                            .selectedOption(option)
                            .createdAt(LocalDateTime.now())
                            .build());
                    notificationService.notifyStoryPollVoted(story.getUser(), user, storyId);
                }
            );
    }

    @Transactional
    public void deleteStory(String email, Long storyId) {
        User user = findUser(email);
        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new RuntimeException("Story not found"));
        
        if (!story.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("You can only delete your own stories");
        }

        storyLikeRepository.deleteByStoryId(storyId);
        storyViewRepository.deleteByStoryId(storyId);
        storyPollVoteRepository.deleteByStoryId(storyId);
        storyRepository.delete(story);
    }

    // ── Stories for a specific user's profile ────────────────────────────────────

    public List<StoryResponse> getUserStories(String viewerEmail, Long targetUserId) {
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Long viewerUserId = resolveUserId(viewerEmail);
        if (!targetUser.isPublicProfile() && !targetUserId.equals(viewerUserId)) {
            return java.util.Collections.emptyList();
        }
        return storyRepository.findByUserIdAndExpiresAtAfterOrderByCreatedAtDesc(
                targetUserId, LocalDateTime.now()).stream()
                .map(s -> toStoryResponse(s, viewerUserId))
                .collect(Collectors.toList());
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
                .pollQuestion(s.getPollQuestion())
                .pollOptions(s.getPollOptions())
                .pollResults(getPollResults(s.getId(), s.getPollOptions()))
                .userPollVote(getUserVote(s.getId(), currentUserId))
                .createdAt(s.getCreatedAt().toString())
                .expiresAt(s.getExpiresAt().toString())
                .hasViewed(hasViewed)
                .liked(currentUserId != null && storyLikeRepository.existsByStoryIdAndUserId(s.getId(), currentUserId))
                .likeCount(storyLikeRepository.countByStoryId(s.getId()))
                .bgIndex(s.getBgIndex() != null ? s.getBgIndex() : 0)
                .build();
    }

    private java.util.Map<String, Long> getPollResults(Long storyId, String options) {
        if (options == null) return null;
        java.util.Map<String, Long> results = new java.util.LinkedHashMap<>();
        for (String opt : options.split(",")) {
            results.put(opt.trim(), storyPollVoteRepository.findByStoryId(storyId).stream()
                    .filter(v -> v.getSelectedOption().equals(opt.trim()))
                    .count());
        }
        return results;
    }

    private String getUserVote(Long storyId, Long userId) {
        if (userId == null) return null;
        return storyPollVoteRepository.findByStoryAndUser(Story.builder().id(storyId).build(), User.builder().id(userId).build())
                .map(StoryPollVote::getSelectedOption)
                .orElse(null);
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
