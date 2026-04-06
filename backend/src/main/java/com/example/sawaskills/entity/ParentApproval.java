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
    private String status;

    @Column(unique = true, nullable = false)
    private String token;

    private LocalDateTime requestedAt;

    private LocalDateTime approvedAt;

    private LocalDateTime expiresAt;

    @ManyToOne
    @JoinColumn(name = "minor_user_id", nullable = false)
    private User minorUser;

}