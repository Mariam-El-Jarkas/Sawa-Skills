package com.example.sawaskills.dto.auth;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {

    private String name;
    private String email;
    private String phone;
    private String password;
    private String dateOfBirth;
    private String city;

}