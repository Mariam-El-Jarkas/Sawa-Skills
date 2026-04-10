package com.example.sawaskills.dto.skills;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSkillResponse {
    private Long id;
    private String skillName;
    private String category;
    private Boolean offering;
}
