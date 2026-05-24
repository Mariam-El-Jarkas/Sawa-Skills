package com.example.sawaskills.dto.admin;
import lombok.*;
import java.time.LocalDateTime;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AdminSessionResponse {
    private Long id;
    private String title, description, organizerName, organizerEmail, status;
    private LocalDateTime sessionDate;
    private long participantCount;
    private Integer maxParticipants;
}
