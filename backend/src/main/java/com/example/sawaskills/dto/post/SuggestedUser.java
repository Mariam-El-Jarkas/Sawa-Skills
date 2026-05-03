package com.example.sawaskills.dto.post;

import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class SuggestedUser {
    private Long id;
    private String name;
    private String initials;
    private String profilePicture;
    private String bio;
}
