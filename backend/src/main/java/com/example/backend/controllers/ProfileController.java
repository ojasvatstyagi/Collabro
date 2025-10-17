package com.example.backend.controllers;

import com.example.backend.dto.ProfileDto;
import com.example.backend.dto.ProfileStatusDto;
import com.example.backend.dto.ProfileUpdateDto;
import com.example.backend.exceptions.UserNotFoundException;
import com.example.backend.models.Profile;
import com.example.backend.services.ProfileService;
import io.micrometer.common.util.StringUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping("/me")
    public ResponseEntity<ProfileDto> getCurrentUserProfile() {
        return ResponseEntity.ok(profileService.getCurrentUserProfileDto());
    }

    @PutMapping("/me")
    public ResponseEntity<ProfileDto> updateProfile(@Valid @RequestBody ProfileUpdateDto updateDto) {
        return ResponseEntity.ok(profileService.updateProfile(updateDto));
    }

    @GetMapping("/status")
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

    @PostMapping(value = "/picture", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ProfileDto> uploadProfilePicture(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) return ResponseEntity.badRequest().body(null);
        return ResponseEntity.ok(profileService.uploadProfilePicture(file));
    }

    @GetMapping(value = "/export", produces = MediaType.APPLICATION_OCTET_STREAM_VALUE)
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
