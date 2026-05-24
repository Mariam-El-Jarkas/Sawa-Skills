package com.example.sawaskills.repository;

import com.example.sawaskills.entity.AdminBroadcast;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdminBroadcastRepository extends JpaRepository<AdminBroadcast, Long> {
    List<AdminBroadcast> findAllByOrderBySentAtDesc();
}
