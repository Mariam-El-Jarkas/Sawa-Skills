package com.example.sawaskills.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "auth_providers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthProvider {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AuthenticationProvider provider;

    private String providerUserId;

    private String passwordHash;

    private LocalDateTime createdAt;
}
