package com.example.sawaskills.repository;

import com.example.sawaskills.entity.StoryView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StoryViewRepository extends JpaRepository<StoryView, Long> {
    boolean existsByStoryIdAndViewerId(Long storyId, Long viewerId);
    void deleteByStoryId(Long storyId);
}