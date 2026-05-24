package com.example.sawaskills.dto.admin;
import lombok.*;
import java.time.LocalDateTime;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AdminBroadcastResponse {
    private Long id;
    private String title, message, audience;
    private LocalDateTime sentAt;
    private Integer recipientCount;
}
