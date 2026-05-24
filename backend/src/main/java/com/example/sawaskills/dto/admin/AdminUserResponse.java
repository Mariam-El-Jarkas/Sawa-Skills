package com.example.sawaskills.dto.admin;
import lombok.*;
import java.time.LocalDateTime;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AdminUserResponse {
    private Long id;
    private String name, email, role, accountStatus, locationCity;
    private Boolean verified;
    private LocalDateTime createdAt;
    private long reportCount;
}
