package com.example.sawaskills.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "activity_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // What happened
    @Column(nullable = false)
    private String action;

    // Example: LOGIN, CREATE_POST, SEND_SWAP_REQUEST
    private String actionType;

    // Optional description
    private String description;

    // When the action happened
    @Column(nullable = false)
    private LocalDateTime createdAt;

    // IP address of user (optional but useful)
    private String ipAddress;

    // Device or platform
    private String userAgent;

    // Relation to user who performed the action
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

}