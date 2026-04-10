package com.example.sawaskills.dto.chat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SendMessageRequest {

    @NotBlank(message = "Message content cannot be empty")
    @Size(max = 2000, message = "Message must be under 2000 characters")
    private String content;
}
