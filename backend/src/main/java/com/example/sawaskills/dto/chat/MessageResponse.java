package com.example.sawaskills.dto.chat;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageResponse {
    private Long id;
    private String content;
    private String sentAt;
    private Boolean isMe;
    private Long senderId;
    private String senderName;
    private Long replyToStoryId;
    private String replyToStoryText;
    private String replyToStoryMedia;
    private Long sharedPostId;
    private Long sharedPostAuthorId;
    private String sharedPostAuthorName;
    private String sharedPostContent;
    private String sharedPostImage;
    private String sharedPostPollOptions;
}
