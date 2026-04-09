package com.example.sawaskills.dto.profile;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RequestEmailChangeRequest {
    @NotBlank(message = "New email is required")
    @Email(message = "Invalid email format")
    private String newEmail;
}
