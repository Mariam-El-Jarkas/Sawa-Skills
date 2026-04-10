package com.example.sawaskills.controller;

import com.example.sawaskills.dto.skills.*;
import com.example.sawaskills.service.SkillsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/skills")
@RequiredArgsConstructor
public class SkillsController {

    private final SkillsService skillsService;

    // ── GET /api/skills — browse listings (public) ────────────────────────────
    @GetMapping
    public ResponseEntity<List<SkillListingResponse>> browse(
            @RequestParam(required = false) String search,
            @RequestParam(required = false, defaultValue = "All") String category,
            @RequestParam(required = false, defaultValue = "All") String availability,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size) {
        return ResponseEntity.ok(skillsService.browseListings(search, category, availability, page, size));
    }

    // ── GET /api/skills/categories — list all categories (public) ────────────
    @GetMapping("/categories")
    public ResponseEntity<List<String>> getCategories() {
        return ResponseEntity.ok(skillsService.getCategories());
    }

    // ── POST /api/skills/listings — create a new listing ─────────────────────
    @PostMapping("/listings")
    public ResponseEntity<SkillListingResponse> createListing(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateListingRequest request) {
        return ResponseEntity.ok(skillsService.createListing(userDetails.getUsername(), request));
    }

    // ── GET /api/skills/my/listings ───────────────────────────────────────────
    @GetMapping("/my/listings")
    public ResponseEntity<List<SkillListingResponse>> getMyListings(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(skillsService.getMyListings(userDetails.getUsername()));
    }

    // ── DELETE /api/skills/listings/{id} ─────────────────────────────────────
    @DeleteMapping("/listings/{id}")
    public ResponseEntity<Map<String, String>> deleteListing(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        skillsService.deleteListing(userDetails.getUsername(), id);
        return ResponseEntity.ok(Map.of("message", "Listing deleted"));
    }

    // ── POST /api/skills/my/offer ─────────────────────────────────────────────
    @PostMapping("/my/offer")
    public ResponseEntity<UserSkillResponse> addOfferedSkill(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody AddUserSkillRequest request) {
        return ResponseEntity.ok(skillsService.addOfferedSkill(userDetails.getUsername(), request));
    }

    // ── POST /api/skills/my/want ──────────────────────────────────────────────
    @PostMapping("/my/want")
    public ResponseEntity<UserSkillResponse> addWantedSkill(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody AddUserSkillRequest request) {
        return ResponseEntity.ok(skillsService.addWantedSkill(userDetails.getUsername(), request));
    }

    // ── GET /api/skills/my/offer ──────────────────────────────────────────────
    @GetMapping("/my/offer")
    public ResponseEntity<List<UserSkillResponse>> getMyOfferedSkills(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(skillsService.getMyOfferedSkills(userDetails.getUsername()));
    }

    // ── GET /api/skills/my/want ───────────────────────────────────────────────
    @GetMapping("/my/want")
    public ResponseEntity<List<UserSkillResponse>> getMyWantedSkills(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(skillsService.getMyWantedSkills(userDetails.getUsername()));
    }

    // ── PATCH /api/skills/my/{id}/visibility ──────────────────────────────────
    @PatchMapping("/my/{id}/visibility")
    public ResponseEntity<UserSkillResponse> toggleVisibility(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        return ResponseEntity.ok(skillsService.toggleVisibility(userDetails.getUsername(), id));
    }
}
