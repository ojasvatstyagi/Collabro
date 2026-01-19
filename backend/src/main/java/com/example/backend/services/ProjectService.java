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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProfileService profileService;

    @Transactional(readOnly = true)
    public Page<ProjectDto> getAllProjects(String search, ProjectLevel level, String technology, String category, Pageable pageable) {
        List<String> techList = technology != null && !technology.isEmpty() ? List.of(technology) : null;
        org.springframework.data.jpa.domain.Specification<Project> spec = 
            com.example.backend.specifications.ProjectSpecification.withDynamicQuery(search, level, techList, category);
            
        return projectRepository.findAll(spec, Objects.requireNonNull(pageable))
                .map(this::convertToDto);
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

    @Transactional(readOnly = true)
    public List<ProjectDto> getJoinedProjects() {
        Profile currentProfile = profileService.getCurrentUserProfile();
        return projectRepository.findByTeam_Members_Id(currentProfile.getId()).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }



    @Transactional
    public ProjectDto updateProject(UUID projectId, ProjectDto projectDto) {
        Project project = projectRepository.findById(Objects.requireNonNull(projectId))
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        
        Profile currentUserProfile = profileService.getCurrentUserProfile();
        if (!project.getCreatedBy().getId().equals(currentUserProfile.getId())) {
             throw new com.example.backend.exceptions.BadRequestException("Only the project owner can update the project");
        }

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
        // Status can be updated via specific flow if needed, but for now allow editing
        if(projectDto.getStatus() != null) {
            project.setStatus(projectDto.getStatus());
        }

        Project savedProject = projectRepository.save(project);
        return convertToDto(savedProject);
    }

    @Transactional
    public void removeTeamMember(UUID projectId, UUID memberId) {
        Project project = projectRepository.findById(Objects.requireNonNull(projectId))
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        
        Profile currentUserProfile = profileService.getCurrentUserProfile();
        if (!project.getCreatedBy().getId().equals(currentUserProfile.getId())) {
             throw new com.example.backend.exceptions.BadRequestException("Only the project owner can remove team members");
        }
        
        if (project.getTeam() == null) {
             throw new ResourceNotFoundException("Project has no team");
        }
        
        Profile memberToRemove = profileService.getProfileById(memberId);
        if (!project.getTeam().getMembers().contains(memberToRemove)) {
            throw new ResourceNotFoundException("User is not a member of this project team");
        }
        
        project.getTeam().getMembers().remove(memberToRemove);
        // Cascade delete or save team? JPA should handle relationship update if properly mapped.
        // But explicitly saving might be safer if cascade isn't perfect.
        // Actually Team.members is likely ManyToMany. 
        // Let's assume standard JPA behavior propagates changes on flush.
    }

    @Transactional(readOnly = true)
    public List<com.example.backend.dto.ProfileDto> getProjectTeam(UUID projectId) {
        Project project = projectRepository.findById(Objects.requireNonNull(projectId))
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
                
        if (project.getTeam() == null) {
            return java.util.Collections.emptyList();
        }
        
        return project.getTeam().getMembers().stream()
                .map(profileService::convertToDto)
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
