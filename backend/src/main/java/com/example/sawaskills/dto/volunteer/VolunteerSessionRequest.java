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
    /** ISO-8601 datetime string, e.g. "2025-06-15T15:30:00" */
    private String sessionDate;
    /** "REMOTE" or "IN_PERSON" — defaults to "REMOTE" */
    private String locationType;
    /** Required when locationType is "IN_PERSON" */
    private String location;
}
