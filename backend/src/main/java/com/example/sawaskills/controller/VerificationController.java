package com.example.sawaskills.controller;

import com.example.sawaskills.dto.verification.VerificationSubmission;
import com.example.sawaskills.entity.VerificationRequest;
import com.example.sawaskills.service.VerificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/verification")
@RequiredArgsConstructor
public class VerificationController {

    private final VerificationService verificationService;

    @Value("${app.admin.email}")
    private String adminEmail;

    // ── User endpoints ────────────────────────────────────────────────────────

    @PostMapping("/submit")
    public ResponseEntity<String> submit(Principal principal, @RequestBody VerificationSubmission submission) {
        verificationService.submitVerification(principal.getName(), submission);
        return ResponseEntity.ok("Verification request submitted successfully");
    }

    @GetMapping("/minor/parent-decision")
    public ResponseEntity<String> handleParentDecision(@RequestParam String token, @RequestParam String decision) {
        String message = verificationService.handleParentDecision(token, decision);
        String html = """
            <html>
              <body style="font-family:sans-serif;text-align:center;padding-top:100px;">
                <h2>%s</h2>
              </body>
            </html>
            """.formatted(escHtml(message));
        return ResponseEntity.ok().header("Content-Type", "text/html").body(html);
    }

    // ── Admin endpoints ───────────────────────────────────────────────────────

    @GetMapping("/admin/requests")
    public ResponseEntity<List<VerificationRequest>> getAllRequests(Principal principal) {
        requireAdmin(principal);
        return ResponseEntity.ok(verificationService.getAllRequests());
    }

    @PatchMapping("/admin/requests/{id}/status")
    public ResponseEntity<String> updateStatus(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> body,
            Principal principal) {
        requireAdmin(principal);
        String status = body.get("status");
        verificationService.updateStatus(id, status);
        return ResponseEntity.ok("Request status updated to " + status);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void requireAdmin(Principal principal) {
        if (principal == null || !adminEmail.equalsIgnoreCase(principal.getName())) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Admin access required");
        }
    }

    private static String escHtml(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}
