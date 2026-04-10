package com.example.sawaskills.dto.chat;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class StartConversationRequest {

    @NotNull(message = "Other user ID is required")
    private Long otherUserId;
}
