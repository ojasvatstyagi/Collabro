package com.example.backend.services;

import com.example.backend.dto.ProjectFileDto;
import com.example.backend.exceptions.ResourceNotFoundException;
import com.example.backend.models.Profile;
import com.example.backend.models.Project;
import com.example.backend.models.ProjectFile;
import com.example.backend.repositories.ProjectFileRepository;
import com.example.backend.repositories.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.Resource;

import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectFileService {

    private final ProjectFileRepository projectFileRepository;
    private final ProjectRepository projectRepository;
    private final FileStorageService fileStorageService;
    private final ProfileService profileService;

    @Transactional
    public ProjectFileDto uploadFile(UUID projectId, MultipartFile file) {
        Project project = projectRepository.findById(Objects.requireNonNull(projectId))
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        Profile uploader = profileService.getCurrentUserProfile();

        String relativePath = fileStorageService.storeFile(file, "project-files/" + projectId);

        ProjectFile projectFile = new ProjectFile();
        projectFile.setFileName(file.getOriginalFilename());
        projectFile.setFileUrl(relativePath);
        projectFile.setFileType(file.getContentType());
        projectFile.setSize(file.getSize());
        projectFile.setProject(project);
        projectFile.setUploadedBy(uploader);

        ProjectFile savedFile = projectFileRepository.save(projectFile);
        return convertToDto(savedFile);
    }

    @Transactional(readOnly = true)
    public List<ProjectFileDto> getProjectFiles(UUID projectId) {
        if (!projectRepository.existsById(Objects.requireNonNull(projectId))) {
             throw new ResourceNotFoundException("Project not found");
        }
        return projectFileRepository.findByProjectIdOrderByCreatedAtDesc(projectId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteFile(UUID fileId) {
        ProjectFile file = projectFileRepository.findById(Objects.requireNonNull(fileId))
                .orElseThrow(() -> new ResourceNotFoundException("File not found"));
        
        // Check permissions? For now, assume allowed if in team or uploader
        
        fileStorageService.deleteFile(file.getFileUrl());
        projectFileRepository.delete(file);
    }
    
    public Resource loadFileAsResource(UUID fileId) {
        ProjectFile file = projectFileRepository.findById(Objects.requireNonNull(fileId))
                .orElseThrow(() -> new ResourceNotFoundException("File not found"));
        return fileStorageService.loadFileAsResource(file.getFileUrl());
    }
    
    public ProjectFile getFileEntity(UUID fileId) {
         return projectFileRepository.findById(Objects.requireNonNull(fileId))
                .orElseThrow(() -> new ResourceNotFoundException("File not found"));
    }

    private ProjectFileDto convertToDto(ProjectFile file) {
        return ProjectFileDto.builder()
                .id(file.getId())
                .fileName(file.getFileName())
                .fileUrl(file.getFileUrl())
                .fileType(file.getFileType())
                .size(file.getSize())
                .createdAt(file.getCreatedAt())
                .uploadedById(file.getUploadedBy().getId())
                .uploadedByName(file.getUploadedBy().getUser().getUsername()) // or firstname
                .uploadedByAvatar(file.getUploadedBy().getProfilePictureUrl())
                .projectId(file.getProject().getId())
                .build();
    }
}
