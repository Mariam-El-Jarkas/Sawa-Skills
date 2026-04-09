package com.example.sawaskills.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "email_change_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailChangeRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    public enum VerificationStep {
        VERIFY_CURRENT,
        VERIFY_NEW
    }

    // The user who requested the change (their current email)
    @Column(nullable = false)
    private String currentEmail;

    // The new email address they want to switch to
    @Column(nullable = false)
    private String pendingEmail;

    @Column(nullable = false)
    private String otpHash;

    @Enumerated(EnumType.STRING)
    private VerificationStep verificationStep;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    private LocalDateTime createdAt;

    private boolean used;
}
