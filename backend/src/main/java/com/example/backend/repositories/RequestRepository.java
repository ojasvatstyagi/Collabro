package com.example.backend.repositories;

import com.example.backend.models.CollaborationRequest;
import com.example.backend.models.Profile;
import com.example.backend.models.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RequestRepository extends JpaRepository<CollaborationRequest, Long> {
    Optional<CollaborationRequest> findByProjectAndRequester(Project project, Profile requester);
    List<CollaborationRequest> findByProject(Project project);
    List<CollaborationRequest> findByRequester(Profile requester);
}
