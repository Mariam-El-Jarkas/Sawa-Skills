package com.example.sawaskills.dto.post;

import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor
public class CreateCommentRequest {
    private String content;
    private Long parentCommentId;
}
