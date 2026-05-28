package com.example.sawaskills.repository;

import com.example.sawaskills.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    @Query("SELECT c FROM Conversation c JOIN c.participants p WHERE p.id = :userId ORDER BY c.createdAt DESC")
    List<Conversation> findByParticipantId(@Param("userId") Long userId);

    @Query("SELECT c FROM Conversation c JOIN c.participants p1 JOIN c.participants p2 WHERE p1.id = :userId AND p2.id = :otherId AND c.name IS NULL ORDER BY c.id DESC")
    List<Conversation> findBetweenUsers(@Param("userId") Long userId, @Param("otherId") Long otherId);

    @Modifying
    @Query(value = "INSERT INTO conversation_hidden_by (conversation_id, user_id) VALUES (:convId, :userId) ON CONFLICT DO NOTHING", nativeQuery = true)
    void insertHiddenBy(@Param("convId") Long conversationId, @Param("userId") Long userId);
}
