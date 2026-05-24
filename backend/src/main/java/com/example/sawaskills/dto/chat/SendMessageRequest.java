package com.example.sawaskills.dto.chat;

import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SendMessageRequest {

    @Size(max = 2000, message = "Message must be under 2000 characters")
    private String content;

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
