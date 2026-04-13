package com.example.sawaskills.repository;

import com.example.sawaskills.entity.SwapRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.Optional;

@Repository
public interface SwapRequestRepository extends JpaRepository<SwapRequest, Long> {

    @Query("SELECT COUNT(s) FROM SwapRequest s WHERE (s.requester.id = :userId OR s.receiver.id = :userId) AND s.status = 'COMPLETED'")
    long countCompletedSwapsByUserId(@Param("userId") Long userId);

    @Query("SELECT s FROM SwapRequest s WHERE (s.requester.id = :userId OR s.receiver.id = :userId) ORDER BY s.createdAt DESC")
    List<SwapRequest> findAllByUserId(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT s FROM SwapRequest s WHERE (s.requester.id = :userId OR s.receiver.id = :userId) AND s.status = :status ORDER BY s.createdAt DESC")
    List<SwapRequest> findAllByUserIdAndStatus(@Param("userId") Long userId, @Param("status") String status, Pageable pageable);

    @Query("SELECT COUNT(s) > 0 FROM SwapRequest s WHERE " +
           "((s.requester.id = :userId AND s.receiver.id = :otherId) OR (s.requester.id = :otherId AND s.receiver.id = :userId)) " +
           "AND s.status IN ('PENDING', 'ACTIVE')")
    boolean existsActiveSwapBetween(@Param("userId") Long userId, @Param("otherId") Long otherId);

    List<SwapRequest> findTop5ByRequesterIdOrReceiverIdOrderByCreatedAtDesc(Long requesterId, Long receiverId);

    @Query("SELECT s.offeredSkill, COUNT(s) as cnt FROM SwapRequest s WHERE s.offeredSkill IS NOT NULL GROUP BY s.offeredSkill ORDER BY cnt DESC")
    List<Object[]> findTopOfferedSkills();

    Optional<SwapRequest> findByIdAndReceiverId(Long id, Long receiverId);

    Optional<SwapRequest> findByIdAndRequesterId(Long id, Long requesterId);
    
    @Query("SELECT COUNT(s) > 0 FROM SwapRequest s WHERE s.listing.id = :listingId AND s.requester.id = :requesterId")
    boolean existsByListingIdAndRequesterId(@Param("listingId") Long listingId, @Param("requesterId") Long requesterId);

    @org.springframework.data.jpa.repository.Modifying
    @Query("UPDATE SwapRequest s SET s.status = 'REJECTED', s.updatedAt = CURRENT_TIMESTAMP WHERE s.listing.id = :listingId AND s.status IN ('PENDING', 'ACTIVE')")
    void cancelActiveSwapsForListing(@Param("listingId") Long listingId);
}
