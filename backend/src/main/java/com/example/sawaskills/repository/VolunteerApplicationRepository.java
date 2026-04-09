package com.example.sawaskills.repository;

import com.example.sawaskills.entity.VolunteerApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VolunteerApplicationRepository extends JpaRepository<VolunteerApplication, Long> {

    boolean existsByApplicantId(Long userId);

    Optional<VolunteerApplication> findByApplicantId(Long userId);
}
