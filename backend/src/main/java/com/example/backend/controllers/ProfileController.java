package com.example.backend.controllers;

import com.example.backend.dto.ProfileDto;
import com.example.backend.dto.ProfileStatusDto;
import com.example.backend.dto.ProfileUpdateDto;
import com.example.backend.exceptions.UserNotFoundException;
import com.example.backend.models.Profile;
import com.example.backend.services.ProfileService;
import io.micrometer.common.util.StringUtils;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping("/me")
    @Operation(summary = "Get current user profile", description = "Returns the current user's profile")
    public ResponseEntity<ProfileDto> getCurrentUserProfile() {
        return ResponseEntity.ok(profileService.getCurrentUserProfileDto());
    }

    @PutMapping("/me")
    @Operation(summary = "Update current user profile", description = "Updates the current user's profile")
    public ResponseEntity<ProfileDto> updateProfile(@Valid @RequestBody ProfileUpdateDto updateDto) {
        return ResponseEntity.ok(profileService.updateProfile(updateDto));
    }

    @GetMapping("/status")
    @Operation(summary = "Get current user profile status", description = "Returns the current user's profile's completion status")
    public ResponseEntity<ProfileStatusDto> getProfileStatus() {
        Profile profile = profileService.getCurrentUserProfile();
        return ResponseEntity.ok(ProfileStatusDto.withMessage(
                profile.isProfileComplete(),
                profile.getCompletionPercentage(),
                getMissingFields(profile),
                profile.isProfileComplete() ? "Profile complete!" : "Please complete your profile"
        ));
    }

    private List<String> getMissingFields(Profile profile) {
        List<String> missingFields = new ArrayList<>();
        if (StringUtils.isBlank(profile.getFirstname())) missingFields.add("firstname");
        if (StringUtils.isBlank(profile.getLastname())) missingFields.add("lastname");
        if (StringUtils.isBlank(profile.getBio())) missingFields.add("bio");
        if (StringUtils.isBlank(profile.getEducation())) missingFields.add("education");
        if (profile.getSkills() == null || profile.getSkills().isEmpty()) missingFields.add("skills");
        return missingFields;
    }

    @GetMapping(value = "/export", produces = MediaType.APPLICATION_OCTET_STREAM_VALUE)
    @Operation(summary = "Export current user profile to PDF", description = "Exports the current user's profile to a PDF file")
    public ResponseEntity<Resource> exportProfile() {
        try {
            if (!profileService.getCurrentUserProfile().isProfileComplete())
                throw new UserNotFoundException("Profile not found");
            Profile profile = profileService.getCurrentUserProfile();
            byte[] pdfBytes = profileService.exportToPdf(profile);

            ByteArrayResource resource = new ByteArrayResource(pdfBytes);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=profile_export.pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .contentLength(pdfBytes.length)
                    .body(resource);
        } catch (UserNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

}
