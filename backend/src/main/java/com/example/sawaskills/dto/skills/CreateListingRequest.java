package com.example.sawaskills.dto.skills;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateListingRequest {

    @NotBlank(message = "Offered skill is required")
    @Size(max = 200)
    private String offeredSkill;

    // Optional when isFree = true (volunteers offering for free)
    @Size(max = 200)
    private String wantedSkill;

    private String location;

    @Pattern(regexp = "Remote|On-site", message = "Availability must be 'Remote' or 'On-site'")
    private String availability;

    @JsonProperty("isFree")
    private boolean isFree;
}
