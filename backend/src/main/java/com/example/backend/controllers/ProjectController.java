package com.example.backend.controllers;

import com.example.backend.utils.ListPaging;
import com.example.backend.dto.ProjectDto;
import com.example.backend.dto.TaskDto;
import com.example.backend.exceptions.BadRequestException;
import com.example.backend.services.ProjectService;
import com.example.backend.services.TaskService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.backend.services.RequestService;

import java.util.List;
import java.util.Set;
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
    private final TaskService taskService;

    /** Fields a client may sort the project list by; anything else would be passed straight to the query. */
    private static final Set<String> SORTABLE_FIELDS = Set.of("createdAt", "title", "teamSize", "level");
    private static final int MAX_PAGE_SIZE = 50;

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
        
        String sortField = sort.length > 0 ? sort[0].trim() : "createdAt";
        String sortDirection = sort.length > 1 ? sort[1] : "desc";
        if (!SORTABLE_FIELDS.contains(sortField)) {
            throw new BadRequestException("Cannot sort by '" + sortField + "'. Allowed: " + SORTABLE_FIELDS);
        }

        Sort.Direction direction = sortDirection.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), MAX_PAGE_SIZE),
                Sort.by(direction, sortField));
        
        return projectService.getAllProjects(search, level, technology, category, pageable);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get project by ID", description = "Retrieve a project by its unique ID")
    public ResponseEntity<ProjectDto> getProjectById(@PathVariable UUID id) {
        return ResponseEntity.ok(projectService.getProjectById(id));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current user's projects", description = "Retrieve projects created by the authenticated user")
    public ResponseEntity<List<ProjectDto>> getMyProjects(@RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        return ListPaging.respond(projectService.getMyProjects(ListPaging.of(page, size, ListPaging.newestFirst("createdAt"))));
    }

    @GetMapping("/joined")
    @Operation(summary = "Get joined projects", description = "Retrieve projects where the current user is a team member")
    public ResponseEntity<List<ProjectDto>> getJoinedProjects(@RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        return ListPaging.respond(projectService.getJoinedProjects(ListPaging.of(page, size, ListPaging.newestFirst("createdAt"))));
    }

    @GetMapping("/user/{profileId}")
    @Operation(summary = "Get user's projects", description = "Retrieve projects created by a specific user (profile ID)")
    public ResponseEntity<List<ProjectDto>> getUserProjects(@PathVariable UUID profileId,
            @RequestParam(required = false) Integer page, @RequestParam(required = false) Integer size) {
        return ListPaging.respond(projectService.getProjectsByProfileId(profileId,
                ListPaging.of(page, size, ListPaging.newestFirst("createdAt"))));
    }

    @PostMapping
    @Operation(summary = "Create a project", description = "Create a new project")
    public ResponseEntity<ProjectDto> createProject(@Valid @RequestBody ProjectDto projectDto) {
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

    @GetMapping("/{id}/tasks")
    @Operation(summary = "Get project tasks", description = "Retrieve tasks for a specific project")
    public ResponseEntity<List<TaskDto>> getProjectTasks(@PathVariable UUID id,
            @RequestParam(required = false) Integer page, @RequestParam(required = false) Integer size) {
        return ListPaging.respond(taskService.getTasksByProject(id, ListPaging.of(page, size, ListPaging.newestFirst("createdAt"))));
    }

    @PostMapping("/{id}/tasks")
    @Operation(summary = "Create project task", description = "Create a new task for a specific project")
    public ResponseEntity<TaskDto> createProjectTask(@PathVariable UUID id, @Valid @RequestBody TaskDto taskDto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(taskService.createTask(id, taskDto));
    }


    @PutMapping("/{id}")
    @Operation(summary = "Update project", description = "Update project details")
    public ResponseEntity<ProjectDto> updateProject(@PathVariable UUID id, @Valid @RequestBody ProjectDto projectDto) {
        return ResponseEntity.ok(projectService.updateProject(id, projectDto));
    }

    @PostMapping("/{id}/leave")
    @Operation(summary = "Leave a project", description = "Leave the team of a project you joined")
    public ResponseEntity<Void> leaveProject(@PathVariable UUID id) {
        projectService.leaveProject(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a project", description = "Permanently delete a project and everything in it (owner only)")
    public ResponseEntity<Void> deleteProject(@PathVariable UUID id) {
        projectService.deleteProject(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/team")
    @Operation(summary = "Get project team", description = "Retrieve team members for a specific project")
    public ResponseEntity<List<com.example.backend.dto.PublicProfileDto>> getProjectTeam(@PathVariable UUID id) {
        return ResponseEntity.ok(projectService.getProjectTeam(id));
    }

    @DeleteMapping("/{id}/team/{userId}")
    @Operation(summary = "Remove team member", description = "Remove a member from the project team")
    public ResponseEntity<Void> removeTeamMember(@PathVariable UUID id, @PathVariable UUID userId) {
        projectService.removeTeamMember(id, userId);
        return ResponseEntity.noContent().build();
    }
}
