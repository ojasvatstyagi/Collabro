package com.example.backend.dto;

import com.example.backend.enums.ProjectLevel;
import com.example.backend.enums.ProjectStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectDto {
    private UUID id;
    private String title;
    private String description;
    private List<String> technologies;
    private ProjectLevel level;
    private String duration;
    private int teamSize;
    private String category;
    private String budget;
    private boolean isRemote;
    private boolean isOpenSource;
    private String contactMethod;
    private String additionalInfo;
    private ProjectStatus status;
    private LocalDateTime createdAt;
    private ProjectCreatorDto createdBy;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProjectCreatorDto {
        private UUID id;
        private String username;
        private String profilePictureUrl;
    }
}
