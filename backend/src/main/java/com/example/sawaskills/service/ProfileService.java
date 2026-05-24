package com.example.sawaskills.service;

import com.example.sawaskills.dto.profile.*;
import com.example.sawaskills.entity.*;
import com.example.sawaskills.repository.*;
import com.example.sawaskills.util.OtpGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProfileService {
    private final jakarta.persistence.EntityManager entityManager;

    // Injected via field — @Value cannot be used with @RequiredArgsConstructor (non-final field)
    @Value("${app.uploads.dir:uploads}")
    private String uploadsDir;

    private final UserRepository userRepository;
    private final ReviewRepository reviewRepository;
    private final SwapRequestRepository swapRequestRepository;
    private final VolunteerApplicationRepository volunteerApplicationRepository;
    private final EmailChangeRequestRepository emailChangeRequestRepository;
    private final UserSkillRepository userSkillRepository;
    private final ConnectionRepository connectionRepository;
    private final SupportRequestRepository supportRequestRepository;
    private final VerificationRequestRepository verificationRequestRepository;
    private final LocationRepository locationRepository;
    private final EmailService emailService;
    private final NotificationService notificationService;
    private final PasswordEncoder passwordEncoder;

    // ── Phase 1: Get full profile ─────────────────────────────────────────────

    public ProfileResponse getMyProfile(String email) {
        User user = findUser(email);

        long reviewCount = reviewRepository.countByReviewedUserId(user.getId());
        double avgRating = reviewRepository
                .findAvgRatingByReviewedUserId(user.getId())
                .orElse(0.0);
        long swapCount = swapRequestRepository.countCompletedSwapsByUserId(user.getId());

        List<ReviewDto> reviews = reviewRepository
                .findByReviewedUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(r -> ReviewDto.builder()
                        .id(r.getId())
                        .reviewerName(r.getReviewer() != null ? r.getReviewer().getName() : "Anonymous")
                        .rating(r.getRating())
                        .comment(r.getComment())
                        .createdAt(r.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        List<ProfileResponse.SkillItem> offeredSkills = userSkillRepository
                .findByUserIdAndOffering(user.getId(), true)
                .stream()
                .map(us -> ProfileResponse.SkillItem.builder().id(us.getId()).name(us.getSkill().getSkillName()).build())
                .collect(Collectors.toList());

        List<ProfileResponse.SkillItem> wantedSkills = userSkillRepository
                .findByUserIdAndOffering(user.getId(), false)
                .stream()
                .map(us -> ProfileResponse.SkillItem.builder().id(us.getId()).name(us.getSkill().getSkillName()).build())
                .collect(Collectors.toList());

        List<ConnectionDto> connections = connectionRepository
                .findAcceptedByUserId(user.getId())
                .stream()
                .map(conn -> {
                    User other = conn.getRequester().getId().equals(user.getId())
                            ? conn.getReceiver()
                            : conn.getRequester();
                    List<String> otherSkills = userSkillRepository
                            .findByUserIdAndOffering(other.getId(), true)
                            .stream()
                            .map(us -> us.getSkill().getSkillName())
                            .collect(Collectors.toList());
                    String initials = other.getName() == null ? "??" :
                            java.util.Arrays.stream(other.getName().split(" "))
                                    .map(w -> String.valueOf(w.charAt(0)).toUpperCase())
                                    .limit(2)
                                    .collect(Collectors.joining());
                    return ConnectionDto.builder()
                            .id(conn.getId())
                            .otherUserId(other.getId())
                            .otherUserName(other.getName())
                            .avatarInitials(initials)
                            .skills(otherSkills)
                            .build();
                })
                .collect(Collectors.toList());

        String location = user.getLocation() != null ? user.getLocation().getCity() : null;

        return ProfileResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhoneNumber())
                .bio(user.getBio())
                .profilePicture(user.getProfilePicture())
                .location(location)
                .avgRating(Math.round(avgRating * 10.0) / 10.0)
                .reviewCount(reviewCount)
                .swapCount(swapCount)
                .volunteerStatus(getVolunteerStatus(user))
                .ageVerificationStatus(getAgeVerificationStatus(user))
                .isAgeVerified(isAdultVerified(user))
                .isMinorVerified(isMinorVerified(user))
                .isVolunteer(isVolunteer(user))
                .publicProfile(user.isPublicProfile())
                .swapNotifications(user.isSwapNotificationsEnabled())
                .messageNotifications(user.isMessageNotificationsEnabled())
                .skillNewsNotifications(user.isSkillNewsNotificationsEnabled())
                .reviews(reviews)
                .offeredSkills(offeredSkills)
                .wantedSkills(wantedSkills)
                .connections(connections)
                .build();
    }

    // ── Update privacy settings ───────────────────────────────────────────────

    @Transactional
    public void updatePrivacy(String email, boolean publicProfile,
                              boolean swapNotifications, boolean messageNotifications,
                              boolean skillNewsNotifications) {
        User user = findUser(email);
        user.setPublicProfile(publicProfile);
        user.setSwapNotificationsEnabled(swapNotifications);
        user.setMessageNotificationsEnabled(messageNotifications);
        user.setSkillNewsNotificationsEnabled(skillNewsNotifications);
        userRepository.save(user);
    }

    // ── Phase 1: Update bio ───────────────────────────────────────────────────

    @Transactional
    public void updateBio(String email, String bio) {
        User user = findUser(email);
        user.setBio(bio);
        userRepository.save(user);
    }

    // ── Phase 1: Update phone number ─────────────────────────────────────────

    @Transactional
    public void updateContact(String email, UpdateContactRequest request) {
        User user = findUser(email);
        if (request.getPhone() != null) {
            user.setPhoneNumber(request.getPhone());
        }
        userRepository.save(user);
    }

    // ── Phase 1: Apply for volunteer badge ────────────────────────────────────

    @Transactional
    public void applyForVolunteer(String email, VolunteerApplicationRequest request) {
        User user = findUser(email);
        if (volunteerApplicationRepository.existsByApplicantId(user.getId())) {
            throw new RuntimeException("You have already submitted a volunteer application");
        }
        VolunteerApplication application = VolunteerApplication.builder()
                .applicant(user)
                .status("PENDING")
                .why(request.getWhy())
                .experience(request.getExperience())
                .skillsToShare(request.getSkillsToShare())
                .submittedAt(LocalDateTime.now())
                .build();
        volunteerApplicationRepository.save(application);
    }

    // ── Phase 3: Upload / replace profile picture (saved to disk) ────────────

    @Transactional
    public String uploadProfilePicture(String email, String imageBase64) {
        if (!imageBase64.startsWith("data:image/")) {
            throw new RuntimeException("Invalid image format. Must be a base64 data URL.");
        }

        String[] parts = imageBase64.split(",", 2);
        if (parts.length != 2) {
            throw new RuntimeException("Malformed image data.");
        }

        byte[] imageBytes;
        try {
            imageBytes = Base64.getDecoder().decode(parts[1]);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Image data is not valid base64.");
        }

        if (imageBytes.length > 2_000_000) {
            throw new RuntimeException("Image too large. Please use an image under 2 MB.");
        }

        User user = findUser(email);
        String ext = imageBase64.startsWith("data:image/png") ? "png" : "jpg";
        String filename = "user_" + user.getId() + "." + ext;

        try {
            Path dir = Paths.get(uploadsDir, "profile-pictures");
            Files.createDirectories(dir);
            Files.write(dir.resolve(filename), imageBytes);
        } catch (Exception e) {
            throw new RuntimeException("Failed to save profile picture: " + e.getMessage());
        }

        String pictureUrl = "/uploads/profile-pictures/" + filename;
        user.setProfilePicture(pictureUrl);
        userRepository.save(user);
        return pictureUrl;
    }

    @Transactional
    public void removeProfilePicture(String email) {
        User user = findUser(email);
        user.setProfilePicture(null);
        userRepository.save(user);
    }

    // ── Phase 2: Request email change — sends OTP to the NEW email ────────────

    @Transactional
    public void requestEmailChange(String currentEmail, String newEmail) {
        if (userRepository.existsByEmail(newEmail)) {
            throw new RuntimeException("This email address is already in use");
        }
        if (currentEmail.equalsIgnoreCase(newEmail)) {
            throw new RuntimeException("New email must be different from the current one");
        }

        emailChangeRequestRepository.invalidateAllByCurrentEmail(currentEmail);

        String otpCode = OtpGenerator.generateOtp();
        EmailChangeRequest changeRequest = EmailChangeRequest.builder()
                .currentEmail(currentEmail)
                .pendingEmail(newEmail)
                .otpHash(passwordEncoder.encode(otpCode))
                .verificationStep(EmailChangeRequest.VerificationStep.VERIFY_CURRENT)
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .createdAt(LocalDateTime.now())
                .used(false)
                .build();
        emailChangeRequestRepository.save(changeRequest);

        // First step: Send OTP to CURRENT email to verify identity
        emailService.sendConfirmIdentityOtp(currentEmail, otpCode);
    }

    @Transactional
    public void verifyCurrentEmail(String currentEmail, String otp) {
        EmailChangeRequest request = emailChangeRequestRepository
                .findTopByCurrentEmailOrderByCreatedAtDesc(currentEmail)
                .orElseThrow(() -> new RuntimeException("No email change request found"));

        if (request.getVerificationStep() != EmailChangeRequest.VerificationStep.VERIFY_CURRENT) {
            throw new RuntimeException("Invalid verification step");
        }
        if (request.isUsed() || request.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Verification code expired or already used");
        }
        if (!passwordEncoder.matches(otp, request.getOtpHash())) {
            throw new RuntimeException("Invalid verification code");
        }

        // Identity verified. Now move to phase 2: Verify NEW email
        String nextOtp = OtpGenerator.generateOtp();
        request.setOtpHash(passwordEncoder.encode(nextOtp));
        request.setVerificationStep(EmailChangeRequest.VerificationStep.VERIFY_NEW);
        request.setExpiresAt(LocalDateTime.now().plusMinutes(15)); // Give more time for the second inbox check
        emailChangeRequestRepository.save(request);

        emailService.sendEmailChangeOtp(request.getPendingEmail(), nextOtp);
    }

    // ── Phase 2: Confirm email change with OTP ────────────────────────────────

    @Transactional
    public String confirmEmailChange(String currentEmail, String otp) {
        EmailChangeRequest request = emailChangeRequestRepository
                .findTopByCurrentEmailOrderByCreatedAtDesc(currentEmail)
                .orElseThrow(() -> new RuntimeException("No email change request found. Please request a new code."));

        if (request.getVerificationStep() != EmailChangeRequest.VerificationStep.VERIFY_NEW) {
            throw new RuntimeException("Must verify current email first");
        }
        if (request.isUsed()) {
            throw new RuntimeException("This code has already been used");
        }
        if (request.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Code has expired. Please request a new one.");
        }
        if (!passwordEncoder.matches(otp, request.getOtpHash())) {
            throw new RuntimeException("Invalid code");
        }

        User user = findUser(currentEmail);
        String newEmail = request.getPendingEmail();
        user.setEmail(newEmail);
        userRepository.save(user);

        request.setUsed(true);
        emailChangeRequestRepository.save(request);

        return newEmail;
    }

    @Transactional
    public void submitSupportRequest(String username, com.example.sawaskills.dto.profile.SupportRequest requestDto, String ipAddress) {
        User user = findUser(username);

        // 1. Save proof image to disk if provided
        String proofPath = null;
        if (requestDto.getAdditionalProof() != null && !requestDto.getAdditionalProof().isEmpty()) {
            proofPath = saveSupportProofImage(user.getId(), requestDto.getAdditionalProof());
        }

        // 2. Persist to Database
        com.example.sawaskills.entity.SupportRequest entity = com.example.sawaskills.entity.SupportRequest.builder()
                .requester(user)
                .oldEmail(requestDto.getOldEmail())
                .newEmail(requestDto.getNewEmail())
                .issueDescription(requestDto.getIssueDescription())
                .joinDate(requestDto.getJoinDate())
                .location(requestDto.getLocation())
                .usedFeatures(requestDto.getUsedFeatures())
                .additionalProofPath(proofPath)
                .ipAddress(ipAddress)
                .status("PENDING")
                .createdAt(LocalDateTime.now())
                .build();
        supportRequestRepository.save(entity);

        // 3. Notify Support Team (Email)
        emailService.sendSupportRequestEmail(requestDto, ipAddress);
        
        // 4. Send confirmation to the NEW email address (Verification Step)
        emailService.sendRecoveryConfirmationEmail(requestDto.getNewEmail());
    }

    private String saveSupportProofImage(Long userId, String base64) {
        try {
            if (!base64.startsWith("data:image/")) return null;
            String[] parts = base64.split(",", 2);
            if (parts.length < 2) return null;
            byte[] bytes = Base64.getDecoder().decode(parts[1]);

            String filename = "recovery_proof_" + userId + "_" + System.currentTimeMillis() + ".jpg";
            Path dir = Paths.get(uploadsDir, "recovery-proofs");
            Files.createDirectories(dir);
            Files.write(dir.resolve(filename), bytes);
            return "/uploads/recovery-proofs/" + filename;
        } catch (Exception e) {
            return null; // Silent fail for image saving, don't block the request
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private boolean isAdultVerified(User user) {
        return verificationRequestRepository.findTopByUserIdAndTypeOrderBySubmittedAtDesc(user.getId(), "ADULT")
                .map(req -> "APPROVED".equals(req.getStatus()))
                .orElse(false);
    }

    private boolean isMinorVerified(User user) {
        return verificationRequestRepository.findTopByUserIdAndTypeOrderBySubmittedAtDesc(user.getId(), "MINOR")
                .map(req -> "APPROVED".equals(req.getStatus()))
                .orElse(false);
    }

    private boolean isVolunteer(User user) {
        return verificationRequestRepository.findTopByUserIdAndTypeOrderBySubmittedAtDesc(user.getId(), "VOLUNTEER")
                .map(req -> "APPROVED".equals(req.getStatus()))
                .orElse(false);
    }

    private String getVolunteerStatus(User user) {
        return verificationRequestRepository.findTopByUserIdAndTypeOrderBySubmittedAtDesc(user.getId(), "VOLUNTEER")
                .map(VerificationRequest::getStatus)
                .orElse(null);
    }

    private String getAgeVerificationStatus(User user) {
        // Check for either Adult or Minor pending/approved status
        return verificationRequestRepository.findAll().stream()
                .filter(req -> req.getUser().getId().equals(user.getId()))
                .filter(req -> "ADULT".equals(req.getType()) || "MINOR".equals(req.getType()))
                .sorted((a, b) -> b.getSubmittedAt().compareTo(a.getSubmittedAt()))
                .findFirst()
                .map(VerificationRequest::getStatus)
                .orElse(null);
    }
    @Transactional(readOnly = true)
    public boolean checkSupportTableExists() {
        try {
            String sql = "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'support_requests'";
            Number count = (Number) entityManager.createNativeQuery(sql).getSingleResult();
            return count.intValue() > 0;
        } catch (Exception e) {
            return false;
        }
    }

    // ── Public profile (view another user) ───────────────────────────────────

    public ProfileResponse getPublicProfile(Long userId, String viewerEmail) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getDeletedAt() != null) throw new RuntimeException("User not found");

        double avgRating = reviewRepository
                .findAvgRatingByReviewedUserId(user.getId())
                .orElse(0.0);
        long reviewCount = reviewRepository.countByReviewedUserId(user.getId());
        long swapCount = swapRequestRepository.countCompletedSwapsByUserId(user.getId());

        // Only return reviews if profile is public
        List<ReviewDto> reviews = user.isPublicProfile()
                ? reviewRepository.findByReviewedUserIdOrderByCreatedAtDesc(user.getId())
                        .stream()
                        .map(r -> ReviewDto.builder()
                                .id(r.getId())
                                .reviewerName(r.getReviewer() != null ? r.getReviewer().getName() : "Anonymous")
                                .rating(r.getRating())
                                .comment(r.getComment())
                                .createdAt(r.getCreatedAt())
                                .build())
                        .collect(Collectors.toList())
                : java.util.Collections.emptyList();

        List<ProfileResponse.SkillItem> offeredSkills = userSkillRepository
                .findByUserIdAndOffering(user.getId(), true)
                .stream()
                .map(us -> ProfileResponse.SkillItem.builder().id(us.getId()).name(us.getSkill().getSkillName()).build())
                .collect(Collectors.toList());

        List<ProfileResponse.SkillItem> wantedSkills = userSkillRepository
                .findByUserIdAndOffering(user.getId(), false)
                .stream()
                .map(us -> ProfileResponse.SkillItem.builder().id(us.getId()).name(us.getSkill().getSkillName()).build())
                .collect(Collectors.toList());

        List<ConnectionDto> connections = connectionRepository
                .findAcceptedByUserId(user.getId())
                .stream()
                .map(conn -> {
                    User other = conn.getRequester().getId().equals(user.getId())
                            ? conn.getReceiver()
                            : conn.getRequester();
                    List<String> otherSkills = userSkillRepository
                            .findByUserIdAndOffering(other.getId(), true)
                            .stream()
                            .map(us -> us.getSkill().getSkillName())
                            .collect(Collectors.toList());
                    String initials = other.getName() == null ? "??" :
                            java.util.Arrays.stream(other.getName().split(" "))
                                    .map(w -> String.valueOf(w.charAt(0)).toUpperCase())
                                    .limit(2)
                                    .collect(Collectors.joining());
                    return ConnectionDto.builder()
                            .id(conn.getId())
                            .otherUserId(other.getId())
                            .otherUserName(other.getName())
                            .avatarInitials(initials)
                            .skills(otherSkills)
                            .build();
                })
                .collect(Collectors.toList());

        // ── Connection status between viewer and this profile ─────────────────
        String connectionStatus = "NONE";
        Long connectionId = null;
        if (viewerEmail != null) {
            java.util.Optional<User> viewerOpt = userRepository.findByEmail(viewerEmail);
            if (viewerOpt.isPresent() && !viewerOpt.get().getId().equals(userId)) {
                User viewer = viewerOpt.get();
                java.util.Optional<Connection> conn = connectionRepository.findByUserId(viewer.getId())
                        .stream()
                        .filter(c -> c.getRequester().getId().equals(userId) || c.getReceiver().getId().equals(userId))
                        .findFirst();
                if (conn.isPresent()) {
                    Connection c = conn.get();
                    if ("ACCEPTED".equals(c.getStatus())) {
                        connectionStatus = "CONNECTED";
                        connectionId = c.getId();
                    } else if ("PENDING".equals(c.getStatus())) {
                        if (c.getRequester().getId().equals(viewer.getId())) {
                            connectionStatus = "PENDING_SENT";
                            connectionId = c.getId();
                        } else {
                            connectionStatus = "PENDING_RECEIVED";
                            connectionId = c.getId();
                        }
                    }
                }
            }
        }
        final String finalConnectionStatus = connectionStatus;
        final Long finalConnectionId = connectionId;

        return ProfileResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .bio(user.getBio())
                .profilePicture(user.getProfilePicture())
                .avgRating(Math.round(avgRating * 10.0) / 10.0)
                .reviewCount(reviewCount)
                .swapCount(swapCount)
                .isAgeVerified(isAdultVerified(user))
                .isMinorVerified(isMinorVerified(user))
                .isVolunteer(isVolunteer(user))
                .publicProfile(user.isPublicProfile())
                .reviews(reviews)
                .offeredSkills(offeredSkills)
                .wantedSkills(wantedSkills)
                .connections(connections)
                .connectionStatus(finalConnectionStatus)
                .connectionId(finalConnectionId)
                .build();
    }

    // ── Location management ───────────────────────────────────────────────────

    public List<java.util.Map<String, Object>> getLocations() {
        return locationRepository.findAll().stream()
                .map(l -> {
                    java.util.Map<String, Object> m = new java.util.LinkedHashMap<>();
                    m.put("id", l.getId());
                    m.put("city", l.getCity());
                    return m;
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public void updateLocation(String email, String city) {
        User user = findUser(email);
        Location loc = locationRepository.findByCity(city)
                .orElseGet(() -> locationRepository.save(
                        Location.builder().city(city).region("Lebanon").build()
                ));
        user.setLocation(loc);
        userRepository.save(user);
    }

    @Transactional
    public void deleteAccount(String email) {
        User user = findUser(email);

        // ── Invalidate active credentials so no one can log in again ─────────
        // otp_verifications and password_reset_tokens store email, not user_id
        entityManager.createNativeQuery("DELETE FROM otp_verifications WHERE email = :email")
                .setParameter("email", email).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM password_reset_tokens WHERE email = :email")
                .setParameter("email", email).executeUpdate();
        nq("DELETE FROM auth_providers WHERE user_id = :uid", user.getId());
        nq("UPDATE exchange_listings SET active = false WHERE owner_id = :uid", user.getId());

        // ── Anonymise the user row — replace PII with random/blank values ────
        // A random email is used so the column remains UNIQUE and non-null,
        // all existing FK relations stay valid without any cascade deletes.
        String randomEmail = "deleted_" + java.util.UUID.randomUUID() + "@deleted.sawaskills.com";
        user.setEmail(randomEmail);
        user.setDeletedEmailHash(hashEmail(email));   // hash of real email for audit/GDPR proof
        user.setName("Deleted User");
        user.setPhoneNumber(null);
        user.setBio(null);
        user.setProfilePicture(null);
        user.setDob(null);
        user.setRole("DELETED");
        user.setPublicProfile(false);
        user.setAllowMessages(false);
        user.setDeletedAt(java.time.LocalDateTime.now());
        userRepository.save(user);

        // Everything else (posts, comments, likes, swaps, reviews, messages…)
        // is kept as-is — it now appears under "Deleted User" with no PII.
    }

    /** Shorthand for executing a native DELETE/UPDATE with a single :uid parameter. */
    private void nq(String sql, Long uid) {
        entityManager.createNativeQuery(sql).setParameter("uid", uid).executeUpdate();
    }

    private String hashEmail(String email) {
        try {
            java.security.MessageDigest md = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(email.toLowerCase().trim().getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (java.security.NoSuchAlgorithmException e) {
            return java.util.UUID.randomUUID().toString();
        }
    }

    @Transactional
    public void sendConnectionRequest(String requesterEmail, Long receiverId) {
        User requester = findUser(requesterEmail);
        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new RuntimeException("Receiver not found"));

        if (requester.getId().equals(receiverId)) {
            throw new RuntimeException("You cannot connect with yourself");
        }

        // Check if connection already exists
        List<Connection> existing = connectionRepository.findByUserId(requester.getId());
        boolean alreadyExists = existing.stream()
                .anyMatch(c -> c.getRequester().getId().equals(receiverId) || c.getReceiver().getId().equals(receiverId));
        
        if (alreadyExists) {
            throw new RuntimeException("Connection request already exists or you are already connected");
        }

        Connection connection = Connection.builder()
                .requester(requester)
                .receiver(receiver)
                .status("PENDING")
                .createdAt(LocalDateTime.now())
                .build();
        connection = connectionRepository.save(connection);

        notificationService.notifyConnectionRequest(receiver, requester, connection.getId());
    }

    @Transactional
    public void approveConnection(String email, Long connectionId) {
        User user = findUser(email);
        Connection connection = connectionRepository.findById(connectionId)
                .orElseThrow(() -> new RuntimeException("Connection request not found"));

        if (!connection.getReceiver().getId().equals(user.getId())) {
            throw new RuntimeException("You can only approve connection requests sent to you");
        }

        connection.setStatus("ACCEPTED");
        connectionRepository.save(connection);

        notificationService.notifyConnectionAccepted(connection.getRequester(), user);
    }

    @Transactional
    public void removeConnection(String email, Long connectionId) {
        User user = findUser(email);
        Connection connection = connectionRepository.findById(connectionId)
                .orElseThrow(() -> new RuntimeException("Connection not found"));

        if (!connection.getReceiver().getId().equals(user.getId()) &&
            !connection.getRequester().getId().equals(user.getId())) {
            throw new RuntimeException("You can only remove your own connections");
        }

        connectionRepository.delete(connection);
    }
}
