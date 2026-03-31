package com.example.sawaskills.controller;

import com.example.sawaskills.dto.auth.RegisterRequest;
import com.example.sawaskills.dto.auth.RegisterResponse;
import com.example.sawaskills.dto.auth.VerifyEmailRequest;
import com.example.sawaskills.dto.auth.VerifyEmailResponse;
import com.example.sawaskills.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // ================================
    // REGISTER
    // ================================
    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(@RequestBody RegisterRequest request) {

        RegisterResponse response = authService.register(request);

        return ResponseEntity.ok(response);
    }

    // ================================
    // VERIFY EMAIL
    // ================================
    @PostMapping("/verify-email")
    public ResponseEntity<VerifyEmailResponse> verifyEmail(
            @RequestBody VerifyEmailRequest request) {

        VerifyEmailResponse response = authService.verifyEmail(request);

        return ResponseEntity.ok(response);
    }
}