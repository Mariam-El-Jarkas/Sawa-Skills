package com.example.sawaskills.dto.admin;
import lombok.*;
import java.time.LocalDateTime;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AdminCommentResponse {
    private Long id, authorId, postId;
    private String content, authorName, authorEmail;
    private long likeCount;
    private LocalDateTime createdAt;
}
