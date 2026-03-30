package com.example.sawaskills.repository;

import com.example.sawaskills.entity.SwapSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SwapSessionRepository extends JpaRepository<SwapSession, Long> {
}