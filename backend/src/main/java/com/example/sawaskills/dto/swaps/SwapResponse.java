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
    private String otherUserPicture;
    private String theyOffer;
    private String youOffer;
    private String note;
    private String preferredTime;
    /** Whether the current user is the requester */
    private Boolean isRequester;
    /** Whether the current user has already rated this participant */
    private Boolean hasRated;
    /** Whether the current user has marked this swap as finished */
    private Boolean isFinished;
    /** Whether both users have marked this swap as finished */
    private Boolean everyoneFinished;
    /** Age of the other party (for safety confirmation UI) */
    private Integer otherUserAge;
    /** Gender of the other party (for safety confirmation UI) */
    private String otherUserGender;
}
