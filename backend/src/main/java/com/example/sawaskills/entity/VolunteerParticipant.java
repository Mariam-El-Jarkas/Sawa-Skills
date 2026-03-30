package com.example.sawaskills.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name="volunteer_participants")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VolunteerParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name="session_id")
    private VolunteerSession session;

    @ManyToOne
    @JoinColumn(name="user_id")
    private User participant;

}