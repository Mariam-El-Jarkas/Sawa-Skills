package com.example.sawaskills.service;

import com.example.sawaskills.exception.RateLimitException;
import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Simple in-memory rate limiter using a sliding window (per minute).
 * Not suitable for multi-instance deployments — use Redis-backed solution then.
 */
@Service
public class RateLimiterService {

    private static final int MAX_REQUESTS_PER_MINUTE = 5;
    private static final long WINDOW_MS = 60_000;

    // key → [count, windowStart]
    private final ConcurrentHashMap<String, long[]> store = new ConcurrentHashMap<>();

    public void checkLimit(String key) {
        long now = System.currentTimeMillis();
        store.compute(key, (k, val) -> {
            if (val == null || now - val[1] > WINDOW_MS) {
                return new long[]{1, now};
            }
            val[0]++;
            return val;
        });

        long[] entry = store.get(key);
        if (entry != null && entry[0] > MAX_REQUESTS_PER_MINUTE) {
            throw new RateLimitException("Too many swap requests. Please wait a minute before trying again.");
        }
    }
}
