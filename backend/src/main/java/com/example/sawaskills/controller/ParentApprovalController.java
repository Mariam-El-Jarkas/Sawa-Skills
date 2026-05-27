package com.example.sawaskills.controller;

import com.example.sawaskills.service.ParentApprovalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/parent-approval")
@RequiredArgsConstructor
public class ParentApprovalController {

    private final ParentApprovalService parentApprovalService;

    /**
     * Public endpoint — no auth required.
     * Parent clicks Approve/Decline link from their email.
     * GET /api/parent-approval/{token}?decision=APPROVE|DECLINE
     */
    @GetMapping(value = "/{token}", produces = "text/html;charset=UTF-8")
    public ResponseEntity<String> handleDecision(
            @PathVariable String token,
            @RequestParam(required = false) String decision) {

        String message;
        String borderColor;
        try {
            if (decision == null || decision.isBlank()) {
                message = "Missing decision parameter. Please use the Approve or Decline button from the email.";
                borderColor = "#ef4444";
            } else {
                message = parentApprovalService.processDecision(token, decision);
                borderColor = "#7c3aed";
            }
        } catch (Exception e) {
            message = e.getMessage() != null ? e.getMessage() : "Something went wrong. Please try again.";
            borderColor = "#ef4444";
        }

        String html = """
            <html>
              <body style="font-family:Arial,sans-serif;text-align:center;padding-top:80px;
                           background:#f5f3ff;">
                <div style="max-width:480px;margin:auto;background:white;padding:40px;
                            border-radius:16px;border-top:5px solid %s;
                            box-shadow:0 4px 24px rgba(124,58,237,0.08);">
                  <h2 style="color:#7c3aed;">SawaSkills</h2>
                  <p style="font-size:18px;color:#374151;">%s</p>
                  <p style="font-size:13px;color:#9ca3af;margin-top:24px;">
                    You may close this tab.
                  </p>
                </div>
              </body>
            </html>
            """.formatted(borderColor, escHtml(message));

        return ResponseEntity.ok()
                .header("Content-Type", "text/html")
                .body(html);
    }

    private static String escHtml(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}
