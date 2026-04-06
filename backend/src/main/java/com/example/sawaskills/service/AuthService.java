package com.example.sawaskills.service;
import com.example.sawaskills.dto.auth.*;
import com.example.sawaskills.entity.OtpVerification;
import com.example.sawaskills.entity.PasswordResetToken;
import com.example.sawaskills.entity.User;
import com.example.sawaskills.repository.OtpVerificationRepository;
import com.example.sawaskills.repository.PasswordResetTokenRepository;
import com.example.sawaskills.repository.UserRepository;
import com.example.sawaskills.security.JwtService;
import com.example.sawaskills.util.OtpGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.UUID;
@Service
@RequiredArgsConstructor
public class AuthService {
private final UserRepository userRepository;
private final OtpVerificationRepository otpVerificationRepository;
private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
private final EmailService emailService;
private final JwtService jwtService;
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
                .message("User registered successfully. Verify email using OTP.")
                .build();
    }
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
    public void resendOtp(ResendOtpRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));
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
    }
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Invalid credentials");
        }
        if (!user.getVerified()) {
            throw new RuntimeException("Email not verified");
        }
        String token = jwtService.generateToken(user.getId(), user.getEmail());
        return LoginResponse.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .build();
    }
    public void forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));
        String token = UUID.randomUUID().toString();
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .email(user.getEmail())
                .token(token)
                .expiresAt(LocalDateTime.now().plusMinutes(15))
                .createdAt(LocalDateTime.now())
                .used(false)
                .build();
        passwordResetTokenRepository.save(resetToken);
        String resetLink = "http://localhost:3000/reset-password?token=" + token;
        emailService.sendPasswordResetEmail(user.getEmail(), resetLink);
    }
    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetToken token = passwordResetTokenRepository
                .findByToken(request.getToken())
                .orElseThrow(() -> new RuntimeException("Invalid token"));
        if (token.isUsed()) {
            throw new RuntimeException("Token already used");
        }
        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Token expired");
        }
        User user = userRepository.findByEmail(token.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        token.setUsed(true);
        passwordResetTokenRepository.save(token);
    }
}
