package com.example.sawaskills.util;

import com.example.sawaskills.entity.User;
import com.example.sawaskills.entity.VerificationRequest;
import com.example.sawaskills.repository.VerificationRequestRepository;

public final class MinorUtils {

    private MinorUtils() {}

    /** Returns true if the user has an APPROVED MINOR verification. */
    public static boolean isMinor(User user, VerificationRequestRepository repo) {
        return repo.findTopByUserIdAndTypeOrderBySubmittedAtDesc(user.getId(), "MINOR")
                .map(r -> "APPROVED".equals(r.getStatus()))
                .orElse(false);
    }

    /**
     * Returns the parent email from the user's MINOR verification request.
     * Throws if not found (should only be called after isMinor returns true).
     */
    public static String parentEmail(User user, VerificationRequestRepository repo) {
        return repo.findTopByUserIdAndTypeOrderBySubmittedAtDesc(user.getId(), "MINOR")
                .map(VerificationRequest::getParentEmail)
                .filter(e -> e != null && !e.isBlank())
                .orElseThrow(() -> new RuntimeException("Parent email not found for minor account"));
    }
}
