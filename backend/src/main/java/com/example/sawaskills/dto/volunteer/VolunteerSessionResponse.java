package com.example.sawaskills.dto.volunteer;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VolunteerSessionResponse {
    private Long id;
    private String title;
    private String description;
    private String date;
    private String organizer;
    private String status;
    private int participants;
    @com.fasterxml.jackson.annotation.JsonProperty("isJoined")
    private boolean isJoined;
    @com.fasterxml.jackson.annotation.JsonProperty("isOrganizer")
    private boolean isOrganizer;
    private Long groupChatId;
}
