package com.example.backend.controllers;

import com.example.backend.dto.SocialLinkCreateDto;
import com.example.backend.dto.SocialLinkDto;
import com.example.backend.services.SocialLinkService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Objects;
import java.util.UUID;

@RestController
@RequestMapping("/api/profile/social-links")
@RequiredArgsConstructor
public class SocialLinkController {

    private final SocialLinkService socialLinkService;

    @GetMapping
    @Operation(summary = "Get current user social links", description = "Returns the current user's social links")
    public ResponseEntity<List<SocialLinkDto>> getCurrentUserSocialLinks() {
        return ResponseEntity.ok(socialLinkService.getCurrentUserSocialLinks());
    }

    @PostMapping
    @Operation(summary = "Add a new social link", description = "Adds a new social link to the current user's profile")
    public ResponseEntity<SocialLinkDto> addSocialLink(@Valid @RequestBody SocialLinkCreateDto createDto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(socialLinkService.addSocialLink(createDto));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Remove a social link", description = "Removes a social link from the current user's profile")
    public ResponseEntity<Void> removeSocialLink(@PathVariable UUID id) {
        socialLinkService.removeSocialLink(Objects.requireNonNull(id));
        return ResponseEntity.noContent().build();
    }
}
