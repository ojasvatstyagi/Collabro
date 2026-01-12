package com.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ProjectFileDto {
    private UUID id;
    private String fileName;
    private String fileUrl;
    private String fileType;
    private long size;
    private LocalDateTime createdAt;
    
    // Uploaded By info
    private UUID uploadedById;
    private String uploadedByName;
    private String uploadedByAvatar;
    
    private UUID projectId;
}
