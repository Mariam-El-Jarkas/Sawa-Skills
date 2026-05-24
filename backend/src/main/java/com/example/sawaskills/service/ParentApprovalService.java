package com.example.sawaskills.service;

import com.example.sawaskills.entity.*;
import com.example.sawaskills.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ParentApprovalService {

    private final ParentApprovalRepository parentApprovalRepository;
    private final SwapRequestRepository swapRequestRepository;
    private final VolunteerSessionRepository sessionRepository;
    private final VolunteerParticipantRepository participantRepository;
    private final ConversationRepository conversationRepository;
    private final VerificationRequestRepository verificationRequestRepository;
    private final EmailService emailService;
    private final NotificationService notificationService;

    /**
     * Creates a pending parental approval record and sends the email to the parent.
     * actionType: SWAP_REQUEST | SWAP_ACCEPT | SESSION_JOIN | VOLUNTEER_APPLY
     * actionId:   ID of the SwapRequest / VolunteerSession (null for VOLUNTEER_APPLY)
     * context:    Human-readable sentence shown in the email body (e.g. "with John Doe")
     * additionalData: Raw JSON or text needed to replay the action on approval (can be null)
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void requestApproval(User minor, String parentEmail, String actionType,
                                Long actionId, String context, String additionalData) {
        String token = UUID.randomUUID().toString();
        ParentApproval approval = ParentApproval.builder()
                .minorUser(minor)
                .parentEmail(parentEmail)
                .actionType(actionType)
                .actionId(actionId)
                .status("PENDING")
                .token(token)
                .additionalData(additionalData)
                .requestedAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusHours(48))
                .build();
        parentApprovalRepository.save(approval);
        emailService.sendParentActionApprovalEmail(parentEmail, minor.getName(), actionType, context, token);
    }

    /**
     * Called when a parent clicks the Approve or Decline link.
     * Handles the downstream effect for each action type.
     */
    @Transactional
    public String processDecision(String token, String decision) {
        ParentApproval approval = parentApprovalRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid or expired approval link"));

        if (!"PENDING".equals(approval.getStatus())) {
            return "This link has already been used. If you have a newer approval email, please use that link instead.";
        }
        if (approval.getExpiresAt() != null && LocalDateTime.now().isAfter(approval.getExpiresAt())) {
            approval.setStatus("EXPIRED");
            parentApprovalRepository.save(approval);
            rejectAction(approval);
            return "This approval link has expired. The action has been cancelled.";
        }

        boolean approved = "APPROVE".equalsIgnoreCase(decision);
        approval.setStatus(approved ? "APPROVED" : "DECLINED");
        approval.setApprovedAt(LocalDateTime.now());
        parentApprovalRepository.save(approval);

        if (approved) {
            String result = approveAction(approval);
            notificationService.notifyParentApproved(approval.getMinorUser(),
                    approval.getActionType(), approval.getActionId());
            return result;
        } else {
            rejectAction(approval);
            notificationService.notifyParentDeclined(approval.getMinorUser(),
                    approval.getActionType(), approval.getActionId());
            return "You have declined the request. Your child has been notified.";
        }
    }

    // ── Approve downstream action ─────────────────────────────────────────────

    private String approveAction(ParentApproval approval) {
        return switch (approval.getActionType()) {
            case "SWAP_REQUEST" -> approveSwapRequest(approval);
            case "SWAP_ACCEPT"  -> approveSwapAccept(approval);
            case "SESSION_JOIN" -> approveSessionJoin(approval);
            case "VOLUNTEER_APPLY" -> approveVolunteerApply(approval);
            default -> "Approved.";
        };
    }

    private String approveSwapRequest(ParentApproval approval) {
        SwapRequest swap = swapRequestRepository.findById(approval.getActionId())
                .orElseThrow(() -> new RuntimeException("Swap not found — it may have been cancelled."));
        if (!"PENDING_PARENT_APPROVAL".equals(swap.getStatus())) {
            throw new RuntimeException("This swap was cancelled before you approved it. No action needed.");
        }
        swap.setStatus("PENDING");
        swap.setUpdatedAt(LocalDateTime.now());
        swapRequestRepository.save(swap);
        notificationService.notifySwapRequest(swap.getReceiver(), swap.getRequester(), swap.getId());
        return "Swap request approved! It is now visible to the other user.";
    }

    private String approveSwapAccept(ParentApproval approval) {
        SwapRequest swap = swapRequestRepository.findById(approval.getActionId())
                .orElseThrow(() -> new RuntimeException("Swap not found — it may have been cancelled."));
        if (!"PENDING_PARENT_APPROVAL".equals(swap.getStatus())) {
            // Swap was cancelled before parent approved — throw so the approval token is NOT consumed
            throw new RuntimeException("This swap was cancelled before you approved it. No action needed.");
        }
        swap.setStatus("ACTIVE");
        swap.setUpdatedAt(LocalDateTime.now());
        swapRequestRepository.save(swap);
        notificationService.notifySwapAccepted(swap.getRequester(), swap.getReceiver(), swap.getId());
        return "Swap accepted! Both users can now proceed with the skill exchange.";
    }

    private String approveSessionJoin(ParentApproval approval) {
        sessionRepository.findById(approval.getActionId()).ifPresent(session -> {
            User minor = approval.getMinorUser();
            if (!participantRepository.existsBySessionIdAndParticipantId(session.getId(), minor.getId())) {
                VolunteerParticipant p = VolunteerParticipant.builder()
                        .session(session)
                        .participant(minor)
                        .build();
                participantRepository.save(p);

                if (session.getGroupChat() != null) {
                    conversationRepository.findById(session.getGroupChat().getId()).ifPresent(gc -> {
                        boolean alreadyMember = gc.getParticipants().stream()
                                .anyMatch(u -> u.getId().equals(minor.getId()));
                        if (!alreadyMember) {
                            gc.getParticipants().add(minor);
                            conversationRepository.save(gc);
                        }
                    });
                }
            }
        });
        return "Your child can now join the volunteer session!";
    }

    private String approveVolunteerApply(ParentApproval approval) {
        // additionalData format: "why|||experience|||skillsToShare"
        String data = approval.getAdditionalData() != null ? approval.getAdditionalData() : "|||";
        String[] parts = data.split("\\|\\|\\|", -1);
        String why = parts.length > 0 ? parts[0] : "";
        String experience = parts.length > 1 ? parts[1] : "";
        String skillsToShare = parts.length > 2 ? parts[2] : "";

        VerificationRequest request = VerificationRequest.builder()
                .user(approval.getMinorUser())
                .type("VOLUNTEER")
                .why(why)
                .experience(experience)
                .skillsToShare(skillsToShare)
                .status("PENDING")
                .submittedAt(LocalDateTime.now())
                .build();
        verificationRequestRepository.save(request);
        return "Volunteer application approved and submitted for admin review!";
    }

    // ── Reject downstream action ──────────────────────────────────────────────

    private void rejectAction(ParentApproval approval) {
        if (approval.getActionType() == null || approval.getActionId() == null) return;
        if ("SWAP_REQUEST".equals(approval.getActionType()) || "SWAP_ACCEPT".equals(approval.getActionType())) {
            swapRequestRepository.findById(approval.getActionId()).ifPresent(swap -> {
                if ("PENDING_PARENT_APPROVAL".equals(swap.getStatus())) {
                    swap.setStatus("REJECTED");
                    swap.setUpdatedAt(LocalDateTime.now());
                    swapRequestRepository.save(swap);
                }
            });
        }
        // SESSION_JOIN and VOLUNTEER_APPLY: nothing to undo — just leave as-is
    }
}
