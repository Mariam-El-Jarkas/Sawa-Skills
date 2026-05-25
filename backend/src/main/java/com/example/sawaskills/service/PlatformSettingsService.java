package com.example.sawaskills.service;

import com.example.sawaskills.repository.PlatformSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PlatformSettingsService {

    private final PlatformSettingRepository repository;

    private static final Map<String, String> DEFAULTS = Map.of(
            "maintenanceMode",           "false",
            "allowRegistrations",        "true",
            "requireEmailVerification",  "true",
            "autoModeration",            "false",
            "autoSuspendThreshold",      "5"
    );

    private volatile Map<String, String> cache = null;

    private Map<String, String> get() {
        if (cache == null) refresh();
        return cache;
    }

    public void refresh() {
        Map<String, String> map = new HashMap<>(DEFAULTS);
        repository.findAll().forEach(s -> map.put(s.getSettingKey(), s.getSettingValue()));
        cache = map;
    }

    public boolean isMaintenanceMode()          { return "true".equals(get().get("maintenanceMode")); }
    public boolean isAllowRegistrations()        { return "true".equals(get().get("allowRegistrations")); }
    public boolean isRequireEmailVerification()  { return "true".equals(get().get("requireEmailVerification")); }
    public boolean isAutoModeration()            { return "true".equals(get().get("autoModeration")); }

    public int getAutoSuspendThreshold() {
        try { return Integer.parseInt(get().getOrDefault("autoSuspendThreshold", "5")); }
        catch (NumberFormatException e) { return 5; }
    }
}
