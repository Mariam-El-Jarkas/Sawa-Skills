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

    List<ExchangeListing> findByOwnerIdAndActiveTrueOrderByCreatedAtDesc(Long ownerId);

    @Query("""
        SELECT l FROM ExchangeListing l
        WHERE l.active = true
        AND (:search IS NULL OR :search = ''
             OR LOWER(l.offeredSkill) LIKE :search
             OR LOWER(l.wantedSkill) LIKE :search
             OR LOWER(l.owner.name) LIKE :search)
        AND (:category IS NULL
             OR LOWER(l.offeredSkill) LIKE :category)
        AND (:availability IS NULL OR l.availability = :availability)
        ORDER BY l.createdAt DESC
    """)
    Page<ExchangeListing> browse(
        @Param("search") String search,
        @Param("category") String category,
        @Param("availability") String availability,
        Pageable pageable
    );
}
