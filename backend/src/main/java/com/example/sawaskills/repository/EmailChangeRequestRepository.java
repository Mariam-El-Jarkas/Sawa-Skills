package com.example.sawaskills.repository;

import com.example.sawaskills.entity.EmailChangeRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Repository
public interface EmailChangeRequestRepository extends JpaRepository<EmailChangeRequest, Long> {

    Optional<EmailChangeRequest> findTopByCurrentEmailOrderByCreatedAtDesc(String currentEmail);

    @Modifying
    @Transactional
    @Query("UPDATE EmailChangeRequest e SET e.used = true WHERE e.currentEmail = :currentEmail AND e.used = false")
    void invalidateAllByCurrentEmail(String currentEmail);
}
