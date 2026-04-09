package com.example.sawaskills.controller;

import com.example.sawaskills.dto.auth.*;
import com.example.sawaskills.service.AuthService;
import com.example.sawaskills.service.RateLimitService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final RateLimitService rateLimitService;

    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest httpRequest) {
        checkRate("register", getClientIp(httpRequest));
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/verify-email")
    public ResponseEntity<VerifyEmailResponse> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        return ResponseEntity.ok(authService.verifyEmail(request));
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<String> resendOtp(
            @Valid @RequestBody ResendOtpRequest request,
            HttpServletRequest httpRequest) {
        checkRate("otp", request.getEmail());
        authService.resendOtp(request);
        return ResponseEntity.ok("OTP resent successfully");
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {
        checkRate("login", getClientIp(httpRequest));
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request,
            HttpServletRequest httpRequest) {
        checkRate("forgot-password", request.getEmail());
        authService.forgotPassword(request);
        return ResponseEntity.ok("Password reset email sent");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok("Password updated successfully");
    }

    @PostMapping("/social-login")
    public ResponseEntity<LoginResponse> socialLogin(@RequestBody SocialLoginRequest request) {
        return ResponseEntity.ok(authService.socialLogin(request));
    }

    private void checkRate(String action, String key) {
        if (!rateLimitService.isAllowed(action, key)) {
            throw new com.example.sawaskills.exception.RateLimitException(
                    "Too many requests. Please try again later.");
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
