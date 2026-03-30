package com.example.sawaskills.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name="user_skills")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSkill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String level;

    private Boolean offering;

    @ManyToOne
    @JoinColumn(name="user_id")
    private User user;

    @ManyToOne
    @JoinColumn(name="skill_id")
    private Skill skill;

}