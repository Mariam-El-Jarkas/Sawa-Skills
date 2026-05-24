package com.example.sawaskills.entity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name="messages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String content;

    private Boolean read;

    private Long replyToStoryId;
    private String replyToStoryText;
    private String replyToStoryMedia;

    private Long sharedPostId;
    private Long sharedPostAuthorId;
    private String sharedPostAuthorName;
    private String sharedPostContent;
    private String sharedPostImage;
    private String sharedPostPollOptions;

    private LocalDateTime sentAt;

    @ManyToOne
    @JoinColumn(name="conversation_id")
    private Conversation conversation;

    @ManyToOne
    @JoinColumn(name="sender_id")
    private User sender;

}