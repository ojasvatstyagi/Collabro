package com.example.backend.controllers;

import com.example.backend.dto.SocialLinkDto;
import com.example.backend.exceptions.ResourceNotFoundException;
import com.example.backend.services.SocialLinkService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/profile/social-links")
@RequiredArgsConstructor
public class SocialLinkController {

    private final SocialLinkService socialLinkService;

    @GetMapping
    @Operation(summary = "Get current user's social links", description = "Returns the current user's social links")
    public ResponseEntity<List<SocialLinkDto>> getCurrentUserSocialLinks() {
        return ResponseEntity.ok(socialLinkService.getCurrentUserSocialLinks());
    }

    @PostMapping
    @Operation(summary = "Add a new social link", description = "Adds a new social link to the current user's profile")
    public ResponseEntity<SocialLinkDto> addSocialLink(@Valid @RequestBody SocialLinkDto socialLinkDto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(socialLinkService.addSocialLink(socialLinkDto));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a social link", description = "Updates a social link in the current user's profile")
    public ResponseEntity<SocialLinkDto> updateSocialLink(
            @PathVariable UUID id,
            @Valid @RequestBody SocialLinkDto socialLinkDto) {
        try {
            SocialLinkDto socialLinkDtoUp = socialLinkService.updateSocialLink(id, socialLinkDto);
            return ResponseEntity.ok(socialLinkDtoUp);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a social link", description = "Deletes a social link from the current user's profile")
    public ResponseEntity<Void> deleteSocialLink(@PathVariable UUID id) {
        socialLinkService.deleteSocialLink(id);
        return ResponseEntity.noContent().build();
    }
}

