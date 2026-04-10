package com.example.sawaskills.repository;

import com.example.sawaskills.entity.UserSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserSkillRepository extends JpaRepository<UserSkill, Long> {

    List<UserSkill> findByUserIdAndOffering(Long userId, Boolean offering);

    List<UserSkill> findByUserId(Long userId);

    Optional<UserSkill> findByUserIdAndSkillSkillNameIgnoreCaseAndOffering(Long userId, String skillName, Boolean offering);
}
