package com.example.sawaskills.controller;

import com.example.sawaskills.dto.verification.MinorVerificationRequest;
import com.example.sawaskills.service.VerificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/verification")
@RequiredArgsConstructor
public class VerificationController {

    private final VerificationService verificationService;

    @PostMapping("/minor/request")
    public String requestMinorVerification(
            @RequestHeader("X-USER-ID") Long userId,
            @RequestBody MinorVerificationRequest request) {

        return verificationService.requestMinorVerification(userId, request);
    }

    @GetMapping("/minor/approve")
    public String approveMinor(@RequestParam String token) {

        return verificationService.approveMinor(token);
    }
}