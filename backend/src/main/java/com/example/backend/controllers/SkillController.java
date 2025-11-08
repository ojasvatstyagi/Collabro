package com.example.backend.controllers;

import com.example.backend.dto.SkillDto;
import com.example.backend.dto.SkillUpdateDto;
import com.example.backend.services.SkillService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/profile/skills")
@RequiredArgsConstructor
public class SkillController {
    private final SkillService skillService;

    @GetMapping
    @Operation(summary = "Get current user skills", description = "Returns the current user's skills")
    public ResponseEntity<List<SkillDto>> getCurrentUserSkills() {
        return ResponseEntity.ok(skillService.getCurrentUserSkills());
    }

    @PostMapping
    @Operation(summary = "Add a new skill", description = "Adds a new skill to the current user's profile")
    public ResponseEntity<SkillDto> addSkill(@Valid @RequestBody SkillUpdateDto skillDto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(skillService.addSkill(skillDto));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a skill", description = "Updates a skill in the current user's profile")
    public ResponseEntity<SkillDto> updateSkill(
            @PathVariable UUID id,
            @Valid @RequestBody SkillUpdateDto skillDto) {
        return ResponseEntity.ok(skillService.updateSkill(id, skillDto));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a skill", description = "Deletes a skill from the current user's profile")
    public ResponseEntity<Void> deleteSkill(@PathVariable UUID id) {
        skillService.deleteSkill(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/search")
    @Operation(summary = "Search for skills", description = "Searches for skills based on the provided query")
    public ResponseEntity<List<String>> searchSkills(@RequestParam String query) {
        return ResponseEntity.ok(skillService.searchSkills(query));
    }
}