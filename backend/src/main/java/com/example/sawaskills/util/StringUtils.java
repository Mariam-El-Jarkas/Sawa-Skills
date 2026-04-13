package com.example.sawaskills.util;

import java.util.Arrays;
import java.util.stream.Collectors;

public final class StringUtils {

    private StringUtils() {}

    /** Strips HTML tags, trims, and enforces a max length. */
    public static String sanitize(String input) {
        if (input == null) return null;
        String sanitized = input.trim().replaceAll("<[^>]*>", "");
        return sanitized.length() > 500 ? sanitized.substring(0, 500) : sanitized;
    }

    /** Builds up-to-2-letter initials from a display name. */
    public static String buildInitials(String name) {
        if (name == null || name.trim().isEmpty()) return "?";
        return Arrays.stream(name.trim().split("\\s+"))
                .filter(w -> !w.isEmpty())
                .map(w -> String.valueOf(w.charAt(0)).toUpperCase())
                .limit(2)
                .collect(Collectors.joining());
    }
}
