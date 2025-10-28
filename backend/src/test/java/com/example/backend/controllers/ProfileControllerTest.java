package com.example.backend.controllers;


import com.example.backend.dto.ProfileDto;
import com.example.backend.dto.ProfileStatusDto;
import com.example.backend.dto.ProfileUpdateDto;
import com.example.backend.dto.SkillDto;
import com.example.backend.enums.Proficiency;
import com.example.backend.exceptions.UserNotFoundException;
import com.example.backend.models.Profile;
import com.example.backend.models.Skill;
import com.example.backend.services.ProfileService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class ProfileControllerTest {

    private MockMvc mockMvc;

    @Mock
    private ProfileService profileService;

    @InjectMocks
    private ProfileController profileController;

    private ProfileDto profileDto;
    private ProfileUpdateDto updateDto;
    private Profile profile;
    private ProfileStatusDto statusDto;
    private MockMultipartFile testImage;

    @BeforeEach
    void setup() {
        mockMvc = MockMvcBuilders.standaloneSetup(profileController).build();

        // Initialize test data
        UUID profileId = UUID.randomUUID();
        UUID skillId = UUID.randomUUID();

        profileDto = ProfileDto.builder()
                .id(profileId)
                .firstname("John")
                .lastname("Doe")
                .bio("Software Developer")
                .education("Computer Science")
                .skills(List.of(new SkillDto(skillId, "Java", Proficiency.ADVANCED)))
                .completionPercentage(100)
                .build();

        updateDto = ProfileUpdateDto.builder()
                .firstname("Updated")
                .lastname("Name")
                .bio("Updated Bio")
                .education("Updated Education")
                .build();

        profile = Profile.builder()
                .id(profileId)
                .firstname("John")
                .lastname("Doe")
                .bio("Software Developer")
                .education("Computer Science")
                .skills(List.of(Skill.builder()
                        .id(skillId)
                        .name("Java")
                        .proficiency(Proficiency.ADVANCED)
                        .build()))
                .build();
        profile.setCompletionPercentage(100);
        profile.setProfileComplete(true);

        statusDto = new ProfileStatusDto(
                true,
                100,
                Collections.emptyList(),
                "Profile complete!"
        );

        testImage = new MockMultipartFile(
                "file",
                "test.jpg",
                "image/jpeg",
                "fake-image".getBytes());
    }

    @Test
    void getCurrentUserProfile_ShouldReturnProfileDto() throws Exception {
        // Arrange
        when(profileService.getCurrentUserProfileDto()).thenReturn(profileDto);

        // Act & Assert
        mockMvc.perform(get("/api/profile/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(profileDto.getId().toString()))
                .andExpect(jsonPath("$.firstname").value(profileDto.getFirstname()))
                .andExpect(jsonPath("$.lastname").value(profileDto.getLastname()))
                .andExpect(jsonPath("$.bio").value(profileDto.getBio()))
                .andExpect(jsonPath("$.education").value(profileDto.getEducation()))
                .andExpect(jsonPath("$.skills[0].name").value("Java"))
                .andExpect(jsonPath("$.completionPercentage").value(100));
    }

    @Test
    void updateProfile_ShouldReturnUpdatedProfileDto() throws Exception {
        // Arrange
        when(profileService.updateProfile(any(ProfileUpdateDto.class))).thenReturn(profileDto);

        // Act & Assert
        mockMvc.perform(put("/api/profile/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(new ObjectMapper().writeValueAsString(updateDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstname").value(profileDto.getFirstname()))
                .andExpect(jsonPath("$.lastname").value(profileDto.getLastname()));
    }

    @Test
    void updateProfile_WithInvalidData_ShouldReturnBadRequest() throws Exception {
        // Arrange
        ProfileUpdateDto invalidDto = ProfileUpdateDto.builder().build();

        // Act & Assert
        mockMvc.perform(put("/api/profile/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(new ObjectMapper().writeValueAsString(invalidDto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getProfileStatus_WithCompleteProfile_ShouldReturnCompleteStatus() throws Exception {
        // Arrange
        when(profileService.getCurrentUserProfile()).thenReturn(profile);

        // Act & Assert
        mockMvc.perform(get("/api/profile/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.complete").value(true))
                .andExpect(jsonPath("$.completionPercentage").value(100))
                .andExpect(jsonPath("$.missingFields").isEmpty())
                .andExpect(jsonPath("$.message").value("Profile complete!"));
    }

    @Test
    void getProfileStatus_WithIncompleteProfile_ShouldReturnMissingFields() throws Exception {
        // Arrange
        Profile incompleteProfile = Profile.builder().build();
        incompleteProfile.setProfileComplete(false);
        incompleteProfile.setCompletionPercentage(30);

        when(profileService.getCurrentUserProfile()).thenReturn(incompleteProfile);

        // Act & Assert
        mockMvc.perform(get("/api/profile/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.complete").value(false))
                .andExpect(jsonPath("$.completionPercentage").value(30))
                .andExpect(jsonPath("$.missingFields").isArray())
                .andExpect(jsonPath("$.missingFields.length()").value(5))
                .andExpect(jsonPath("$.message").value("Please complete your profile"));
    }

    @Test
    void exportProfile_ShouldReturnPdfFile() throws Exception {
        // Arrange
        byte[] pdfContent = "Dummy PDF content".getBytes();
        when(profileService.getCurrentUserProfile()).thenReturn(profile);
        when(profileService.exportToPdf(profile)).thenReturn(pdfContent);

        // Act & Assert
        mockMvc.perform(get("/api/profile/export"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=profile_export.pdf"))
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andExpect(content().bytes(pdfContent));
    }

    @Test
    void exportProfile_WhenProfileNotFound_ShouldReturnNotFound() throws Exception {
        // Arrange
        when(profileService.getCurrentUserProfile()).thenThrow(
                new UserNotFoundException("Profile not found"));

        // Act & Assert
        mockMvc.perform(get("/api/profile/export"))
                .andExpect(status().isNotFound());
    }
}