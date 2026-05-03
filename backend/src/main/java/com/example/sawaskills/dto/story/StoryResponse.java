package com.example.sawaskills.dto.story;

import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class StoryResponse {
    private Long id;
    private Long userId;
    private String userName;
    private String userInitials;
    private String userPicture;
    private String textContent;
    private String mediaUrl;
    private String createdAt;
    private String expiresAt;
    private boolean hasViewed;
}
