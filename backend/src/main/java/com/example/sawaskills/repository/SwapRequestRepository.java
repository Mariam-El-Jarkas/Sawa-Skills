package com.example.sawaskills.repository;

import com.example.sawaskills.entity.SwapRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SwapRequestRepository extends JpaRepository<SwapRequest, Long> {
}