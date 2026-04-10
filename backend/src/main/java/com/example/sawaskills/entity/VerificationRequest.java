package com.example.sawaskills.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "verification_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerificationRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String idFrontImage;

    private String idBackImage;

    private String selfieImage;

    private String status; // PENDING, APPROVED, REJECTED, PENDING_PARENT, PENDING_ADMIN

    private LocalDateTime submittedAt;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    private String type; // ADULT, MINOR, VOLUNTEER

    private String fullName;

    private LocalDate dob;

    private String parentEmail;

    private String parentApprovalToken; // Unique token for email link

    private LocalDateTime parentDecisionAt;

    // Volunteer specific (Using TEXT for long content)
    @Column(columnDefinition = "TEXT")
    private String why;

    @Column(columnDefinition = "TEXT")
    private String experience;

    @Column(columnDefinition = "TEXT")
    private String skillsToShare;

}