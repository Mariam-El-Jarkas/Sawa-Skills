package com.example.sawaskills.dto.post;

import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class PostResponse {
    private Long id;
    private Long authorId;
    private String authorName;
    private String authorInitials;
    private String authorPicture;
    private String content;
    private String imageUrl;
    private String documentUrl;
    private String pollQuestion;
    private String pollOptions;
    private String visibility;
    private String createdAt;
    private long likeCount;
    private long commentCount;
    private boolean isLiked;
    private boolean isMine;
    private boolean isML;
    private java.util.Map<String, Long> pollResults;
    private String userPollVote;
}
