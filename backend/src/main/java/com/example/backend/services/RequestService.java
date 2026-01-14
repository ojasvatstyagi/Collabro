package com.example.backend.services;

import com.example.backend.dto.CollaborationRequestDTO;
import com.example.backend.dto.RequestStatsDTO;
import com.example.backend.enums.RequestStatus;
import com.example.backend.exceptions.BadRequestException;
import com.example.backend.exceptions.ResourceNotFoundException;
import com.example.backend.models.CollaborationRequest;
import com.example.backend.models.Profile;
import com.example.backend.models.Project;
import com.example.backend.models.Team;
import com.example.backend.repositories.ProjectRepository;
import com.example.backend.repositories.RequestRepository;
import com.example.backend.repositories.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RequestService {

    private final RequestRepository requestRepository;
    private final ProjectRepository projectRepository;
    private final ProfileService profileService;
    private final TeamRepository teamRepository;

    @Transactional
    public CollaborationRequest createJoinRequest(UUID projectId, String message) {
        Profile requester = profileService.getCurrentUserProfile();
        Project project = projectRepository.findById(Objects.requireNonNull(projectId))
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        // Validate: Can't join own project
        if (project.getCreatedBy().getId().equals(requester.getId())) {
            throw new BadRequestException("You cannot join your own project");
        }

        // Validate: No duplicate requests
        if (requestRepository.findByProjectAndRequester(project, requester).isPresent()) {
            throw new BadRequestException("Request already exists");
        }

        // Check if already a team member
        if (project.getTeam() != null && project.getTeam().getMembers().contains(requester)) {
            throw new BadRequestException("You are already a member of this project");
        }

        CollaborationRequest request = new CollaborationRequest();
        request.setProject(project);
        request.setRequester(requester);
        request.setStatus(RequestStatus.PENDING);
        request.setMessage(message);

        return requestRepository.save(request);
    }

    public List<CollaborationRequestDTO> getReceivedRequests(RequestStatus status) {
        Profile currentUser = profileService.getCurrentUserProfile();
        
        List<CollaborationRequest> requests;
        if (status != null) {
            requests = requestRepository.findByProjectOwnerAndStatus(currentUser, status);
        } else {
            requests = requestRepository.findByProjectOwner(currentUser);
        }
        
        return requests.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public List<CollaborationRequestDTO> getSentRequests(RequestStatus status) {
        Profile currentUser = profileService.getCurrentUserProfile();
        
        List<CollaborationRequest> requests;
        if (status != null) {
            requests = requestRepository.findByRequesterAndStatus(currentUser, status);
        } else {
            requests = requestRepository.findByRequester(currentUser);
        }
        
        return requests.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public CollaborationRequest getRequestById(Long requestId) {
        CollaborationRequest request = requestRepository.findById(Objects.requireNonNull(requestId))
                .orElseThrow(() -> new ResourceNotFoundException("Request not found"));
        
        Profile currentUser = profileService.getCurrentUserProfile();
        
        // User must be either the project owner or the requester
        boolean isProjectOwner = request.getProject().getCreatedBy().getId().equals(currentUser.getId());
        boolean isRequester = request.getRequester().getId().equals(currentUser.getId());
        
        if (!isProjectOwner && !isRequester) {
            throw new AccessDeniedException("You don't have permission to view this request");
        }
        
        return request;
    }

    @Transactional
    public CollaborationRequestDTO approveRequest(Long requestId) {
        CollaborationRequest request = requestRepository.findById(Objects.requireNonNull(requestId))
                .orElseThrow(() -> new ResourceNotFoundException("Request not found"));
        
        Profile currentUser = profileService.getCurrentUserProfile();
        
        // Only project owner can approve
        if (!request.getProject().getCreatedBy().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Only the project owner can approve requests");
        }
        
        // Validate request is pending
        if (request.getStatus() != RequestStatus.PENDING) {
            throw new BadRequestException("Only pending requests can be approved");
        }
        
        // Update request status
        request.setStatus(RequestStatus.APPROVED);
        CollaborationRequest savedRequest = requestRepository.save(request);
        
        // Add requester to team
        addRequesterToTeam(request.getProject(), request.getRequester());
        
        return mapToDTO(savedRequest);
    }

    @Transactional
    public CollaborationRequestDTO rejectRequest(Long requestId, String reason) {
        CollaborationRequest request = requestRepository.findById(Objects.requireNonNull(requestId))
                .orElseThrow(() -> new ResourceNotFoundException("Request not found"));
        
        Profile currentUser = profileService.getCurrentUserProfile();
        
        // Only project owner can reject
        if (!request.getProject().getCreatedBy().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Only the project owner can reject requests");
        }
        
        // Validate request is pending
        if (request.getStatus() != RequestStatus.PENDING) {
            throw new BadRequestException("Only pending requests can be rejected");
        }
        
        // Update request status
        request.setStatus(RequestStatus.REJECTED);
        request.setRejectionReason(reason);
        
        CollaborationRequest savedRequest = requestRepository.save(request);
        
        return mapToDTO(savedRequest);
    }

    @Transactional
    public void cancelRequest(Long requestId) {
        CollaborationRequest request = requestRepository.findById(Objects.requireNonNull(requestId))
                .orElseThrow(() -> new ResourceNotFoundException("Request not found"));
        
        Profile currentUser = profileService.getCurrentUserProfile();
        
        // Only requester can cancel
        if (!request.getRequester().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("You can only cancel your own requests");
        }
        
        // Can only cancel pending requests
        if (request.getStatus() != RequestStatus.PENDING) {
            throw new BadRequestException("Only pending requests can be cancelled");
        }
        
        requestRepository.delete(request);
    }

    public RequestStatsDTO getRequestStats() {
        Profile currentUser = profileService.getCurrentUserProfile();
        
        return RequestStatsDTO.builder()
                .pendingReceived(requestRepository.countByProjectOwnerAndStatus(currentUser, RequestStatus.PENDING))
                .totalReceived(requestRepository.countByProjectOwner(currentUser))
                .approvedReceived(requestRepository.countByProjectOwnerAndStatus(currentUser, RequestStatus.APPROVED))
                .rejectedReceived(requestRepository.countByProjectOwnerAndStatus(currentUser, RequestStatus.REJECTED))
                .pendingSent(requestRepository.countByRequesterAndStatus(currentUser, RequestStatus.PENDING))
                .totalSent(requestRepository.countByRequester(currentUser))
                .build();
    }

    private void addRequesterToTeam(Project project, Profile requester) {
        Team team = project.getTeam();
        
        // Create team if it doesn't exist
        if (team == null) {
            team = new Team();
            team.setTeamName(project.getTitle() + " Team");
            team.setProject(project);
            team = teamRepository.save(team);
            project.setTeam(team);
            projectRepository.save(project);
        }
        
        // Add member if not already in team
        if (!team.getMembers().contains(requester)) {
            team.getMembers().add(requester);
            teamRepository.save(team);
        }
    }

    private CollaborationRequestDTO mapToDTO(CollaborationRequest request) {
        Profile requester = request.getRequester();
        
        // Get skills as list of strings
        List<String> skills = requester.getSkills().stream()
                .map(skill -> skill.getName())
                .collect(Collectors.toList());
        
        CollaborationRequestDTO.RequesterDTO requesterDTO = CollaborationRequestDTO.RequesterDTO.builder()
                .id(requester.getId())
                .username(requester.getUser().getUsername())
                .firstname(requester.getFirstname())
                .lastname(requester.getLastname())
                .profilePictureUrl(requester.getProfilePictureUrl())
                .skills(skills)
                .build();
        
        return CollaborationRequestDTO.builder()
                .id(request.getId())
                .projectId(request.getProject().getId())
                .projectTitle(request.getProject().getTitle())
                .requester(requesterDTO)
                .message(request.getMessage())
                .status(request.getStatus())
                .createdAt(request.getCreatedAt())
                .updatedAt(request.getUpdatedAt())
                .rejectionReason(request.getRejectionReason())
                .build();
    }
}
