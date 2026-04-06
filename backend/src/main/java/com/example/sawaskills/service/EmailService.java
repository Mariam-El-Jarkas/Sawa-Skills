package com.example.sawaskills.service;

import kong.unirest.Unirest;
import kong.unirest.HttpResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Value("${resend.api.key}")
    private String apiKey;

    public void sendOtpEmail(String email, String otpCode) {

        String html = """
        <div style="background:#f5f3ff;padding:40px;font-family:Arial,sans-serif;">
            <div style="max-width:500px;margin:auto;background:white;padding:30px;border-radius:12px;text-align:center;">

                <h2 style="color:#7c3aed;">Welcome to SawaSkills</h2>

                <p style="color:#555;font-size:16px;">
                    Verify your email using the code below
                </p>

                <div style="
                    margin:30px auto;
                    padding:20px;
                    width:240px;
                    border-radius:10px;
                    background:#ede9fe;
                    font-size:32px;
                    letter-spacing:8px;
                    color:#7c3aed;
                    font-weight:bold;">
                    %s
                </div>

                <p style="color:#555;">
                    This code expires in <b>2 minutes</b>.
                </p>

                <p style="color:#888;font-size:14px;">
                    Never share this code with anyone.
                </p>

                <hr style="margin:30px 0;border:none;border-top:1px solid #eee;">

                <p style="font-size:12px;color:#999;">
                    If you did not create this account, you can safely ignore this email.
                </p>

                <p style="font-size:12px;color:#aaa;">
                    © 2026 SawaSkills
                </p>

            </div>
        </div>
        """.formatted(otpCode);

        sendEmail(email, "Verify your email for SawaSkills", html);
    }

    public void sendPasswordResetEmail(String email, String token) {

        String resetLink = "http://localhost:3000/reset-password?token=" + token;

        String html = """
        <div style="background:#f5f3ff;padding:40px;font-family:Arial,sans-serif;">
            <div style="max-width:500px;margin:auto;background:white;padding:30px;border-radius:12px;text-align:center;">

                <h2 style="color:#7c3aed;">Reset your password</h2>

                <p style="color:#555;font-size:16px;">
                    Click the button below to reset your password.
                </p>

                <a href="%s"
                   style="display:inline-block;
                          margin-top:25px;
                          padding:14px 28px;
                          background:#7c3aed;
                          color:white;
                          text-decoration:none;
                          border-radius:8px;
                          font-weight:bold;">
                    Reset Password
                </a>

                <p style="color:#555;margin-top:20px;">
                    This link expires in 15 minutes.
                </p>

                <hr style="margin:30px 0;border:none;border-top:1px solid #eee;">

                <p style="font-size:12px;color:#999;">
                    If you did not request a password reset you can ignore this email.
                </p>

                <p style="font-size:12px;color:#aaa;">
                    © 2026 SawaSkills
                </p>

            </div>
        </div>
        """.formatted(resetLink);

        sendEmail(email, "Reset your SawaSkills password", html);
    }

    private void sendEmail(String email, String subject, String html) {

        try {

            HttpResponse<String> response = Unirest.post("https://api.resend.com/emails")
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .body("{"
                            + "\"from\":\"SawaSkills <onboarding@resend.dev>\","
                            + "\"to\":\"" + email + "\","
                            + "\"subject\":\"" + subject + "\","
                            + "\"html\":\"" + html.replace("\"","\\\"").replace("\n","") + "\""
                            + "}")
                    .asString();

            System.out.println("EMAIL STATUS: " + response.getStatus());
            System.out.println("EMAIL RESPONSE: " + response.getBody());

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}