package com.example.sawaskills.controller;

import com.example.sawaskills.dto.profile.*;
import com.example.sawaskills.service.ProfileService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    // ── GET /api/profile/me ───────────────────────────────────────────────────

    @GetMapping("/me")
    public ResponseEntity<ProfileResponse> getMyProfile(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(profileService.getMyProfile(userDetails.getUsername()));
    }

    // ── GET /api/profile/{id} ─────────────────────────────────────────────────

    @GetMapping("/{id}")
    public ResponseEntity<ProfileResponse> getPublicProfile(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        String viewerEmail = userDetails != null ? userDetails.getUsername() : null;
        return ResponseEntity.ok(profileService.getPublicProfile(id, viewerEmail));
    }

    // ── PATCH /api/profile/privacy ────────────────────────────────────────────

    @PatchMapping("/privacy")
    public ResponseEntity<Void> updatePrivacy(
            @RequestBody UpdatePrivacyRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        profileService.updatePrivacy(
                userDetails.getUsername(),
                request.isPublicProfile(),
                request.isSwapNotifications(),
                request.isMessageNotifications(),
                request.isSkillNewsNotifications());
        return ResponseEntity.ok().build();
    }

    // ── PATCH /api/profile/bio ────────────────────────────────────────────────

    @PatchMapping("/bio")
    public ResponseEntity<Map<String, String>> updateBio(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdateBioRequest request) {
        profileService.updateBio(userDetails.getUsername(), request.getBio());
        return ResponseEntity.ok(Map.of("message", "Bio updated successfully"));
    }

    // ── PATCH /api/profile/contact ────────────────────────────────────────────

    @PatchMapping("/contact")
    public ResponseEntity<Map<String, String>> updateContact(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdateContactRequest request) {
        profileService.updateContact(userDetails.getUsername(), request);
        return ResponseEntity.ok(Map.of("message", "Contact updated successfully"));
    }

    // ── POST /api/profile/picture ─────────────────────────────────────────────

    @PostMapping("/picture")
    public ResponseEntity<Map<String, String>> uploadPicture(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdatePictureRequest request) {
        String url = profileService.uploadProfilePicture(userDetails.getUsername(), request.getImageBase64());
        return ResponseEntity.ok(Map.of("pictureUrl", url));
    }

    @DeleteMapping("/picture")
    public ResponseEntity<Map<String, String>> removePicture(
            @AuthenticationPrincipal UserDetails userDetails) {
        profileService.removeProfilePicture(userDetails.getUsername());
        return ResponseEntity.ok(Map.of("message", "Profile picture removed successfully"));
    }

    // ── POST /api/profile/volunteer ───────────────────────────────────────────

    @PostMapping("/volunteer")
    public ResponseEntity<Map<String, String>> applyForVolunteer(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody VolunteerApplicationRequest request) {
        profileService.applyForVolunteer(userDetails.getUsername(), request);
        return ResponseEntity.ok(Map.of("message", "Volunteer application submitted"));
    }

    // ── POST /api/profile/contact/request-email-change ───────────────────────

    @PostMapping("/contact/request-email-change")
    public ResponseEntity<Map<String, String>> requestEmailChange(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody RequestEmailChangeRequest request) {
        profileService.requestEmailChange(userDetails.getUsername(), request.getNewEmail());
        return ResponseEntity.ok(Map.of("message", "A verification code has been sent to your CURRENT email address to confirm your identity."));
    }

    @PostMapping("/contact/verify-current-email")
    public ResponseEntity<Map<String, String>> verifyCurrentEmail(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ConfirmEmailChangeRequest request) {
        profileService.verifyCurrentEmail(userDetails.getUsername(), request.getOtp());
        return ResponseEntity.ok(Map.of("message", "Identity confirmed. Now please verify the code sent to your NEW email address."));
    }

    // ── POST /api/profile/contact/confirm-email-change ───────────────────────

    @PostMapping("/contact/confirm-email-change")
    public ResponseEntity<Map<String, String>> confirmEmailChange(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ConfirmEmailChangeRequest request) {
        String newEmail = profileService.confirmEmailChange(userDetails.getUsername(), request.getOtp());
        return ResponseEntity.ok(Map.of(
                "message", "Email updated successfully. Please log in again with your new email.",
                "newEmail", newEmail
        ));
    }

    @PostMapping("/support/recovery")
    public ResponseEntity<Map<String, String>> submitSupportRequest(
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest request,
            @Valid @RequestBody com.example.sawaskills.dto.profile.SupportRequest supportDto) {
        String clientIp = request.getRemoteAddr();
        profileService.submitSupportRequest(userDetails.getUsername(), supportDto, clientIp);
        return ResponseEntity.ok(Map.of("message", "Recovery request submitted successfully. Our team will review it within 24 hours."));
    }

    // ── GET /api/profile/locations ────────────────────────────────────────────

    @GetMapping("/locations")
    public ResponseEntity<List<Map<String, Object>>> getLocations() {
        return ResponseEntity.ok(profileService.getLocations());
    }

    // ── PATCH /api/profile/location ───────────────────────────────────────────

    @PatchMapping("/location")
    public ResponseEntity<Map<String, String>> updateLocation(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, String> body) {
        String city = body.get("city");
        if (city == null || city.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "city is required"));
        }
        profileService.updateLocation(userDetails.getUsername(), city.trim());
        return ResponseEntity.ok(Map.of("message", "Location updated successfully"));
    }

    // ── Connection Requests ──────────────────────────────────────────────────

    @PostMapping("/{id}/connect")
    public ResponseEntity<Map<String, String>> sendConnectionRequest(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        profileService.sendConnectionRequest(userDetails.getUsername(), id);
        return ResponseEntity.ok(Map.of("message", "Connection request sent"));
    }

    @PostMapping("/connections/{id}/approve")
    public ResponseEntity<Map<String, String>> approveConnection(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        profileService.approveConnection(userDetails.getUsername(), id);
        return ResponseEntity.ok(Map.of("message", "Connection approved"));
    }

    @DeleteMapping("/connections/{id}")
    public ResponseEntity<Void> removeConnection(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        profileService.removeConnection(userDetails.getUsername(), id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping
    public ResponseEntity<Map<String, String>> deleteAccount(
            @AuthenticationPrincipal UserDetails userDetails) {
        profileService.deleteAccount(userDetails.getUsername());
        return ResponseEntity.ok(Map.of("message", "Account deleted successfully"));
    }

    @GetMapping("/diagnostic/check-table")
    public ResponseEntity<Map<String, Object>> checkTable() {
        boolean exists = profileService.checkSupportTableExists();
        return ResponseEntity.ok(Map.of("tableName", "support_requests", "exists", exists));
    }
}
