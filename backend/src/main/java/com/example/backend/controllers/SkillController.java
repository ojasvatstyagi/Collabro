package com.example.backend.controllers;

import com.example.backend.dtos.SkillDto;
import com.example.backend.dtos.SkillUpdateDto;
import com.example.backend.services.SkillService;
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
    public ResponseEntity<List<SkillDto>> getCurrentUserSkills() {
        return ResponseEntity.ok(skillService.getCurrentUserSkills());
    }

    @PostMapping
    public ResponseEntity<SkillDto> addSkill(@Valid @RequestBody SkillUpdateDto skillDto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(skillService.addSkill(skillDto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SkillDto> updateSkill(
            @PathVariable UUID id,
            @Valid @RequestBody SkillUpdateDto skillDto) {
        return ResponseEntity.ok(skillService.updateSkill(id, skillDto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSkill(@PathVariable UUID id) {
        skillService.deleteSkill(id);
        return ResponseEntity.noContent().build();
    }
}
