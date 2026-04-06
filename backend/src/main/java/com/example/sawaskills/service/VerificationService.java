package com.example.sawaskills.service;

import com.example.sawaskills.dto.verification.MinorVerificationRequest;
import com.example.sawaskills.entity.ParentApproval;
import com.example.sawaskills.entity.User;
import com.example.sawaskills.repository.ParentApprovalRepository;
import com.example.sawaskills.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class VerificationService {

    private final UserRepository userRepository;
    private final ParentApprovalRepository parentApprovalRepository;
    private final EmailService emailService;

    public String requestMinorVerification(Long userId, MinorVerificationRequest request) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String token = UUID.randomUUID().toString();

        ParentApproval approval = ParentApproval.builder()
                .minorUser(user)
                .parentEmail(request.getParentEmail())
                .token(token)
                .status("PENDING")
                .requestedAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusHours(24))
                .build();

        parentApprovalRepository.save(approval);

        emailService.sendParentApprovalEmail(request.getParentEmail(), token);

        return "Parent approval email sent";
    }

    public String approveMinor(String token) {

        ParentApproval approval = parentApprovalRepository
                .findAll()
                .stream()
                .filter(a -> a.getToken().equals(token))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Invalid approval token"));

        if (approval.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Approval token expired");
        }

        approval.setStatus("APPROVED");
        approval.setApprovedAt(LocalDateTime.now());

        parentApprovalRepository.save(approval);

        User user = approval.getMinorUser();

        user.setVerified(true);
        user.setRole("MINOR");

        userRepository.save(user);

        return "Minor account approved successfully";
    }
}