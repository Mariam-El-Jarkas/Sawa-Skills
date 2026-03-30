package com.example.sawaskills.entity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name="connections")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Connection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String status;

    private LocalDateTime createdAt;

    @ManyToOne
    @JoinColumn(name="requester_id")
    private User requester;

    @ManyToOne
    @JoinColumn(name="receiver_id")
    private User receiver;

}