package com.example.sawaskills.dto.home;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrendingSkillResponse {
    private String name;
    private Long swapCount;
}
