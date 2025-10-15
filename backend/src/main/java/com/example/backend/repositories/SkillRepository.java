package com.example.backend.repositories;

import com.example.backend.models.Profile;
import com.example.backend.models.Skill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SkillRepository extends JpaRepository<Skill, UUID> {
    Optional<Skill> findByIdAndProfile(UUID skillId, Profile profile);
}
