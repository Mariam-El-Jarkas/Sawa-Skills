package com.example.sawaskills.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name="volunteer_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VolunteerSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    private String description;

    private LocalDateTime sessionDate;

    @ManyToOne
    @JoinColumn(name="organizer_id")
    private User organizer;

    @OneToOne
    @JoinColumn(name="conversation_id")
    private Conversation groupChat;

    @Builder.Default
    @Column(name = "status", length = 20)
    private String status = "PENDING_REVIEW"; // PENDING_REVIEW | APPROVED | REJECTED

    private Integer maxParticipants;

    /** "REMOTE" or "IN_PERSON" */
    @Builder.Default
    @Column(name = "location_type", length = 20)
    private String locationType = "REMOTE";

    @Column(name = "location", length = 255)
    private String location;
}