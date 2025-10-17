package com.example.backend.controllers;

import com.example.backend.exceptions.BadRequestException;
import com.example.backend.exceptions.ResourceNotFoundException;
import com.example.backend.models.Profile;
import com.example.backend.repositories.FileStorageService;
import com.example.backend.services.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
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
    public ResponseEntity<?> uploadProfilePicture(
            @RequestParam("file") MultipartFile file) throws BadRequestException {

        try {
            if (file.isEmpty()) throw new BadRequestException("File is empty");

            // Validate file type
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                throw new BadRequestException("Only image files are allowed");
            }

            Profile profile = profileService.getCurrentUserProfile();

            // Delete old picture if exists
            if (profile.getProfilePictureUrl() != null) {
                fileStorageService.deleteFile(profile.getProfilePictureUrl());
            }

            // Store new picture
            String relativePath = fileStorageService.storeFile(file, "profile-pictures");
            profile.setProfilePictureUrl(relativePath);
            profile = profileService.saveProfile(profile);

            return ResponseEntity.ok(profileService.convertToDto(profile));
        } catch (BadRequestException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping
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