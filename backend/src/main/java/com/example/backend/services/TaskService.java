package com.example.backend.services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.example.backend.dto.TaskDto; // Need to create this
import com.example.backend.enums.TaskPriority;
import com.example.backend.enums.TaskStatus;
import com.example.backend.exceptions.BadRequestException;
import com.example.backend.exceptions.ResourceNotFoundException;
import com.example.backend.models.Profile;
import com.example.backend.models.Project;
import com.example.backend.models.Task;
import com.example.backend.repositories.ProjectRepository;
import com.example.backend.repositories.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final ProfileService profileService;
    private final ProjectAccessService projectAccessService;

    @Transactional
    public TaskDto createTask(UUID projectId, TaskDto taskDto) {
        Project project = projectRepository.findById(Objects.requireNonNull(projectId))
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        projectAccessService.requireMember(project);
        if (taskDto.getTitle() == null || taskDto.getTitle().isBlank()) {
            throw new BadRequestException("Task title is required");
        }

        Profile assignee = null;
        if (taskDto.getAssigneeId() != null) {
            assignee = resolveAssignee(project, taskDto.getAssigneeId());
        }

        Task task = new Task();
        task.setTitle(taskDto.getTitle());
        task.setDescription(taskDto.getDescription());
        task.setProject(project);
        task.setAssignedTo(assignee);
        task.setPriority(taskDto.getPriority() != null ? taskDto.getPriority() : TaskPriority.MEDIUM);
        task.setStatus(TaskStatus.PENDING);
        task.setTags(taskDto.getTags());
        task.setDeadline(taskDto.getDueDate() != null ? taskDto.getDueDate() : LocalDateTime.now().plusDays(7));
        
        Task savedTask = taskRepository.save(task);
        return convertToDto(savedTask);
    }

    @Transactional
    public TaskDto updateTask(UUID taskId, TaskDto taskDto) {
        Task task = taskRepository.findById(Objects.requireNonNull(taskId))
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
        projectAccessService.requireMember(task.getProject());

        if (taskDto.getTitle() != null) {
            if (taskDto.getTitle().isBlank()) {
                throw new BadRequestException("Task title cannot be blank");
            }
            task.setTitle(taskDto.getTitle());
        }
        if (taskDto.getDescription() != null) task.setDescription(taskDto.getDescription());
        if (taskDto.getStatus() != null) task.setStatus(taskDto.getStatus());
        if (taskDto.getPriority() != null) task.setPriority(taskDto.getPriority());
        if (taskDto.getTags() != null) task.setTags(taskDto.getTags());
        if (taskDto.getDueDate() != null) task.setDeadline(taskDto.getDueDate());
        
        if (taskDto.getAssigneeId() != null) {
             task.setAssignedTo(resolveAssignee(task.getProject(), taskDto.getAssigneeId()));
        }

        Task updatedTask = taskRepository.save(Objects.requireNonNull(task));
        return convertToDto(updatedTask);
    }
    
    @Transactional
    public void deleteTask(UUID taskId) {
        Task task = taskRepository.findById(Objects.requireNonNull(taskId))
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
        projectAccessService.requireMember(task.getProject());
        taskRepository.delete(task);
    }

    @Transactional(readOnly = true)
    public Page<TaskDto> getTasksByProject(UUID projectId, Pageable pageable) {
        Project project = projectRepository.findById(Objects.requireNonNull(projectId))
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        projectAccessService.requireMember(project);
        return taskRepository.findByProjectId(projectId, pageable).map(this::convertToDto);
    }

    private Profile resolveAssignee(Project project, UUID assigneeId) {
        Profile assignee = profileService.getProfileById(assigneeId);
        if (!projectAccessService.isMember(project, assignee)) {
            throw new BadRequestException("Assignee must be a member of the project");
        }
        return assignee;
    }

    private TaskDto convertToDto(Task task) {
        return TaskDto.builder()
                .id(task.getId())
                .title(task.getTitle())
                .description(task.getDescription())
                .status(task.getStatus())
                .priority(task.getPriority())
                .tags(task.getTags())
                .dueDate(task.getDeadline())
                .createdAt(task.getCreatedAt())
                .assigneeId(task.getAssignedTo() != null ? task.getAssignedTo().getId() : null)
                .assigneeName(task.getAssignedTo() != null ? task.getAssignedTo().getFirstname() + " " + task.getAssignedTo().getLastname() : null)
                .assigneeAvatar(task.getAssignedTo() != null ? ProfileService.publicPictureUrl(task.getAssignedTo().getProfilePictureUrl()) : null)
                .projectId(task.getProject().getId())
                .build();
    }
}
