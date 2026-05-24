package com.example.sawaskills.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SchemaMigration implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        // Add notification preference columns to users table if they don't exist,
        // then backfill any NULL values so existing rows default to enabled (true).
        jdbcTemplate.execute(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS swap_notifications_enabled boolean DEFAULT true");
        jdbcTemplate.execute(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS message_notifications_enabled boolean DEFAULT true");
        jdbcTemplate.execute(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS skill_news_notifications_enabled boolean DEFAULT true");

        jdbcTemplate.execute(
            "UPDATE users SET swap_notifications_enabled = true WHERE swap_notifications_enabled IS NULL");
        jdbcTemplate.execute(
            "UPDATE users SET message_notifications_enabled = true WHERE message_notifications_enabled IS NULL");
        jdbcTemplate.execute(
            "UPDATE users SET skill_news_notifications_enabled = true WHERE skill_news_notifications_enabled IS NULL");

        // Soft-delete / anonymisation support
        jdbcTemplate.execute(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at timestamp");
        jdbcTemplate.execute(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_email_hash varchar(64)");
        // Allow email to be null for anonymised accounts
        jdbcTemplate.execute(
            "ALTER TABLE users ALTER COLUMN email DROP NOT NULL");

        // Free listings for volunteers
        jdbcTemplate.execute(
            "ALTER TABLE exchange_listings ADD COLUMN IF NOT EXISTS is_free boolean DEFAULT false");
        jdbcTemplate.execute(
            "ALTER TABLE exchange_listings ALTER COLUMN wanted_skill DROP NOT NULL");

        // Parental approval for minor actions
        jdbcTemplate.execute(
            "ALTER TABLE parent_approvals ADD COLUMN IF NOT EXISTS action_type varchar(50)");
        jdbcTemplate.execute(
            "ALTER TABLE parent_approvals ADD COLUMN IF NOT EXISTS action_id bigint");
        jdbcTemplate.execute(
            "ALTER TABLE parent_approvals ADD COLUMN IF NOT EXISTS additional_data text");
    }
}
