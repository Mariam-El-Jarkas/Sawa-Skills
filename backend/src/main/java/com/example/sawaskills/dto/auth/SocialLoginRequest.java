package com.example.sawaskills.dto.auth;

import lombok.Data;

@Data
public class SocialLoginRequest {
    private String provider;     // "GOOGLE", "FACEBOOK", or "GITHUB"
    private String accessToken;  // access token for Google/Facebook, auth code for GitHub
    private String redirectUri;  // required for GitHub token exchange
}
