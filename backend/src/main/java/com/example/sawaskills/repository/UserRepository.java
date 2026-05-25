package com.example.sawaskills.repository;

import com.example.sawaskills.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    long countByDeletedAtIsNull();
    long countByCreatedAtAfterAndDeletedAtIsNull(LocalDateTime after);

    @Query("SELECT u FROM User u WHERE u.deletedAt IS NULL " +
           "AND (:q = '' OR LOWER(u.name) LIKE CONCAT('%', :q, '%') OR LOWER(u.email) LIKE CONCAT('%', :q, '%')) " +
           "AND (:status IS NULL OR u.accountStatus = :status) " +
           "AND (:verified IS NULL OR u.verified = :verified) " +
           "ORDER BY u.createdAt DESC")
    List<User> searchUsers(@Param("q") String q, @Param("status") String status, @Param("verified") Boolean verified);

    @Query("SELECT u FROM User u WHERE u.deletedAt IS NULL AND u.role = :role")
    List<User> findByRoleAndDeletedAtIsNull(@Param("role") String role);

    @Query("SELECT u FROM User u WHERE u.deletedAt IS NULL AND u.verified = true")
    List<User> findVerifiedUsers();

    @Query("SELECT u FROM User u WHERE u.deletedAt IS NULL AND (u.accountStatus = 'ACTIVE' OR u.accountStatus IS NULL)")
    List<User> findAllActiveUsers();

    @Query("SELECT DISTINCT u FROM User u JOIN VerificationRequest vr ON vr.user = u " +
           "WHERE u.deletedAt IS NULL AND vr.type = 'MINOR' AND vr.status = 'APPROVED'")
    List<User> findMinorUsers();

    @Query("SELECT DISTINCT u FROM User u JOIN VerificationRequest vr ON vr.user = u " +
           "WHERE u.deletedAt IS NULL AND vr.type = 'ADULT' AND vr.status = 'APPROVED'")
    List<User> findAdultUsers();

    @Query("SELECT DISTINCT u FROM User u JOIN VerificationRequest vr ON vr.user = u " +
           "WHERE u.deletedAt IS NULL AND vr.type = 'VOLUNTEER' AND vr.status = 'APPROVED'")
    List<User> findVolunteerBadgeUsers();
}
