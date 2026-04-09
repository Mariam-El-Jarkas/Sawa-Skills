package com.example.sawaskills.dto.profile;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ConfirmEmailChangeRequest {
    @NotBlank(message = "OTP is required")
    private String otp;
}
