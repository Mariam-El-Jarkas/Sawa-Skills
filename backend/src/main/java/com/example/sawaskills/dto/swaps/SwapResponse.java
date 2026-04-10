package com.example.sawaskills.dto.swaps;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SwapResponse {
    private Long id;
    private String status;
    private String date;
    private Long otherUserId;
    private String otherUserName;
    private String otherUserInitials;
    private String theyOffer;
    private String youOffer;
    private String note;
    private String preferredTime;
    /** Whether the current user is the requester */
    private Boolean isRequester;
}
