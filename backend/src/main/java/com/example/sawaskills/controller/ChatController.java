package com.example.sawaskills.controller;

import com.example.sawaskills.dto.chat.*;
import com.example.sawaskills.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    // ── GET /api/chat/conversations ───────────────────────────────────────────
    @GetMapping("/conversations")
    public ResponseEntity<List<ConversationResponse>> getConversations(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(chatService.getConversations(userDetails.getUsername()));
    }

    // ── POST /api/chat/conversations — find or create ─────────────────────────
    @PostMapping("/conversations")
    public ResponseEntity<ConversationResponse> startConversation(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody StartConversationRequest request) {
        return ResponseEntity.ok(chatService.findOrCreateConversation(
                userDetails.getUsername(), request.getOtherUserId()));
    }

    // ── GET /api/chat/conversations/{id}/messages ─────────────────────────────
    @GetMapping("/conversations/{id}/messages")
    public ResponseEntity<List<MessageResponse>> getMessages(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        return ResponseEntity.ok(chatService.getMessages(userDetails.getUsername(), id));
    }

    // ── POST /api/chat/conversations/{id}/messages ────────────────────────────
    @PostMapping("/conversations/{id}/messages")
    public ResponseEntity<MessageResponse> sendMessage(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody SendMessageRequest request) {
        return ResponseEntity.ok(chatService.sendMessage(userDetails.getUsername(), id, request));
    }

    // ── PATCH /api/chat/conversations/{id}/read ───────────────────────────────
    @PatchMapping("/conversations/{id}/read")
    public ResponseEntity<Map<String, String>> markRead(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        chatService.markRead(userDetails.getUsername(), id);
        return ResponseEntity.ok(Map.of("message", "Messages marked as read"));
    }
}
