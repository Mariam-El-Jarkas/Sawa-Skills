package com.example.sawaskills.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    private String name;

    @Column(unique = true, nullable = true)
    private String email;

    private String phoneNumber;



    private String bio;

    private String profilePicture;

    private String role;

    private LocalDate dob;

    private Boolean verified;

    private LocalDateTime createdAt;

    @Builder.Default
    private boolean publicProfile = true;

    @Builder.Default
    private boolean allowMessages = true;

    @Builder.Default
    @Column(columnDefinition = "boolean default true")
    private boolean swapNotificationsEnabled = true;

    @Builder.Default
    @Column(columnDefinition = "boolean default true")
    private boolean messageNotificationsEnabled = true;

    @Builder.Default
    @Column(columnDefinition = "boolean default true")
    private boolean skillNewsNotificationsEnabled = true;

    @ManyToOne
    @JoinColumn(name = "location_id")
    private Location location;

    private LocalDateTime deletedAt;
    private String deletedEmailHash;

    @Column(length = 20)
    private String gender; // MALE | FEMALE | PREFER_NOT_TO_SAY

    @Builder.Default
    @Column(name = "account_status", length = 20)
    private String accountStatus = "ACTIVE"; // ACTIVE | SUSPENDED | BANNED
}