package com.example.sawaskills.repository;

import com.example.sawaskills.entity.ExchangeListing;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExchangeListingRepository extends JpaRepository<ExchangeListing, Long> {

    List<ExchangeListing> findByOwnerIdOrderByCreatedAtDesc(Long ownerId);

    @Query("""
        SELECT l FROM ExchangeListing l
        WHERE (:search = '' OR LOWER(l.offeredSkill) LIKE LOWER(CONCAT('%',:search,'%'))
               OR LOWER(l.wantedSkill) LIKE LOWER(CONCAT('%',:search,'%')))
        AND (:availability IS NULL OR l.availability = :availability)
        ORDER BY l.createdAt DESC
    """)
    Page<ExchangeListing> browse(
        @Param("search") String search,
        @Param("availability") String availability,
        Pageable pageable
    );
}
