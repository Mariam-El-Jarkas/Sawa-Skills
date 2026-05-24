package com.example.sawaskills.dto.admin;
import lombok.*;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AdminStatsResponse {
    private long totalUsers, activeToday, pendingVerifications, pendingReports;
    private long totalSwaps, completedSwaps, pendingSwaps, totalSessions, totalPosts, totalMessages;
}
