package com.example.sawaskills.controller;

import com.example.sawaskills.dto.post.*;
import com.example.sawaskills.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    // ── Feed endpoints ────────────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<List<PostResponse>> getPosts(
            @AuthenticationPrincipal UserDetails userDetails) {
        String email = userDetails != null ? userDetails.getUsername() : null;
        return ResponseEntity.ok(postService.getPosts(email));
    }

    @GetMapping("/following")
    public ResponseEntity<List<PostResponse>> getFollowingPosts(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(postService.getFollowingPosts(userDetails.getUsername()));
    }

    @GetMapping("/post-count")
    public ResponseEntity<Long> getPostCount(
            @AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) return ResponseEntity.ok(0L);
        return ResponseEntity.ok(postService.getUserPostCount(userDetails.getUsername()));
    }

    @GetMapping("/suggested-connections")
    public ResponseEntity<List<SuggestedUser>> getSuggestedConnections(
            @AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) return ResponseEntity.ok(Collections.emptyList());
        return ResponseEntity.ok(postService.getSuggestedConnections(userDetails.getUsername()));
    }

    @GetMapping("/ml")
    public ResponseEntity<List<PostResponse>> getMLPosts(
            @AuthenticationPrincipal UserDetails userDetails) {
        String email = userDetails != null ? userDetails.getUsername() : null;
        return ResponseEntity.ok(postService.getMLPosts(email));
    }

    // ── Post CRUD ─────────────────────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<PostResponse> createPost(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody CreatePostRequest request) {
        return ResponseEntity.ok(postService.createPost(userDetails.getUsername(), request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        postService.deletePost(userDetails.getUsername(), id);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}")
    public ResponseEntity<PostResponse> editPost(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(postService.editPost(userDetails.getUsername(), id, body.get("content")));
    }

    // ── Post likes ────────────────────────────────────────────────────────────

    @PostMapping("/{id}/like")
    public ResponseEntity<Map<String, Object>> toggleLike(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        return ResponseEntity.ok(postService.toggleLike(userDetails.getUsername(), id));
    }

    @PostMapping("/{id}/vote")
    public ResponseEntity<Map<String, Object>> submitVote(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(postService.submitVote(userDetails.getUsername(), id, body.get("option")));
    }

    // ── Post report ───────────────────────────────────────────────────────────

    @PostMapping("/{id}/report")
    public ResponseEntity<Map<String, String>> reportPost(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        postService.reportPost(userDetails.getUsername(), id, body.get("reason"));
        return ResponseEntity.ok(Map.of("message", "Report submitted successfully"));
    }

    // ── Comments ──────────────────────────────────────────────────────────────

    @GetMapping("/{id}/comments")
    public ResponseEntity<List<CommentResponse>> getComments(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        String email = userDetails != null ? userDetails.getUsername() : null;
        return ResponseEntity.ok(postService.getComments(email, id));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<CommentResponse> addComment(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @RequestBody CreateCommentRequest request) {
        return ResponseEntity.ok(postService.addComment(userDetails.getUsername(), id, request));
    }

    @DeleteMapping("/{postId}/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long postId,
            @PathVariable Long commentId) {
        postService.deleteComment(userDetails.getUsername(), commentId);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{postId}/comments/{commentId}")
    public ResponseEntity<CommentResponse> editComment(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long postId,
            @PathVariable Long commentId,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(postService.editComment(userDetails.getUsername(), commentId, body.get("content")));
    }

    @PostMapping("/{postId}/comments/{commentId}/like")
    public ResponseEntity<Map<String, Object>> toggleCommentLike(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long postId,
            @PathVariable Long commentId) {
        return ResponseEntity.ok(postService.toggleCommentLike(userDetails.getUsername(), commentId));
    }
}
