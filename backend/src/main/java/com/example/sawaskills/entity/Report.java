package com.example.sawaskills.entity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "reports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String reason;

    private String status;

    private LocalDateTime createdAt;

    @ManyToOne
    @JoinColumn(name = "reporter_id")
    private User reporter;

}