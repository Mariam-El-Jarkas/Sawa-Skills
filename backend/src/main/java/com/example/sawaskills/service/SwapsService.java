package com.example.sawaskills.service;

import com.example.sawaskills.dto.swaps.*;
import com.example.sawaskills.entity.*;
import com.example.sawaskills.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.sawaskills.util.StringUtils;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageRequest;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SwapsService {

    private final SwapRequestRepository swapRequestRepository;
    private final UserRepository userRepository;
    private final ReviewRepository reviewRepository;
    private final ExchangeListingRepository exchangeListingRepository;
    private final RateLimiterService rateLimiterService;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final int MAX_SWAPS_PER_REQUEST = 100;

    // ── Create swap request ───────────────────────────────────────────────────

    @Transactional
    public SwapResponse createSwap(String email, CreateSwapRequest request) {
        User requester = findUser(email);
        rateLimiterService.checkLimit("swap-create:" + email);

        if (requester.getId().equals(request.getReceiverId())) {
            throw new RuntimeException("You cannot send a swap request to yourself");
        }

        User receiver = userRepository.findById(request.getReceiverId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (swapRequestRepository.existsActiveSwapBetween(requester.getId(), receiver.getId())) {
            throw new RuntimeException("You already have an active or pending swap with this user");
        }

        if (request.getListingId() != null && swapRequestRepository.existsByListingIdAndRequesterId(request.getListingId(), requester.getId())) {
            throw new RuntimeException("You have already requested this swap");
        }

        ExchangeListing listing = null;
        if (request.getListingId() != null) {
            listing = exchangeListingRepository.findById(request.getListingId())
                    .orElseThrow(() -> new RuntimeException("Listing not found"));
        }

        SwapRequest swap = SwapRequest.builder()
                .requester(requester)
                .receiver(receiver)
                .offeredSkill(StringUtils.sanitize(request.getOfferedSkill()))
                .wantedSkill(StringUtils.sanitize(request.getWantedSkill()))
                .preferredTime(request.getPreferredTime() != null ? StringUtils.sanitize(request.getPreferredTime()) : null)
                .note(request.getNote() != null ? StringUtils.sanitize(request.getNote()) : null)
                .listing(listing)
                .status("PENDING")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        try {
            swapRequestRepository.save(swap);
        } catch (DataIntegrityViolationException e) {
            throw new RuntimeException("You have already requested this swap");
        }
        return toResponse(swap, requester.getId());
    }

    // ── Get my swaps ──────────────────────────────────────────────────────────

    public List<SwapResponse> getMySwaps(String email, String statusFilter) {
        User user = findUser(email);
        List<SwapRequest> swaps;

        PageRequest limit = PageRequest.of(0, MAX_SWAPS_PER_REQUEST);
        if (statusFilter == null || statusFilter.equalsIgnoreCase("all")) {
            swaps = swapRequestRepository.findAllByUserId(user.getId(), limit);
        } else {
            swaps = swapRequestRepository.findAllByUserIdAndStatus(user.getId(), statusFilter.toUpperCase(), limit);
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

    // ── Mark as finished ─────────────────────────────────────────────────────

    @Transactional
    public SwapResponse markAsFinished(String email, Long swapId) {
        User user = findUser(email);
        SwapRequest swap = swapRequestRepository.findById(swapId)
                .orElseThrow(() -> new RuntimeException("Swap not found"));

        if (!"ACTIVE".equals(swap.getStatus())) {
            throw new RuntimeException("Only active swaps can be marked as finished");
        }

        boolean isRequester = swap.getRequester().getId().equals(user.getId());
        boolean isReceiver = swap.getReceiver().getId().equals(user.getId());

        if (!isRequester && !isReceiver) {
            throw new RuntimeException("You are not part of this swap");
        }

        if (isRequester) swap.setRequesterFinished(true);
        else swap.setReceiverFinished(true);

        if (Boolean.TRUE.equals(swap.getRequesterFinished()) && Boolean.TRUE.equals(swap.getReceiverFinished())) {
            swap.setStatus("COMPLETED");
            
            // Deactivate associated listing if exists
            if (swap.getListing() != null) {
                ExchangeListing listing = swap.getListing();
                listing.setActive(false);
                exchangeListingRepository.save(listing);
            }
        }

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
        if (!"COMPLETED".equals(swap.getStatus())) {
            throw new RuntimeException("You can only rate a completed swap");
        }

        User reviewedUser = swap.getRequester().getId().equals(reviewer.getId())
                ? swap.getReceiver()
                : swap.getRequester();

        if (reviewRepository.existsByReviewerIdAndSwapId(reviewer.getId(), swapId)) {
            throw new RuntimeException("You have already rated this user for this swap");
        }

        Review review = Review.builder()
                .reviewer(reviewer)
                .reviewedUser(reviewedUser)
                .swapId(swapId)
                .rating(request.getRating())
                .comment(request.getComment() != null ? StringUtils.sanitize(request.getComment()) : null)
                .createdAt(LocalDateTime.now())
                .build();
        reviewRepository.save(review);
    }

    private SwapResponse toResponse(SwapRequest swap, Long currentUserId) {
        boolean isRequester = swap.getRequester().getId().equals(currentUserId);
        User other = isRequester ? swap.getReceiver() : swap.getRequester();

        String initials = StringUtils.buildInitials(other.getName());

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
                .hasRated(reviewRepository.existsByReviewerIdAndSwapId(currentUserId, swap.getId()))
                .isFinished(isRequester ? Boolean.TRUE.equals(swap.getRequesterFinished()) : Boolean.TRUE.equals(swap.getReceiverFinished()))
                .everyoneFinished(Boolean.TRUE.equals(swap.getRequesterFinished()) && Boolean.TRUE.equals(swap.getReceiverFinished()))
                .build();
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

}
