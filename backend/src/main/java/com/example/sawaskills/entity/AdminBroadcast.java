package com.example.sawaskills.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "admin_broadcasts")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AdminBroadcast {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String title;
    @Column(columnDefinition = "TEXT")
    private String message;
    private String audience;
    private LocalDateTime sentAt;
    private Integer recipientCount;
}
