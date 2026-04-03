package com.example.sawaskills.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class EmailService {

    @Value("${resend.api.key}")
    private String resendApiKey;

    @Value("${resend.from.email}")
    private String fromEmail;

    private final RestTemplate restTemplate = new RestTemplate();

    public void sendOtpEmail(String toEmail, String otpCode) {

        String url = "https://api.resend.com/emails";

        String htmlTemplate = 
            "<div style=\"background:#f5f3ff;padding:40px;font-family:Arial,sans-serif;\">" +
            "<div style=\"max-width:600px;margin:auto;background:white;border-radius:12px;padding:40px;text-align:center;\">" +
            "<h1 style=\"color:#6D28D9;margin-bottom:10px;font-size:24px;\">Welcome to SawaSkills</h1>" +
            "<p style=\"color:#444;font-size:16px;margin-bottom:30px;\">Verify your email using the code below</p>" +
            "<div style=\"background:#f5f3ff;border-radius:8px;padding:15px 20px;margin:20px 0;display:inline-block;border:1px solid #e0e0e0;\">" +
            "<span style=\"font-size:32px;font-weight:bold;letter-spacing:8px;color:#6D28D9;font-family:'Courier New',monospace;\">" +
            otpCode.charAt(0) + otpCode.charAt(1) + otpCode.charAt(2) + otpCode.charAt(3) + otpCode.charAt(4) + otpCode.charAt(5) +
            "</span>" +
            "</div>" +
            "<p style=\"font-size:14px;color:#666;margin-top:20px;\">This code expires in <b>2 minutes</b>.</p>" +
            "<p style=\"font-size:14px;color:#666;\">Never share this code with anyone.</p>" +
            "<hr style=\"margin:30px 0;border:none;border-top:1px solid #eee;\">" +
            "<p style=\"font-size:12px;color:#999;\">If you did not create this account, you can safely ignore this email.</p>" +
            "<p style=\"font-size:12px;color:#999;\">© 2026 SawaSkills</p>" +
            "</div>" +
            "</div>";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(resendApiKey);

        Map<String, Object> body = new HashMap<>();
        body.put("from", fromEmail);
        body.put("to", new String[]{toEmail});
        body.put("subject", "Verify your email for SawaSkills");
        body.put("html", htmlTemplate);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        restTemplate.postForEntity(url, request, String.class);
    }
}