package com.example.sawaskills.dto.admin;
import lombok.*;
import java.time.LocalDateTime;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AdminLogResponse {
    private Long id;
    private String action, actionType, description, ipAddress, userName, userEmail;
    private LocalDateTime createdAt;
}
