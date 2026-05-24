package com.example.sawaskills.service;

import com.example.sawaskills.dto.verification.VerificationSubmission;
import com.example.sawaskills.entity.Notification;
import com.example.sawaskills.entity.User;
import com.example.sawaskills.entity.VerificationRequest;
import com.example.sawaskills.repository.NotificationRepository;
import com.example.sawaskills.repository.UserRepository;
import com.example.sawaskills.repository.VerificationRequestRepository;
import com.example.sawaskills.util.MinorUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class VerificationService {

    private final VerificationRequestRepository verificationRequestRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final ParentApprovalService parentApprovalService;
    private final NotificationRepository notificationRepository;

    @Value("${app.uploads.dir:uploads}")
    private String uploadsDir;

    @Transactional
    public void submitVerification(String email, VerificationSubmission submission) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String typeStr = submission.getType() != null ? submission.getType().toUpperCase() : "";
        log.info("SUBMISSION START: user={}, type={}", email, typeStr);

        // Check for duplicates — skip for minor users applying for Volunteer since they
        // go through the ParentApproval gate (not a direct VerificationRequest submission).
        boolean minorApplyingForVolunteer = "VOLUNTEER".equals(typeStr)
                && MinorUtils.isMinor(user, verificationRequestRepository);
        if (!minorApplyingForVolunteer) {
            verificationRequestRepository.findTopByUserIdAndTypeOrderBySubmittedAtDesc(user.getId(), typeStr)
                    .ifPresent(req -> {
                        if (req.getStatus().startsWith("PENDING")) {
                            throw new RuntimeException("A verification request of this type is already pending review.");
                        }
                    });
        }

        if ("VOLUNTEER".equals(typeStr)) {
            boolean isAdult = verificationRequestRepository.findTopByUserIdAndTypeOrderBySubmittedAtDesc(user.getId(), "ADULT")
                    .map(req -> "APPROVED".equals(req.getStatus())).orElse(false);
            boolean isMinor = verificationRequestRepository.findTopByUserIdAndTypeOrderBySubmittedAtDesc(user.getId(), "MINOR")
                    .map(req -> "APPROVED".equals(req.getStatus())).orElse(false);
            if (!isAdult && !isMinor) {
                throw new RuntimeException("You must be a verified Minor or Adult before applying for Volunteer.");
            }
            // Minor users require parental approval before the application goes to admin
            if (isMinor && !isAdult) {
                String parentEmail = MinorUtils.parentEmail(user, verificationRequestRepository);
                String additionalData = (submission.getWhy() != null ? submission.getWhy() : "") + "|||"
                        + (submission.getExperience() != null ? submission.getExperience() : "") + "|||"
                        + (submission.getSkillsToShare() != null ? submission.getSkillsToShare() : "");
                String context = "Apply to become a Volunteer on SawaSkills";
                parentApprovalService.requestApproval(user, parentEmail, "VOLUNTEER_APPLY",
                        null, context, additionalData);
                throw new RuntimeException("PENDING_PARENT_APPROVAL:Your application has been sent to your parent for approval. Once they approve, it will be submitted for review.");
            }
        }

        LocalDate dobDate = null;
        if (submission.getDob() != null && !submission.getDob().isBlank()) {
            try {
                // Try format YYYY-MM-DD
                dobDate = LocalDate.parse(submission.getDob());
            } catch (Exception e) {
                log.warn("Failed standard DOB parse for {}, trying fallback...", submission.getDob());
                // Fallback: If it's something like DD/MM/YYYY or similar, we should handle it or just fail gracefully
                throw new RuntimeException("Invalid Date format. Use YYYY-MM-DD.");
            }
        }

        String initialStatus = "PENDING";
        String parentToken = null;

        if ("MINOR".equals(typeStr)) {
            initialStatus = "PENDING_PARENT";
            parentToken = UUID.randomUUID().toString();
        }

        VerificationRequest request = VerificationRequest.builder()
                .user(user)
                .type(typeStr)
                .fullName(submission.getFullName())
                .dob(dobDate)
                .parentEmail(submission.getParentEmail())
                .parentApprovalToken(parentToken)
                .why(submission.getWhy())
                .experience(submission.getExperience())
                .skillsToShare(submission.getSkillsToShare())
                .status(initialStatus)
                .submittedAt(LocalDateTime.now())
                .build();

        if ("ADULT".equals(typeStr)) {
            if (submission.getIdFrontImage() != null && !submission.getIdFrontImage().isBlank()) {
                request.setIdFrontImage(saveImage(submission.getIdFrontImage(), "id_front"));
            }
            if (submission.getIdBackImage() != null && !submission.getIdBackImage().isBlank()) {
                request.setIdBackImage(saveImage(submission.getIdBackImage(), "id_back"));
            }
            if (submission.getSelfieImage() != null && !submission.getSelfieImage().isBlank()) {
                request.setSelfieImage(saveImage(submission.getSelfieImage(), "selfie"));
            }

            if (request.getIdFrontImage() == null || request.getSelfieImage() == null) {
                throw new RuntimeException("Required images missing for Adult Verification.");
            }
        }

        // Backfill gender on the User if not already set (e.g. Google sign-in users)
        if (submission.getGender() != null && !submission.getGender().isBlank()
                && user.getGender() == null) {
            user.setGender(submission.getGender().toUpperCase());
            userRepository.save(user);
        }

        VerificationRequest saved = verificationRequestRepository.save(request);
        log.info("SUBMISSION SUCCESS: Request ID {} saved with status {}", saved.getId(), initialStatus);

        if ("MINOR".equals(typeStr)) {
            emailService.sendParentApprovalEmail(submission.getParentEmail(), user.getName(), parentToken);
        }
    }

    @Transactional
    public String handleParentDecision(String token, String decision) {
        VerificationRequest request = verificationRequestRepository.findByParentApprovalToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid token"));
        
        if (!"PENDING_PARENT".equals(request.getStatus())) {
            return "Already processed.";
        }

        request.setParentDecisionAt(LocalDateTime.now());
        if ("APPROVE".equalsIgnoreCase(decision)) {
            request.setStatus("PENDING_ADMIN");
            return "Parent approval confirmed. Pending admin review.";
        } else {
            request.setStatus("REJECTED");
            return "Rejected by parent.";
        }
    }

    private String saveImage(String base64, String prefix) {
        if (base64 == null || base64.isBlank()) {
            log.warn("saveImage called with null/empty base64 for {}", prefix);
            return null;
        }
        if (base64.startsWith("/")) return base64; // Already a path

        try {
            // Clean up base64 string
            String encoded = base64;
            if (base64.contains(",")) {
                encoded = base64.split(",")[1];
            }
            
            // Log a snippet of the base64 for debugging (safely)
            log.info("Decoding image for {}: length={}, prefix={}", prefix, encoded.length(), encoded.substring(0, Math.min(encoded.length(), 20)));
            
            byte[] bytes = Base64.getDecoder().decode(encoded.trim());
            String filename = prefix + "_" + UUID.randomUUID() + ".jpg";
            Path path = Paths.get(uploadsDir, "verifications", filename);
            Files.createDirectories(path.getParent());
            Files.write(path, bytes);
            
            log.info("Image saved successfully: {}", filename);
            return "/uploads/verifications/" + filename;
        } catch (IllegalArgumentException e) {
            log.error("Base64 decoding failed for {}: {}", prefix, e.getMessage());
            throw new RuntimeException("Invalid image format. Decoding failed.");
        } catch (IOException e) {
            log.error("File system error saving image {}: {}", prefix, e.getMessage());
            throw new RuntimeException("Server failed to save your image. Please check permissions.");
        } catch (Exception e) {
            log.error("Unexpected error in saveImage for {}: {}", prefix, e.getMessage());
            throw new RuntimeException("An unexpected error occurred while saving images.");
        }
    }

    public List<VerificationRequest> getAllRequests() {
        return verificationRequestRepository.findAllByOrderBySubmittedAtDesc();
    }

    @Transactional
    public void updateStatus(Long id, String status) {
        VerificationRequest request = verificationRequestRepository.findById(id).orElseThrow();
        request.setStatus(status);

        User user = request.getUser();
        String type = request.getType(); // ADULT | MINOR | VOLUNTEER

        if ("APPROVED".equals(status)) {
            if ("ADULT".equals(type) || "MINOR".equals(type)) {
                user.setVerified(true);
                userRepository.save(user);
            }
            if ("VOLUNTEER".equals(type)) {
                user.setRole("VOLUNTEER");
                userRepository.save(user);
            }
            sendVerificationNotification(user, type, true);
        } else if ("REJECTED".equals(status)) {
            sendVerificationNotification(user, type, false);
        }

        verificationRequestRepository.save(request);
    }

    private void sendVerificationNotification(User user, String type, boolean approved) {
        String notifType = approved ? "VERIFICATION_APPROVED" : "VERIFICATION_REJECTED";

        String message = switch (type) {
            case "ADULT" -> approved
                ? "🎉 Your Adult (16+) verification has been approved! You now have full access to all features."
                : "Your Adult verification was not approved. Please contact support if you believe this is a mistake.";
            case "MINOR" -> approved
                ? "✅ Your Minor verification has been approved! You now have access to all features."
                : "Your Minor verification was not approved. Please contact support for more details.";
            case "VOLUNTEER" -> approved
                ? "⭐ Congratulations! Your Volunteer application has been approved. You can now create volunteer sessions and offer free skills."
                : "Your Volunteer application was not approved at this time. You may apply again in the future.";
            default -> approved
                ? "Your verification has been approved."
                : "Your verification was not approved.";
        };

        Notification notification = Notification.builder()
                .user(user)
                .type(notifType)
                .message(message)
                .read(false)
                .createdAt(java.time.LocalDateTime.now())
                .build();

        notificationRepository.save(notification);
    }
}