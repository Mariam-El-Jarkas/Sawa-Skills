package com.example.sawaskills.repository;

import com.example.sawaskills.entity.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {

    List<Report> findByStatus(String status);
    List<Report> findAllByOrderByCreatedAtDesc();
    long countByStatus(String status);
    long countByReportedPostId(Long postId);

    @Query("SELECT COUNT(r) FROM Report r WHERE r.reportedPost.author.id = :authorId")
    long countByReportedPostAuthorId(@Param("authorId") Long authorId);

    @Modifying
    @Query("DELETE FROM Report r WHERE r.reportedPost.id = :postId")
    void deleteByReportedPostId(@Param("postId") Long postId);
}
