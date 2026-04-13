package com.example.sawaskills.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name="swap_requests", uniqueConstraints = {
    @UniqueConstraint(name = "uq_swap_requester_listing", columnNames = {"requester_id", "listing_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SwapRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String status;

    private String description;

    private String offeredSkill;

    private String wantedSkill;

    private String preferredTime;

    private String note;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "listing_id")
    private ExchangeListing listing;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Builder.Default
    private Boolean requesterFinished = false;
    @Builder.Default
    private Boolean receiverFinished = false;

    @ManyToOne
    @JoinColumn(name="requester_id")
    private User requester;

    @ManyToOne
    @JoinColumn(name="receiver_id")
    private User receiver;

}