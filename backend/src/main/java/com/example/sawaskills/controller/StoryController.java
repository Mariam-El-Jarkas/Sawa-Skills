package com.example.sawaskills.controller;

import com.example.sawaskills.dto.story.*;
import com.example.sawaskills.service.StoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stories")
@RequiredArgsConstructor
public class StoryController {

    private final StoryService storyService;

    @GetMapping
    public ResponseEntity<List<StoryResponse>> getActiveStories(
            @AuthenticationPrincipal UserDetails userDetails) {
        String email = userDetails != null ? userDetails.getUsername() : null;
        return ResponseEntity.ok(storyService.getActiveStories(email));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<StoryResponse>> getUserStories(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserDetails userDetails) {
        String email = userDetails != null ? userDetails.getUsername() : null;
        return ResponseEntity.ok(storyService.getUserStories(email, userId));
    }

    @PostMapping
    public ResponseEntity<StoryResponse> createStory(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody CreateStoryRequest request) {
        return ResponseEntity.ok(storyService.createStory(userDetails.getUsername(), request));
    }

    @PostMapping("/{id}/view")
    public ResponseEntity<Void> viewStory(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        storyService.viewStory(userDetails.getUsername(), id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/vote")
    public ResponseEntity<Void> submitVote(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> payload) {
        storyService.submitVote(userDetails.getUsername(), id, payload.get("option"));
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<Void> toggleLike(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        storyService.toggleLike(userDetails.getUsername(), id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStory(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        storyService.deleteStory(userDetails.getUsername(), id);
        return ResponseEntity.ok().build();
    }
}
