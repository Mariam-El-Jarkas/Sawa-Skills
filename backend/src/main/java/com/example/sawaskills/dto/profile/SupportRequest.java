package com.example.sawaskills.dto.profile;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SupportRequest {
    @NotBlank(message = "Current email is required")
    @Email(message = "Invalid current email format")
    private String oldEmail;

    @NotBlank(message = "New email is required")
    @Email(message = "Invalid new email format")
    private String newEmail;

    @NotBlank(message = "Issue description is required")
    @Size(max = 2000, message = "Issue description must not exceed 2000 characters")
    private String issueDescription;
    
    // Identity verification details
    @NotBlank(message = "Join date is required")
    private String joinDate;

    @NotBlank(message = "Location is required")
    private String location;

    @NotBlank(message = "Feature usage details are required")
    private String usedFeatures;

    private String additionalProof;
}
