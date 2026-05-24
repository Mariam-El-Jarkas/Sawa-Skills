package com.example.sawaskills.service;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimitService {

    // Separate buckets per action type per key (e.g. IP or email)
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    private Bucket newBucket(int maxRequests, Duration period) {
        Bandwidth limit = Bandwidth.builder()
                .capacity(maxRequests)
                .refillGreedy(maxRequests, period)
                .build();
        return Bucket.builder().addLimit(limit).build();
    }

    /**
     * Returns true if the request is allowed, false if rate limit exceeded.
     * action  : e.g. "login", "register", "otp", "forgot-password"
     * key     : IP address or email
     */
    public boolean isAllowed(String action, String key) {
        String bucketKey = action + ":" + key;
        Bucket bucket = buckets.computeIfAbsent(bucketKey, k -> switch (action) {
            case "login"           -> newBucket(10, Duration.ofMinutes(15)); // 10 attempts / 15 min
            case "register"        -> newBucket(5,  Duration.ofHours(1));    // 5 registrations / hour
            case "otp"             -> newBucket(5,  Duration.ofMinutes(10)); // 5 OTP resends / 10 min
            case "forgot-password" -> newBucket(3,  Duration.ofHours(1));    // 3 resets / hour
            case "swap-create"     -> newBucket(5,  Duration.ofMinutes(1));  // 5 swaps / min
            default                -> newBucket(20, Duration.ofMinutes(1));
        });
        return bucket.tryConsume(1);
    }
}
