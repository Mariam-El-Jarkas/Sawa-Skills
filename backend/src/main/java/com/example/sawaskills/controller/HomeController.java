package com.example.sawaskills.controller;

import com.example.sawaskills.dto.home.*;
import com.example.sawaskills.service.HomeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/home")
@RequiredArgsConstructor
public class HomeController {

    private final HomeService homeService;

    // ── GET /api/home/stats — works for guests (null principal) + auth users ──
    @GetMapping("/stats")
    public ResponseEntity<HomeStatsResponse> getStats(
            @AuthenticationPrincipal UserDetails userDetails) {
        String email = userDetails != null ? userDetails.getUsername() : null;
        return ResponseEntity.ok(homeService.getStats(email));
    }

    // ── GET /api/home/trending ────────────────────────────────────────────────
    @GetMapping("/trending")
    public ResponseEntity<List<TrendingSkillResponse>> getTrending() {
        return ResponseEntity.ok(homeService.getTrending());
    }
}
