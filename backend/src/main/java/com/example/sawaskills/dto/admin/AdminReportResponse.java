package com.example.sawaskills.dto.admin;
import lombok.*;
import java.time.LocalDateTime;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AdminReportResponse {
    private Long id, postId;
    private String reason, status, reporterName, reporterEmail, postContent, postAuthorName;
    private LocalDateTime createdAt;
}
