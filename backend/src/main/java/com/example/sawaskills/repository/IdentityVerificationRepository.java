package com.example.sawaskills.repository;

import com.example.sawaskills.entity.IdentityVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IdentityVerificationRepository extends JpaRepository<IdentityVerification, Long> {
}