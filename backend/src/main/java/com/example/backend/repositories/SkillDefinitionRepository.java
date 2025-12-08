package com.example.backend.repositories;

import com.example.backend.models.SkillDefinition;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface SkillDefinitionRepository extends JpaRepository<SkillDefinition, UUID> {
    Optional<SkillDefinition> findByNormalizedName(String normalizedName);
}
