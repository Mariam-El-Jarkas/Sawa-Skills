package com.example.sawaskills.config;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
public class AdminDataMigration {

    @PersistenceContext
    private EntityManager em;

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void migrate() {
        try {
            int u = em.createNativeQuery("UPDATE users SET account_status = 'ACTIVE' WHERE account_status IS NULL").executeUpdate();
            int p = em.createNativeQuery("UPDATE posts SET admin_hidden = FALSE WHERE admin_hidden IS NULL").executeUpdate();
            int s = em.createNativeQuery("UPDATE volunteer_sessions SET status = 'PENDING_REVIEW' WHERE status IS NULL").executeUpdate();
            if (u + p + s > 0) log.info("Admin migration: backfilled {} user(s), {} post(s), {} session(s)", u, p, s);
        } catch (Exception e) {
            log.warn("Admin migration skipped: {}", e.getMessage());
        }
    }
}
