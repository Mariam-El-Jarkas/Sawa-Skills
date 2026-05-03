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
}
