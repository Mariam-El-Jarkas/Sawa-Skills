package com.example.sawaskills.dto.swaps;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateSwapRequest {

    @NotNull(message = "Receiver ID is required")
    private Long receiverId;

    @NotBlank(message = "Offered skill is required")
    @Size(max = 200, message = "Offered skill must be under 200 characters")
    private String offeredSkill;

    @NotBlank(message = "Wanted skill is required")
    @Size(max = 200, message = "Wanted skill must be under 200 characters")
    private String wantedSkill;

    @Size(max = 100, message = "Preferred time must be under 100 characters")
    private String preferredTime;

    @Size(max = 500, message = "Note must be under 500 characters")
    private String note;
    
    private Long listingId;
}
