package com.example.backend.repositories;

import com.example.backend.models.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ProjectRepository extends JpaRepository<Project, UUID>, JpaSpecificationExecutor<Project> {
    java.util.List<Project> findByCreatedBy_Id(UUID id);
    java.util.List<Project> findByTeam_Members_Id(UUID profileId);
}
