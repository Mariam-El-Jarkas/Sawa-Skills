package com.example.sawaskills.repository;

import com.example.sawaskills.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    List<Message> findByConversationIdOrderBySentAtAsc(Long conversationId);

    Optional<Message> findTopByConversationIdOrderBySentAtDesc(Long conversationId);

    long countByConversationIdAndReadFalseAndSenderIdNot(Long conversationId, Long senderId);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE Message m SET m.read = true WHERE m.conversation.id = :conversationId AND m.sender.id <> :userId")
    void markAllReadInConversation(@Param("conversationId") Long conversationId, @Param("userId") Long userId);
}
