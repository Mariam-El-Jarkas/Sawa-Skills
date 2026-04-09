package com.example.sawaskills.repository;

import com.example.sawaskills.entity.ParentApproval;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ParentApprovalRepository extends JpaRepository<ParentApproval, Long> {

    Optional<ParentApproval> findByToken(String token);

}