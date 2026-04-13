package com.example.sawaskills.service;

import com.example.sawaskills.dto.skills.*;
import com.example.sawaskills.entity.*;
import com.example.sawaskills.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.sawaskills.util.StringUtils;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SkillsService {

    private final ExchangeListingRepository listingRepository;
    private final UserRepository userRepository;
    private final UserSkillRepository userSkillRepository;
    private final SkillRepository skillRepository;
    private final SkillCategoryRepository skillCategoryRepository;
    private final ReviewRepository reviewRepository;
    private final SwapRequestRepository swapRequestRepository;

    // ── Browse listings ───────────────────────────────────────────────────────

    public List<SkillListingResponse> browseListings(String currentEmail, String search, String category, String availability, int page, int size) {
        String normalizedSearch = (search == null || search.trim().isEmpty()) ? "" : "%" + search.toLowerCase() + "%";
        String normalizedAvail = (availability != null && availability.equals("All")) ? null : availability;
        String normalizedCat = (category == null || category.equals("All")) ? null : "%" + category.toLowerCase() + "%";

        Long currentUserId = null;
        if (currentEmail != null) {
            currentUserId = userRepository.findByEmail(currentEmail).map(User::getId).orElse(null);
        }

        Pageable pageable = PageRequest.of(page, size);
        final Long finalUserId = currentUserId;

        Page<ExchangeListing> listings = listingRepository.browse(normalizedSearch, normalizedCat, normalizedAvail, pageable);

        // Batch-fetch all avg ratings in one query instead of N+1
        List<Long> ownerIds = listings.stream()
                .map(l -> l.getOwner().getId()).distinct().collect(Collectors.toList());
        Map<Long, Double> ratingMap = ownerIds.isEmpty() ? Map.of() :
                reviewRepository.findAvgRatingsByUserIds(ownerIds).stream()
                        .collect(Collectors.toMap(r -> (Long) r[0], r -> r[1] != null ? (Double) r[1] : 0.0));

        return listings.getContent().stream()
                .map(l -> this.toListingResponse(l, finalUserId, ratingMap))
                .collect(Collectors.toList());
    }

    // ── Get categories ────────────────────────────────────────────────────────

    public List<String> getCategories() {
        List<SkillCategory> categories = skillCategoryRepository.findAll();
        if (categories.isEmpty()) {
            return Arrays.asList("Cooking", "Music", "Languages", "Tech", "Art", "Sports", "Business", "Design");
        }
        return categories.stream().map(SkillCategory::getName).collect(Collectors.toList());
    }

    // ── Create listing ────────────────────────────────────────────────────────

    @Transactional
    public SkillListingResponse createListing(String email, CreateListingRequest request) {
        User user = findUser(email);

        ExchangeListing listing = ExchangeListing.builder()
                .owner(user)
                .offeredSkill(StringUtils.sanitize(request.getOfferedSkill()))
                .wantedSkill(StringUtils.sanitize(request.getWantedSkill()))
                .location(request.getLocation() != null ? StringUtils.sanitize(request.getLocation()) : null)
                .availability(request.getAvailability())
                .createdAt(LocalDateTime.now())
                .build();

        listingRepository.save(listing);
        return toListingResponse(listing, user.getId());
    }

    // ── Get my listings ───────────────────────────────────────────────────────

    public List<SkillListingResponse> getMyListings(String email) {
        User user = findUser(email);
        return listingRepository.findByOwnerIdAndActiveTrueOrderByCreatedAtDesc(user.getId())
                .stream().map(l -> this.toListingResponse(l, user.getId())).collect(Collectors.toList());
    }

    // ── Delete listing ────────────────────────────────────────────────────────

    @Transactional
    public void deleteListing(String email, Long listingId) {
        User user = findUser(email);
        ExchangeListing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new RuntimeException("Listing not found"));
        if (!listing.getOwner().getId().equals(user.getId())) {
            throw new RuntimeException("You can only delete your own listings");
        }
        listing.setActive(false);
        listingRepository.save(listing);
        swapRequestRepository.cancelActiveSwapsForListing(listingId);
    }

    // ── Add offered skill ─────────────────────────────────────────────────────

    @Transactional
    public UserSkillResponse addOfferedSkill(String email, AddUserSkillRequest request) {
        return addUserSkill(email, request, true);
    }

    // ── Add wanted skill ──────────────────────────────────────────────────────

    @Transactional
    public UserSkillResponse addWantedSkill(String email, AddUserSkillRequest request) {
        return addUserSkill(email, request, false);
    }

    // ── Get my offered skills ─────────────────────────────────────────────────

    public List<UserSkillResponse> getMyOfferedSkills(String email) {
        User user = findUser(email);
        return userSkillRepository.findByUserIdAndOffering(user.getId(), true)
                .stream().map(this::toUserSkillResponse).collect(Collectors.toList());
    }

    // ── Get my wanted skills ──────────────────────────────────────────────────

    public List<UserSkillResponse> getMyWantedSkills(String email) {
        User user = findUser(email);
        return userSkillRepository.findByUserIdAndOffering(user.getId(), false)
                .stream().map(this::toUserSkillResponse).collect(Collectors.toList());
    }

    // ── Toggle visibility ─────────────────────────────────────────────────────

    @Transactional
    public UserSkillResponse toggleVisibility(String email, Long userSkillId) {
        User user = findUser(email);
        UserSkill us = userSkillRepository.findById(userSkillId)
                .orElseThrow(() -> new RuntimeException("Skill not found"));
        if (!us.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("You can only update your own skills");
        }
        // UserSkill doesn't have isPublic field - we use level as a visibility flag
        // Toggle: if level is "hidden" set to "public", otherwise set to "hidden"
        String current = us.getLevel();
        us.setLevel("hidden".equals(current) ? "public" : "hidden");
        userSkillRepository.save(us);
        return toUserSkillResponse(us);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private UserSkillResponse addUserSkill(String email, AddUserSkillRequest request, boolean offering) {
        User user = findUser(email);
        String skillName = StringUtils.sanitize(request.getSkillName());

        // Find or create the Skill entity
        Skill skill = skillRepository.findBySkillNameIgnoreCase(skillName).orElseGet(() -> {
            SkillCategory category = null;
            if (request.getCategory() != null && !request.getCategory().isBlank()) {
                category = skillCategoryRepository.findByName(request.getCategory()).orElse(null);
            }
            return skillRepository.save(Skill.builder()
                    .skillName(skillName)
                    .category(category)
                    .build());
        });

        // Check for duplicate
        userSkillRepository.findByUserIdAndSkillSkillNameIgnoreCaseAndOffering(user.getId(), skillName, offering)
                .ifPresent(existing -> {
                    throw new RuntimeException("You already have this skill in your " + (offering ? "offered" : "wanted") + " list");
                });

        UserSkill us = UserSkill.builder()
                .user(user)
                .skill(skill)
                .offering(offering)
                .level("public")
                .build();
        userSkillRepository.save(us);
        return toUserSkillResponse(us);
    }

    private SkillListingResponse toListingResponse(ExchangeListing l, Long currentUserId) {
        double avgRating = reviewRepository.findAvgRatingByReviewedUserId(l.getOwner().getId()).orElse(0.0);
        return toListingResponse(l, currentUserId, Map.of(l.getOwner().getId(), avgRating));
    }

    private SkillListingResponse toListingResponse(ExchangeListing l, Long currentUserId, Map<Long, Double> ratingMap) {
        User owner = l.getOwner();
        String initials = StringUtils.buildInitials(owner.getName());

        double avgRating = ratingMap.getOrDefault(owner.getId(), 0.0);

        return SkillListingResponse.builder()
                .id(l.getId())
                .ownerId(owner.getId())
                .ownerName(owner.getName())
                .ownerInitials(initials)
                .profilePicture(owner.getProfilePicture())
                .offeredSkill(l.getOfferedSkill())
                .wantedSkill(l.getWantedSkill())
                .location(l.getLocation())
                .availability(l.getAvailability())
                .avgRating(Math.round(avgRating * 10.0) / 10.0)
                .createdAt(l.getCreatedAt() != null ? l.getCreatedAt().toString() : null)
                .alreadyRequested(currentUserId != null && l.getId() != null && 
                        swapRequestRepository.existsByListingIdAndRequesterId(l.getId(), currentUserId))
                .build();
    }

    private UserSkillResponse toUserSkillResponse(UserSkill us) {
        Skill skill = us.getSkill();
        if (skill == null) throw new RuntimeException("Data integrity error: skill record missing for user skill id=" + us.getId());
        return UserSkillResponse.builder()
                .id(us.getId())
                .skillName(skill.getSkillName())
                .category(skill.getCategory() != null ? skill.getCategory().getName() : null)
                .offering(us.getOffering())
                .isPublic(!"hidden".equals(us.getLevel()))
                .build();
    }


    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

}
