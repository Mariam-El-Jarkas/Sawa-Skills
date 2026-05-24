package com.example.sawaskills.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "parent_approvals")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ParentApproval {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String parentEmail;

    @Column(nullable = false)
    private String status; // PENDING, APPROVED, DECLINED, EXPIRED

    @Column(unique = true, nullable = false)
    private String token;

    // SWAP_REQUEST, SWAP_ACCEPT, VOLUNTEER_APPLY, SESSION_JOIN
    private String actionType;

    // ID of the swap / session / verification record being gated
    private Long actionId;

    // JSON or plain-text context stored so we can recreate the action on approval
    @Column(columnDefinition = "TEXT")
    private String additionalData;

    private LocalDateTime requestedAt;

    private LocalDateTime approvedAt;

    private LocalDateTime expiresAt;

    @ManyToOne
    @JoinColumn(name = "minor_user_id", nullable = false)
    private User minorUser;
}
