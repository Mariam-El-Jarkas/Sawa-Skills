package com.example.sawaskills.dto.profile;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class UpdatePrivacyRequest {
    private boolean publicProfile;
    private boolean swapNotifications;
    private boolean messageNotifications;
    private boolean skillNewsNotifications;
}
