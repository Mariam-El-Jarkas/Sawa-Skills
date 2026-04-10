package com.example.sawaskills.dto.swaps;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateSwapRequest {

    @NotNull(message = "Receiver ID is required")
    private Long receiverId;

    @NotBlank(message = "Offered skill is required")
    private String offeredSkill;

    @NotBlank(message = "Wanted skill is required")
    private String wantedSkill;

    private String preferredTime;

    private String note;
}
