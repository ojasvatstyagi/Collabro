package com.example.backend.controllers;

import com.example.backend.dto.DeleteAccountRequest;
import com.example.backend.dto.ProfileDto;
import com.example.backend.dto.ProfileStatusDto;
import com.example.backend.dto.ProfileUpdateDto;
import com.example.backend.exceptions.BadRequestException;
import com.example.backend.models.Profile;
import com.example.backend.models.User;
import com.example.backend.services.AccountService;
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
import java.util.Objects;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;
    private final com.example.backend.services.UserService userService;
    private final AccountService accountService;

    @GetMapping("/me")
    @Operation(summary = "Get current user profile", description = "Returns the current user's profile")
    public ResponseEntity<ProfileDto> getCurrentUserProfile() {
        return ResponseEntity.ok(profileService.getCurrentUserProfileDto());
    }

    @GetMapping("/users/{username}")
    @Operation(summary = "View another user's profile", description = "The public part of a profile (no e-mail, phone or settings); 404 for unknown or deleted accounts")
    public ResponseEntity<com.example.backend.dto.PublicProfileDto> getPublicProfile(@PathVariable String username) {
        return ResponseEntity.ok(profileService.getPublicProfile(username));
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
                profile.isProfileComplete() ? "Profile complete!" : "Please complete your profile"));
    }

    private List<String> getMissingFields(Profile profile) {
        List<String> missingFields = new ArrayList<>();
        if (StringUtils.isBlank(profile.getFirstname()))
            missingFields.add("firstname");
        if (StringUtils.isBlank(profile.getLastname()))
            missingFields.add("lastname");
        if (StringUtils.isBlank(profile.getBio()))
            missingFields.add("bio");
        if (StringUtils.isBlank(profile.getEducation()))
            missingFields.add("education");
        if (StringUtils.isBlank(profile.getLocation()))
            missingFields.add("location");
        if (StringUtils.isBlank(profile.getPhone()))
            missingFields.add("phone");
        if (profile.getSkills() == null || profile.getSkills().isEmpty())
            missingFields.add("skills");
        return missingFields;
    }

    @GetMapping(value = "/export", produces = MediaType.APPLICATION_OCTET_STREAM_VALUE)
    @Operation(summary = "Export current user profile to PDF", description = "Exports the current user's profile to a PDF file")
    public ResponseEntity<Resource> exportProfile() {
        Profile profile = profileService.getCurrentUserProfile();
        if (!profile.isProfileComplete()) {
            throw new BadRequestException("Complete your profile before exporting it as a PDF");
        }
        byte[] pdfBytes = profileService.exportToPdf(profile);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=profile_export.pdf")
                .contentType(Objects.requireNonNull(MediaType.APPLICATION_PDF))
                .contentLength(pdfBytes.length)
                .body(new ByteArrayResource(pdfBytes));
    }

    @DeleteMapping("/me")
    @Operation(summary = "Delete current user account", description = "Soft deletes the current user account")
    public ResponseEntity<Void> deleteAccount(@Valid @RequestBody DeleteAccountRequest request) {
        User user = userService.getCurrentUser();
        accountService.deleteAccount(user, request.getPassword());
        return ResponseEntity.noContent().build(); // 204 No Content
    }
}
