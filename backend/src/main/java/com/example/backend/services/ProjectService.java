package com.example.backend.services;

import com.example.backend.dto.ProjectDto;
import com.example.backend.enums.ProjectStatus;
import com.example.backend.exceptions.BadRequestException;
import com.example.backend.exceptions.ForbiddenException;
import com.example.backend.exceptions.ResourceNotFoundException;
import com.example.backend.models.Profile;
import com.example.backend.models.Project;
import com.example.backend.models.Team;
import com.example.backend.repositories.ChatMessageRepository;
import com.example.backend.repositories.ProjectFileRepository;
import com.example.backend.repositories.ProjectRepository;
import com.example.backend.repositories.RequestRepository;
import com.example.backend.repositories.TaskRepository;
import com.example.backend.repositories.TeamRepository;
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
    private final TaskRepository taskRepository;
    private final RequestRepository requestRepository;
    private final TeamRepository teamRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ProjectFileRepository projectFileRepository;
    private final FileStorageService fileStorageService;

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
        
        // The team is created when the first join request is approved
        Project savedProject = projectRepository.save(project);
        return convertToDto(savedProject);
    }

    @Transactional(readOnly = true)
    public Page<ProjectDto> getMyProjects(Pageable pageable) {
        Profile currentProfile = profileService.getCurrentUserProfile();
        return getProjectsByProfileId(currentProfile.getId(), pageable);
    }

    @Transactional(readOnly = true)
    public Page<ProjectDto> getProjectsByProfileId(UUID profileId, Pageable pageable) {
        return projectRepository.findByCreatedBy_Id(profileId, pageable).map(this::convertToDto);
    }

    @Transactional(readOnly = true)
    public Page<ProjectDto> getJoinedProjects(Pageable pageable) {
        Profile currentProfile = profileService.getCurrentUserProfile();
        return projectRepository.findByTeam_Members_Id(currentProfile.getId(), pageable).map(this::convertToDto);
    }

    @Transactional
    public ProjectDto updateProject(UUID projectId, ProjectDto projectDto) {
        Project project = projectRepository.findById(Objects.requireNonNull(projectId))
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        
        Profile currentUserProfile = profileService.getCurrentUserProfile();
        if (!project.getCreatedBy().getId().equals(currentUserProfile.getId())) {
             throw new com.example.backend.exceptions.ForbiddenException("Only the project owner can update the project");
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
             throw new com.example.backend.exceptions.ForbiddenException("Only the project owner can remove team members");
        }
        
        if (project.getTeam() == null) {
             throw new ResourceNotFoundException("Project has no team");
        }
        
        Profile memberToRemove = profileService.getProfileById(memberId);
        if (!project.getTeam().getMembers().contains(memberToRemove)) {
            throw new ResourceNotFoundException("User is not a member of this project team");
        }
        
        releaseMember(project, memberToRemove);
    }

    /** A team member leaves on their own. The owner cannot: they would have to delete the project instead. */
    @Transactional
    public void leaveProject(UUID projectId) {
        Project project = projectRepository.findById(Objects.requireNonNull(projectId))
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        Profile me = profileService.getCurrentUserProfile();

        if (project.getCreatedBy().getId().equals(me.getId())) {
            throw new BadRequestException("The project owner cannot leave. Delete the project instead");
        }
        if (project.getTeam() == null || !project.getTeam().getMembers().contains(me)) {
            throw new BadRequestException("You are not a member of this project");
        }
        releaseMember(project, me);
    }

    /**
     * Permanently deletes a project with everything inside it: tasks, files (including the stored copies),
     * chat, join requests and its team. Only the owner may do this.
     */
    @Transactional
    public void deleteProject(UUID projectId) {
        Project project = projectRepository.findById(Objects.requireNonNull(projectId))
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        Profile me = profileService.getCurrentUserProfile();
        if (!project.getCreatedBy().getId().equals(me.getId())) {
            throw new ForbiddenException("Only the project owner can delete the project");
        }

        // Chat messages are not mapped from Project, so nothing would remove them with it
        chatMessageRepository.deleteByProjectId(projectId);

        List<String> storedFiles = projectFileRepository.findByProjectIdOrderByCreatedAtDesc(projectId).stream()
                .map(file -> file.getFileUrl())
                .toList();
        Team team = project.getTeam();

        // Tasks, file rows, requests and reviews go with the project (cascade)
        projectRepository.delete(project);
        if (team != null) {
            teamRepository.delete(team);
        }
        // Only touch the disk once the database side has gone through
        storedFiles.forEach(fileStorageService::deleteFile);
    }

    /** Takes a member out of the team and clears what tied them to the project. */
    private void releaseMember(Project project, Profile member) {
        project.getTeam().getMembers().remove(member);
        taskRepository.findByProjectIdAndAssignedToId(project.getId(), member.getId())
                .forEach(task -> task.setAssignedTo(null));
        // The approved request would otherwise block them from ever asking to join again
        requestRepository.findByProjectAndRequester(project, member).ifPresent(requestRepository::delete);
    }

    @Transactional(readOnly = true)
    public List<com.example.backend.dto.PublicProfileDto> getProjectTeam(UUID projectId) {
        Project project = projectRepository.findById(Objects.requireNonNull(projectId))
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
                
        if (project.getTeam() == null) {
            return java.util.Collections.emptyList();
        }
        
        return project.getTeam().getMembers().stream()
                .map(profileService::toPublicDto)
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
                .remote(project.isRemote())
                .openSource(project.isOpenSource())
                .contactMethod(project.getContactMethod())
                .additionalInfo(project.getAdditionalInfo())
                .status(project.getStatus())
                .createdAt(project.getCreatedAt())
                .createdBy(ProjectDto.ProjectCreatorDto.builder()
                        .id(project.getCreatedBy().getId())
                        .username(project.getCreatedBy().displayUsername())
                        .displayName(project.getCreatedBy().displayName())
                        .profilePictureUrl(ProfileService.publicPictureUrl(project.getCreatedBy().getProfilePictureUrl()))
                        .build())
                .build();
    }
}
