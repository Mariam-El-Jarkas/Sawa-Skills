package com.example.sawaskills.dto.auth;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegisterResponse {

    private Long userId;

    private String email;

    private String message;

}