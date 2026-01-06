package com.example.backend.services;

import com.example.backend.dto.ProjectDto;
import com.example.backend.enums.ProjectStatus;
import com.example.backend.exceptions.ResourceNotFoundException;
import com.example.backend.models.Profile;
import com.example.backend.models.Project;
import com.example.backend.repositories.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.example.backend.enums.ProjectLevel;

import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProfileService profileService;

    @Transactional(readOnly = true)
    public List<ProjectDto> getAllProjects(String search, ProjectLevel level, String technology) {
        List<String> techList = technology != null && !technology.isEmpty() ? List.of(technology) : null;
        org.springframework.data.jpa.domain.Specification<Project> spec = 
            com.example.backend.specifications.ProjectSpecification.withDynamicQuery(search, level, techList);
            
        return projectRepository.findAll(spec).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProjectDto getProjectById(UUID id) {
        Project project = projectRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));
        return convertToDto(project);
    }

    @Transactional
    public ProjectDto createProject(ProjectDto projectDto) {
        Profile currentUserProfile = profileService.getCurrentUserProfile();

        Project project = new Project();
        project.setTitle(projectDto.getTitle());
        project.setDescription(projectDto.getDescription());
        project.setTechnologies(projectDto.getTechnologies());
        project.setLevel(projectDto.getLevel());
        project.setDuration(projectDto.getDuration());
        project.setTeamSize(projectDto.getTeamSize());
        project.setCategory(projectDto.getCategory());
        project.setBudget(projectDto.getBudget());
        project.setRemote(projectDto.isRemote());
        project.setOpenSource(projectDto.isOpenSource());
        project.setContactMethod(projectDto.getContactMethod());
        project.setAdditionalInfo(projectDto.getAdditionalInfo());
        project.setStatus(ProjectStatus.ACTIVE); // Default status
        project.setCreatedBy(currentUserProfile);
        
        // Post and Team are null for now as per plan
        
        Project savedProject = projectRepository.save(project);
        return convertToDto(savedProject);
    }

    @Transactional(readOnly = true)
    public List<ProjectDto> getMyProjects() {
        Profile currentProfile = profileService.getCurrentUserProfile();
        return getProjectsByProfileId(currentProfile.getId());
    }

    @Transactional(readOnly = true)
    public List<ProjectDto> getProjectsByProfileId(UUID profileId) {
        return projectRepository.findByCreatedBy_Id(profileId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    private ProjectDto convertToDto(Project project) {
        return ProjectDto.builder()
                .id(project.getId())
                .title(project.getTitle())
                .description(project.getDescription())
                .technologies(project.getTechnologies())
                .level(project.getLevel())
                .duration(project.getDuration())
                .teamSize(project.getTeamSize())
                .category(project.getCategory())
                .budget(project.getBudget())
                .isRemote(project.isRemote())
                .isOpenSource(project.isOpenSource())
                .contactMethod(project.getContactMethod())
                .additionalInfo(project.getAdditionalInfo())
                .status(project.getStatus())
                .createdAt(project.getCreatedAt())
                .createdBy(ProjectDto.ProjectCreatorDto.builder()
                        .id(project.getCreatedBy().getId())
                        .username(project.getCreatedBy().getUser().getUsername())
                        .email(project.getCreatedBy().getUser().getEmail())
                        .profilePictureUrl(project.getCreatedBy().getProfilePictureUrl())
                        .build())
                .build();
    }
}
