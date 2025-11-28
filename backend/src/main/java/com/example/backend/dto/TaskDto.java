package com.example.backend.dto;

import com.example.backend.enums.TaskStatus;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class TaskDto {
    private UUID id;
    private String title;
    private String description;
    private List<String> mediaUrls;
    private LocalDateTime createdAt;
    private LocalDateTime deadline;
    private TaskStatus status;
    private UUID projectId;
    private UUID assignedToProfileId;
}
