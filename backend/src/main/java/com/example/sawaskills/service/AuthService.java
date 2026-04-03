package com.example.sawaskills.service;

import com.example.sawaskills.dto.auth.RegisterRequest;
import com.example.sawaskills.dto.auth.RegisterResponse;
import com.example.sawaskills.dto.auth.VerifyEmailRequest;
import com.example.sawaskills.dto.auth.VerifyEmailResponse;
import com.example.sawaskills.entity.OtpVerification;
import com.example.sawaskills.entity.User;
import com.example.sawaskills.repository.OtpVerificationRepository;
import com.example.sawaskills.repository.UserRepository;
import com.example.sawaskills.util.OtpGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final OtpVerificationRepository otpVerificationRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    // ================================
    // REGISTER USER
    // ================================
    public RegisterResponse register(RegisterRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .phoneNumber(request.getPhone())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role("USER")
                .verified(false)
                .createdAt(LocalDateTime.now())
                .build();

        userRepository.save(user);

        // Generate OTP
        
        String otpCode = OtpGenerator.generateOtp();

        OtpVerification otp = OtpVerification.builder()
                .email(user.getEmail())
                .otpHash(passwordEncoder.encode(otpCode))
                .expiresAt(LocalDateTime.now().plusMinutes(2))
                .createdAt(LocalDateTime.now())
                .used(false)
                .build();

        otpVerificationRepository.save(otp);

       emailService.sendOtpEmail(user.getEmail(), otpCode);

        return RegisterResponse.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .message("User registered successfully. Please verify your email using OTP.")
                .build();
    }

    // ================================
    // VERIFY EMAIL
    // ================================
    public VerifyEmailResponse verifyEmail(VerifyEmailRequest request) {

        OtpVerification otp = otpVerificationRepository
                .findTopByEmailOrderByCreatedAtDesc(request.getEmail())
                .orElseThrow(() -> new RuntimeException("OTP not found"));

        if (otp.isUsed()) {
            throw new RuntimeException("OTP already used");
        }

        if (otp.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("OTP expired");
        }

        if (!passwordEncoder.matches(request.getOtp(), otp.getOtpHash())) {
            throw new RuntimeException("Invalid OTP");
        }

        otp.setUsed(true);
        otpVerificationRepository.save(otp);

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setVerified(true);
        userRepository.save(user);

        return VerifyEmailResponse.builder()
                .message("Email verified successfully")
                .build();
    }
}