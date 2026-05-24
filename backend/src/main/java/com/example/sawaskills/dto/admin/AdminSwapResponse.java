package com.example.sawaskills.dto.admin;
import lombok.*;
import java.time.LocalDateTime;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AdminSwapResponse {
    private Long id;
    private String requesterName, requesterEmail, receiverName, receiverEmail;
    private String offeredSkill, wantedSkill, status;
    private LocalDateTime createdAt, updatedAt;
}
