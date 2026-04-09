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

    public void sendParentApprovalEmail(String parentEmail, String token) {

    String link = "http://localhost:8080/api/verification/minor/approve?token=" + token;

    String html = """
        <div style="background:#f5f3ff;padding:40px;font-family:Arial;">
            <div style="max-width:500px;margin:auto;background:white;padding:30px;border-radius:12px;text-align:center;">

                <h2 style="color:#7c3aed;">SawaSkills Minor Account Approval</h2>

                <p>Your child requested to create a SawaSkills account.</p>

                <p>Please approve their account by clicking below.</p>

                <a href="%s"
                   style="display:inline-block;
                          margin-top:20px;
                          padding:14px 28px;
                          background:#7c3aed;
                          color:white;
                          text-decoration:none;
                          border-radius:8px;">
                    Approve Account
                </a>

                <p style="margin-top:20px;font-size:12px;color:#777;">
                    This link expires in 24 hours.
                </p>

            </div>
        </div>
        """.formatted(link);

    sendEmail(parentEmail, "Approve your child's SawaSkills account", html);
}
    public void sendEmailChangeOtp(String newEmail, String otpCode) {
        String html = """
        <div style="background:#f5f3ff;padding:40px;font-family:Arial,sans-serif;">
            <div style="max-width:500px;margin:auto;background:white;padding:30px;border-radius:12px;text-align:center;">
                <h2 style="color:#7c3aed;">Confirm your new email</h2>
                <p style="color:#555;font-size:16px;">
                    Use the code below to verify your new email address on SawaSkills.
                </p>
                <div style="margin:30px auto;padding:20px;width:240px;border-radius:10px;background:#ede9fe;font-size:32px;letter-spacing:8px;color:#7c3aed;font-weight:bold;">
                    %s
                </div>
                <p style="color:#555;">This code expires in <b>15 minutes</b>.</p>
                <p style="color:#888;font-size:14px;">Verification code for your <b>new</b> email address.</p>
                <hr style="margin:30px 0;border:none;border-top:1px solid #eee;">
                <p style="font-size:12px;color:#aaa;">© 2026 SawaSkills</p>
            </div>
        </div>
        """.formatted(otpCode);

        sendEmail(newEmail, "Verify your NEW email address – SawaSkills", html);
    }

    public void sendConfirmIdentityOtp(String currentEmail, String otpCode) {
        String html = """
        <div style="background:#f5f3ff;padding:40px;font-family:Arial,sans-serif;">
            <div style="max-width:500px;margin:auto;background:white;padding:30px;border-radius:12px;text-align:center;">
                <h2 style="color:#7c3aed;">Verify your identity</h2>
                <p style="color:#555;font-size:16px;">
                    You requested to change your email. Please verify that this is you by using the code below.
                </p>
                <div style="margin:30px auto;padding:20px;width:240px;border-radius:10px;background:#ede9fe;font-size:32px;letter-spacing:8px;color:#7c3aed;font-weight:bold;">
                    %s
                </div>
                <p style="color:#555;">This code expires in <b>10 minutes</b>.</p>
                <p style="color:#888;font-size:14px;">Verification code for your <b>current</b> email address.</p>
                <hr style="margin:30px 0;border:none;border-top:1px solid #eee;">
                <p style="font-size:12px;color:#aaa;">© 2026 SawaSkills</p>
            </div>
        </div>
        """.formatted(otpCode);

        sendEmail(currentEmail, "Confirm your identity – SawaSkills", html);
    }

    public void sendSupportRequestEmail(com.example.sawaskills.dto.profile.SupportRequest request, String ipAddress) {
        String proofHtml = "";
        if (request.getAdditionalProof() != null && request.getAdditionalProof().startsWith("data:image")) {
            proofHtml = """
                <div style="margin-top:20px;padding:15px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;">
                    <p style="margin:0 0 10px 0;font-weight:bold;color:#1e293b;">Uploaded Proof Attachment:</p>
                    <img src="%s" style="max-width:100%%;border-radius:8px;box-shadow:0 4px 6px -1px rgb(0 0 0 / 0.1);" />
                </div>
                """.formatted(request.getAdditionalProof());
        } else if (request.getAdditionalProof() != null && !request.getAdditionalProof().isEmpty()) {
            proofHtml = "<p style=\"margin-top:20px;\"><b>Additional Proof Description:</b> %s</p>".formatted(request.getAdditionalProof());
        }

        String html = """
        <div style="background:#f9fafb;padding:40px;font-family:Arial,sans-serif;">
            <div style="max-width:600px;margin:auto;background:white;padding:30px;border-radius:12px;border:1px solid #e5e7eb;">
                <h2 style="color:#7c3aed;border-bottom:2px solid #f3f4f6;padding-bottom:10px;">Account Recovery Request</h2>
                
                <div style="margin-top:20px;">
                    <p><b>Current Email:</b> %s</p>
                    <p><b>New Email Target:</b> %s</p>
                    <p><b>Issue Description:</b> %s</p>
                </div>
                
                <div style="margin-top:30px;padding:20px;background:#fefce8;border-radius:8px;border:1px solid #fef08a;">
                    <h3 style="color:#a16207;margin-top:0;">Identity Verification Data</h3>
                    <p><b>Approx. Join Date:</b> %s</p>
                    <p><b>Registered Location:</b> %s</p>
                    <p><b>Used Features:</b> %s</p>
                    <p><b>Client Metadata (IP):</b> <code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;">%s</code></p>
                </div>
                
                %s
                
                <p style="margin-top:30px;font-size:14px;color:#6b7280;">
                    Review this request manually and verify against the user's new email confirmation status.
                </p>
            </div>
        </div>
        """.formatted(
            request.getOldEmail(),
            request.getNewEmail(),
            request.getIssueDescription(),
            request.getJoinDate(),
            request.getLocation(),
            request.getUsedFeatures(),
            ipAddress,
            proofHtml
        );

        sendEmail("support@sawaskills.com", "Action Required: Account Recovery Request", html);
    }

    public void sendRecoveryConfirmationEmail(String newEmail) {
        String html = """
        <div style="background:#f5f3ff;padding:40px;font-family:Arial,sans-serif;">
            <div style="max-width:500px;margin:auto;background:white;padding:30px;border-radius:12px;text-align:center;">
                <h2 style="color:#7c3aed;">Confirm your recovery email</h2>
                <p style="color:#555;font-size:16px;">
                    You've been listed as the new email for a SawaSkills account recovery.
                </p>
                <p style="color:#555;">To confirm you own this inbox and help us verify your request, please use the reference code below in our manual review process:</p>
                <div style="margin:30px auto;padding:20px;width:240px;border-radius:10px;background:#ede9fe;font-size:32px;letter-spacing:8px;color:#7c3aed;font-weight:bold;">
                    OWNED
                </div>
                <p style="color:#888;font-size:14px;">Once confirmed, our team will proceed with the manual review.</p>
                <hr style="margin:30px 0;border:none;border-top:1px solid #eee;">
                <p style="font-size:12px;color:#aaa;">© 2026 SawaSkills</p>
            </div>
        </div>
        """;
        sendEmail(newEmail, "Confirm your email for SawaSkills Recovery", html);
    }

    public void sendPasswordResetEmail(String email, String otpCode) {

        String html = """
        <div style="background:#f5f3ff;padding:40px;font-family:Arial,sans-serif;">
            <div style="max-width:500px;margin:auto;background:white;padding:30px;border-radius:12px;text-align:center;">

                <h2 style="color:#7c3aed;">Reset your password</h2>

                <p style="color:#555;font-size:16px;">
                    Use the code below to reset your password in the app.
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
                    This code expires in <b>15 minutes</b>.
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
        """.formatted(otpCode);

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