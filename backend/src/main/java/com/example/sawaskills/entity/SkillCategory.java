package com.example.sawaskills.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name="skill_categories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SkillCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String description;

    @Builder.Default
    private String iconKey = "Other";

}