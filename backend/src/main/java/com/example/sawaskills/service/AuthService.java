package com.example.sawaskills.service;

import com.example.sawaskills.dto.auth.*;
import com.example.sawaskills.entity.*;
import com.example.sawaskills.repository.*;
import com.example.sawaskills.security.JwtService;
import com.example.sawaskills.util.OtpGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import kong.unirest.HttpResponse;
import kong.unirest.Unirest;
import org.json.JSONObject;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final AuthProviderRepository authProviderRepository;
    private final OtpVerificationRepository otpVerificationRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final JwtService jwtService;

    @Value("${github.client.id:}")
    private String githubClientId;

    @Value("${github.client.secret:}")
    private String githubClientSecret;

    public RegisterResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }
        LocalDate dob = null;
        if (request.getDateOfBirth() != null && !request.getDateOfBirth().isBlank()) {
            dob = LocalDate.parse(request.getDateOfBirth());
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .phoneNumber(request.getPhone())
                .role("USER")
                .dob(dob)
                .gender(request.getGender())
                .verified(false)
                .createdAt(LocalDateTime.now())
                .build();
        userRepository.save(user);

        AuthProvider authProvider = AuthProvider.builder()
                .user(user)
                .provider(AuthenticationProvider.LOCAL)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .createdAt(LocalDateTime.now())
                .build();
        authProviderRepository.save(authProvider);

        String otpCode = OtpGenerator.generateOtp();
        otpVerificationRepository.invalidateAllByEmail(user.getEmail());
        OtpVerification otp = OtpVerification.builder()
                .email(user.getEmail())
                .otpHash(passwordEncoder.encode(otpCode))
                .expiresAt(LocalDateTime.now().plusMinutes(10))
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
        otpVerificationRepository.invalidateAllByEmail(user.getEmail());
        OtpVerification otp = OtpVerification.builder()
                .email(user.getEmail())
                .otpHash(passwordEncoder.encode(otpCode))
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .createdAt(LocalDateTime.now())
                .used(false)
                .build();
        otpVerificationRepository.save(otp);
        emailService.sendOtpEmail(user.getEmail(), otpCode);
    }

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        AuthProvider authProvider = authProviderRepository.findByUserAndProvider(user, AuthenticationProvider.LOCAL)
                .orElseThrow(() -> new RuntimeException("This account does not have a local password. Please sign in with Google or GitHub."));

        if (!passwordEncoder.matches(request.getPassword(), authProvider.getPasswordHash())) {
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
                .name(user.getName())
                .role(user.getRole())
                .build();
    }

    public void forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));
        String otpCode = OtpGenerator.generateOtp();
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .email(user.getEmail())
                .token(passwordEncoder.encode(otpCode))
                .expiresAt(LocalDateTime.now().plusMinutes(15))
                .createdAt(LocalDateTime.now())
                .used(false)
                .build();
        passwordResetTokenRepository.save(resetToken);
        emailService.sendPasswordResetEmail(user.getEmail(), otpCode);
    }

    public LoginResponse socialLogin(SocialLoginRequest request) {
        String name, email, providerId;
        AuthenticationProvider provider = AuthenticationProvider.valueOf(request.getProvider().toUpperCase());

        try {
            if (provider == AuthenticationProvider.GOOGLE) {
                HttpResponse<String> res = Unirest.get("https://www.googleapis.com/oauth2/v3/userinfo")
                        .header("Authorization", "Bearer " + request.getAccessToken())
                        .asString();
                if (res.getStatus() != 200) throw new RuntimeException("Invalid Google token");
                JSONObject body = new JSONObject(res.getBody());
                email = body.getString("email");
                name = body.optString("name", email);
                providerId = body.getString("sub");
            } else if (provider == AuthenticationProvider.FACEBOOK) {
                HttpResponse<String> res = Unirest.get("https://graph.facebook.com/me")
                        .queryString("fields", "id,name,email")
                        .queryString("access_token", request.getAccessToken())
                        .asString();
                if (res.getStatus() != 200) throw new RuntimeException("Invalid Facebook token");
                JSONObject body = new JSONObject(res.getBody());
                email = body.optString("email", "");
                name = body.optString("name", "");
                providerId = body.getString("id");
                if (email.isEmpty()) throw new RuntimeException("Facebook account has no email.");
            } else if (provider == AuthenticationProvider.GITHUB) {
                String code = request.getAccessToken();
                String accessToken = exchangeGithubCode(code, request.getRedirectUri());
                
                HttpResponse<String> res = Unirest.get("https://api.github.com/user")
                        .header("Authorization", "Bearer " + accessToken)
                        .header("Accept", "application/vnd.github.v3+json")
                        .asString();
                if (res.getStatus() != 200) throw new RuntimeException("Invalid GitHub token");
                JSONObject body = new JSONObject(res.getBody());
                name = body.optString("name", body.optString("login", "GitHub User"));
                providerId = String.valueOf(body.get("id"));
                email = body.optString("email", "");
                if (email.isEmpty()) {
                    HttpResponse<String> emailRes = Unirest.get("https://api.github.com/user/emails")
                            .header("Authorization", "Bearer " + accessToken)
                            .header("Accept", "application/vnd.github.v3+json")
                            .asString();
                    if (emailRes.getStatus() == 200) {
                        org.json.JSONArray emails = new org.json.JSONArray(emailRes.getBody());
                        for (int i = 0; i < emails.length(); i++) {
                            JSONObject emailObj = emails.getJSONObject(i);
                            if (emailObj.optBoolean("primary", false)) {
                                email = emailObj.getString("email");
                                break;
                            }
                        }
                    }
                }
                if (email.isEmpty()) throw new RuntimeException("GitHub account has no email.");
            } else {
                throw new RuntimeException("Unsupported provider: " + request.getProvider());
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to verify social token: " + e.getMessage());
        }

        final String finalEmail = email;
        final String finalName = name;
        final String finalProviderId = providerId;

        AuthProvider authProvider = authProviderRepository.findByProviderAndProviderUserId(provider, finalProviderId)
                .orElseGet(() -> {
                    // Find or create user
                    User user = userRepository.findByEmail(finalEmail).orElseGet(() -> {
                        User newUser = User.builder()
                                .name(finalName)
                                .email(finalEmail)
                                .role("USER")
                                .verified(true)
                                .createdAt(LocalDateTime.now())
                                .build();
                        return userRepository.save(newUser);
                    });

                    // Create provider link
                    AuthProvider newProvider = AuthProvider.builder()
                            .user(user)
                            .provider(provider)
                            .providerUserId(finalProviderId)
                            .createdAt(LocalDateTime.now())
                            .build();
                    return authProviderRepository.save(newProvider);
                });

        User user = authProvider.getUser();
        if (!user.getVerified()) {
            user.setVerified(true);
            userRepository.save(user);
        }

        String token = jwtService.generateToken(user.getId(), user.getEmail());
        return LoginResponse.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole())
                .build();
    }

    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetToken resetToken = passwordResetTokenRepository
                .findTopByEmailOrderByCreatedAtDesc(request.getEmail())
                .orElseThrow(() -> new RuntimeException("No reset request found for this email"));
        if (resetToken.isUsed()) {
            throw new RuntimeException("Reset code already used");
        }
        if (resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Reset code expired");
        }
        if (!passwordEncoder.matches(request.getToken(), resetToken.getToken())) {
            throw new RuntimeException("Invalid reset code");
        }
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        AuthProvider authProvider = authProviderRepository.findByUserAndProvider(user, AuthenticationProvider.LOCAL)
                .orElseGet(() -> AuthProvider.builder()
                        .user(user)
                        .provider(AuthenticationProvider.LOCAL)
                        .createdAt(LocalDateTime.now())
                        .build());

        authProvider.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        authProviderRepository.save(authProvider);
        
        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);
    }

    private String exchangeGithubCode(String code, String redirectUri) {
        try {
            kong.unirest.MultipartBody req = Unirest.post("https://github.com/login/oauth/access_token")
                    .field("client_id", githubClientId)
                    .field("client_secret", githubClientSecret)
                    .field("code", code);
            if (redirectUri != null && !redirectUri.isBlank()) {
                req = req.field("redirect_uri", redirectUri);
            }
            HttpResponse<String> res = req
                    .header("Accept", "application/json")
                    .asString();
            if (res.getStatus() != 200) {
                throw new RuntimeException("Failed to exchange GitHub code: " + res.getBody());
            }
            JSONObject body = new JSONObject(res.getBody());
            if (body.has("error")) {
                throw new RuntimeException("GitHub error: " + body.getString("error_description"));
            }
            return body.getString("access_token");
        } catch (Exception e) {
            throw new RuntimeException("GitHub token exchange failed: " + e.getMessage());
        }
    }
}
