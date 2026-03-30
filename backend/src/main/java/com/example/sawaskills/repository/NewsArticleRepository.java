package com.example.sawaskills.repository;

import com.example.sawaskills.entity.NewsArticle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NewsArticleRepository extends JpaRepository<NewsArticle, Long> {

    // Find articles by skill category
    List<NewsArticle> findBySkillCategoryId(Long skillCategoryId);

}