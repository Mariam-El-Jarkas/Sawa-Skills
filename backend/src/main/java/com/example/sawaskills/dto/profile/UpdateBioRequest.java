package com.example.sawaskills.dto.profile;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateBioRequest {
    @Size(max = 500, message = "Bio must not exceed 500 characters")
    private String bio;
}
