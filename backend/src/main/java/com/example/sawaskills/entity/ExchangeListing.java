package com.example.sawaskills.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "exchange_listings", indexes = {
    @jakarta.persistence.Index(name = "idx_listing_active", columnList = "active"),
    @jakarta.persistence.Index(name = "idx_listing_offered", columnList = "offeredSkill"),
    @jakarta.persistence.Index(name = "idx_listing_wanted", columnList = "wantedSkill"),
    @jakarta.persistence.Index(name = "idx_listing_owner", columnList = "owner_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExchangeListing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String offeredSkill;

    @Column(nullable = false)
    private String wantedSkill;

    private String location;

    /** "Remote" or "On-site" */
    private String availability;

    private LocalDateTime createdAt;
    
    @Builder.Default
    private boolean active = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;
}
