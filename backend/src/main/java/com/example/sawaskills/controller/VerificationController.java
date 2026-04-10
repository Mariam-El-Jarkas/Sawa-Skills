package com.example.sawaskills.controller;

import com.example.sawaskills.dto.verification.VerificationSubmission;
import com.example.sawaskills.entity.VerificationRequest;
import com.example.sawaskills.service.VerificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/verification")
@RequiredArgsConstructor
public class VerificationController {

    private final VerificationService verificationService;

    // User Submissions
    @PostMapping("/submit")
    public ResponseEntity<String> submit(Principal principal, @RequestBody VerificationSubmission submission) {
        verificationService.submitVerification(principal.getName(), submission);
        return ResponseEntity.ok("Verification request submitted successfully");
    }

    // Admin Endpoints
    @GetMapping("/admin/requests")
    public ResponseEntity<List<VerificationRequest>> getAllRequests() {
        return ResponseEntity.ok(verificationService.getAllRequests());
    }

    @PatchMapping("/admin/requests/{id}/status")
    public ResponseEntity<String> updateStatus(@PathVariable Long id, @RequestBody java.util.Map<String, String> body) {
        String status = body.get("status");
        verificationService.updateStatus(id, status);
        return ResponseEntity.ok("Request status updated to " + status);
    }

    @GetMapping("/minor/parent-decision")
    public ResponseEntity<String> handleParentDecision(@RequestParam String token, @RequestParam String decision) {
        String message = verificationService.handleParentDecision(token, decision);
        return ResponseEntity.ok("<html><body style='font-family:sans-serif;text-align:center;padding-top:100px;'><h2>" + message + "</h2></body></html>");
    }
}