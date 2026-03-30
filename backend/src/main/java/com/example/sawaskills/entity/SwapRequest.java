package com.example.sawaskills.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name="swap_requests")
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

    private LocalDateTime createdAt;

    @ManyToOne
    @JoinColumn(name="requester_id")
    private User requester;

    @ManyToOne
    @JoinColumn(name="receiver_id")
    private User receiver;

}