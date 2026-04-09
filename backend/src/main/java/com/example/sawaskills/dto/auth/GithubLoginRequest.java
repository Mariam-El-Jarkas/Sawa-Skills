package com.example.sawaskills.dto.auth;

import lombok.Data;

@Data
public class GithubLoginRequest {
    private String code;
    private String redirectUri;
}
