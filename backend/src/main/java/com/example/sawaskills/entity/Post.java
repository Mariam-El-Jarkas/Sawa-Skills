package com.example.sawaskills.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name="posts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String content;

    private String imageUrl;
    private String documentUrl;
    
    private String pollQuestion;
    private String pollOptions; // Comma separated options

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private PostVisibility visibility = PostVisibility.EVERYONE;

    private LocalDateTime createdAt;

    @ManyToOne
    @JoinColumn(name="author_id")
    private User author;

    public enum PostVisibility {
        EVERYONE, FOLLOWERS
    }
}