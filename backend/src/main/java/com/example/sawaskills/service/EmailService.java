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

    @Value("${resend.from.email}")
    private String fromEmail;

    @Value("${app.support.email}")
    private String supportEmail;

    @Value("${app.base-url}")
    private String baseUrl;

    public void sendOtpEmail(String email, String otpCode) {
        String html = buildCodeEmail(
            "Verify Your Email",
            "Welcome to SawaSkills! Use the code below to verify your email address and activate your account.",
            otpCode,
            "This code expires in <strong style='color:#4b5563;'>10 minutes</strong>. If you didn't create an account, you can safely ignore this email."
        );
        sendEmail(email, "Verify your email for SawaSkills", html);
    }

    public void sendParentApprovalEmail(String parentEmail, String childName, String token) {
        String approveLink = baseUrl + "/api/verification/minor/parent-decision?token=" + token + "&decision=APPROVE";
        String rejectLink  = baseUrl + "/api/verification/minor/parent-decision?token=" + token + "&decision=REJECT";

        String html = buildActionEmail(
            "Parental Permission Requested",
            "Your child, <strong>" + childName + "</strong>, has requested to join SawaSkills.",
            "SawaSkills is a safe community for sharing skills. As they are under 16, we require your permission before their account is activated.",
            "Approve Account", approveLink,
            "Decline", rejectLink,
            "This link expires in <strong>48 hours</strong>. If you did not expect this email, you can safely ignore it."
        );

        sendEmail(parentEmail, "Action Required: Parental Permission for " + childName, html);
    }

    public void sendParentActionApprovalEmail(String parentEmail, String childName,
                                               String actionType, String context, String token) {
        String approveLink = baseUrl + "/api/parent-approval/" + token + "?decision=APPROVE";
        String declineLink  = baseUrl + "/api/parent-approval/" + token + "?decision=DECLINE";

        String actionLabel = switch (actionType) {
            case "SWAP_REQUEST"    -> "request a skill swap";
            case "SWAP_ACCEPT"     -> "accept a skill swap request";
            case "SESSION_JOIN"    -> "join a volunteer session";
            case "VOLUNTEER_APPLY" -> "apply to become a Volunteer";
            default                -> "perform an action";
        };

        String html = buildActionEmail(
            "Parental Approval Required",
            "Your child, <strong>" + childName + "</strong>, is requesting to <strong>" + actionLabel + "</strong> on SawaSkills.",
            context,
            "Approve", approveLink,
            "Decline", declineLink,
            "This link expires in <strong>48 hours</strong>. If you did not expect this email, you can safely ignore it."
        );

        sendEmail(parentEmail, "Action Required: Approve your child's request on SawaSkills", html);
    }

    public void sendSupportRequestEmail(com.example.sawaskills.dto.profile.SupportRequest request, String ipAddress) {
        String html = buildInfoEmail(
            "Account Recovery Request",
            "A user has submitted an account recovery request and requires your attention.",
            "<strong>Old Email:</strong> " + request.getOldEmail() + "<br/><br/>"
            + "<strong>New Email:</strong> " + request.getNewEmail() + "<br/><br/>"
            + "<strong>Issue:</strong> " + request.getIssueDescription(),
            "Please review this request in the admin dashboard and respond within 48 hours."
        );
        sendEmail(supportEmail, "Action Required: Account Recovery Request", html);
    }

    public void sendRecoveryConfirmationEmail(String newEmail) {
        String html = buildInfoEmail(
            "Recovery Request Received",
            "We've received your account recovery request for <strong>" + newEmail + "</strong>.",
            "Our support team will review your request and get back to you within 1–2 business days. "
            + "You'll receive an email at this address once a decision has been made.",
            "If you did not submit this request, please contact us immediately at " + supportEmail + "."
        );
        sendEmail(newEmail, "Recovery request received – SawaSkills", html);
    }

    public void sendEmailChangeOtp(String newEmail, String otpCode) {
        String html = buildCodeEmail(
            "Confirm Your New Email",
            "You requested to change your SawaSkills email address. Enter the code below to confirm your new email.",
            otpCode,
            "This code expires in <strong style='color:#4b5563;'>10 minutes</strong>. If you did not request this change, please secure your account immediately."
        );
        sendEmail(newEmail, "Verify your new email address – SawaSkills", html);
    }

    public void sendConfirmIdentityOtp(String currentEmail, String otpCode) {
        String html = buildCodeEmail(
            "Confirm Your Identity",
            "We need to verify it's really you before making changes to your SawaSkills account.",
            otpCode,
            "This code expires in <strong style='color:#4b5563;'>10 minutes</strong>. If you didn't request this, you can safely ignore this email."
        );
        sendEmail(currentEmail, "Confirm your identity – SawaSkills", html);
    }

    public void sendPasswordResetEmail(String email, String otpCode) {
        String html = buildCodeEmail(
            "Reset Your Password",
            "We received a request to reset your SawaSkills password. Use the code below to continue. If you didn't request this, you can safely ignore this email.",
            otpCode,
            "This code expires in <strong style='color:#4b5563;'>10 minutes</strong>."
        );
        sendEmail(email, "Reset your SawaSkills password", html);
    }

    // ── Reusable approval email template (approve / decline buttons) ─────────

    private String buildActionEmail(String title, String body, String context,
                                    String approveTxt, String approveUrl,
                                    String declineTxt, String declineUrl,
                                    String note) {
        return """
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8"/>
          <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
          <meta name="color-scheme" content="light dark"/>
          <style>
            @media (prefers-color-scheme: dark) {
              .bg-page  { background-color: #0d0720 !important; }
              .bg-card  { background-color: #150a2e !important; border-color: #2d1b5e !important; }
              .txt-head { color: #ede9fe !important; }
              .txt-body { color: #a78bfa !important; }
              .txt-ctx  { color: #7c6ba8 !important; }
              .ctx-box  { background-color: #1e0d47 !important; border-color: #4c1d95 !important; }
              .txt-note { color: #7c6ba8 !important; }
              .divider  { border-top-color: #2d1b5e !important; }
              .footer   { color: #4c3880 !important; }
            }
          </style>
        </head>
        <body style="margin:0;padding:0;background-color:#f5f3ff;" class="bg-page">
          <table width="100%%" cellpadding="0" cellspacing="0" style="background-color:#f5f3ff;" class="bg-page">
            <tr>
              <td align="center" style="padding:48px 20px;">
                <table width="100%%" cellpadding="0" cellspacing="0"
                       style="max-width:480px;background:#ffffff;border-radius:20px;
                              border:1px solid #ede9fe;overflow:hidden;"
                       class="bg-card">

                  <!-- Purple header -->
                  <tr>
                    <td align="center"
                        style="background:linear-gradient(135deg,#7c3aed 0%%,#5b21b6 100%%);
                               padding:36px 32px;">
                      <table cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center"
                              style="width:60px;height:60px;
                                     background:rgba(255,255,255,0.15);
                                     border-radius:16px;border:1.5px solid rgba(255,255,255,0.25);">
                            <span style="display:block;font-size:30px;font-weight:900;
                                         color:#ffffff;font-family:Arial,sans-serif;
                                         line-height:60px;letter-spacing:-1px;">S</span>
                          </td>
                        </tr>
                      </table>
                      <p style="margin:12px 0 0;font-family:Arial,sans-serif;
                                font-size:13px;letter-spacing:2.5px;color:rgba(255,255,255,0.85);
                                text-transform:uppercase;font-weight:600;">SawaSkills</p>
                    </td>
                  </tr>

                  <!-- Body -->
                  <tr>
                    <td align="center" style="padding:40px 40px 32px;font-family:Arial,sans-serif;">
                      <h1 class="txt-head"
                          style="margin:0 0 12px;font-size:22px;font-weight:800;
                                 color:#1e0a3c;letter-spacing:-0.3px;">%s</h1>
                      <p class="txt-body"
                         style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;">%s</p>

                      <!-- Context pill -->
                      <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
                        <tr>
                          <td align="center" class="ctx-box"
                              style="background:#f5f3ff;border:1.5px solid #ddd6fe;
                                     border-radius:12px;padding:12px 28px;">
                            <span class="txt-ctx"
                                  style="font-size:14px;color:#6b7280;font-family:Arial,sans-serif;">%s</span>
                          </td>
                        </tr>
                      </table>

                      <!-- Action buttons -->
                      <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;" width="320">
                        <tr>
                          <td style="padding-right:10px;" nowrap="nowrap">
                            <a href="%s"
                               style="display:inline-block;padding:13px 24px;
                                      background:#7c3aed;color:#ffffff;
                                      text-decoration:none;border-radius:10px;
                                      font-weight:700;font-size:15px;
                                      font-family:Arial,sans-serif;
                                      white-space:nowrap;">%s</a>
                          </td>
                          <td nowrap="nowrap">
                            <a href="%s"
                               style="display:inline-block;padding:13px 24px;
                                      background:#5b21b6;color:#ffffff;
                                      text-decoration:none;border-radius:10px;
                                      font-weight:700;font-size:15px;
                                      font-family:Arial,sans-serif;
                                      white-space:nowrap;">%s</a>
                          </td>
                        </tr>
                      </table>

                      <p class="txt-note"
                         style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6;">%s</p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td class="divider"
                        style="border-top:1px solid #f3f4f6;padding:20px 40px;
                               text-align:center;font-family:Arial,sans-serif;">
                      <p class="footer"
                         style="margin:0;font-size:12px;color:#d1d5db;letter-spacing:0.3px;">
                        © 2026 SawaSkills &nbsp;·&nbsp; Learn · Build · Grow
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
        """.formatted(title, body, context, approveUrl, approveTxt, declineUrl, declineTxt, note);
    }

    // ── Reusable info email template (no code, no buttons) ───────────────────

    private String buildInfoEmail(String title, String intro, String body, String note) {
        return """
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8"/>
          <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
          <meta name="color-scheme" content="light dark"/>
          <style>
            @media (prefers-color-scheme: dark) {
              .bg-page  { background-color: #0d0720 !important; }
              .bg-card  { background-color: #150a2e !important; border-color: #2d1b5e !important; }
              .txt-head { color: #ede9fe !important; }
              .txt-intro{ color: #a78bfa !important; }
              .txt-body { color: #c4b5fd !important; }
              .body-box  { background-color: #1e0d47 !important; border-color: #4c1d95 !important; }
              .txt-note { color: #7c6ba8 !important; }
              .divider  { border-top-color: #2d1b5e !important; }
              .footer   { color: #4c3880 !important; }
            }
          </style>
        </head>
        <body style="margin:0;padding:0;background-color:#f5f3ff;" class="bg-page">
          <table width="100%%" cellpadding="0" cellspacing="0" style="background-color:#f5f3ff;" class="bg-page">
            <tr>
              <td align="center" style="padding:48px 20px;">
                <table width="100%%" cellpadding="0" cellspacing="0"
                       style="max-width:480px;background:#ffffff;border-radius:20px;
                              border:1px solid #ede9fe;overflow:hidden;"
                       class="bg-card">

                  <!-- Purple header -->
                  <tr>
                    <td align="center"
                        style="background:linear-gradient(135deg,#7c3aed 0%%,#5b21b6 100%%);
                               padding:36px 32px;">
                      <table cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center"
                              style="width:60px;height:60px;
                                     background:rgba(255,255,255,0.15);
                                     border-radius:16px;border:1.5px solid rgba(255,255,255,0.25);">
                            <span style="display:block;font-size:30px;font-weight:900;
                                         color:#ffffff;font-family:Arial,sans-serif;
                                         line-height:60px;letter-spacing:-1px;">S</span>
                          </td>
                        </tr>
                      </table>
                      <p style="margin:12px 0 0;font-family:Arial,sans-serif;
                                font-size:13px;letter-spacing:2.5px;color:rgba(255,255,255,0.85);
                                text-transform:uppercase;font-weight:600;">SawaSkills</p>
                    </td>
                  </tr>

                  <!-- Body -->
                  <tr>
                    <td style="padding:40px 40px 32px;font-family:Arial,sans-serif;">
                      <h1 class="txt-head"
                          style="margin:0 0 10px;font-size:22px;font-weight:800;
                                 color:#1e0a3c;letter-spacing:-0.3px;text-align:center;">%s</h1>
                      <p class="txt-intro"
                         style="margin:0 0 24px;font-size:15px;color:#374151;
                                line-height:1.7;text-align:center;">%s</p>

                      <!-- Body box -->
                      <table cellpadding="0" cellspacing="0" width="100%%" style="margin-bottom:28px;">
                        <tr>
                          <td class="body-box"
                              style="background:#f9f7ff;border:1px solid #ede9fe;
                                     border-radius:12px;padding:18px 20px;">
                            <p class="txt-body"
                               style="margin:0;font-size:14px;color:#4b5563;line-height:1.8;">%s</p>
                          </td>
                        </tr>
                      </table>

                      <p class="txt-note"
                         style="margin:0;font-size:13px;color:#9ca3af;
                                line-height:1.6;text-align:center;">%s</p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td class="divider"
                        style="border-top:1px solid #f3f4f6;padding:20px 40px;
                               text-align:center;font-family:Arial,sans-serif;">
                      <p class="footer"
                         style="margin:0;font-size:12px;color:#d1d5db;letter-spacing:0.3px;">
                        © 2026 SawaSkills &nbsp;·&nbsp; Learn · Build · Grow
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
        """.formatted(title, intro, body, note);
    }

    // ── Reusable professional email template ─────────────────────────────────

    private String buildCodeEmail(String title, String body, String code, String note) {
        return """
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8"/>
          <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
          <meta name="color-scheme" content="light dark"/>
          <style>
            /* ── Dark mode overrides ──────────────────────────────────────── */
            @media (prefers-color-scheme: dark) {
              .bg-page  { background-color: #0d0720 !important; }
              .bg-card  { background-color: #150a2e !important; border-color: #2d1b5e !important; }
              .txt-head { color: #ede9fe !important; }
              .txt-body { color: #a78bfa !important; }
              .txt-note { color: #7c6ba8 !important; }
              .code-box { background-color: #1e0d47 !important; border-color: #4c1d95 !important; }
              .code-txt { color: #c4b5fd !important; }
              .divider  { border-top-color: #2d1b5e !important; }
              .footer   { color: #4c3880 !important; }
            }
          </style>
        </head>
        <body style="margin:0;padding:0;background-color:#f5f3ff;" class="bg-page">
          <table width="100%%" cellpadding="0" cellspacing="0" style="background-color:#f5f3ff;" class="bg-page">
            <tr>
              <td align="center" style="padding:48px 20px;">
                <table width="100%%" cellpadding="0" cellspacing="0"
                       style="max-width:480px;background:#ffffff;border-radius:20px;
                              border:1px solid #ede9fe;overflow:hidden;"
                       class="bg-card">

                  <!-- ── Purple header ──────────────────────────────────── -->
                  <tr>
                    <td align="center"
                        style="background:linear-gradient(135deg,#7c3aed 0%%,#5b21b6 100%%);
                               padding:36px 32px;">
                      <!-- Logo pill -->
                      <table cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center"
                              style="width:60px;height:60px;
                                     background:rgba(255,255,255,0.15);
                                     border-radius:16px;border:1.5px solid rgba(255,255,255,0.25);">
                            <span style="display:block;font-size:30px;font-weight:900;
                                         color:#ffffff;font-family:Arial,sans-serif;
                                         line-height:60px;letter-spacing:-1px;">S</span>
                          </td>
                        </tr>
                      </table>
                      <p style="margin:12px 0 0;font-family:Arial,sans-serif;
                                font-size:13px;letter-spacing:2.5px;color:rgba(255,255,255,0.85);
                                text-transform:uppercase;font-weight:600;">SawaSkills</p>
                    </td>
                  </tr>

                  <!-- ── Body ──────────────────────────────────────────── -->
                  <tr>
                    <td align="center" style="padding:40px 40px 32px;font-family:Arial,sans-serif;">
                      <h1 class="txt-head"
                          style="margin:0 0 10px;font-size:22px;font-weight:800;
                                 color:#1e0a3c;letter-spacing:-0.3px;">%s</h1>
                      <p class="txt-body"
                         style="margin:0 0 32px;font-size:15px;color:#6b7280;line-height:1.7;">%s</p>

                      <!-- Code box -->
                      <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
                        <tr>
                          <td align="center" class="code-box"
                              style="background:#f5f3ff;border:2px solid #ddd6fe;
                                     border-radius:14px;padding:20px 40px;">
                            <span class="code-txt"
                                  style="font-size:38px;font-weight:900;letter-spacing:12px;
                                         color:#7c3aed;font-family:'Courier New',Courier,monospace;">%s</span>
                          </td>
                        </tr>
                      </table>

                      <p class="txt-note"
                         style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6;">%s</p>
                    </td>
                  </tr>

                  <!-- ── Footer ─────────────────────────────────────────── -->
                  <tr>
                    <td class="divider"
                        style="border-top:1px solid #f3f4f6;padding:20px 40px;
                               text-align:center;font-family:Arial,sans-serif;">
                      <p class="footer"
                         style="margin:0;font-size:12px;color:#d1d5db;letter-spacing:0.3px;">
                        © 2026 SawaSkills &nbsp;·&nbsp; Learn · Build · Grow
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
        """.formatted(title, body, code, note);
    }

    private void sendEmail(String email, String subject, String html) {
        try {
            JSONObject body = new JSONObject();
            body.put("from", "SawaSkills <" + fromEmail + ">");
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