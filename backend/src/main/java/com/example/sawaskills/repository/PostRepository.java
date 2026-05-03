package com.example.sawaskills.repository;

import com.example.sawaskills.entity.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {
    List<Post> findAllByOrderByCreatedAtDesc();

    List<Post> findByVisibilityOrderByCreatedAtDesc(Post.PostVisibility visibility);

    @Query("SELECT p FROM Post p WHERE p.author.id IN :userIds AND (p.visibility = 'EVERYONE' OR p.visibility = 'FOLLOWERS') ORDER BY p.createdAt DESC")
    List<Post> findByAuthorIdsOrderByCreatedAtDesc(@Param("userIds") List<Long> userIds);

    List<Post> findByContentContainingIgnoreCaseOrderByCreatedAtDesc(String keyword);
    
    long countByAuthorId(Long authorId);
}