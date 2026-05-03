package com.example.sawaskills.repository;

import com.example.sawaskills.entity.PollVote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PollVoteRepository extends JpaRepository<PollVote, Long> {
    List<PollVote> findByPostId(Long postId);
    Optional<PollVote> findByPostIdAndUserId(Long postId, Long userId);
    long countByPostIdAndSelectedOption(Long postId, String selectedOption);
}
