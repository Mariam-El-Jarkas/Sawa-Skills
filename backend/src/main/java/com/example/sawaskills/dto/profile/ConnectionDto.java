package com.example.sawaskills.dto.profile;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ConnectionDto {
    private Long id;
    private Long otherUserId;
    private String otherUserName;
    private String avatarInitials;
    private List<String> skills; // other user's offered skills
}
