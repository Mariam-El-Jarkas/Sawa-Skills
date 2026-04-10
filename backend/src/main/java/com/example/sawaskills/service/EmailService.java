package com.example.sawaskills.service;

import kong.unirest.Unirest;
import kong.unirest.HttpResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.json.JSONObject;

@Service
public class EmailService {

    @Value("${resend.api.key}")
    private String apiKey;

    public void sendOtpEmail(String email, String otpCode) {
        String html = """
        <div style="background:#f5f3ff;padding:40px;font-family:Arial,sans-serif;">
            <div style="max-width:500px;margin:auto;background:white;padding:30px;border-radius:12px;text-align:center;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
                <h2 style="color:#7c3aed;">Welcome to SawaSkills</h2>
                <p style="color:#555;font-size:16px;">Verify your email using the code below</p>
                <div style="margin:30px auto;padding:20px;width:240px;border-radius:10px;background:#ede9fe;font-size:32px;letter-spacing:8px;color:#7c3aed;font-weight:bold;">
                    %s
                </div>
                <p style="color:#555;">This code expires in <b>10 minutes</b>.</p>
                <hr style="margin:30px 0;border:none;border-top:1px solid #eee;">
                <p style="font-size:12px;color:#aaa;">© 2026 SawaSkills</p>
            </div>
        </div>
        """.formatted(otpCode);
        sendEmail(email, "Verify your email for SawaSkills", html);
    }

    public void sendParentApprovalEmail(String parentEmail, String childName, String token) {
        String approveLink = "http://localhost:8080/api/verification/minor/parent-decision?token=" + token + "&decision=APPROVE";
        String rejectLink = "http://localhost:8080/api/verification/minor/parent-decision?token=" + token + "&decision=REJECT";

        String html = """
        <div style="background:#f5f3ff;padding:40px;font-family:Arial,sans-serif;">
            <div style="max-width:500px;margin:auto;background:white;padding:30px;border-radius:12px;text-align:center;border-top:5px solid #7c3aed;">
                <h2 style="color:#7c3aed;">Parental Permission Requested</h2>
                <p style="color:#374151;font-size:16px;">Your child, <b>%s</b>, has requested to join SawaSkills.</p>
                <p style="color:#6b7280;">SawaSkills is a community for sharing skills safely. As they are under 18, we require your permission.</p>
                <div style="margin-top:40px;display:flex;gap:10px;justify-content:center;">
                    <a href="%s" style="display:inline-block;padding:12px 24px;background:#7c3aed;color:white;text-decoration:none;border-radius:8px;font-weight:bold;">Approve Account</a>
                    <a href="%s" style="display:inline-block;padding:12px 24px;background:#ef4444;color:white;text-decoration:none;border-radius:8px;font-weight:bold;margin-left:10px;">Reject</a>
                </div>
                <p style="margin-top:30px;font-size:12px;color:#9ca3af;">This link will expire in 48 hours.</p>
            </div>
        </div>
        """.formatted(childName, approveLink, rejectLink);
        
        sendEmail(parentEmail, "Action Required: Parental Permission for " + childName, html);
    }

    public void sendSupportRequestEmail(com.example.sawaskills.dto.profile.SupportRequest request, String ipAddress) {
        String html = "<h2>Account Recovery Request</h2><p>Old Email: " + request.getOldEmail() + "</p><p>Issue: " + request.getIssueDescription() + "</p>";
        sendEmail("support@sawaskills.com", "Action Required: Account Recovery Request", html);
    }

    public void sendRecoveryConfirmationEmail(String newEmail) {
        String html = "<h2>Recovery Request Received</h2><p>We have received your recovery request for " + newEmail + ".</p>";
        sendEmail(newEmail, "Confirm your email for SawaSkills Recovery", html);
    }

    public void sendEmailChangeOtp(String newEmail, String otpCode) {
        String html = "<h2>Confirm your new email</h2><p>Code: <b>" + otpCode + "</b></p>";
        sendEmail(newEmail, "Verify your NEW email address – SawaSkills", html);
    }

    public void sendConfirmIdentityOtp(String currentEmail, String otpCode) {
        String html = "<h2>Verify your identity</h2><p>Code: <b>" + otpCode + "</b></p>";
        sendEmail(currentEmail, "Confirm your identity – SawaSkills", html);
    }

    public void sendPasswordResetEmail(String email, String otpCode) {
        String html = "<h2>Reset your password</h2><p>Code: <b>" + otpCode + "</b></p>";
        sendEmail(email, "Reset your SawaSkills password", html);
    }

    private void sendEmail(String email, String subject, String html) {
        try {
            JSONObject body = new JSONObject();
            body.put("from", "SawaSkills <onboarding@resend.dev>");
            body.put("to", email);
            body.put("subject", subject);
            body.put("html", html);

            HttpResponse<String> response = Unirest.post("https://api.resend.com/emails")
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .body(body.toString())
                    .asString();

            System.out.println("RESEND EMAIL STATUS: " + response.getStatus());
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}