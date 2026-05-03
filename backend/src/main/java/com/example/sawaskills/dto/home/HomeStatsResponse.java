package com.example.sawaskills.dto.home;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HomeStatsResponse {
    // Authenticated user stats
    private Long swapCount;
    private Long connectionCount;
    private Double avgRating;

    // Guest / global stats
    private Long totalSkills;
    private Long totalMembers;
    private Long totalCities;

    private Boolean isAuthenticated;

    // Location & swap activity (authenticated only)
    private String userCity;
    private Long pendingSwapCount;
    private Long activeSwapCount;
}
