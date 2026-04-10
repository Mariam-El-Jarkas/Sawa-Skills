package com.example.sawaskills.service;

import com.example.sawaskills.dto.swaps.*;
import com.example.sawaskills.entity.*;
import com.example.sawaskills.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SwapsService {

    private final SwapRequestRepository swapRequestRepository;
    private final UserRepository userRepository;
    private final ReviewRepository reviewRepository;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    // ── Create swap request ───────────────────────────────────────────────────

    @Transactional
    public SwapResponse createSwap(String email, CreateSwapRequest request) {
        User requester = findUser(email);

        if (requester.getId().equals(request.getReceiverId())) {
            throw new RuntimeException("You cannot send a swap request to yourself");
        }

        User receiver = userRepository.findById(request.getReceiverId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (swapRequestRepository.existsActiveSwapBetween(requester.getId(), receiver.getId())) {
            throw new RuntimeException("You already have an active or pending swap with this user");
        }

        SwapRequest swap = SwapRequest.builder()
                .requester(requester)
                .receiver(receiver)
                .offeredSkill(sanitize(request.getOfferedSkill()))
                .wantedSkill(sanitize(request.getWantedSkill()))
                .preferredTime(request.getPreferredTime() != null ? sanitize(request.getPreferredTime()) : null)
                .note(request.getNote() != null ? sanitize(request.getNote()) : null)
                .status("PENDING")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        swapRequestRepository.save(swap);
        return toResponse(swap, requester.getId());
    }

    // ── Get my swaps ──────────────────────────────────────────────────────────

    public List<SwapResponse> getMySwaps(String email, String statusFilter) {
        User user = findUser(email);
        List<SwapRequest> swaps;

        if (statusFilter == null || statusFilter.equalsIgnoreCase("all")) {
            swaps = swapRequestRepository.findAllByUserId(user.getId());
        } else {
            swaps = swapRequestRepository.findAllByUserIdAndStatus(user.getId(), statusFilter.toUpperCase());
        }

        return swaps.stream()
                .map(s -> toResponse(s, user.getId()))
                .collect(Collectors.toList());
    }

    // ── Accept swap ───────────────────────────────────────────────────────────

    @Transactional
    public SwapResponse acceptSwap(String email, Long swapId) {
        User user = findUser(email);
        SwapRequest swap = swapRequestRepository.findById(swapId)
                .orElseThrow(() -> new RuntimeException("Swap not found"));

        if (!swap.getReceiver().getId().equals(user.getId())) {
            throw new RuntimeException("Only the receiver can accept a swap request");
        }
        if (!"PENDING".equals(swap.getStatus())) {
            throw new RuntimeException("Only pending swaps can be accepted");
        }

        swap.setStatus("ACTIVE");
        swap.setUpdatedAt(LocalDateTime.now());
        swapRequestRepository.save(swap);
        return toResponse(swap, user.getId());
    }

    // ── Reject swap ───────────────────────────────────────────────────────────

    @Transactional
    public SwapResponse rejectSwap(String email, Long swapId) {
        User user = findUser(email);
        SwapRequest swap = swapRequestRepository.findById(swapId)
                .orElseThrow(() -> new RuntimeException("Swap not found"));

        boolean isReceiver = swap.getReceiver().getId().equals(user.getId());
        boolean isRequester = swap.getRequester().getId().equals(user.getId());

        if (!isReceiver && !isRequester) {
            throw new RuntimeException("You are not part of this swap");
        }
        if (!"PENDING".equals(swap.getStatus()) && !"ACTIVE".equals(swap.getStatus())) {
            throw new RuntimeException("This swap cannot be cancelled");
        }

        swap.setStatus("REJECTED");
        swap.setUpdatedAt(LocalDateTime.now());
        swapRequestRepository.save(swap);
        return toResponse(swap, user.getId());
    }

    // ── Rate swap ─────────────────────────────────────────────────────────────

    @Transactional
    public void rateSwap(String email, Long swapId, RatingRequest request) {
        User reviewer = findUser(email);
        SwapRequest swap = swapRequestRepository.findById(swapId)
                .orElseThrow(() -> new RuntimeException("Swap not found"));

        boolean isParticipant = swap.getRequester().getId().equals(reviewer.getId())
                || swap.getReceiver().getId().equals(reviewer.getId());
        if (!isParticipant) {
            throw new RuntimeException("You are not part of this swap");
        }
        if (!"ACTIVE".equals(swap.getStatus()) && !"COMPLETED".equals(swap.getStatus())) {
            throw new RuntimeException("You can only rate active or completed swaps");
        }

        // Determine the other user
        User reviewedUser = swap.getRequester().getId().equals(reviewer.getId())
                ? swap.getReceiver()
                : swap.getRequester();

        if (reviewRepository.existsByReviewerIdAndReviewedUserId(reviewer.getId(), reviewedUser.getId())) {
            throw new RuntimeException("You have already rated this user for this swap");
        }

        Review review = Review.builder()
                .reviewer(reviewer)
                .reviewedUser(reviewedUser)
                .rating(request.getRating())
                .comment(request.getComment() != null ? sanitize(request.getComment()) : null)
                .createdAt(LocalDateTime.now())
                .build();
        reviewRepository.save(review);

        // Mark swap as completed once both parties have rated
        if (bothPartiesRated(swap)) {
            swap.setStatus("COMPLETED");
            swap.setUpdatedAt(LocalDateTime.now());
            swapRequestRepository.save(swap);
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private boolean bothPartiesRated(SwapRequest swap) {
        return reviewRepository.existsByReviewerIdAndReviewedUserId(
                        swap.getRequester().getId(), swap.getReceiver().getId())
                && reviewRepository.existsByReviewerIdAndReviewedUserId(
                        swap.getReceiver().getId(), swap.getRequester().getId());
    }

    private SwapResponse toResponse(SwapRequest swap, Long currentUserId) {
        boolean isRequester = swap.getRequester().getId().equals(currentUserId);
        User other = isRequester ? swap.getReceiver() : swap.getRequester();

        String initials = other.getName() == null ? "??" :
                Arrays.stream(other.getName().split(" "))
                        .map(w -> String.valueOf(w.charAt(0)).toUpperCase())
                        .limit(2)
                        .collect(Collectors.joining());

        return SwapResponse.builder()
                .id(swap.getId())
                .status(swap.getStatus() != null ? swap.getStatus().toLowerCase() : "pending")
                .date(swap.getCreatedAt() != null ? swap.getCreatedAt().format(DATE_FMT) : null)
                .otherUserId(other.getId())
                .otherUserName(other.getName())
                .otherUserInitials(initials)
                .theyOffer(isRequester ? swap.getWantedSkill() : swap.getOfferedSkill())
                .youOffer(isRequester ? swap.getOfferedSkill() : swap.getWantedSkill())
                .note(swap.getNote())
                .preferredTime(swap.getPreferredTime())
                .isRequester(isRequester)
                .build();
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private String sanitize(String input) {
        if (input == null) return null;
        return input.trim().replaceAll("<[^>]*>", "");
    }
}
