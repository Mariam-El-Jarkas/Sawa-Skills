package com.example.sawaskills.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "post_shares")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostShare {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // user who shared the post
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // post being shared
    @ManyToOne
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    // type of share
    // FEED, CHAT, EXTERNAL, LINK
    @Column(nullable = false)
    private String shareType;

    private LocalDateTime createdAt;

}