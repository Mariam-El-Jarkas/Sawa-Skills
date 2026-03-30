package com.example.sawaskills.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "identity_verifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IdentityVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String idFrontImage;

    @Column(nullable = false)
    private String idBackImage;

    @Column(nullable = false)
    private String selfieImage;

    @Column(nullable = false)
    private String status; // PENDING, APPROVED, REJECTED

    private String adminComment;

    private LocalDateTime submittedAt;

    private LocalDateTime reviewedAt;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
}