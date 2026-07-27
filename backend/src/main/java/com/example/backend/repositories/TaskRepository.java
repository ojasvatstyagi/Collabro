package com.example.backend.repositories;

import com.example.backend.enums.TaskStatus;
import com.example.backend.models.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TaskRepository extends JpaRepository<Task, UUID> {
    List<Task> findByProjectId(UUID projectId);
    org.springframework.data.domain.Page<Task> findByProjectId(UUID projectId, org.springframework.data.domain.Pageable pageable);
    List<Task> findByProjectIdAndAssignedToId(UUID projectId, UUID profileId);
    List<Task> findByAssignedToIdAndStatus(UUID profileId, TaskStatus status);
    long countByAssignedToIdAndStatus(UUID profileId, TaskStatus status);
}
