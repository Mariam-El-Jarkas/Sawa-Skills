package com.example.sawaskills.dto.verification;

import lombok.Data;

@Data
public class VerificationSubmission {
    private String type; // ADULT, MINOR, VOLUNTEER
    private String fullName;
    private String dob; // Changed to String for manual parsing/tolerance
    private String idFrontImage; // base64
    private String idBackImage;  // base64
    private String selfieImage;  // base64
    private String parentEmail;
    
    // Volunteer fields
    private String why;
    private String experience;
    private String skillsToShare;
}
