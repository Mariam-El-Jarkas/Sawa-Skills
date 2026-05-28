package com.example.sawaskills.repository;

import com.example.sawaskills.entity.VolunteerParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VolunteerParticipantRepository extends JpaRepository<VolunteerParticipant, Long> {
    long countBySessionId(Long sessionId);
    boolean existsBySessionIdAndParticipantId(Long sessionId, Long participantId);
    void deleteBySessionIdAndParticipantId(Long sessionId, Long participantId);
    void deleteBySessionId(Long sessionId);
}