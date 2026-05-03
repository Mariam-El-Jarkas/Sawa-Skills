package com.example.sawaskills.dto.story;

import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor
public class CreateStoryRequest {
    private String textContent;
    private String mediaBase64;
}
