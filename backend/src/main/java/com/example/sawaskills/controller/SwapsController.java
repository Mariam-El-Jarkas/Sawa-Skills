package com.example.sawaskills.controller;

import com.example.sawaskills.dto.swaps.*;
import com.example.sawaskills.service.SwapsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/swaps")
@RequiredArgsConstructor
public class SwapsController {

    private final SwapsService swapsService;

    // ── POST /api/swaps ───────────────────────────────────────────────────────
    @PostMapping
    public ResponseEntity<SwapResponse> createSwap(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateSwapRequest request) {
        return ResponseEntity.ok(swapsService.createSwap(userDetails.getUsername(), request));
    }

    // ── GET /api/swaps/my ─────────────────────────────────────────────────────
    @GetMapping("/my")
    public ResponseEntity<List<SwapResponse>> getMySwaps(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(swapsService.getMySwaps(userDetails.getUsername(), status));
    }

    // ── PATCH /api/swaps/{id}/accept ──────────────────────────────────────────
    @PatchMapping("/{id}/accept")
    public ResponseEntity<SwapResponse> acceptSwap(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        return ResponseEntity.ok(swapsService.acceptSwap(userDetails.getUsername(), id));
    }

    // ── PATCH /api/swaps/{id}/reject ──────────────────────────────────────────
    @PatchMapping("/{id}/reject")
    public ResponseEntity<SwapResponse> rejectSwap(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        return ResponseEntity.ok(swapsService.rejectSwap(userDetails.getUsername(), id));
    }

    // ── POST /api/swaps/{id}/rate ─────────────────────────────────────────────
    @PostMapping("/{id}/rate")
    public ResponseEntity<Map<String, String>> rateSwap(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody RatingRequest request) {
        swapsService.rateSwap(userDetails.getUsername(), id, request);
        return ResponseEntity.ok(Map.of("message", "Rating submitted successfully"));
    }
}
