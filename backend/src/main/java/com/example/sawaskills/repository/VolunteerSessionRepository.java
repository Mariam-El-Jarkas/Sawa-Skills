package com.example.sawaskills.repository;

import com.example.sawaskills.entity.VolunteerSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VolunteerSessionRepository extends JpaRepository<VolunteerSession, Long> {
    java.util.Optional<VolunteerSession> findByGroupChatId(Long groupChatId);
}