package com.example.sawaskills.controller;

import com.example.sawaskills.dto.admin.*;
import com.example.sawaskills.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @Value("${app.admin.email}")
    private String adminEmail;

    // ── Stats & Analytics ─────────────────────────────────────────────────────

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsResponse> getStats(Principal p) {
        requireAdmin(p); return ResponseEntity.ok(adminService.getDashboardStats());
    }

    @GetMapping("/analytics/user-growth")
    public ResponseEntity<List<AdminAnalyticsPoint>> getUserGrowth(Principal p) {
        requireAdmin(p); return ResponseEntity.ok(adminService.getUserGrowth());
    }

    @GetMapping("/analytics/swap-trends")
    public ResponseEntity<Map<String, List<AdminAnalyticsPoint>>> getSwapTrends(Principal p) {
        requireAdmin(p); return ResponseEntity.ok(adminService.getSwapTrends());
    }

    @GetMapping("/analytics/skill-demand")
    public ResponseEntity<List<AdminAnalyticsPoint>> getSkillDemand(Principal p) {
        requireAdmin(p); return ResponseEntity.ok(adminService.getSkillDemand());
    }

    @GetMapping("/analytics/top-users")
    public ResponseEntity<List<AdminUserResponse>> getTopUsers(Principal p) {
        requireAdmin(p); return ResponseEntity.ok(adminService.getTopUsers());
    }

    // ── Users ─────────────────────────────────────────────────────────────────

    @GetMapping("/users")
    public ResponseEntity<List<AdminUserResponse>> getUsers(Principal p,
            @RequestParam(defaultValue = "") String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String verified) {
        requireAdmin(p); return ResponseEntity.ok(adminService.getUsers(search, status, verified));
    }

    @PatchMapping("/users/{id}/ban")
    public ResponseEntity<String> banUser(@PathVariable Long id, Principal p) {
        requireAdmin(p); adminService.banUser(id); return ResponseEntity.ok("User banned");
    }

    @PatchMapping("/users/{id}/unban")
    public ResponseEntity<String> unbanUser(@PathVariable Long id, Principal p) {
        requireAdmin(p); adminService.unbanUser(id); return ResponseEntity.ok("User unbanned");
    }

    @PatchMapping("/users/{id}/suspend")
    public ResponseEntity<String> suspendUser(@PathVariable Long id, Principal p) {
        requireAdmin(p); adminService.suspendUser(id); return ResponseEntity.ok("User suspended");
    }

    @PatchMapping("/users/{id}/verify")
    public ResponseEntity<String> verifyUser(@PathVariable Long id, Principal p) {
        requireAdmin(p); adminService.verifyUser(id); return ResponseEntity.ok("User verified");
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<String> deleteUser(@PathVariable Long id, Principal p) {
        requireAdmin(p); adminService.deleteUser(id); return ResponseEntity.ok("User deleted");
    }

    // ── Posts ─────────────────────────────────────────────────────────────────

    @GetMapping("/posts")
    public ResponseEntity<List<AdminPostResponse>> getPosts(Principal p,
            @RequestParam(defaultValue = "") String search,
            @RequestParam(required = false) String status) {
        requireAdmin(p); return ResponseEntity.ok(adminService.getPosts(search, status));
    }

    @PatchMapping("/posts/{id}/visibility")
    public ResponseEntity<String> setPostVisibility(@PathVariable Long id,
            @RequestBody Map<String, Boolean> body, Principal p) {
        requireAdmin(p);
        adminService.setPostHidden(id, Boolean.TRUE.equals(body.get("hidden")));
        return ResponseEntity.ok("Post updated");
    }

    @DeleteMapping("/posts/{id}")
    public ResponseEntity<String> deletePost(@PathVariable Long id, Principal p) {
        requireAdmin(p); adminService.deletePost(id); return ResponseEntity.ok("Post deleted");
    }

    @GetMapping("/posts/{postId}/comments")
    public ResponseEntity<List<AdminCommentResponse>> getPostComments(@PathVariable Long postId, Principal p) {
        requireAdmin(p); return ResponseEntity.ok(adminService.getPostComments(postId));
    }

    @DeleteMapping("/posts/{postId}/comments/{commentId}")
    public ResponseEntity<String> deleteComment(@PathVariable Long postId, @PathVariable Long commentId, Principal p) {
        requireAdmin(p); adminService.deleteComment(commentId); return ResponseEntity.ok("Comment deleted");
    }

    // ── Reports ───────────────────────────────────────────────────────────────

    @GetMapping("/reports")
    public ResponseEntity<List<AdminReportResponse>> getReports(Principal p,
            @RequestParam(defaultValue = "") String search,
            @RequestParam(required = false) String status) {
        requireAdmin(p); return ResponseEntity.ok(adminService.getReports(search, status));
    }

    @PatchMapping("/reports/{id}/resolve")
    public ResponseEntity<String> resolveReport(@PathVariable Long id, Principal p) {
        requireAdmin(p); adminService.resolveReport(id); return ResponseEntity.ok("Resolved");
    }

    @PatchMapping("/reports/{id}/dismiss")
    public ResponseEntity<String> dismissReport(@PathVariable Long id, Principal p) {
        requireAdmin(p); adminService.dismissReport(id); return ResponseEntity.ok("Dismissed");
    }

    // ── Swaps ─────────────────────────────────────────────────────────────────

    @GetMapping("/swaps")
    public ResponseEntity<List<AdminSwapResponse>> getSwaps(Principal p,
            @RequestParam(defaultValue = "") String search,
            @RequestParam(required = false) String status) {
        requireAdmin(p); return ResponseEntity.ok(adminService.getSwaps(search, status));
    }

    @PatchMapping("/swaps/{id}/cancel")
    public ResponseEntity<String> cancelSwap(@PathVariable Long id, Principal p) {
        requireAdmin(p); adminService.cancelSwap(id); return ResponseEntity.ok("Swap cancelled");
    }

    // ── Volunteer ─────────────────────────────────────────────────────────────

    @GetMapping("/volunteer/sessions")
    public ResponseEntity<List<AdminSessionResponse>> getSessions(Principal p) {
        requireAdmin(p); return ResponseEntity.ok(adminService.getVolunteerSessions());
    }

    @PatchMapping("/volunteer/sessions/{id}/approve")
    public ResponseEntity<String> approveSession(@PathVariable Long id, Principal p) {
        requireAdmin(p); adminService.approveSession(id); return ResponseEntity.ok("Approved");
    }

    @PatchMapping("/volunteer/sessions/{id}/reject")
    public ResponseEntity<String> rejectSession(@PathVariable Long id, Principal p) {
        requireAdmin(p); adminService.rejectSession(id); return ResponseEntity.ok("Rejected");
    }

    @DeleteMapping("/volunteer/sessions/{id}")
    public ResponseEntity<String> deleteSession(@PathVariable Long id, Principal p) {
        requireAdmin(p); adminService.deleteSession(id); return ResponseEntity.ok("Session deleted");
    }

    // ── Badge revocation ──────────────────────────────────────────────────────

    @PatchMapping("/users/{userId}/revoke-badge")
    public ResponseEntity<String> revokeBadge(
            @PathVariable Long userId,
            @RequestParam String type,
            Principal p) {
        requireAdmin(p);
        adminService.revokeBadge(userId, type);
        return ResponseEntity.ok("Badge revoked");
    }

    // ── Skills ────────────────────────────────────────────────────────────────

    @GetMapping("/skills/categories")
    public ResponseEntity<List<AdminSkillCategoryResponse>> getCategories(Principal p) {
        requireAdmin(p); return ResponseEntity.ok(adminService.getSkillCategories());
    }

    @PostMapping("/skills/categories")
    public ResponseEntity<AdminSkillCategoryResponse> createCategory(
            @RequestBody Map<String, String> body, Principal p) {
        requireAdmin(p);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminService.createSkillCategory(body.get("name"), body.get("description"), body.get("iconKey")));
    }

    @DeleteMapping("/skills/categories/{id}")
    public ResponseEntity<String> deleteCategory(@PathVariable Long id, Principal p) {
        requireAdmin(p); adminService.deleteSkillCategory(id); return ResponseEntity.ok("Deleted");
    }

    @PostMapping("/skills/categories/{categoryId}/skills")
    public ResponseEntity<AdminSkillDto> addSkill(@PathVariable Long categoryId,
            @RequestBody Map<String, String> body, Principal p) {
        requireAdmin(p);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminService.addSkillToCategory(categoryId, body.get("skillName")));
    }

    @DeleteMapping("/skills/{skillId}")
    public ResponseEntity<String> removeSkill(@PathVariable Long skillId, Principal p) {
        requireAdmin(p); adminService.removeSkill(skillId); return ResponseEntity.ok("Removed");
    }

    // ── Notifications ─────────────────────────────────────────────────────────

    @GetMapping("/notifications/broadcasts")
    public ResponseEntity<List<AdminBroadcastResponse>> getBroadcasts(Principal p) {
        requireAdmin(p); return ResponseEntity.ok(adminService.getBroadcasts());
    }

    @PostMapping("/notifications/broadcast")
    public ResponseEntity<AdminBroadcastResponse> sendBroadcast(
            @RequestBody AdminBroadcastRequest req, Principal p) {
        requireAdmin(p);
        return ResponseEntity.ok(adminService.sendBroadcast(req.getTitle(), req.getMessage(), req.getAudience()));
    }

    @DeleteMapping("/notifications/broadcasts/{id}")
    public ResponseEntity<String> deleteBroadcast(@PathVariable Long id, Principal p) {
        requireAdmin(p); adminService.deleteBroadcast(id); return ResponseEntity.ok("Deleted");
    }

    // ── Logs ──────────────────────────────────────────────────────────────────

    @GetMapping("/logs")
    public ResponseEntity<List<AdminLogResponse>> getLogs(Principal p,
            @RequestParam(defaultValue = "") String search,
            @RequestParam(required = false) String severity) {
        requireAdmin(p); return ResponseEntity.ok(adminService.getLogs(search, severity));
    }

    // ── Admin Profile ─────────────────────────────────────────────────────────

    @PatchMapping("/profile/name")
    public ResponseEntity<String> updateName(@RequestBody Map<String, String> body, Principal p) {
        requireAdmin(p);
        adminService.updateAdminName(p.getName(), body.get("name"));
        return ResponseEntity.ok("Name updated");
    }

    @PatchMapping("/profile/password")
    public ResponseEntity<String> changePassword(@RequestBody Map<String, String> body, Principal p) {
        requireAdmin(p);
        adminService.changeAdminPassword(p.getName(), body.get("currentPassword"), body.get("newPassword"));
        return ResponseEntity.ok("Password updated");
    }

    // ── Settings ──────────────────────────────────────────────────────────────

    @GetMapping("/settings")
    public ResponseEntity<Map<String, String>> getSettings(Principal p) {
        requireAdmin(p); return ResponseEntity.ok(adminService.getSettings());
    }

    @PutMapping("/settings")
    public ResponseEntity<String> saveSettings(@RequestBody Map<String, String> settings, Principal p) {
        requireAdmin(p); adminService.saveSettings(settings); return ResponseEntity.ok("Saved");
    }

    // ── Guard ─────────────────────────────────────────────────────────────────

    private void requireAdmin(Principal principal) {
        if (principal == null || !adminEmail.equalsIgnoreCase(principal.getName()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access required");
    }
}
