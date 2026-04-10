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

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
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

    // ── Browse listings ───────────────────────────────────────────────────────

    public List<SkillListingResponse> browseListings(String search, String category, String availability, int page, int size) {
        String normalizedSearch = (search == null || search.trim().isEmpty()) ? "" : search;
        String normalizedAvail = (availability != null && availability.equals("All")) ? null : availability;

        Pageable pageable = PageRequest.of(page, size);
        Page<ExchangeListing> listings;

        if (category != null && !category.equals("All")) {
            // Filter by category: check if offeredSkill matches category name
            listings = listingRepository.browse(normalizedSearch, normalizedAvail, pageable);
            return listings.stream()
                    .filter(l -> l.getOfferedSkill().toLowerCase().contains(category.toLowerCase())
                            || (l.getOwner() != null && hasSkillInCategory(l.getOwner().getId(), category)))
                    .map(l -> toListingResponse(l))
                    .collect(Collectors.toList());
        }

        listings = listingRepository.browse(normalizedSearch, normalizedAvail, pageable);
        return listings.stream().map(this::toListingResponse).collect(Collectors.toList());
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
                .offeredSkill(sanitize(request.getOfferedSkill()))
                .wantedSkill(sanitize(request.getWantedSkill()))
                .location(request.getLocation() != null ? sanitize(request.getLocation()) : null)
                .availability(request.getAvailability())
                .createdAt(LocalDateTime.now())
                .build();

        listingRepository.save(listing);
        return toListingResponse(listing);
    }

    // ── Get my listings ───────────────────────────────────────────────────────

    public List<SkillListingResponse> getMyListings(String email) {
        User user = findUser(email);
        return listingRepository.findByOwnerIdOrderByCreatedAtDesc(user.getId())
                .stream().map(this::toListingResponse).collect(Collectors.toList());
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
        listingRepository.delete(listing);
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
        String skillName = sanitize(request.getSkillName());

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

    private SkillListingResponse toListingResponse(ExchangeListing l) {
        User owner = l.getOwner();
        String initials = owner.getName() == null ? "??" :
                java.util.Arrays.stream(owner.getName().split(" "))
                        .map(w -> String.valueOf(w.charAt(0)).toUpperCase())
                        .limit(2)
                        .collect(Collectors.joining());

        double avgRating = reviewRepository.findAvgRatingByReviewedUserId(owner.getId()).orElse(0.0);

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
                .build();
    }

    private UserSkillResponse toUserSkillResponse(UserSkill us) {
        return UserSkillResponse.builder()
                .id(us.getId())
                .skillName(us.getSkill().getSkillName())
                .category(us.getSkill().getCategory() != null ? us.getSkill().getCategory().getName() : null)
                .offering(us.getOffering())
                .build();
    }

    private boolean hasSkillInCategory(Long userId, String category) {
        return userSkillRepository.findByUserIdAndOffering(userId, true).stream()
                .anyMatch(us -> us.getSkill().getCategory() != null &&
                        us.getSkill().getCategory().getName().equalsIgnoreCase(category));
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
