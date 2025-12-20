package com.example.backend.controllers;

import com.example.backend.dto.ProfileDto;
import com.example.backend.exceptions.ResourceNotFoundException;
import com.example.backend.models.Profile;
import com.example.backend.services.FileStorageService;
import com.example.backend.services.ProfileService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.Objects;

@RestController
@RequestMapping("/api/profile/picture")
@RequiredArgsConstructor
@Slf4j
public class ProfilePictureController {
    private final ProfileService profileService;
    private final FileStorageService fileStorageService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload Profile Picture", description = "Uploads a profile picture for the current user")
    public ResponseEntity<?> uploadProfilePicture(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "File is empty"));
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "Only image files are allowed"));
        }
        log.info("Uploading profile picture");
        ProfileDto profileDto = fileStorageService.uploadProfilePicture(file);
        return ResponseEntity.ok(profileDto);
    }

    @GetMapping
    @Operation(summary = "Get Profile Picture", description = "Retrieves the profile picture for the current user")
    public ResponseEntity<?> getProfilePicture() {
        Profile profile = profileService.getCurrentUserProfile();
        if (profile.getProfilePictureUrl() == null)
            throw new ResourceNotFoundException("Profile picture not found");

        Resource resource = fileStorageService.loadFileAsResource(profile.getProfilePictureUrl());
        return ResponseEntity.ok()
                .contentType(Objects.requireNonNull(MediaType.IMAGE_JPEG)) // Adjust based on actual file type
                .body(resource);
    }

    @DeleteMapping
    @Operation(summary = "Delete Profile Picture", description = "Deletes the profile picture for the current user")
    public ResponseEntity<Void> deleteProfilePicture() {
        Profile profile = profileService.getCurrentUserProfile();
        if (profile.getProfilePictureUrl() != null) {
            log.info("Deleting profile picture");
            fileStorageService.deleteFile(profile.getProfilePictureUrl());
            profile.setProfilePictureUrl(null);
            profileService.saveProfile(profile);
        }
        return ResponseEntity.noContent().build();
    }
}