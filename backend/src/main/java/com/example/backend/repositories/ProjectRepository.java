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

    long countByCreatedBy_Id(UUID id);
    long countByCreatedBy_IdAndStatus(UUID id, com.example.backend.enums.ProjectStatus status);
    long countByTeam_Members_Id(UUID profileId);

    /** Members of the biggest team among the projects this profile owns (the owner is not counted), null if none has a team. */
    @org.springframework.data.jpa.repository.Query("SELECT MAX(SIZE(p.team.members)) FROM Project p WHERE p.createdBy.id = :ownerId")
    Integer findLargestTeamMemberCount(@org.springframework.data.repository.query.Param("ownerId") UUID ownerId);

    // The creator (and the user behind it) is always shown with a project, so load it with the page
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = { "createdBy", "createdBy.user" })
    org.springframework.data.domain.Page<Project> findByCreatedBy_Id(UUID id, org.springframework.data.domain.Pageable pageable);
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = { "createdBy", "createdBy.user" })
    org.springframework.data.domain.Page<Project> findByTeam_Members_Id(UUID profileId, org.springframework.data.domain.Pageable pageable);
}
