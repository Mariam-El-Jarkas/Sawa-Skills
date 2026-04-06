package com.example.sawaskills.controller;
import com.example.sawaskills.dto.auth.*;
import com.example.sawaskills.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;
    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }
    @PostMapping("/verify-email")
    public ResponseEntity<VerifyEmailResponse> verifyEmail(@RequestBody VerifyEmailRequest 
request) {
        return ResponseEntity.ok(authService.verifyEmail(request));
    }
    @PostMapping("/resend-otp")
    public ResponseEntity<String> resendOtp(@RequestBody ResendOtpRequest request) {
        authService.resendOtp(request);
        return ResponseEntity.ok("OTP resent successfully");
    }
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }
    @PostMapping("/forgot-password")
public ResponseEntity<String> forgotPassword(@RequestBody ForgotPasswordRequest 
request) {
authService.forgotPassword(request);
return ResponseEntity.ok("Password reset email sent");
    }
@PostMapping("/reset-password")
public ResponseEntity<String> resetPassword(@RequestBody ResetPasswordRequest 
request) {
authService.resetPassword(request);
return ResponseEntity.ok("Password updated successfully");
}
}