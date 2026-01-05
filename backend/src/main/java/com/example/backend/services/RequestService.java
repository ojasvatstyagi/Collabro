package com.example.backend.services;

import com.example.backend.enums.RequestStatus;
import com.example.backend.exceptions.ResourceNotFoundException;
import com.example.backend.models.CollaborationRequest;
import com.example.backend.models.Profile;
import com.example.backend.models.Project;
import com.example.backend.repositories.ProjectRepository;
import com.example.backend.repositories.RequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Objects;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RequestService {

    private final RequestRepository requestRepository;
    private final ProjectRepository projectRepository;
    private final ProfileService profileService;

    @Transactional
    public void createJoinRequest(UUID projectId, String message) {
        Profile requester = profileService.getCurrentUserProfile();
        Project project = projectRepository.findById(Objects.requireNonNull(projectId))
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        if (project.getCreatedBy().getId().equals(requester.getId())) {
            throw new IllegalArgumentException("You cannot join your own project");
        }

        if (requestRepository.findByProjectAndRequester(project, requester).isPresent()) {
            throw new IllegalArgumentException("Request already exists");
        }

        CollaborationRequest request = new CollaborationRequest();
        request.setProject(project);
        request.setRequester(requester);
        request.setStatus(RequestStatus.PENDING);
        // message is not currently stored in CollaborationRequest entity based on previous review, 
        // effectively ignoring it for now or we need to add it to the entity. 
        // For this step, we'll stick to the entity definition.
        
        requestRepository.save(request);
    }
}
