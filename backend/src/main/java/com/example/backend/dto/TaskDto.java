package com.example.backend.dto;

import com.example.backend.enums.TaskPriority;
import com.example.backend.enums.TaskStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class TaskDto {
    private UUID id;
    private String title;
    private String description;
    private TaskStatus status;
    private TaskPriority priority;
    private List<String> tags;
    private LocalDateTime dueDate;
    private LocalDateTime createdAt;
    
    private UUID assigneeId;
    private String assigneeName;
    private String assigneeAvatar;
    
    private UUID projectId;
}
