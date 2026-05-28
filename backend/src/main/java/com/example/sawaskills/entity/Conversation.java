package com.example.sawaskills.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name="conversations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDateTime createdAt;
    
    private String name;

    @ManyToOne
    @JoinColumn(name = "admin_id")
    private User admin;

    @Builder.Default
    @Column(nullable = false, columnDefinition = "boolean default true")
    private boolean everyoneCanMessage = true;

    private String profilePicture;

    @Builder.Default
    @Column(name = "is_closed", nullable = false, columnDefinition = "boolean default false")
    private boolean closed = false;

    @ManyToMany
    @JoinTable(
        name = "conversation_participants",
        joinColumns = @JoinColumn(name = "conversation_id"),
        inverseJoinColumns = @JoinColumn(name = "user_id"),
        uniqueConstraints = @UniqueConstraint(name = "uq_conversation_user", columnNames = {"conversation_id", "user_id"})
    )
    @Builder.Default
    private Set<User> participants = new HashSet<>();

    @ManyToMany
    @JoinTable(
        name = "conversation_hidden_by",
        joinColumns = @JoinColumn(name = "conversation_id"),
        inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    @Builder.Default
    private Set<User> hiddenBy = new HashSet<>();

}