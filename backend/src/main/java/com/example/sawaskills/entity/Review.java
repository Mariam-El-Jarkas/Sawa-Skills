package com.example.sawaskills.entity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name="reviews")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Review {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long swapId;
    private Integer rating;

    private String comment;

    private LocalDateTime createdAt;

    @ManyToOne
    @JoinColumn(name="reviewer_id")
    private User reviewer;

    @ManyToOne
    @JoinColumn(name="reviewed_user_id")
    private User reviewedUser;

}