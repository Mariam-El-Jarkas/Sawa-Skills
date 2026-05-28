package com.example.sawaskills.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Set;
import java.util.stream.Collectors;

@ControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // Messages that are intentional business-rule errors → 400 Bad Request
    private static final Set<String> BUSINESS_ERROR_PREFIXES = Set.of(
        "User not found", "Swap not found", "Session not found", "Listing not found",
        "You cannot", "You already", "You have already", "You are not", "Only ",
        "Email already", "A duplicate", "Invalid ", "Required ", "Offered skill",
        "Wanted skill", "Skill you", "Max ", "Availability must",
        "A verification request", "You must", "Parent email not found",
        "Only verified", "Only volunteers", "Too many",
        "Email not verified", "Account not verified", "RESEND_OTP:",
        "This swap", "This link", "This request",
        "Pending ", "PENDING_PARENT_APPROVAL",
        "Password", "OTP ", "Token "
    );

    // Handles @Valid failures — returns the first readable message
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<String> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .collect(Collectors.joining(", "));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(message);
    }

    // Handles unique constraint violations and FK reference errors
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<String> handleDataIntegrity(DataIntegrityViolationException ex) {
        String msg = ex.getMostSpecificCause().getMessage();
        if (msg == null) {
            log.error("DataIntegrityViolationException with null cause", ex);
            return ResponseEntity.status(HttpStatus.CONFLICT).body("This action could not be completed due to a data conflict.");
        }
        // FK violation: trying to delete/update a row that other rows reference
        if (msg.contains("foreign key") || msg.contains("violates foreign key") || msg.contains("constraint")) {
            log.warn("FK constraint violation: {}", msg);
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("This item cannot be removed because other data depends on it. Please remove related items first.");
        }
        // Duplicate email / account
        if (msg.contains("email") || msg.contains("users")) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("An account with this email already exists");
        }
        // Duplicate session participant
        if (msg.contains("volunteer_participants") || msg.contains("uq_session_participant")) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("You have already joined this session");
        }
        // Duplicate conversation participant
        if (msg.contains("conversation_participants")) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("You are already a member of this conversation");
        }
        // Duplicate swap request
        if (msg.contains("uq_swap_requester_listing") || msg.contains("swap_requests")) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("You have already requested this swap");
        }
        log.warn("Unhandled DataIntegrityViolationException: {}", msg);
        return ResponseEntity.status(HttpStatus.CONFLICT).body("This action could not be completed due to a data conflict.");
    }

    @ExceptionHandler(RateLimitException.class)
    public ResponseEntity<String> handleRateLimit(RateLimitException ex) {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(ex.getMessage());
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<String> handleRuntimeException(RuntimeException ex) {
        String msg = ex.getMessage();
        boolean isBusinessError = msg != null && BUSINESS_ERROR_PREFIXES.stream()
                .anyMatch(prefix -> msg.startsWith(prefix) || msg.contains(prefix));
        if (isBusinessError) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(msg);
        }
        log.error("Unexpected server error", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("An unexpected error occurred. Please try again later.");
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<String> handleGeneralException(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("An unexpected error occurred");
    }
}
