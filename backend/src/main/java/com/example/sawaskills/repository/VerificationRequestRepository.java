package com.example.sawaskills.repository;

import com.example.sawaskills.entity.VerificationRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VerificationRequestRepository extends JpaRepository<VerificationRequest, Long> {
    List<VerificationRequest> findByUserId(Long userId);
    Optional<VerificationRequest> findTopByUserIdAndTypeOrderBySubmittedAtDesc(Long userId, String type);
    List<VerificationRequest> findByStatus(String status);
    List<VerificationRequest> findAllByOrderBySubmittedAtDesc();
    Optional<VerificationRequest> findByParentApprovalToken(String token);
}