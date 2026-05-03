package com.example.sawaskills.dto.post;

import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor
public class CreatePostRequest {
    private String content;
    private String imageBase64;
    private String documentBase64;
    private String pollQuestion;
    private String pollOptions;
    private String visibility; // EVERYONE or FOLLOWERS
}
