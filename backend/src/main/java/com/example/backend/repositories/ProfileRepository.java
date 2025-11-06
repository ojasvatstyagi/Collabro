package com.example.backend.repositories;


import com.example.backend.models.Profile;
import com.example.backend.models.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProfileRepository extends JpaRepository<Profile, UUID>, JpaSpecificationExecutor<Profile> {
    Optional<Profile> findByUser(User user);

    // Find users with similar skills (minimum 3 matches)
    @Query("""
        SELECT p FROM Profile p 
        JOIN p.skills s 
        WHERE s.name IN :skillNames 
          AND p.id <> :excludeProfileId 
        GROUP BY p 
        HAVING COUNT(s) >= 3
    """)
    List<Profile> findProfilesWithMatchingSkills(
            @Param("skillNames") List<String> skillNames,
            @Param("excludeProfileId") UUID excludeProfileId
    );

    // Find users with complementary skills (not already in the current user's skill set)
    @Query("""
        SELECT DISTINCT p FROM Profile p 
        JOIN p.skills s 
        WHERE s.name NOT IN :userSkillNames 
          AND p.id <> :userId
    """)
    List<Profile> findProfilesWithComplementarySkills(
            @Param("userSkillNames") List<String> userSkillNames,
            @Param("userId") UUID userId
    );

    Page<Profile> findAll(Specification<Profile> specification, Pageable pageable);
}
