package com.example.backend.controllers;

import com.example.backend.dtos.ProfileDto;
import com.example.backend.dtos.ProfileStatusDto;
import com.example.backend.dtos.ProfileUpdateDto;
import com.example.backend.models.Profile;
import com.example.backend.services.ProfileService;
import io.micrometer.common.util.StringUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
    public ResponseEntity<ProfileDto> getCurrentUserProfile() {
        return ResponseEntity.ok(profileService.getCurrentUserProfileDto());
    }

    @PutMapping
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
        if (profile.getSkills().isEmpty()) missingFields.add("skills");

        return missingFields;
    }
}
