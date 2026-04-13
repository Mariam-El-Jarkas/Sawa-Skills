package com.example.sawaskills.dto.skills;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SkillListingResponse {
    private Long id;
    private Long ownerId;
    private String ownerName;
    private String ownerInitials;
    private String profilePicture;
    private String offeredSkill;
    private String wantedSkill;
    private String location;
    private String availability;
    private Double avgRating;
    private String createdAt;
    private boolean alreadyRequested;
}
