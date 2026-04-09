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
public class UpdatePictureRequest {
    @NotBlank(message = "Image data is required")
    private String imageBase64; // data URL: "data:image/jpeg;base64,..."
}
