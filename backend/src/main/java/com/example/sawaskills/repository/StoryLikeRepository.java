package com.example.sawaskills.repository;

import com.example.sawaskills.entity.Story;
import com.example.sawaskills.entity.StoryLike;
import com.example.sawaskills.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface StoryLikeRepository extends JpaRepository<StoryLike, Long> {
    Optional<StoryLike> findByStoryAndUser(Story story, User user);
    long countByStoryId(Long storyId);
    boolean existsByStoryIdAndUserId(Long storyId, Long userId);
    void deleteByStoryId(Long storyId);
}
