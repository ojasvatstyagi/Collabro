package com.example.backend.controllers;

import com.example.backend.dto.ProfileDto;
import com.example.backend.exceptions.GlobalExceptionHandler;
import com.example.backend.models.Profile;
import com.example.backend.services.FileStorageService;
import com.example.backend.services.ProfileService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.multipart.MultipartFile;


import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;


@ExtendWith(MockitoExtension.class)
class ProfilePictureControllerTest {

    private MockMvc mockMvc;

    @Mock
    private ProfileService profileService;

    @Mock
    private FileStorageService fileStorageService;

    @InjectMocks
    private ProfilePictureController profilePictureController;

    private Profile testProfile;
    private ProfileDto testProfileDto;
    private MockMultipartFile testImage;
    private MockMultipartFile testTextFile;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(profilePictureController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        testProfile = Profile.builder()
                .id(UUID.randomUUID())
                .firstname("John")
                .lastname("Doe")
                .profilePictureUrl("existing/path.jpg")
                .build();

        testProfileDto = ProfileDto.builder()
                .id(testProfile.getId())
                .firstname(testProfile.getFirstname())
                .lastname(testProfile.getLastname())
                .profilePictureUrl("new/path.jpg") // Updated to match what the service will return
                .build();

        testImage = new MockMultipartFile(
                "file",
                "test.jpg",
                "image/jpeg",
                "test image content".getBytes()
        );

        testTextFile = new MockMultipartFile(
                "file",
                "test.txt",
                "text/plain",
                "text content".getBytes()
        );
    }

    @Test
    void uploadProfilePicture_WithValidImage_ShouldReturnUpdatedProfile() throws Exception {
        // Arrange
        String newImagePath = "new/path.jpg";
        when(profileService.getCurrentUserProfile()).thenReturn(testProfile);
        when(fileStorageService.storeFile(any(MultipartFile.class), eq("profile-pictures")))
                .thenReturn(newImagePath);
        when(profileService.saveProfile(any(Profile.class))).thenReturn(testProfile);
        when(profileService.convertToDto(testProfile)).thenReturn(testProfileDto);

        // Act & Assert
        mockMvc.perform(multipart("/api/profile/picture")
                        .file(testImage))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(testProfile.getId().toString()))
                .andExpect(jsonPath("$.firstname").value(testProfile.getFirstname()))
                .andExpect(jsonPath("$.profilePictureUrl").value("new/path.jpg")); // Match the DTO value

        verify(fileStorageService).deleteFile("existing/path.jpg");
        verify(fileStorageService).storeFile(testImage, "profile-pictures");
        verify(profileService).saveProfile(argThat(profile ->
                profile.getProfilePictureUrl().equals("new/path.jpg")
        ));
    }

    @Test
    void uploadProfilePicture_WithEmptyFile_ShouldReturnBadRequest() throws Exception {
        // Arrange
        MockMultipartFile emptyFile = new MockMultipartFile(
                "file",
                "empty.jpg",
                "image/jpeg",
                new byte[0]
        );

        // Act & Assert
        mockMvc.perform(multipart("/api/profile/picture")
                        .file(emptyFile))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("File is empty"));
    }

    @Test
    void uploadProfilePicture_WithInvalidFileType_ShouldReturnBadRequest() throws Exception {
        // Act & Assert
        mockMvc.perform(multipart("/api/profile/picture")
                        .file(testTextFile))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Only image files are allowed"));
    }

    @Test
    void getProfilePicture_WhenExists_ShouldReturnImage() throws Exception {
        // Arrange
        ByteArrayResource imageResource = new ByteArrayResource("image data".getBytes());
        when(profileService.getCurrentUserProfile()).thenReturn(testProfile);
        when(fileStorageService.loadFileAsResource(testProfile.getProfilePictureUrl()))
                .thenReturn(imageResource);

        // Act & Assert
        mockMvc.perform(get("/api/profile/picture"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.IMAGE_JPEG))
                .andExpect(content().bytes("image data".getBytes()));
    }

    @Test
    void getProfilePicture_WhenNotExists_ShouldReturnNotFound() throws Exception {
        // Arrange
        Profile profileWithoutPicture = Profile.builder()
                .id(UUID.randomUUID())
                .build();
        when(profileService.getCurrentUserProfile()).thenReturn(profileWithoutPicture);

        // Act & Assert
        mockMvc.perform(get("/api/profile/picture"))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteProfilePicture_WhenExists_ShouldDeleteAndReturnNoContent() throws Exception {
        // Arrange
        when(profileService.getCurrentUserProfile()).thenReturn(testProfile);
        when(profileService.saveProfile(any(Profile.class))).thenReturn(testProfile);

        // Act & Assert
        mockMvc.perform(delete("/api/profile/picture"))
                .andExpect(status().isNoContent());

        verify(fileStorageService).deleteFile("existing/path.jpg");
        verify(profileService).saveProfile(argThat(profile ->
                profile.getProfilePictureUrl() == null
        ));
    }

    @Test
    void deleteProfilePicture_WhenNotExists_ShouldReturnNoContent() throws Exception {
        // Arrange
        Profile profileWithoutPicture = Profile.builder()
                .id(UUID.randomUUID())
                .build();
        when(profileService.getCurrentUserProfile()).thenReturn(profileWithoutPicture);

        // Act & Assert
        mockMvc.perform(delete("/api/profile/picture"))
                .andExpect(status().isNoContent());

        verify(fileStorageService, never()).deleteFile(anyString());
        verify(profileService, never()).saveProfile(any());
    }
}
