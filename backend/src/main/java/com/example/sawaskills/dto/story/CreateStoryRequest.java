package com.example.sawaskills.dto.story;

import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor
public class CreateStoryRequest {
    private String textContent;
    private String mediaBase64;
    private String pollQuestion;
    private String pollOptions;
    private int bgIndex;
}
