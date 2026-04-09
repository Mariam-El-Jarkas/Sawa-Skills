package com.example.sawaskills.repository;

import com.example.sawaskills.entity.Connection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConnectionRepository extends JpaRepository<Connection, Long> {

    @Query("SELECT c FROM Connection c WHERE (c.requester.id = :userId OR c.receiver.id = :userId) AND c.status = 'ACCEPTED'")
    List<Connection> findAcceptedByUserId(Long userId);
}
