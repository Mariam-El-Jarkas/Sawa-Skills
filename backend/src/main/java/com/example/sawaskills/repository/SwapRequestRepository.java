package com.example.sawaskills.repository;

import com.example.sawaskills.entity.SwapRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface SwapRequestRepository extends JpaRepository<SwapRequest, Long> {

    @Query("SELECT COUNT(s) FROM SwapRequest s WHERE (s.requester.id = :userId OR s.receiver.id = :userId) AND s.status = 'COMPLETED'")
    long countCompletedSwapsByUserId(Long userId);
}
