package com.example.sawaskills.dto.profile;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ReviewDto {
    private Long id;
    private String reviewerName;
    private Integer rating;
    private String comment;
    private LocalDateTime createdAt;
}
