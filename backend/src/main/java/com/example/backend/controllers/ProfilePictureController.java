package com.example.backend.controllers;

import com.example.backend.dto.ProfileDto;
import com.example.backend.exceptions.BadRequestException;
import com.example.backend.exceptions.ResourceNotFoundException;
import com.example.backend.models.Profile;
import com.example.backend.services.FileStorageService;
import com.example.backend.services.ProfileService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/profile/picture")
@RequiredArgsConstructor
public class ProfilePictureController {
    private final ProfileService profileService;
    private final FileStorageService fileStorageService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload Profile Picture", description = "Uploads a profile picture for the current user")
    public ResponseEntity<?> uploadProfilePicture(@RequestParam("file") MultipartFile file) {
        try {
            ProfileDto profileDto = fileStorageService.uploadProfilePicture(file);
            return ResponseEntity.ok(profileDto);
        } catch (BadRequestException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            // Optional: handle unexpected exceptions
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "An unexpected error occurred"));
        }
    }


    @GetMapping
    @Operation(summary = "Get Profile Picture", description = "Retrieves the profile picture for the current user")
    public ResponseEntity<?> getProfilePicture() {
        Profile profile = profileService.getCurrentUserProfile();
        try {
            if (profile.getProfilePictureUrl() == null)
                throw new ResourceNotFoundException("Profile picture not found");

            Resource resource = fileStorageService.loadFileAsResource(profile.getProfilePictureUrl());
            return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_JPEG) // Adjust based on actual file type
                    .body(resource);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping
    @Operation(summary = "Delete Profile Picture", description = "Deletes the profile picture for the current user")
    public ResponseEntity<Void> deleteProfilePicture() {
        Profile profile = profileService.getCurrentUserProfile();
        if (profile.getProfilePictureUrl() != null) {
            fileStorageService.deleteFile(profile.getProfilePictureUrl());
            profile.setProfilePictureUrl(null);
            profileService.saveProfile(profile);
        }
        return ResponseEntity.noContent().build();
    }
}