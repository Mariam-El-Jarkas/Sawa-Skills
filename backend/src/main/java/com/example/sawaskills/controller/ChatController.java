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

    @GetMapping("/search")
    public ResponseEntity<List<ConversationResponse>> search(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam String query) {
        return ResponseEntity.ok(chatService.searchConversations(userDetails.getUsername(), query));
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

    // ── PATCH /api/chat/conversations/{id}/permissions ────────────────────────
    @PatchMapping("/conversations/{id}/permissions")
    public ResponseEntity<Map<String, String>> updatePermissions(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> body) {
        Boolean everyoneCanMessage = body.get("everyoneCanMessage");
        if (everyoneCanMessage == null) {
            throw new RuntimeException("everyoneCanMessage field is required");
        }
        chatService.updatePermissions(userDetails.getUsername(), id, everyoneCanMessage);
        return ResponseEntity.ok(Map.of("message", "Permissions updated successfully"));
    }

    // ── DELETE /api/chat/conversations/{id} — deletes the record ─────────────
    @DeleteMapping("/conversations/{id}")
    public ResponseEntity<Map<String, String>> deleteConversation(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        chatService.clearConversation(userDetails.getUsername(), id);
        return ResponseEntity.ok(Map.of("message", "Conversation deleted successfully"));
    }

    // ── DELETE /api/chat/conversations/{id}/messages — clears history ────────
    @DeleteMapping("/conversations/{id}/messages")
    public ResponseEntity<Map<String, String>> clearMessages(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        chatService.clearMessages(userDetails.getUsername(), id);
        return ResponseEntity.ok(Map.of("message", "Conversation history cleared"));
    }

    // ── POST /api/chat/conversations/{id}/leave — leave a group ──────────────
    @PostMapping("/conversations/{id}/leave")
    public ResponseEntity<Map<String, String>> leaveGroup(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        chatService.leaveGroup(userDetails.getUsername(), id);
        return ResponseEntity.ok(Map.of("message", "Left group successfully"));
    }

    // ── PATCH /api/chat/conversations/{id}/info — update group info (admin) ──
    @PatchMapping("/conversations/{id}/info")
    public ResponseEntity<Map<String, String>> updateGroupInfo(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @RequestBody UpdateGroupInfoRequest request) {
        chatService.updateGroupInfo(userDetails.getUsername(), id, request);
        return ResponseEntity.ok(Map.of("message", "Group info updated successfully"));
    }

    // ── POST /api/chat/conversations/{id}/close — close group (admin) ─────────
    @PostMapping("/conversations/{id}/close")
    public ResponseEntity<Map<String, String>> closeGroup(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        chatService.closeGroup(userDetails.getUsername(), id);
        return ResponseEntity.ok(Map.of("message", "Group closed successfully"));
    }

    // ── POST /api/chat/conversations/{id}/hide — hide from feed ───────────────
    @PostMapping("/conversations/{id}/hide")
    public ResponseEntity<Map<String, String>> hideConversation(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        chatService.hideConversation(userDetails.getUsername(), id);
        return ResponseEntity.ok(Map.of("message", "Conversation hidden"));
    }
}
