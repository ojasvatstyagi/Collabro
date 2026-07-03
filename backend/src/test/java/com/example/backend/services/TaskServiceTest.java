package com.example.backend.services;

import com.example.backend.dto.TaskDto;
import com.example.backend.exceptions.BadRequestException;
import com.example.backend.exceptions.ForbiddenException;
import com.example.backend.models.Profile;
import com.example.backend.models.Project;
import com.example.backend.models.Task;
import com.example.backend.repositories.ProjectRepository;
import com.example.backend.repositories.TaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static com.example.backend.services.ProjectTestData.profile;
import static com.example.backend.services.ProjectTestData.project;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository;
    @Mock
    private ProjectRepository projectRepository;
    @Mock
    private ProfileService profileService;

    private TaskService taskService;
    private Profile owner;
    private Profile member;
    private Profile outsider;
    private Project project;
    private Task task;

    @BeforeEach
    void setUp() {
        taskService = new TaskService(taskRepository, projectRepository, profileService,
                new ProjectAccessService(profileService));
        owner = profile("owner");
        member = profile("member");
        outsider = profile("outsider");
        project = project(owner, member);

        task = new Task();
        task.setId(UUID.randomUUID());
        task.setTitle("Existing");
        task.setProject(project);
    }

    private TaskDto newTask() {
        return TaskDto.builder().title("Write docs").build();
    }

    @Test
    void createTask_AsTeamMember_Succeeds() {
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(profileService.getCurrentUserProfile()).thenReturn(member);
        when(taskRepository.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));

        TaskDto result = taskService.createTask(project.getId(), newTask());

        assertEquals("Write docs", result.getTitle());
        assertEquals(project.getId(), result.getProjectId());
    }

    @Test
    void createTask_AsOutsider_ThrowsForbiddenAndSavesNothing() {
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(profileService.getCurrentUserProfile()).thenReturn(outsider);

        assertThrows(ForbiddenException.class, () -> taskService.createTask(project.getId(), newTask()));

        verify(taskRepository, never()).save(any(Task.class));
    }

    @Test
    void createTask_AssigneeOutsideProject_ThrowsBadRequest() {
        TaskDto dto = TaskDto.builder().title("Write docs").assigneeId(outsider.getId()).build();
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(profileService.getCurrentUserProfile()).thenReturn(owner);
        when(profileService.getProfileById(outsider.getId())).thenReturn(outsider);

        assertThrows(BadRequestException.class, () -> taskService.createTask(project.getId(), dto));

        verify(taskRepository, never()).save(any(Task.class));
    }

    @Test
    void updateTask_AsOutsider_ThrowsForbiddenAndLeavesTaskUnchanged() {
        when(taskRepository.findById(task.getId())).thenReturn(Optional.of(task));
        when(profileService.getCurrentUserProfile()).thenReturn(outsider);

        assertThrows(ForbiddenException.class,
                () -> taskService.updateTask(task.getId(), TaskDto.builder().title("Hijacked").build()));

        assertEquals("Existing", task.getTitle());
        verify(taskRepository, never()).save(any(Task.class));
    }

    @Test
    void updateTask_AsTeamMember_Succeeds() {
        when(taskRepository.findById(task.getId())).thenReturn(Optional.of(task));
        when(profileService.getCurrentUserProfile()).thenReturn(member);
        when(taskRepository.save(task)).thenReturn(task);

        TaskDto result = taskService.updateTask(task.getId(), TaskDto.builder().title("Renamed").build());

        assertEquals("Renamed", result.getTitle());
    }

    @Test
    void deleteTask_AsOutsider_ThrowsForbiddenAndDeletesNothing() {
        when(taskRepository.findById(task.getId())).thenReturn(Optional.of(task));
        when(profileService.getCurrentUserProfile()).thenReturn(outsider);

        assertThrows(ForbiddenException.class, () -> taskService.deleteTask(task.getId()));

        verify(taskRepository, never()).delete(any(Task.class));
    }

    @Test
    void deleteTask_AsTeamMember_Deletes() {
        when(taskRepository.findById(task.getId())).thenReturn(Optional.of(task));
        when(profileService.getCurrentUserProfile()).thenReturn(member);

        taskService.deleteTask(task.getId());

        verify(taskRepository).delete(task);
    }

    @Test
    void getTasksByProject_AsOutsider_ThrowsForbidden() {
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(profileService.getCurrentUserProfile()).thenReturn(outsider);

        assertThrows(ForbiddenException.class, () -> taskService.getTasksByProject(project.getId()));

        verify(taskRepository, never()).findByProjectId(any());
    }

    @Test
    void getTasksByProject_AsOwner_ReturnsTasks() {
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(profileService.getCurrentUserProfile()).thenReturn(owner);
        when(taskRepository.findByProjectId(project.getId())).thenReturn(List.of(task));

        List<TaskDto> result = taskService.getTasksByProject(project.getId());

        assertEquals(1, result.size());
    }

    @Test
    void createTask_WithoutATitle_ThrowsBadRequest() {
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(profileService.getCurrentUserProfile()).thenReturn(owner);

        for (String title : new String[] { null, "", "   " }) {
            assertThrows(BadRequestException.class,
                    () -> taskService.createTask(project.getId(), TaskDto.builder().title(title).build()));
        }
        verify(taskRepository, never()).save(any(Task.class));
    }

    @Test
    void updateTask_WithABlankTitle_ThrowsBadRequestAndKeepsTheOldOne() {
        when(taskRepository.findById(task.getId())).thenReturn(Optional.of(task));
        when(profileService.getCurrentUserProfile()).thenReturn(member);

        assertThrows(BadRequestException.class,
                () -> taskService.updateTask(task.getId(), TaskDto.builder().title("  ").build()));

        assertEquals("Existing", task.getTitle());
    }
}
