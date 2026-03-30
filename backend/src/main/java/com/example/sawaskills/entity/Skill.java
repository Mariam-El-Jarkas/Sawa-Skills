package com.example.sawaskills.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name="skills")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Skill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String skillName;

    @ManyToOne
    @JoinColumn(name = "category_id")
    private SkillCategory category;

}