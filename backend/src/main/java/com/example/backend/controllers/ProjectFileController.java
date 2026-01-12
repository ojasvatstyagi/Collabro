package com.example.backend.controllers;

import com.example.backend.dto.ProjectFileDto;
import com.example.backend.models.ProjectFile;
import com.example.backend.services.ProjectFileService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Objects;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ProjectFileController {

    private final ProjectFileService projectFileService;

    @PostMapping(value = "/projects/{projectId}/files", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload file to project", description = "Upload a file to a specific project")
    public ResponseEntity<ProjectFileDto> uploadFile(
            @PathVariable UUID projectId,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(projectFileService.uploadFile(projectId, file));
    }

    @GetMapping("/projects/{projectId}/files")
    @Operation(summary = "Get project files", description = "Retrieve all files for a project")
    public ResponseEntity<List<ProjectFileDto>> getProjectFiles(@PathVariable UUID projectId) {
        return ResponseEntity.ok(projectFileService.getProjectFiles(projectId));
    }

    @DeleteMapping("/project-files/{fileId}")
    @Operation(summary = "Delete file", description = "Delete a specific file")
    public ResponseEntity<Void> deleteFile(@PathVariable UUID fileId) {
        projectFileService.deleteFile(fileId);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/project-files/{fileId}/download")
    @Operation(summary = "Download file", description = "Download a specific file")
    public ResponseEntity<Resource> downloadFile(@PathVariable UUID fileId) {
        Resource resource = projectFileService.loadFileAsResource(fileId);
        ProjectFile fileEntity = projectFileService.getFileEntity(fileId);
        
        String contentType = "application/octet-stream";
        if (fileEntity.getFileType() != null) {
            contentType = fileEntity.getFileType();
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(Objects.requireNonNull(contentType)))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileEntity.getFileName() + "\"")
                .body(resource);
    }
}
