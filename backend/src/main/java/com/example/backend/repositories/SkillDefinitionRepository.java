package com.example.backend.repositories;

import com.example.backend.models.SkillDefinition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SkillDefinitionRepository extends JpaRepository<SkillDefinition, UUID> {
    Optional<SkillDefinition> findByNormalizedName(String normalizedName);
}
