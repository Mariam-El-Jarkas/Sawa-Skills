package com.example.sawaskills.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "news_articles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NewsArticle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(length = 5000)
    private String content;

    private String source;

    private String url;

    private LocalDateTime publishedAt;

    @ManyToOne
    @JoinColumn(name = "skill_category_id")
    private SkillCategory skillCategory;

}