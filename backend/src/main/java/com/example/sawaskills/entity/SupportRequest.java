package com.example.sawaskills.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "support_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupportRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User requester;

    private String oldEmail;
    private String newEmail;

    @Column(columnDefinition = "TEXT")
    private String issueDescription;

    private String joinDate;
    private String location;

    @Column(columnDefinition = "TEXT")
    private String usedFeatures;

    @Column(columnDefinition = "TEXT")
    private String additionalProofPath;
    private String ipAddress;
    private String status; // PENDING, RESOLVED
    private LocalDateTime createdAt;
}
