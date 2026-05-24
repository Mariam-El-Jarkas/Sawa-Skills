package com.example.sawaskills.repository;

import com.example.sawaskills.entity.ParentApproval;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ParentApprovalRepository extends JpaRepository<ParentApproval, Long> {

    Optional<ParentApproval> findByToken(String token);

    Optional<ParentApproval> findTopByMinorUserIdAndActionTypeAndActionIdOrderByRequestedAtDesc(
            Long minorUserId, String actionType, Long actionId);

    // Find any PENDING approval for a specific action (used to expire on cancel)
    Optional<ParentApproval> findTopByActionTypeAndActionIdAndStatusOrderByRequestedAtDesc(
            String actionType, Long actionId, String status);
}
