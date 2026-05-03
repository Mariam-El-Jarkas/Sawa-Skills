package com.example.sawaskills.dto.post;

import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CommentResponse {
    private Long id;
    private Long authorId;
    private String authorName;
    private String authorInitials;
    private String content;
    private String createdAt;
    private boolean isMine;
    private long likeCount;
    private boolean isLiked;
}
