package com.example.backend.controllers;

import com.example.backend.dto.ProjectDto;
import com.example.backend.services.ProjectService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @GetMapping
    @Operation(summary = "Get all projects", description = "Retrieve a list of all projects with optional filtering")
    public ResponseEntity<List<ProjectDto>> getAllProjects(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) com.example.backend.enums.ProjectLevel level) {
        return ResponseEntity.ok(projectService.getAllProjects(search, level));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get project by ID", description = "Retrieve a project by its unique ID")
    public ResponseEntity<ProjectDto> getProjectById(@PathVariable UUID id) {
        return ResponseEntity.ok(projectService.getProjectById(id));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current user's projects", description = "Retrieve projects created by the authenticated user")
    public ResponseEntity<List<ProjectDto>> getMyProjects() {
        return ResponseEntity.ok(projectService.getMyProjects());
    }

    @GetMapping("/user/{profileId}")
    @Operation(summary = "Get user's projects", description = "Retrieve projects created by a specific user (profile ID)")
    public ResponseEntity<List<ProjectDto>> getUserProjects(@PathVariable UUID profileId) {
        return ResponseEntity.ok(projectService.getProjectsByProfileId(profileId));
    }

    @PostMapping
    @Operation(summary = "Create a project", description = "Create a new project")
    public ResponseEntity<ProjectDto> createProject(@RequestBody ProjectDto projectDto) {
        ProjectDto createdProject = projectService.createProject(projectDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdProject);
    }
}
