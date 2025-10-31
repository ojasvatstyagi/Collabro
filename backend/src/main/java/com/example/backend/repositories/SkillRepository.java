package com.example.backend.repositories;

import com.example.backend.models.Profile;
import com.example.backend.models.Skill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SkillRepository extends JpaRepository<Skill, UUID> {
    Optional<Skill> findByIdAndProfile(UUID skillId, Profile profile);

    List<Skill> findByProfile(Profile profile);

    @Query("SELECT DISTINCT s.name FROM Skill s WHERE s.name LIKE %:query%")
    List<String> findSkillNamesContaining(@Param("query") String query);
}
