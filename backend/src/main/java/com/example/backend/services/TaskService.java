package com.example.backend.services;

import com.example.backend.dto.TaskDto; // Need to create this
import com.example.backend.enums.TaskPriority;
import com.example.backend.enums.TaskStatus;
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
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final ProfileService profileService;

    @Transactional
    public TaskDto createTask(UUID projectId, TaskDto taskDto) {
        Project project = projectRepository.findById(Objects.requireNonNull(projectId))
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        
        Profile assignee = null;
        if (taskDto.getAssigneeId() != null) {
            assignee = profileService.getProfileById(taskDto.getAssigneeId());
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

        if (taskDto.getTitle() != null) task.setTitle(taskDto.getTitle());
        if (taskDto.getDescription() != null) task.setDescription(taskDto.getDescription());
        if (taskDto.getStatus() != null) task.setStatus(taskDto.getStatus());
        if (taskDto.getPriority() != null) task.setPriority(taskDto.getPriority());
        if (taskDto.getTags() != null) task.setTags(taskDto.getTags());
        if (taskDto.getDueDate() != null) task.setDeadline(taskDto.getDueDate());
        
        if (taskDto.getAssigneeId() != null) {
             Profile assignee = profileService.getProfileById(taskDto.getAssigneeId());
             task.setAssignedTo(assignee);
        }

        Task updatedTask = taskRepository.save(Objects.requireNonNull(task));
        return convertToDto(updatedTask);
    }
    
    @Transactional
    public void deleteTask(UUID taskId) {
        if (!taskRepository.existsById(Objects.requireNonNull(taskId))) {
            throw new ResourceNotFoundException("Task not found");
        }
        taskRepository.deleteById(taskId);
    }
    
    @Transactional(readOnly = true)
    public List<TaskDto> getTasksByProject(UUID projectId) {
        return taskRepository.findByProjectId(Objects.requireNonNull(projectId)).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
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
                .assigneeAvatar(task.getAssignedTo() != null ? task.getAssignedTo().getProfilePictureUrl() : null)
                .projectId(task.getProject().getId())
                .build();
    }
}
