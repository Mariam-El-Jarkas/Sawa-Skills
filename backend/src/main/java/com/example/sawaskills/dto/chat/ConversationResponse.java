package com.example.sawaskills.dto.chat;

import lombok.*;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationResponse {
    private Long id;
    private Long otherUserId;
    private String otherUserName;
    private String otherUserInitials;
    private String otherUserPicture;
    private String lastMessage;
    private String lastMessageTime;
    private java.time.LocalDateTime lastTimestamp;
    private long unreadCount;
    @com.fasterxml.jackson.annotation.JsonProperty("isGroup")
    private boolean isGroup;

    // Group specific
    private Long adminId;
    private boolean everyoneCanMessage;
    private int participantsCount;
    private List<ParticipantInfo> participants;
    private String profilePicture;

    @com.fasterxml.jackson.annotation.JsonProperty("isClosed")
    private boolean isClosed;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ParticipantInfo {
        private Long id;
        private String name;
        private String initials;
        private String picture;
        
        @com.fasterxml.jackson.annotation.JsonProperty("isAdmin")
        private boolean isAdmin;
    }
}
