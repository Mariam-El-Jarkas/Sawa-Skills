package com.example.sawaskills.dto.volunteer;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VolunteerSessionRequest {
    private String title;
    private String description;
    private String sessionDate; // Simple ISO string or just date string
}
