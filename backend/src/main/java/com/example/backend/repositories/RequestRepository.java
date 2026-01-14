package com.example.backend.repositories;

import com.example.backend.enums.RequestStatus;
import com.example.backend.models.CollaborationRequest;
import com.example.backend.models.Profile;
import com.example.backend.models.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RequestRepository extends JpaRepository<CollaborationRequest, Long> {
    Optional<CollaborationRequest> findByProjectAndRequester(Project project, Profile requester);
    
    List<CollaborationRequest> findByProject(Project project);
    
    List<CollaborationRequest> findByRequester(Profile requester);
    
    List<CollaborationRequest> findByProjectAndStatus(Project project, RequestStatus status);
    
    List<CollaborationRequest> findByRequesterAndStatus(Profile requester, RequestStatus status);

    
    // Get all requests for projects owned by a specific profile
    @Query("SELECT r FROM CollaborationRequest r WHERE r.project.createdBy = :owner")
    List<CollaborationRequest> findByProjectOwner(@Param("owner") Profile owner);
    
    // Get all requests for projects owned by a specific profile with status filter
    @Query("SELECT r FROM CollaborationRequest r WHERE r.project.createdBy = :owner AND r.status = :status")
    List<CollaborationRequest> findByProjectOwnerAndStatus(@Param("owner") Profile owner, @Param("status") RequestStatus status);
    
    // Count requests by status for a project
    long countByProjectAndStatus(Project project, RequestStatus status);
    
    // Count requests by status for a requester
    long countByRequesterAndStatus(Profile requester, RequestStatus status);

    long countByRequester(Profile requester);
    
    // Count all requests for projects owned by a profile
    @Query("SELECT COUNT(r) FROM CollaborationRequest r WHERE r.project.createdBy = :owner")
    long countByProjectOwner(@Param("owner") Profile owner);
    
    // Count requests by status for projects owned by a profile
    @Query("SELECT COUNT(r) FROM CollaborationRequest r WHERE r.project.createdBy = :owner AND r.status = :status")
    long countByProjectOwnerAndStatus(@Param("owner") Profile owner, @Param("status") RequestStatus status);
}
