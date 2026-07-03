package com.example.backend.services;

import com.example.backend.dto.ProjectFileDto;
import com.example.backend.exceptions.ForbiddenException;
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
    private final ProjectAccessService projectAccessService;

    @Transactional
    public ProjectFileDto uploadFile(UUID projectId, MultipartFile file) {
        Project project = projectRepository.findById(Objects.requireNonNull(projectId))
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        Profile uploader = projectAccessService.requireMember(project);
        if (file.isEmpty()) {
            throw new com.example.backend.exceptions.BadRequestException("File is empty");
        }

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
        Project project = projectRepository.findById(Objects.requireNonNull(projectId))
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        projectAccessService.requireMember(project);
        return projectFileRepository.findByProjectIdOrderByCreatedAtDesc(projectId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteFile(UUID fileId) {
        ProjectFile file = projectFileRepository.findById(Objects.requireNonNull(fileId))
                .orElseThrow(() -> new ResourceNotFoundException("File not found"));
        
        // The project owner may delete any file; other members only the files they uploaded
        Profile current = projectAccessService.requireMember(file.getProject());
        boolean isUploader = file.getUploadedBy().getId().equals(current.getId());
        if (!isUploader && !projectAccessService.isOwner(file.getProject(), current)) {
            throw new ForbiddenException("Only the uploader or the project owner can delete this file");
        }

        // Delete the row first: if removing the stored file fails, the transaction rolls the row back
        projectFileRepository.delete(file);
        fileStorageService.deleteFile(file.getFileUrl());
    }

    @Transactional(readOnly = true)
    public Resource loadFileAsResource(UUID fileId) {
        ProjectFile file = getFileEntity(fileId);
        return fileStorageService.loadFileAsResource(file.getFileUrl());
    }

    @Transactional(readOnly = true)
    public ProjectFile getFileEntity(UUID fileId) {
        ProjectFile file = projectFileRepository.findById(Objects.requireNonNull(fileId))
                .orElseThrow(() -> new ResourceNotFoundException("File not found"));
        projectAccessService.requireMember(file.getProject());
        return file;
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
                .uploadedByName(file.getUploadedBy().displayUsername()) // or firstname
                .uploadedByAvatar(ProfileService.publicPictureUrl(file.getUploadedBy().getProfilePictureUrl()))
                .projectId(file.getProject().getId())
                .build();
    }
}
