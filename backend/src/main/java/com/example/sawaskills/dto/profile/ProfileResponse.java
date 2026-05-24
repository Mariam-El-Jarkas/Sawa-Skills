package com.example.sawaskills.dto.profile;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ProfileResponse {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private String bio;
    private String profilePicture;
    private String location;

    // Stats — all computed from DB
    private double avgRating;
    private long reviewCount;
    private long swapCount;

    // Badges & Statuses
    private String volunteerStatus;
    @com.fasterxml.jackson.annotation.JsonProperty("isAgeVerified")
    private boolean isAgeVerified;
    @com.fasterxml.jackson.annotation.JsonProperty("isMinorVerified")
    private boolean isMinorVerified;
    @com.fasterxml.jackson.annotation.JsonProperty("isVolunteer")
    private boolean isVolunteer;
    private String ageVerificationStatus;

    // Privacy
    private boolean publicProfile;

    // Notification preferences
    private boolean swapNotifications;
    private boolean messageNotifications;
    private boolean skillNewsNotifications;

    // Reviews list (for profile page display)
    private List<ReviewDto> reviews;

    // Skills from DB
    private List<SkillItem> offeredSkills;
    private List<SkillItem> wantedSkills;

    @Data
    @Builder
    public static class SkillItem {
        private Long id;
        private String name;
    }

    // Connections from DB
    private List<ConnectionDto> connections;

    // Connection status between viewer and this profile (null = own profile or guest)
    // Values: "NONE" | "PENDING_SENT" | "PENDING_RECEIVED" | "CONNECTED"
    private String connectionStatus;
    private Long connectionId; // set when status is PENDING_RECEIVED or CONNECTED (for approve/remove)
}
