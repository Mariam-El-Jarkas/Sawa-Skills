package com.example.sawaskills.dto.story;

import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class StoryResponse {
    private Long id;
    private Long userId;
    private String userName;
    private String userInitials;
    private String userPicture;
    private String textContent;
    private String mediaUrl;
    private String pollQuestion;
    private String pollOptions;
    private java.util.Map<String, Long> pollResults;
    private String userPollVote;
    private String createdAt;
    private String expiresAt;
    private boolean hasViewed;
    private boolean liked;
    private long likeCount;
    private int bgIndex;
}
