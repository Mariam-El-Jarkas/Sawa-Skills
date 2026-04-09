package com.example.sawaskills.repository;

import com.example.sawaskills.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByReviewedUserIdOrderByCreatedAtDesc(Long userId);

    long countByReviewedUserId(Long userId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.reviewedUser.id = :userId")
    Optional<Double> findAvgRatingByReviewedUserId(Long userId);
}
