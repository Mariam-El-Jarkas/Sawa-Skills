package com.example.sawaskills.controller;

import com.example.sawaskills.dto.verification.MinorVerificationRequest;
import com.example.sawaskills.service.VerificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/verification")
@RequiredArgsConstructor
public class VerificationController {

    private final VerificationService verificationService;

    @PostMapping("/minor/request")
    public ResponseEntity<String> requestMinorVerification(
            Principal principal,
            @RequestBody MinorVerificationRequest request) {

        return ResponseEntity.ok(verificationService.requestMinorVerification(principal.getName(), request));
    }

    @GetMapping("/minor/approve")
    public ResponseEntity<String> approveMinor(@RequestParam String token) {
        try {
            verificationService.approveMinor(token);
            String html = """
                <!DOCTYPE html>
                <html lang="en">
                <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
                <title>Account Approved – SawaSkills</title>
                <style>
                  *{margin:0;padding:0;box-sizing:border-box}
                  body{font-family:Arial,sans-serif;background:#f5f3ff;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px}
                  .card{background:#fff;border-radius:16px;padding:40px 32px;max-width:420px;width:100%;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,.08)}
                  .icon{font-size:64px;margin-bottom:16px}
                  h1{color:#7c3aed;font-size:24px;margin-bottom:12px}
                  p{color:#555;font-size:15px;line-height:1.6}
                  .badge{display:inline-block;margin-top:20px;padding:10px 24px;background:#7c3aed;color:#fff;border-radius:8px;font-weight:700;font-size:14px}
                </style>
                </head>
                <body>
                  <div class="card">
                    <div class="icon">✅</div>
                    <h1>Account Approved!</h1>
                    <p>You have successfully approved your child's SawaSkills account.<br><br>
                    Their account is now fully active and they can access all features.</p>
                    <div class="badge">SawaSkills</div>
                  </div>
                </body>
                </html>
                """;
            return ResponseEntity.ok()
                    .header("Content-Type", "text/html; charset=UTF-8")
                    .body(html);
        } catch (Exception e) {
            String html = """
                <!DOCTYPE html>
                <html lang="en">
                <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
                <title>Error – SawaSkills</title>
                <style>
                  *{margin:0;padding:0;box-sizing:border-box}
                  body{font-family:Arial,sans-serif;background:#f5f3ff;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px}
                  .card{background:#fff;border-radius:16px;padding:40px 32px;max-width:420px;width:100%;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,.08)}
                  .icon{font-size:64px;margin-bottom:16px}
                  h1{color:#dc2626;font-size:24px;margin-bottom:12px}
                  p{color:#555;font-size:15px;line-height:1.6}
                </style>
                </head>
                <body>
                  <div class="card">
                    <div class="icon">❌</div>
                    <h1>Link Expired or Invalid</h1>
                    <p>This approval link is no longer valid.<br><br>
                    It may have already been used or has expired (24 hours). Please ask your child to send a new request.</p>
                  </div>
                </body>
                </html>
                """;
            return ResponseEntity.badRequest()
                    .header("Content-Type", "text/html; charset=UTF-8")
                    .body(html);
        }
    }
}