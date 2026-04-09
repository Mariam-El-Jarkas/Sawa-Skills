package com.example.sawaskills.dto.profile;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class UpdateContactRequest {
    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^(\\+961|0?)(3|7[01689]|81)\\d{6}$", message = "Invalid Lebanese phone number format")
    private String phone;
}
