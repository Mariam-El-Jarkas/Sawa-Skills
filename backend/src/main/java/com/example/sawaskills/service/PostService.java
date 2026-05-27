package com.example.sawaskills.service;

import com.example.sawaskills.dto.post.*;
import com.example.sawaskills.entity.*;
import com.example.sawaskills.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PostService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(PostService.class);

    @Value("${ml.service.url:http://localhost:8000}")
    private String mlServiceUrl;

    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final PostLikeRepository postLikeRepository;
    private final CommentLikeRepository commentLikeRepository;
    private final UserRepository userRepository;
    private final ConnectionRepository connectionRepository;
    private final UserSkillRepository userSkillRepository;
    private final ReportRepository reportRepository;
    private final PostShareRepository postShareRepository;
    private final PollVoteRepository pollVoteRepository;
    private final NotificationService notificationService;
    private final RestTemplate restTemplate;
    private final PlatformSettingsService platformSettings;
    private final B2StorageService b2StorageService;

    private static final List<String> SPAM_KEYWORDS = List.of(
            "buy now", "click here", "free money", "earn from home", "make money fast",
            "limited offer", "act now", "you have been selected", "congratulations you won",
            "work from home", "earn $", "100% free", "risk free", "no credit card"
    );

    // ── For You feed ──────────────────────────────────────────────────────────

    public List<PostResponse> getPosts(String email) {
        Long userId = resolveUserId(email);
        return postRepository.findByVisibilityOrderByCreatedAtDesc(Post.PostVisibility.EVERYONE).stream()
                .filter(p -> !p.isAdminHidden())
                .map(p -> toPostResponse(p, userId, false))
                .collect(Collectors.toList());
    }

    public PostResponse getPostById(String email, Long postId) {
        Long userId = resolveUserId(email);
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        return toPostResponse(post, userId, false);
    }

    // ── Following feed (connections + own posts) ──────────────────────────────

    public List<PostResponse> getFollowingPosts(String email) {
        User user = findUser(email);
        List<Long> connectedIds = connectionRepository.findAcceptedByUserId(user.getId())
                .stream()
                .map(c -> c.getRequester().getId().equals(user.getId())
                        ? c.getReceiver().getId()
                        : c.getRequester().getId())
                .collect(Collectors.toList());
        connectedIds.add(user.getId());
        return postRepository.findByAuthorIdsOrderByCreatedAtDesc(connectedIds).stream()
                .filter(p -> !p.isAdminHidden())
                .map(p -> toPostResponse(p, user.getId(), false))
                .collect(Collectors.toList());
    }

    // ── ML feed — calls Python microservice, falls back to keyword matching ───

    public List<PostResponse> getMLPosts(String email) {
        if (email == null) return Collections.emptyList();
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) return Collections.emptyList();

        List<String> skills = new ArrayList<>();
        userSkillRepository.findByUserIdAndOffering(user.getId(), true)
                .forEach(us -> skills.add(us.getSkill().getSkillName()));
        userSkillRepository.findByUserIdAndOffering(user.getId(), false)
                .forEach(us -> skills.add(us.getSkill().getSkillName()));
        if (skills.isEmpty()) return Collections.emptyList();

        List<Post> candidates = postRepository.findByVisibilityOrderByCreatedAtDesc(Post.PostVisibility.EVERYONE).stream()
                .filter(p -> !p.isAdminHidden())
                .filter(p -> !p.getAuthor().getId().equals(user.getId()))
                .limit(50)
                .collect(Collectors.toList());
        if (candidates.isEmpty()) return Collections.emptyList();

        // Try ML microservice first
        try {
            List<PostResponse> mlResults = callMLService(skills, candidates, user.getId());
            if (!mlResults.isEmpty()) return mlResults;
        } catch (Exception ignored) {
            // ML service unavailable — fall through to keyword fallback
        }

        return keywordFallback(skills, candidates, user.getId());
    }

    @SuppressWarnings("unchecked")
    private List<PostResponse> callMLService(List<String> skills, List<Post> candidates, Long currentUserId) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("skills", skills);
        body.put("posts", candidates.stream()
                .map(p -> Map.of("id", p.getId(), "content", p.getContent() != null ? p.getContent() : ""))
                .collect(Collectors.toList()));

        List<Map<String, Object>> results = restTemplate.postForObject(
                mlServiceUrl + "/score-posts", body, List.class);

        if (results == null || results.isEmpty()) return Collections.emptyList();

        Map<Long, Double> scoreMap = new LinkedHashMap<>();
        for (Map<String, Object> r : results) {
            Long id = ((Number) r.get("id")).longValue();
            Double score = ((Number) r.get("score")).doubleValue();
            scoreMap.put(id, score);
        }

        return candidates.stream()
                .filter(p -> scoreMap.containsKey(p.getId()))
                .sorted(Comparator.comparingDouble(p -> -scoreMap.getOrDefault(p.getId(), 0.0)))
                .limit(5)
                .map(p -> toPostResponse(p, currentUserId, true))
                .collect(Collectors.toList());
    }

    private List<PostResponse> keywordFallback(List<String> skills, List<Post> candidates, Long currentUserId) {
        Set<Long> seen = new HashSet<>();
        List<PostResponse> result = new ArrayList<>();
        for (String skill : skills) {
            candidates.stream()
                    .filter(p -> p.getContent() != null && p.getContent().toLowerCase().contains(skill.toLowerCase()))
                    .filter(p -> seen.add(p.getId()))
                    .limit(3)
                    .map(p -> toPostResponse(p, currentUserId, true))
                    .forEach(result::add);
            if (result.size() >= 5) break;
        }
        return result.stream().limit(5).collect(Collectors.toList());
    }

    public long getUserPostCount(String email) {
        User user = findUser(email);
        return postRepository.countByAuthorId(user.getId());
    }

    public List<SuggestedUser> getSuggestedConnections(String email) {
        User user = findUser(email);
        List<Long> connectedIds = connectionRepository.findByUserId(user.getId())
                .stream()
                .map(c -> c.getRequester().getId().equals(user.getId()) ? c.getReceiver().getId() : c.getRequester().getId())
                .collect(Collectors.toList());
        connectedIds.add(user.getId());

        return userRepository.findAll().stream()
                .filter(u -> !connectedIds.contains(u.getId()))
                .limit(5)
                .map(u -> SuggestedUser.builder()
                        .id(u.getId())
                        .name(u.getName())
                        .initials(initials(u.getName()))
                        .profilePicture(u.getProfilePicture())
                        .bio(u.getBio())
                        .build())
                .collect(Collectors.toList());
    }

    // ── Create post ───────────────────────────────────────────────────────────

    @Transactional
    public PostResponse createPost(String email, CreatePostRequest request) {
        User user = findUser(email);
        if ((request.getContent() == null || request.getContent().isBlank()) &&
                (request.getImageBase64() == null || request.getImageBase64().isBlank()) &&
                (request.getPollQuestion() == null || request.getPollQuestion().isBlank()) &&
                (request.getDocumentBase64() == null || request.getDocumentBase64().isBlank())) {
            throw new RuntimeException("Post must have content, image, poll, or document");
        }
        
        String uploadedImageUrl = saveImage(request.getImageBase64(), "post-images", "post_" + user.getId());
        String uploadedDocUrl   = saveDocument(request.getDocumentBase64(), "post-docs", "doc_" + user.getId());

        // When reposting, inherit the original post's media if the reposter didn't upload new media
        String imageUrl    = uploadedImageUrl;
        String documentUrl = uploadedDocUrl;
        if (request.getSharedPostId() != null) {
            postRepository.findById(request.getSharedPostId()).ifPresent(orig -> { /* just for existence check */ });
            Post orig = postRepository.findById(request.getSharedPostId()).orElse(null);
            if (orig != null) {
                if (imageUrl == null)    imageUrl    = orig.getImageUrl();
                if (documentUrl == null) documentUrl = orig.getDocumentUrl();
            }
        }
        
        Post.PostVisibility visibility = Post.PostVisibility.EVERYONE;
        if ("FOLLOWERS".equalsIgnoreCase(request.getVisibility())) {
            visibility = Post.PostVisibility.FOLLOWERS;
        }

        boolean autoHide = platformSettings.isAutoModeration() && isSpam(request.getContent());

        Post post = Post.builder()
                .content(request.getContent())
                .imageUrl(imageUrl)
                .documentUrl(documentUrl)
                .pollQuestion(request.getPollQuestion())
                .pollOptions(request.getPollOptions())
                .visibility(visibility)
                .author(user)
                .adminHidden(autoHide)
                .createdAt(LocalDateTime.now())
                .build();
        post = postRepository.save(post);

        // Notify users whose skills match the post content
        notifyMLMatches(post, user);

        // If this looks like a repost (starts with the repost emoji), notify original author
        detectAndNotifyRepost(post, user);

        return toPostResponse(post, user.getId(), false);
    }

    // ── Delete post ───────────────────────────────────────────────────────────

    @Transactional
    public void deletePost(String email, Long postId) {
        User user = findUser(email);
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        if (!post.getAuthor().getId().equals(user.getId())) {
            throw new RuntimeException("You can only delete your own posts");
        }
        
        // Manual cascading deletion due to no CascadeType on entities
        postLikeRepository.deleteByPostId(postId);
        reportRepository.deleteByReportedPostId(postId);
        postShareRepository.deleteByPostId(postId);
        pollVoteRepository.deleteByPostId(postId);

        List<Comment> comments = commentRepository.findByPostId(postId);
        for (Comment c : comments) {
            commentLikeRepository.deleteByCommentId(c.getId());
        }
        commentRepository.deleteByPostId(postId);
        
        postRepository.delete(post);
    }

    // ── Edit post ─────────────────────────────────────────────────────────────

    @Transactional
    public PostResponse editPost(String email, Long postId, String content) {
        User user = findUser(email);
        if (content == null || content.isBlank()) {
            throw new RuntimeException("Post content cannot be empty");
        }
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        if (!post.getAuthor().getId().equals(user.getId())) {
            throw new RuntimeException("You can only edit your own posts");
        }
        post.setContent(content.trim());
        post = postRepository.save(post);
        return toPostResponse(post, user.getId(), false);
    }

    // ── Toggle post like ──────────────────────────────────────────────────────

    @Transactional
    public Map<String, Object> toggleLike(String email, Long postId) {
        User user = findUser(email);
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        boolean isLiked;
        if (postLikeRepository.existsByPostIdAndUserId(postId, user.getId())) {
            postLikeRepository.deleteByPostIdAndUserId(postId, user.getId());
            isLiked = false;
        } else {
            postLikeRepository.save(PostLike.builder().user(user).post(post).build());
            isLiked = true;
            notificationService.notifyPostLiked(post.getAuthor(), user, postId);
        }
        long likeCount = postLikeRepository.countByPostId(postId);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("liked", isLiked);
        result.put("likeCount", likeCount);
        return result;
    }

    // ── Poll voting ───────────────────────────────────────────────────────────

    @Transactional
    public Map<String, Object> submitVote(String email, Long postId, String option) {
        User user = findUser(email);
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        
        Optional<PollVote> existing = pollVoteRepository.findByPostIdAndUserId(postId, user.getId());
        if (existing.isPresent()) {
            existing.get().setSelectedOption(option);
            pollVoteRepository.save(existing.get());
        } else {
            pollVoteRepository.save(PollVote.builder()
                    .post(post)
                    .user(user)
                    .selectedOption(option)
                    .createdAt(LocalDateTime.now())
                    .build());
        }

        Map<String, Long> results = new LinkedHashMap<>();
        if (post.getPollOptions() != null) {
            for (String opt : post.getPollOptions().split(",")) {
                results.put(opt.trim(), pollVoteRepository.countByPostIdAndSelectedOption(postId, opt.trim()));
            }
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("results", results);
        response.put("userVote", option);
        return response;
    }

    // ── Comments ──────────────────────────────────────────────────────────────

    public List<CommentResponse> getComments(String email, Long postId) {
        Long userId = resolveUserId(email);
        return commentRepository.findByPostIdOrderByCreatedAtAsc(postId).stream()
                .map(c -> toCommentResponse(c, userId))
                .collect(Collectors.toList());
    }

    @Transactional
    public CommentResponse addComment(String email, Long postId, CreateCommentRequest request) {
        User user = findUser(email);
        if (request.getContent() == null || request.getContent().isBlank()) {
            throw new RuntimeException("Comment cannot be empty");
        }
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        Comment comment = Comment.builder()
                .content(request.getContent().trim())
                .author(user)
                .post(post)
                .createdAt(LocalDateTime.now())
                .build();
        comment = commentRepository.save(comment);
        notificationService.notifyCommented(post.getAuthor(), user, postId, comment.getContent());
        return toCommentResponse(comment, user.getId());
    }

    @Transactional
    public void deleteComment(String email, Long commentId) {
        User user = findUser(email);
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));
        if (!comment.getAuthor().getId().equals(user.getId())) {
            throw new RuntimeException("You can only delete your own comments");
        }
        commentLikeRepository.deleteByCommentId(commentId);
        commentRepository.delete(comment);
    }

    @Transactional
    public CommentResponse editComment(String email, Long commentId, String content) {
        User user = findUser(email);
        if (content == null || content.isBlank()) throw new RuntimeException("Comment cannot be empty");
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));
        if (!comment.getAuthor().getId().equals(user.getId())) {
            throw new RuntimeException("You can only edit your own comments");
        }
        comment.setContent(content.trim());
        comment = commentRepository.save(comment);
        return toCommentResponse(comment, user.getId());
    }

    @Transactional
    public Map<String, Object> toggleCommentLike(String email, Long commentId) {
        User user = findUser(email);
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));
        boolean isLiked;
        if (commentLikeRepository.existsByCommentIdAndUserId(commentId, user.getId())) {
            commentLikeRepository.deleteByCommentIdAndUserId(commentId, user.getId());
            isLiked = false;
        } else {
            commentLikeRepository.save(CommentLike.builder().user(user).comment(comment).createdAt(LocalDateTime.now()).build());
            isLiked = true;
        }
        long likeCount = commentLikeRepository.countByCommentId(commentId);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("liked", isLiked);
        result.put("likeCount", likeCount);
        return result;
    }

    // ── Report post ───────────────────────────────────────────────────────────

    @Transactional
    public void reportPost(String email, Long postId, String reason) {
        User user = findUser(email);
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        reportRepository.save(Report.builder()
                .reporter(user)
                .reportedPost(post)
                .reason(reason)
                .status("PENDING")
                .createdAt(LocalDateTime.now())
                .build());

        // Auto-suspend if report count reaches threshold
        User author = post.getAuthor();
        if (author != null && !"SUSPENDED".equals(author.getAccountStatus()) && !"BANNED".equals(author.getAccountStatus())) {
            long totalReports = reportRepository.countByReportedPostAuthorId(author.getId());
            if (totalReports >= platformSettings.getAutoSuspendThreshold()) {
                author.setAccountStatus("SUSPENDED");
                userRepository.save(author);
            }
        }
    }

    private boolean isSpam(String content) {
        if (content == null || content.isBlank()) return false;
        String lower = content.toLowerCase();
        return SPAM_KEYWORDS.stream().anyMatch(lower::contains);
    }

    // ── Notification helpers ──────────────────────────────────────────────────

    private void notifyMLMatches(Post post, User author) {
        if (post.getContent() == null || post.getContent().isBlank()) return;
        try {
            String contentLower = post.getContent().toLowerCase();
            Set<Long> notified = new HashSet<>();
            userSkillRepository.findAll().forEach(us -> {
                String skillName = us.getSkill().getSkillName();
                if (skillName != null &&
                        contentLower.contains(skillName.toLowerCase()) &&
                        !us.getUser().getId().equals(author.getId()) &&
                        notified.add(us.getUser().getId())) {
                    notificationService.notifyMLMatch(us.getUser(), post, skillName);
                }
            });
        } catch (Exception ignored) {}
    }

    private void detectAndNotifyRepost(Post post, User reposter) {
        if (post.getContent() == null || !post.getContent().startsWith("🔁")) return;
        try {
            // Extract original author name from "🔁 OriginalName:\n..." pattern
            String content = post.getContent();
            int colonIdx = content.indexOf(":\n");
            if (colonIdx < 0) return;
            String originalAuthorName = content.substring(2, colonIdx).trim(); // after "🔁 "
            userRepository.findAll().stream()
                    .filter(u -> u.getName() != null && u.getName().equalsIgnoreCase(originalAuthorName))
                    .findFirst()
                    .ifPresent(originalAuthor ->
                            notificationService.notifyReposted(originalAuthor, reposter, post.getId()));
        } catch (Exception ignored) {}
    }

    // ── DTO helpers ───────────────────────────────────────────────────────────

    private PostResponse toPostResponse(Post post, Long currentUserId, boolean isML) {
        long likeCount = postLikeRepository.countByPostId(post.getId());
        long commentCount = commentRepository.countByPostId(post.getId());
        boolean isLiked = currentUserId != null &&
                postLikeRepository.existsByPostIdAndUserId(post.getId(), currentUserId);
        boolean isMine = currentUserId != null &&
                post.getAuthor().getId().equals(currentUserId);
        return PostResponse.builder()
                .id(post.getId())
                .authorId(post.getAuthor().getId())
                .authorName(post.getAuthor().getName())
                .authorInitials(initials(post.getAuthor().getName()))
                .authorPicture(post.getAuthor().getProfilePicture())
                .content(post.getContent())
                .imageUrl(post.getImageUrl())
                .documentUrl(post.getDocumentUrl())
                .pollQuestion(post.getPollQuestion())
                .pollOptions(post.getPollOptions())
                .visibility(post.getVisibility().name())
                .createdAt(post.getCreatedAt().toString())
                .likeCount(likeCount)
                .commentCount(commentCount)
                .isLiked(isLiked)
                .isMine(isMine)
                .isML(isML)
                .pollResults(getPollResults(post.getId(), post.getPollOptions()))
                .userPollVote(getUserVote(post.getId(), currentUserId))
                .build();
    }

    private Map<String, Long> getPollResults(Long postId, String options) {
        if (options == null) return null;
        Map<String, Long> results = new LinkedHashMap<>();
        for (String opt : options.split(",")) {
            results.put(opt.trim(), pollVoteRepository.countByPostIdAndSelectedOption(postId, opt.trim()));
        }
        return results;
    }

    private String getUserVote(Long postId, Long userId) {
        if (userId == null) return null;
        return pollVoteRepository.findByPostIdAndUserId(postId, userId)
                .map(PollVote::getSelectedOption)
                .orElse(null);
    }

    private CommentResponse toCommentResponse(Comment c, Long currentUserId) {
        long likeCount = commentLikeRepository.countByCommentId(c.getId());
        boolean isLiked = currentUserId != null &&
                commentLikeRepository.existsByCommentIdAndUserId(c.getId(), currentUserId);
        return CommentResponse.builder()
                .id(c.getId())
                .authorId(c.getAuthor().getId())
                .authorName(c.getAuthor().getName())
                .authorInitials(initials(c.getAuthor().getName()))
                .content(c.getContent())
                .createdAt(c.getCreatedAt().toString())
                .isMine(currentUserId != null && c.getAuthor().getId().equals(currentUserId))
                .likeCount(likeCount)
                .isLiked(isLiked)
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

    String saveImage(String base64, String subDir, String prefix) {
        if (base64 == null || base64.isBlank()) return null;
        try {
            if (!base64.startsWith("data:image/")) return null;
            String[] parts = base64.split(",", 2);
            if (parts.length < 2) return null;
            byte[] bytes = java.util.Base64.getDecoder().decode(parts[1]);
            String key = subDir + "/" + prefix + "_" + System.currentTimeMillis() + ".jpg";
            return b2StorageService.upload(bytes, key, "image/jpeg");
        } catch (Exception e) {
            return null;
        }
    }

    String saveDocument(String base64, String subDir, String prefix) {
        if (base64 == null || base64.isBlank()) return null;
        try {
            String[] parts = base64.split(",", 2);
            if (parts.length < 2) {
                log.warn("saveDocument: no comma separator found in base64 string (length={})", base64.length());
                return null;
            }
            String rawBase64 = parts[1].replaceAll("\\s", "");
            byte[] bytes = java.util.Base64.getMimeDecoder().decode(rawBase64);

            String ext = "pdf";
            String contentType = "application/pdf";
            if (parts[0].contains("word")) { ext = "docx"; contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"; }
            else if (parts[0].contains("text/plain")) { ext = "txt"; contentType = "text/plain"; }

            String key = subDir + "/" + prefix + "_" + System.currentTimeMillis() + "." + ext;
            log.info("saveDocument: uploading {} bytes to B2 key={}", bytes.length, key);
            return b2StorageService.upload(bytes, key, contentType);
        } catch (Exception e) {
            log.error("saveDocument failed (subDir={}, prefix={}): {}", subDir, prefix, e.getMessage(), e);
            return null;
        }
    }
}
