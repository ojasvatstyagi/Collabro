package com.example.backend.repositories;

import com.example.backend.models.ProjectFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProjectFileRepository extends JpaRepository<ProjectFile, UUID> {
    List<ProjectFile> findByProjectIdOrderByCreatedAtDesc(UUID projectId);
}
