package com.example.sawaskills.dto.skills;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateListingRequest {

    @NotBlank(message = "Offered skill is required")
    private String offeredSkill;

    @NotBlank(message = "Wanted skill is required")
    private String wantedSkill;

    private String location;

    @Pattern(regexp = "Remote|On-site", message = "Availability must be 'Remote' or 'On-site'")
    private String availability;
}
