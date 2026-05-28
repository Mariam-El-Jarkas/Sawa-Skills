package com.example.sawaskills.service;

import com.example.sawaskills.dto.admin.*;
import com.example.sawaskills.entity.*;
import com.example.sawaskills.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final AuthProviderRepository authProviderRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;
    private final PostRepository postRepository;
    private final PostLikeRepository postLikeRepository;
    private final CommentRepository commentRepository;
    private final CommentLikeRepository commentLikeRepository;
    private final PostShareRepository postShareRepository;
    private final PollVoteRepository pollVoteRepository;
    private final ReportRepository reportRepository;
    private final SwapRequestRepository swapRequestRepository;
    private final VolunteerSessionRepository volunteerSessionRepository;
    private final VolunteerParticipantRepository volunteerParticipantRepository;
    private final SkillCategoryRepository skillCategoryRepository;
    private final SkillRepository skillRepository;
    private final UserSkillRepository userSkillRepository;
    private final NotificationRepository notificationRepository;
    private final MessageRepository messageRepository;
    private final ActivityLogRepository activityLogRepository;
    private final PlatformSettingRepository platformSettingRepository;
    private final AdminBroadcastRepository adminBroadcastRepository;
    private final VerificationRequestRepository verificationRequestRepository;
    private final PlatformSettingsService platformSettingsService;
    private final VolunteerService volunteerService;

    // ── Stats ────────────────────────────────────────────────────────────────

    public AdminStatsResponse getDashboardStats() {
        long totalUsers = userRepository.countByDeletedAtIsNull();
        long activeToday = userRepository.countByCreatedAtAfterAndDeletedAtIsNull(LocalDate.now().atStartOfDay());
        long pendingVerifications = verificationRequestRepository.findByStatus("PENDING").size()
                + verificationRequestRepository.findByStatus("PENDING_ADMIN").size();
        long pendingReports = reportRepository.countByStatus("PENDING");
        List<SwapRequest> allSwaps = swapRequestRepository.findAll();
        long totalSwaps = allSwaps.size();
        long completedSwaps = allSwaps.stream().filter(s -> "COMPLETED".equalsIgnoreCase(s.getStatus())).count();
        long pendingSwaps = allSwaps.stream().filter(s -> "PENDING".equalsIgnoreCase(s.getStatus())).count();
        return AdminStatsResponse.builder()
                .totalUsers(totalUsers).activeToday(activeToday)
                .pendingVerifications(pendingVerifications).pendingReports(pendingReports)
                .totalSwaps(totalSwaps).completedSwaps(completedSwaps).pendingSwaps(pendingSwaps)
                .totalSessions(volunteerSessionRepository.count())
                .totalPosts(postRepository.count()).totalMessages(messageRepository.count())
                .build();
    }

    // ── Analytics ────────────────────────────────────────────────────────────

    public List<AdminAnalyticsPoint> getUserGrowth() {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM yyyy");
        Map<String, Long> grouped = new TreeMap<>();
        LocalDateTime sevenMonthsAgo = LocalDateTime.now().minusMonths(6).withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
        for (int i = 6; i >= 0; i--) grouped.put(LocalDateTime.now().minusMonths(i).withDayOfMonth(1).format(fmt), 0L);
        userRepository.findAll().stream()
                .filter(u -> u.getDeletedAt() == null && u.getCreatedAt() != null && !u.getCreatedAt().isBefore(sevenMonthsAgo))
                .forEach(u -> grouped.merge(u.getCreatedAt().format(fmt), 1L, Long::sum));
        return grouped.entrySet().stream().map(e -> new AdminAnalyticsPoint(e.getKey(), e.getValue())).collect(Collectors.toList());
    }

    public Map<String, List<AdminAnalyticsPoint>> getSwapTrends() {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM yyyy");
        Map<String, Long> comp = new TreeMap<>(), pend = new TreeMap<>();
        LocalDateTime sevenMonthsAgo = LocalDateTime.now().minusMonths(6).withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
        for (int i = 6; i >= 0; i--) {
            String k = LocalDateTime.now().minusMonths(i).withDayOfMonth(1).format(fmt);
            comp.put(k, 0L); pend.put(k, 0L);
        }
        swapRequestRepository.findAll().stream()
                .filter(s -> s.getCreatedAt() != null && !s.getCreatedAt().isBefore(sevenMonthsAgo))
                .forEach(s -> {
                    String k = s.getCreatedAt().format(fmt);
                    if ("COMPLETED".equalsIgnoreCase(s.getStatus())) comp.merge(k, 1L, Long::sum);
                    else if ("PENDING".equalsIgnoreCase(s.getStatus())) pend.merge(k, 1L, Long::sum);
                });
        Map<String, List<AdminAnalyticsPoint>> result = new HashMap<>();
        result.put("completed", comp.entrySet().stream().map(e -> new AdminAnalyticsPoint(e.getKey(), e.getValue())).collect(Collectors.toList()));
        result.put("pending", pend.entrySet().stream().map(e -> new AdminAnalyticsPoint(e.getKey(), e.getValue())).collect(Collectors.toList()));
        return result;
    }

    public List<AdminAnalyticsPoint> getSkillDemand() {
        return skillCategoryRepository.findAll().stream()
                .map(cat -> new AdminAnalyticsPoint(cat.getName(), skillRepository.findByCategory_Id(cat.getId()).size()))
                .sorted(Comparator.comparingLong(AdminAnalyticsPoint::getValue).reversed())
                .limit(6).collect(Collectors.toList());
    }

    public List<AdminUserResponse> getTopUsers() {
        Map<Long, Long> counts = swapRequestRepository.findAll().stream()
                .filter(s -> "COMPLETED".equalsIgnoreCase(s.getStatus()) && s.getReceiver() != null)
                .collect(Collectors.groupingBy(s -> s.getReceiver().getId(), Collectors.counting()));
        return counts.entrySet().stream()
                .sorted(Map.Entry.<Long, Long>comparingByValue().reversed()).limit(5)
                .map(e -> userRepository.findById(e.getKey()).map(u -> toUserResponse(u, e.getValue())).orElse(null))
                .filter(Objects::nonNull).collect(Collectors.toList());
    }

    // ── Users ────────────────────────────────────────────────────────────────

    public List<AdminUserResponse> getUsers(String search, String status, String verified) {
        String q = search == null ? "" : search.toLowerCase();
        String st = (status == null || status.isBlank() || status.equals("all")) ? null : status.toUpperCase();
        Boolean verifiedFilter = "true".equalsIgnoreCase(verified) ? Boolean.TRUE
                : "false".equalsIgnoreCase(verified) ? Boolean.FALSE : null;

        List<User> all = userRepository.findAll().stream()
                .filter(u -> u.getDeletedAt() == null)
                .filter(u -> q.isEmpty()
                        || (u.getName() != null && u.getName().toLowerCase().contains(q))
                        || (u.getEmail() != null && u.getEmail().toLowerCase().contains(q)))
                .filter(u -> st == null || st.equalsIgnoreCase(u.getAccountStatus() != null ? u.getAccountStatus() : "ACTIVE"))
                .filter(u -> verifiedFilter == null || verifiedFilter.equals(u.getVerified()))
                .collect(Collectors.toList());

        return all.stream()
                .map(u -> toUserResponse(u, reportRepository.countByReportedPostAuthorId(u.getId())))
                .collect(Collectors.toList());
    }

    public void banUser(Long id) { User u = reqUser(id); u.setAccountStatus("BANNED"); userRepository.save(u); log("BAN_USER", "admin_action", "Banned: " + u.getEmail()); }
    public void unbanUser(Long id) { User u = reqUser(id); u.setAccountStatus("ACTIVE"); userRepository.save(u); log("UNBAN_USER", "admin_action", "Unbanned: " + u.getEmail()); }
    public void suspendUser(Long id) { User u = reqUser(id); u.setAccountStatus("SUSPENDED"); userRepository.save(u); log("SUSPEND_USER", "admin_action", "Suspended: " + u.getEmail()); }
    public void verifyUser(Long id) { User u = reqUser(id); u.setVerified(true); userRepository.save(u); }

    @Transactional
    public void deleteUser(Long id) {
        User u = reqUser(id);
        String email = u.getEmail();
        u.setEmail("deleted_" + UUID.randomUUID() + "@deleted.sawaskills.com");
        u.setName("Deleted User"); u.setBio(null); u.setProfilePicture(null);
        u.setPhoneNumber(null); u.setDob(null); u.setDeletedAt(LocalDateTime.now()); u.setAccountStatus("BANNED");
        userRepository.save(u); log("DELETE_USER", "admin_action", "Deleted: " + email);
    }

    // ── Posts ────────────────────────────────────────────────────────────────

    public List<AdminPostResponse> getPosts(String search, String status) {
        String q = search == null ? "" : search.toLowerCase();
        return postRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(p -> q.isEmpty() || (p.getContent() != null && p.getContent().toLowerCase().contains(q))
                        || (p.getAuthor() != null && p.getAuthor().getName().toLowerCase().contains(q)))
                .filter(p -> {
                    if (status == null || status.isBlank() || status.equals("all")) return true;
                    if ("hidden".equals(status)) return p.isAdminHidden();
                    if ("visible".equals(status)) return !p.isAdminHidden();
                    if ("reported".equals(status)) return reportRepository.countByReportedPostId(p.getId()) > 0;
                    if ("deleted".equals(status)) return p.getAuthor() != null && p.getAuthor().getDeletedAt() != null;
                    return true;
                })
                .map(p -> AdminPostResponse.builder()
                        .id(p.getId()).content(p.getContent()).imageUrl(p.getImageUrl())
                        .authorId(p.getAuthor() != null ? p.getAuthor().getId() : null)
                        .authorName(p.getAuthor() != null ? p.getAuthor().getName() : "Unknown")
                        .authorEmail(p.getAuthor() != null ? p.getAuthor().getEmail() : "")
                        .likesCount(postLikeRepository.countByPostId(p.getId()))
                        .commentsCount(commentRepository.countByPostId(p.getId()))
                        .reportCount(reportRepository.countByReportedPostId(p.getId()))
                        .adminHidden(p.isAdminHidden())
                        .visibility(p.getVisibility() != null ? p.getVisibility().name() : "EVERYONE")
                        .createdAt(p.getCreatedAt()).build())
                .collect(Collectors.toList());
    }

    public void setPostHidden(Long id, boolean hidden) {
        Post p = postRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        p.setAdminHidden(hidden); postRepository.save(p);
    }

    @Transactional
    public void deletePost(Long id) {
        Post p = postRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        postLikeRepository.deleteByPostId(id);
        reportRepository.deleteByReportedPostId(id);
        postShareRepository.deleteByPostId(id);
        pollVoteRepository.deleteByPostId(id);
        commentRepository.findByPostId(id).forEach(c -> commentLikeRepository.deleteByCommentId(c.getId()));
        commentRepository.deleteByPostId(id);
        postRepository.delete(p);
    }

    public List<AdminCommentResponse> getPostComments(Long postId) {
        postRepository.findById(postId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        return commentRepository.findByPostIdOrderByCreatedAtAsc(postId).stream()
                .map(c -> AdminCommentResponse.builder()
                        .id(c.getId()).postId(postId)
                        .content(c.getContent())
                        .authorId(c.getAuthor() != null ? c.getAuthor().getId() : null)
                        .authorName(c.getAuthor() != null ? c.getAuthor().getName() : "Unknown")
                        .authorEmail(c.getAuthor() != null ? c.getAuthor().getEmail() : "")
                        .likeCount(commentLikeRepository.countByCommentId(c.getId()))
                        .createdAt(c.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteComment(Long commentId) {
        commentRepository.findById(commentId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        commentLikeRepository.deleteByCommentId(commentId);
        commentRepository.deleteById(commentId);
    }

    // ── Reports ──────────────────────────────────────────────────────────────

    public List<AdminReportResponse> getReports(String search, String status) {
        String q = search == null ? "" : search.toLowerCase();
        return reportRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(r -> status == null || status.isBlank() || status.equals("all") || status.equalsIgnoreCase(r.getStatus()))
                .filter(r -> q.isEmpty() || (r.getReason() != null && r.getReason().toLowerCase().contains(q))
                        || (r.getReporter() != null && r.getReporter().getName().toLowerCase().contains(q)))
                .map(r -> AdminReportResponse.builder()
                        .id(r.getId()).reason(r.getReason()).status(r.getStatus()).createdAt(r.getCreatedAt())
                        .reporterName(r.getReporter() != null ? r.getReporter().getName() : "Unknown")
                        .reporterEmail(r.getReporter() != null ? r.getReporter().getEmail() : "")
                        .postId(r.getReportedPost() != null ? r.getReportedPost().getId() : null)
                        .postContent(r.getReportedPost() != null ? trunc(r.getReportedPost().getContent(), 80) : "")
                        .postAuthorName(r.getReportedPost() != null && r.getReportedPost().getAuthor() != null ? r.getReportedPost().getAuthor().getName() : "Unknown")
                        .build())
                .collect(Collectors.toList());
    }

    public void resolveReport(Long id) { Report r = reportRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND)); r.setStatus("RESOLVED"); reportRepository.save(r); }
    public void dismissReport(Long id) { Report r = reportRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND)); r.setStatus("DISMISSED"); reportRepository.save(r); }

    // ── Swaps ────────────────────────────────────────────────────────────────

    public List<AdminSwapResponse> getSwaps(String search, String status) {
        String q = search == null ? "" : search.toLowerCase();
        return swapRequestRepository.findAll().stream()
                .sorted(Comparator.comparing(s -> s.getCreatedAt() != null ? s.getCreatedAt() : LocalDateTime.MIN, Comparator.reverseOrder()))
                .filter(s -> status == null || status.isBlank() || status.equals("all") || status.equalsIgnoreCase(s.getStatus()))
                .filter(s -> q.isEmpty() || (s.getRequester() != null && s.getRequester().getName().toLowerCase().contains(q))
                        || (s.getReceiver() != null && s.getReceiver().getName().toLowerCase().contains(q)))
                .map(s -> AdminSwapResponse.builder()
                        .id(s.getId())
                        .requesterName(s.getRequester() != null ? s.getRequester().getName() : "Unknown")
                        .requesterEmail(s.getRequester() != null ? s.getRequester().getEmail() : "")
                        .receiverName(s.getReceiver() != null ? s.getReceiver().getName() : "Unknown")
                        .receiverEmail(s.getReceiver() != null ? s.getReceiver().getEmail() : "")
                        .offeredSkill(s.getOfferedSkill()).wantedSkill(s.getWantedSkill())
                        .status(s.getStatus()).createdAt(s.getCreatedAt()).updatedAt(s.getUpdatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    public void cancelSwap(Long id) {
        SwapRequest s = swapRequestRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        s.setStatus("REJECTED"); s.setUpdatedAt(LocalDateTime.now()); swapRequestRepository.save(s);
    }

    // ── Volunteer Sessions ───────────────────────────────────────────────────

    public List<AdminSessionResponse> getVolunteerSessions() {
        return volunteerSessionRepository.findAll().stream()
                .sorted(Comparator.comparing(s -> s.getSessionDate() != null ? s.getSessionDate() : LocalDateTime.MIN, Comparator.reverseOrder()))
                .map(s -> AdminSessionResponse.builder()
                        .id(s.getId()).title(s.getTitle()).description(s.getDescription()).sessionDate(s.getSessionDate())
                        .organizerName(s.getOrganizer() != null ? s.getOrganizer().getName() : "Unknown")
                        .organizerEmail(s.getOrganizer() != null ? s.getOrganizer().getEmail() : "")
                        .status(s.getStatus()).participantCount(volunteerParticipantRepository.countBySessionId(s.getId()))
                        .maxParticipants(s.getMaxParticipants()).build())
                .collect(Collectors.toList());
    }

    public void approveSession(Long id) { VolunteerSession s = reqSession(id); s.setStatus("APPROVED"); volunteerSessionRepository.save(s); }
    public void rejectSession(Long id) { VolunteerSession s = reqSession(id); s.setStatus("REJECTED"); volunteerSessionRepository.save(s); }

    @Transactional
    public void deleteSession(Long id) {
        volunteerService.deleteSessionById(id);
        log("DELETE_SESSION", "admin_action", "Deleted session: " + id);
    }

    // ── Skills ───────────────────────────────────────────────────────────────

    public List<AdminSkillCategoryResponse> getSkillCategories() {
        return skillCategoryRepository.findAll().stream().map(cat -> {
            List<Skill> skills = skillRepository.findByCategory_Id(cat.getId());
            return AdminSkillCategoryResponse.builder().id(cat.getId()).name(cat.getName())
                    .description(cat.getDescription()).iconKey(cat.getIconKey())
                    .skillCount(skills.size()).skills(skills.stream().map(s -> new AdminSkillDto(s.getId(), s.getSkillName())).collect(Collectors.toList())).build();
        }).collect(Collectors.toList());
    }

    public AdminSkillCategoryResponse createSkillCategory(String name, String description, String iconKey) {
        SkillCategory cat = skillCategoryRepository.save(
            SkillCategory.builder().name(name).description(description).iconKey(iconKey != null ? iconKey : "Other").build()
        );
        return AdminSkillCategoryResponse.builder().id(cat.getId()).name(cat.getName())
                .description(cat.getDescription()).iconKey(cat.getIconKey()).skillCount(0).skills(List.of()).build();
    }

    @Transactional
    public void deleteSkillCategory(Long id) {
        skillCategoryRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        // Remove user_skills rows first — they reference Skill via FK and block deletion
        skillRepository.findByCategory_Id(id).forEach(skill -> userSkillRepository.deleteBySkillId(skill.getId()));
        skillRepository.deleteByCategoryId(id);
        skillCategoryRepository.deleteById(id);
    }

    public AdminSkillDto addSkillToCategory(Long categoryId, String skillName) {
        SkillCategory cat = skillCategoryRepository.findById(categoryId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        Skill skill = skillRepository.save(Skill.builder().skillName(skillName).category(cat).build());
        return new AdminSkillDto(skill.getId(), skill.getSkillName());
    }

    @Transactional
    public void revokeBadge(Long userId, String type) {
        String normalised = type.toUpperCase();
        if (!java.util.Set.of("ADULT", "MINOR", "VOLUNTEER").contains(normalised))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid badge type: " + type);

        VerificationRequest req = verificationRequestRepository
                .findTopByUserIdAndTypeAndStatusOrderBySubmittedAtDesc(userId, normalised, "APPROVED")
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No approved " + normalised + " badge found for this user"));

        req.setStatus("REVOKED");
        verificationRequestRepository.save(req);
    }

    @Transactional
    public void removeSkill(Long skillId) {
        skillRepository.findById(skillId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        userSkillRepository.deleteBySkillId(skillId);
        skillRepository.deleteById(skillId);
    }

    // ── Broadcasts ───────────────────────────────────────────────────────────

    public List<AdminBroadcastResponse> getBroadcasts() {
        return adminBroadcastRepository.findAllByOrderBySentAtDesc().stream()
                .map(b -> AdminBroadcastResponse.builder().id(b.getId()).title(b.getTitle()).message(b.getMessage())
                        .audience(b.getAudience()).sentAt(b.getSentAt()).recipientCount(b.getRecipientCount()).build())
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteBroadcast(Long id) {
        adminBroadcastRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        adminBroadcastRepository.deleteById(id);
    }

    public AdminBroadcastResponse sendBroadcast(String title, String message, String audience) {
        List<User> recipients = resolveAudience(audience);
        LocalDateTime now = LocalDateTime.now();
        notificationRepository.saveAll(recipients.stream()
                .map(u -> Notification.builder().user(u).type("ADMIN_BROADCAST").message(title + ": " + message).read(false).createdAt(now).build())
                .collect(Collectors.toList()));
        AdminBroadcast b = adminBroadcastRepository.save(AdminBroadcast.builder().title(title).message(message).audience(audience).sentAt(now).recipientCount(recipients.size()).build());
        return AdminBroadcastResponse.builder().id(b.getId()).title(title).message(message).audience(audience).sentAt(now).recipientCount(recipients.size()).build();
    }

    // ── Logs ─────────────────────────────────────────────────────────────────

    public List<AdminLogResponse> getLogs(String search, String severity) {
        String q = search == null ? "" : search.toLowerCase();
        return activityLogRepository.findTop200ByOrderByCreatedAtDesc().stream()
                .filter(l -> q.isEmpty() || (l.getAction() != null && l.getAction().toLowerCase().contains(q))
                        || (l.getUser() != null && l.getUser().getName().toLowerCase().contains(q)))
                .filter(l -> {
                    if (severity == null || severity.isBlank() || severity.equals("all")) return true;
                    String t = (l.getActionType() != null ? l.getActionType() : "").toLowerCase();
                    return switch (severity.toLowerCase()) {
                        case "info" -> t.equals("login") || t.equals("info");
                        case "warning" -> t.equals("suspicious") || t.equals("warning");
                        case "error" -> t.equals("error");
                        case "admin_action" -> t.equals("admin_action");
                        default -> true;
                    };
                })
                .map(l -> AdminLogResponse.builder().id(l.getId()).action(l.getAction()).actionType(l.getActionType())
                        .description(l.getDescription()).createdAt(l.getCreatedAt()).ipAddress(l.getIpAddress())
                        .userName(l.getUser() != null ? l.getUser().getName() : "System")
                        .userEmail(l.getUser() != null ? l.getUser().getEmail() : "").build())
                .collect(Collectors.toList());
    }

    // ── Admin Profile ─────────────────────────────────────────────────────────

    @Transactional
    public void updateAdminName(String email, String newName) {
        if (newName == null || newName.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name cannot be empty");
        User user = userRepository.findByEmail(email).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        user.setName(newName.trim());
        userRepository.save(user);
    }

    @Transactional
    public void changeAdminPassword(String email, String currentPassword, String newPassword) {
        if (newPassword == null || newPassword.length() < 8)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New password must be at least 8 characters");
        User user = userRepository.findByEmail(email).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        AuthProvider auth = authProviderRepository.findByUserAndProvider(user, com.example.sawaskills.entity.AuthenticationProvider.LOCAL)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "No local password set for this account"));
        if (!passwordEncoder.matches(currentPassword, auth.getPasswordHash()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
        auth.setPasswordHash(passwordEncoder.encode(newPassword));
        authProviderRepository.save(auth);
    }

    // ── Settings ─────────────────────────────────────────────────────────────

    public Map<String, String> getSettings() {
        Map<String, String> defaults = new LinkedHashMap<>();
        defaults.put("platformName", "Sawa Skills"); defaults.put("supportEmail", "support@sawaskills.online");
        defaults.put("maintenanceMode", "false"); defaults.put("allowRegistrations", "true");
        defaults.put("requireEmailVerification", "true"); defaults.put("autoModeration", "false");
        defaults.put("autoSuspendThreshold", "5");
        platformSettingRepository.findAll().forEach(s -> defaults.put(s.getSettingKey(), s.getSettingValue()));
        return defaults;
    }

    @Transactional
    public void saveSettings(Map<String, String> settings) {
        settings.forEach((k, v) -> {
            PlatformSetting s = platformSettingRepository.findBySettingKey(k).orElse(PlatformSetting.builder().settingKey(k).build());
            s.setSettingValue(v); s.setUpdatedAt(LocalDateTime.now()); platformSettingRepository.save(s);
        });
        platformSettingsService.refresh();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private User reqUser(Long id) { return userRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found")); }
    private VolunteerSession reqSession(Long id) { return volunteerSessionRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found")); }

    private AdminUserResponse toUserResponse(User u, long reportCount) {
        return AdminUserResponse.builder().id(u.getId()).name(u.getName()).email(u.getEmail()).role(u.getRole())
                .verified(u.getVerified()).accountStatus(u.getAccountStatus() != null ? u.getAccountStatus() : "ACTIVE")
                .locationCity(u.getLocation() != null ? u.getLocation().getCity() : null)
                .createdAt(u.getCreatedAt()).reportCount(reportCount).build();
    }

    private List<User> resolveAudience(String audience) {
        if (audience == null) return List.of();
        return switch (audience.toUpperCase()) {
            case "VERIFIED"   -> userRepository.findVerifiedUsers();
            case "MINOR"      -> userRepository.findMinorUsers();
            case "ADULT"      -> userRepository.findAdultUsers();
            case "VOLUNTEERS" -> userRepository.findVolunteerBadgeUsers();
            default           -> userRepository.findAllActiveUsers();
        };
    }

    private void log(String action, String type, String desc) {
        activityLogRepository.save(ActivityLog.builder().action(action).actionType(type).description(desc).createdAt(LocalDateTime.now()).build());
    }

    private String trunc(String s, int max) { if (s == null) return ""; return s.length() <= max ? s : s.substring(0, max) + "..."; }
}
