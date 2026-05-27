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
        "Email not verified", "Account not verified",
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

    // Handles duplicate email / unique constraint violations
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<String> handleDataIntegrity(DataIntegrityViolationException ex) {
        String msg = ex.getMostSpecificCause().getMessage();
        if (msg != null && (msg.contains("email") || msg.contains("users"))) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("An account with this email already exists");
        }
        return ResponseEntity.status(HttpStatus.CONFLICT).body("A duplicate entry already exists");
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
