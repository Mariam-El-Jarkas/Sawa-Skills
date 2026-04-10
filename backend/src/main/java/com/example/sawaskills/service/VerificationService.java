package com.example.sawaskills.service;

import com.example.sawaskills.dto.verification.VerificationSubmission;
import com.example.sawaskills.entity.User;
import com.example.sawaskills.entity.VerificationRequest;
import com.example.sawaskills.repository.UserRepository;
import com.example.sawaskills.repository.VerificationRequestRepository;
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

    @Value("${app.uploads.dir:uploads}")
    private String uploadsDir;

    @Transactional
    public void submitVerification(String email, VerificationSubmission submission) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String typeStr = submission.getType() != null ? submission.getType().toUpperCase() : "";
        log.info("SUBMISSION START: user={}, type={}", email, typeStr);

        // Check for duplicates
        verificationRequestRepository.findTopByUserIdAndTypeOrderBySubmittedAtDesc(user.getId(), typeStr)
                .ifPresent(req -> {
                    if (req.getStatus().startsWith("PENDING")) {
                        throw new RuntimeException("A verification request of this type is already pending review.");
                    }
                });

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
        if (base64 == null || base64.isBlank()) return null;
        if (base64.startsWith("/")) return base64; // Already a path

        try {
            String encoded = base64.contains(",") ? base64.split(",")[1] : base64;
            byte[] bytes = Base64.getDecoder().decode(encoded);
            String filename = prefix + "_" + UUID.randomUUID() + ".jpg";
            Path path = Paths.get(uploadsDir, "verifications", filename);
            Files.createDirectories(path.getParent());
            Files.write(path, bytes);
            return "/uploads/verifications/" + filename;
        } catch (Exception e) {
            log.error("Image save failed: {}", e.getMessage());
            return null;
        }
    }

    public List<VerificationRequest> getAllRequests() {
        return verificationRequestRepository.findAllByOrderBySubmittedAtDesc();
    }

    @Transactional
    public void updateStatus(Long id, String status) {
        VerificationRequest request = verificationRequestRepository.findById(id).orElseThrow();
        request.setStatus(status);
        if ("APPROVED".equals(status)) {
            User user = request.getUser();
            if ("ADULT".equals(request.getType()) || "MINOR".equals(request.getType())) {
                user.setVerified(true);
            }
            userRepository.save(user);
        }
        verificationRequestRepository.save(request);
    }
}