package com.example.sawaskills.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "exchange_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExchangeRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    private String description;

    @Column(nullable = false)
    private Boolean offerForFree;

    private LocalDateTime createdAt;

    @ManyToOne
    @JoinColumn(name = "creator_user_id", nullable = false)
    private User creator;

    @ManyToOne
    @JoinColumn(name = "offered_skill_id")
    private Skill offeredSkill;

    @ManyToOne
    @JoinColumn(name = "requested_skill_id")
    private Skill requestedSkill;

    @ManyToOne
    @JoinColumn(name = "location_id")
    private Location location;

}