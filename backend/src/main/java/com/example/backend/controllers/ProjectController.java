package com.example.backend.controllers;

import com.example.backend.dto.ProjectDto;
import com.example.backend.services.ProjectService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.backend.services.RequestService;

import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;
    private final RequestService requestService;

    @GetMapping
    @Operation(summary = "Get all projects", description = "Retrieve a paginated list of all projects with optional filtering")
    public Page<ProjectDto> getAllProjects(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) com.example.backend.enums.ProjectLevel level,
            @RequestParam(required = false) String technology,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt,desc") String[] sort) {
        
        String sortField = sort[0];
        String sortDirection = sort.length > 1 ? sort[1] : "desc";
        
        Sort.Direction direction = sortDirection.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortField));
        
        return projectService.getAllProjects(search, level, technology, category, pageable);
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

    @PostMapping("/{id}/join")
    @Operation(summary = "Join a project", description = "Send a request to join a project")
    public ResponseEntity<?> joinProject(@PathVariable UUID id, @RequestBody(required = false) com.example.backend.dto.JoinProjectRequest request) {
        String message = request != null ? request.getMessage() : null;
        requestService.createJoinRequest(id, message);
        return ResponseEntity.ok().body("{\"message\": \"Join request sent successfully\"}");
    }
}
