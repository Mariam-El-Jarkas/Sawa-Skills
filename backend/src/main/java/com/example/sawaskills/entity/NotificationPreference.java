package com.example.sawaskills.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name="notification_preferences")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Boolean emailEnabled;

    private Boolean swapEnabled;

    private Boolean messageEnabled;

    private Boolean communityEnabled;

    @OneToOne
    @JoinColumn(name="user_id")
    private User user;

}