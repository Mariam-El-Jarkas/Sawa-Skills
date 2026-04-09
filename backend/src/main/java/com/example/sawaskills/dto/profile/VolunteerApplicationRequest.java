package com.example.sawaskills.dto.profile;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VolunteerApplicationRequest {

    @NotBlank(message = "Please tell us why you want to volunteer")
    private String why;

    @NotBlank(message = "Please describe your relevant experience")
    private String experience;

    @NotBlank(message = "Please list the skills you want to share")
    private String skillsToShare;
}
