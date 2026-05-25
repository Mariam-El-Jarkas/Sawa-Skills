package com.example.sawaskills.security;

import com.example.sawaskills.service.PlatformSettingsService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class MaintenanceFilter extends OncePerRequestFilter {

    private final PlatformSettingsService settings;

    private static final Set<String> ALWAYS_ALLOWED_PREFIXES = Set.of(
            "/api/admin",
            "/api/auth/login",
            "/api/auth/verify-email",
            "/api/auth/refresh",
            "/api/parent-approval",
            "/uploads",
            "/error"
    );

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest req,
                                    @NonNull HttpServletResponse res,
                                    @NonNull FilterChain chain) throws ServletException, IOException {
        if (settings.isMaintenanceMode() && !isAllowed(req.getRequestURI())) {
            res.setStatus(HttpServletResponse.SC_SERVICE_UNAVAILABLE);
            res.setContentType("application/json");
            res.getWriter().write("{\"error\":\"The platform is currently under maintenance. Please try again later.\"}");
            return;
        }
        chain.doFilter(req, res);
    }

    private boolean isAllowed(String uri) {
        return ALWAYS_ALLOWED_PREFIXES.stream().anyMatch(uri::startsWith);
    }
}
