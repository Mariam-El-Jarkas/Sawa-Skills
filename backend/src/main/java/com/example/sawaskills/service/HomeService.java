package com.example.sawaskills.service;

import com.example.sawaskills.dto.home.*;
import com.example.sawaskills.entity.User;
import com.example.sawaskills.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HomeService {

    private final UserRepository userRepository;
    private final SwapRequestRepository swapRequestRepository;
    private final ConnectionRepository connectionRepository;
    private final ReviewRepository reviewRepository;
    private final SkillRepository skillRepository;
    private final LocationRepository locationRepository;

    // ── Stats for authenticated user (or global for guests) ──────────────────

    public HomeStatsResponse getStats(String email) {
        if (email != null) {
            return getAuthenticatedStats(email);
        }
        return getGlobalStats();
    }

    private HomeStatsResponse getAuthenticatedStats(String email) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) return getGlobalStats();

        long swapCount = swapRequestRepository.countCompletedSwapsByUserId(user.getId());
        long connectionCount = connectionRepository.findAcceptedByUserId(user.getId()).size();
        double avgRating = reviewRepository.findAvgRatingByReviewedUserId(user.getId()).orElse(0.0);
        long pendingSwaps = swapRequestRepository.countByStatusAndUserId("PENDING", user.getId());
        long activeSwaps = swapRequestRepository.countByStatusAndUserId("ACTIVE", user.getId());
        String userCity = user.getLocation() != null ? user.getLocation().getCity() : null;

        return HomeStatsResponse.builder()
                .swapCount(swapCount)
                .connectionCount(connectionCount)
                .avgRating(Math.round(avgRating * 10.0) / 10.0)
                .isAuthenticated(true)
                .userCity(userCity)
                .pendingSwapCount(pendingSwaps)
                .activeSwapCount(activeSwaps)
                .build();
    }

    private HomeStatsResponse getGlobalStats() {
        long totalSkills = skillRepository.count();
        long totalMembers = userRepository.count();
        long totalCities = locationRepository.count();

        return HomeStatsResponse.builder()
                .totalSkills(totalSkills > 0 ? totalSkills : 500)
                .totalMembers(totalMembers > 0 ? totalMembers : 2000)
                .totalCities(totalCities > 0 ? totalCities : 12)
                .isAuthenticated(false)
                .build();
    }

    // ── Trending skills (top 5 by swap request volume) ───────────────────────

    public List<TrendingSkillResponse> getTrending() {
        List<Object[]> rows = swapRequestRepository.findTopOfferedSkills();

        List<TrendingSkillResponse> result = rows.stream()
                .limit(5)
                .map(row -> TrendingSkillResponse.builder()
                        .name((String) row[0])
                        .swapCount(((Number) row[1]).longValue())
                        .build())
                .collect(Collectors.toList());

        // Fallback defaults so the UI always has something to show
        if (result.isEmpty()) {
            result = List.of(
                    new TrendingSkillResponse("Web Development", 31L),
                    new TrendingSkillResponse("Photography", 27L),
                    new TrendingSkillResponse("Graphic Design", 22L),
                    new TrendingSkillResponse("Cooking", 19L),
                    new TrendingSkillResponse("Guitar", 14L)
            );
        }
        return result;
    }
}
