package com.example.sawaskills.repository;

import com.example.sawaskills.entity.Skill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SkillRepository extends JpaRepository<Skill, Long> {

    Optional<Skill> findBySkillNameIgnoreCase(String skillName);
    List<Skill> findByCategory_Id(Long categoryId);

    @Modifying
    @Query("DELETE FROM Skill s WHERE s.category.id = :categoryId")
    void deleteByCategoryId(@Param("categoryId") Long categoryId);
}
