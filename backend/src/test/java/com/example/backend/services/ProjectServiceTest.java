package com.example.backend.services;

import com.example.backend.exceptions.BadRequestException;
import com.example.backend.exceptions.ForbiddenException;
import com.example.backend.models.CollaborationRequest;
import com.example.backend.models.Profile;
import com.example.backend.models.Project;
import com.example.backend.models.ProjectFile;
import com.example.backend.models.Task;
import com.example.backend.models.Team;
import com.example.backend.repositories.ChatMessageRepository;
import com.example.backend.repositories.ProjectFileRepository;
import com.example.backend.repositories.ProjectRepository;
import com.example.backend.repositories.RequestRepository;
import com.example.backend.repositories.TaskRepository;
import com.example.backend.repositories.TeamRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static com.example.backend.services.ProjectTestData.profile;
import static com.example.backend.services.ProjectTestData.project;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    @Mock
    private ProjectRepository projectRepository;
    @Mock
    private ProfileService profileService;
    @Mock
    private TaskRepository taskRepository;
    @Mock
    private RequestRepository requestRepository;
    @Mock
    private TeamRepository teamRepository;
    @Mock
    private ChatMessageRepository chatMessageRepository;
    @Mock
    private ProjectFileRepository projectFileRepository;
    @Mock
    private FileStorageService fileStorageService;

    @InjectMocks
    private ProjectService projectService;

    private Profile owner;
    private Profile member;
    private Profile outsider;
    private Project project;

    @BeforeEach
    void setUp() {
        owner = profile("owner");
        member = profile("member");
        outsider = profile("outsider");
        project = project(owner, member);
    }

    private void theProjectExists() {
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
    }

    private Task assignedTo(Profile profile) {
        Task task = new Task();
        task.setAssignedTo(profile);
        task.setProject(project);
        return task;
    }

    // ---- leaving ----

    @Test
    void leaveProject_RemovesTheMemberFreesTheirTasksAndClearsTheRequest() {
        theProjectExists();
        when(profileService.getCurrentUserProfile()).thenReturn(member);
        Task task = assignedTo(member);
        when(taskRepository.findByProjectIdAndAssignedToId(project.getId(), member.getId())).thenReturn(List.of(task));
        CollaborationRequest approved = new CollaborationRequest();
        when(requestRepository.findByProjectAndRequester(project, member)).thenReturn(Optional.of(approved));

        projectService.leaveProject(project.getId());

        assertFalse(project.getTeam().getMembers().contains(member));
        assertNull(task.getAssignedTo());
        // Without this the approved request would stop them ever asking to join again
        verify(requestRepository).delete(approved);
    }

    @Test
    void leaveProject_AsTheOwner_IsRefused() {
        theProjectExists();
        when(profileService.getCurrentUserProfile()).thenReturn(owner);

        assertThrows(BadRequestException.class, () -> projectService.leaveProject(project.getId()));

        assertEquals(1, project.getTeam().getMembers().size());
    }

    @Test
    void leaveProject_WhenNotOnTheTeam_IsRefused() {
        theProjectExists();
        when(profileService.getCurrentUserProfile()).thenReturn(outsider);

        assertThrows(BadRequestException.class, () -> projectService.leaveProject(project.getId()));
    }

    @Test
    void leaveProject_OfAProjectWithoutATeam_IsRefused() {
        project = project(owner);
        theProjectExists();
        when(profileService.getCurrentUserProfile()).thenReturn(member);

        assertThrows(BadRequestException.class, () -> projectService.leaveProject(project.getId()));
    }

    // ---- removing a member ----

    @Test
    void removeTeamMember_ByTheOwner_AlsoFreesTheirTasksAndRequest() {
        theProjectExists();
        when(profileService.getCurrentUserProfile()).thenReturn(owner);
        when(profileService.getProfileById(member.getId())).thenReturn(member);
        Task task = assignedTo(member);
        when(taskRepository.findByProjectIdAndAssignedToId(project.getId(), member.getId())).thenReturn(List.of(task));

        projectService.removeTeamMember(project.getId(), member.getId());

        assertTrue(project.getTeam().getMembers().isEmpty());
        assertNull(task.getAssignedTo());
    }

    @Test
    void removeTeamMember_ByAMember_IsForbidden() {
        theProjectExists();
        when(profileService.getCurrentUserProfile()).thenReturn(member);

        assertThrows(ForbiddenException.class,
                () -> projectService.removeTeamMember(project.getId(), member.getId()));
    }

    // ---- deleting ----

    @Test
    void deleteProject_ByTheOwner_RemovesEverythingAndTheStoredFilesLast() {
        theProjectExists();
        when(profileService.getCurrentUserProfile()).thenReturn(owner);
        ProjectFile file = new ProjectFile();
        file.setFileUrl("project-files/x/spec.pdf");
        when(projectFileRepository.findByProjectIdOrderByCreatedAtDesc(project.getId())).thenReturn(List.of(file));
        Team team = project.getTeam();

        projectService.deleteProject(project.getId());

        InOrder order = inOrder(chatMessageRepository, projectRepository, teamRepository, fileStorageService);
        order.verify(chatMessageRepository).deleteByProjectId(project.getId());
        order.verify(projectRepository).delete(project);
        order.verify(teamRepository).delete(team);
        order.verify(fileStorageService).deleteFile("project-files/x/spec.pdf");
    }

    @Test
    void deleteProject_WithoutATeam_DoesNotTryToDeleteOne() {
        project = project(owner);
        theProjectExists();
        when(profileService.getCurrentUserProfile()).thenReturn(owner);

        projectService.deleteProject(project.getId());

        verify(projectRepository).delete(project);
        verify(teamRepository, never()).delete(any(Team.class));
    }

    @Test
    void deleteProject_ByAnyoneElse_IsForbiddenAndDeletesNothing() {
        theProjectExists();
        when(profileService.getCurrentUserProfile()).thenReturn(member);

        assertThrows(ForbiddenException.class, () -> projectService.deleteProject(project.getId()));

        verify(projectRepository, never()).delete(any(Project.class));
        verify(chatMessageRepository, never()).deleteByProjectId(any());
        verify(fileStorageService, never()).deleteFile(anyString());
    }
}
