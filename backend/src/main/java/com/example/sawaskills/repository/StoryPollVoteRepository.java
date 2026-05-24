package com.example.sawaskills.repository;

import com.example.sawaskills.entity.Story;
import com.example.sawaskills.entity.StoryPollVote;
import com.example.sawaskills.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StoryPollVoteRepository extends JpaRepository<StoryPollVote, Long> {
    List<StoryPollVote> findByStoryId(Long storyId);
    Optional<StoryPollVote> findByStoryAndUser(Story story, User user);
    void deleteByStoryId(Long storyId);
}
