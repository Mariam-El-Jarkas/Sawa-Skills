package com.example.sawaskills.dto.auth;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class VerifyEmailRequest {

    private String email;
    private String otp;

}