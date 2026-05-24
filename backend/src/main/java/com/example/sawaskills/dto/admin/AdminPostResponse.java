package com.example.sawaskills.dto.admin;
import lombok.*;
import java.time.LocalDateTime;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AdminPostResponse {
    private Long id, authorId;
    private String content, imageUrl, authorName, authorEmail, visibility;
    private long likesCount, commentsCount, reportCount;
    private boolean adminHidden;
    private LocalDateTime createdAt;
}
