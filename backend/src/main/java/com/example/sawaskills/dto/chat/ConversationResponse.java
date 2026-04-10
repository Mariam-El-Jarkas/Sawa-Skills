package com.example.sawaskills.dto.chat;

import lombok.*;

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
    private long unreadCount;
    private boolean isGroup;
}
