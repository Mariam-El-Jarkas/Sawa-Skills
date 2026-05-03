package com.example.sawaskills.repository;

import com.example.sawaskills.entity.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {

    List<Report> findByStatus(String status);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM Report r WHERE r.reportedPost.id = :postId")
    void deleteByReportedPostId(@org.springframework.data.repository.query.Param("postId") Long postId);

}