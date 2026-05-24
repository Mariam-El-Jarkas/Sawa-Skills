package com.example.sawaskills.dto.admin;
import lombok.*;
import java.util.List;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AdminSkillCategoryResponse {
    private Long id;
    private String name, description;
    private long skillCount;
    private List<AdminSkillDto> skills;
}
