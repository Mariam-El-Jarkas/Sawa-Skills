package com.example.sawaskills.dto.skills;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AddUserSkillRequest {

    @NotBlank(message = "Skill name is required")
    @Size(max = 100, message = "Skill name must be under 100 characters")
    private String skillName;

    @Size(max = 300, message = "Description must be under 300 characters")
    private String description;

    private String category;
}
