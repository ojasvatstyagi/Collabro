package com.example.backend.services;


import com.example.backend.dto.ProfileDto;
import com.example.backend.dto.ProfileUpdateDto;
import com.example.backend.exceptions.UserNotFoundException;
import com.example.backend.models.Profile;
import com.example.backend.models.User;
import com.example.backend.repositories.ProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.ArrayList;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProfileServiceTest {

    @Mock private ProfileRepository profileRepository;
    @Mock private UserService userService;
    @Mock private ModelMapper modelMapper;
    @Mock private FileStorageService fileStorageService;

    @InjectMocks private ProfileService profileService;

    private User testUser;
    private Profile testProfile;
    private ProfileDto testProfileDto;
    private ProfileUpdateDto testUpdateDto;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(profileService, "uploadBasePath", "/uploads/");

        testUser = new User();
        testUser.setId(UUID.randomUUID());
        testUser.setUsername("testuser");

        testProfile = Profile.builder()
                .id(UUID.randomUUID())
                .user(testUser)
                .firstname("John")
                .lastname("Doe")
                .bio("Software Developer")
                .education("Computer Science")
                .isProfileComplete(false)
                .completionPercentage(0)
                .profilePictureUrl(null)
                .skills(new ArrayList<>())
                .build();

        testProfileDto = ProfileDto.builder()
                .id(testProfile.getId())
                .firstname(testProfile.getFirstname())
                .lastname(testProfile.getLastname())
                .bio(testProfile.getBio())
                .education(testProfile.getEducation())
                .profilePictureUrl(null)
                .completionPercentage(0)
                .isProfileComplete(false)
                .skills(new ArrayList<>())
                .build();

        testUpdateDto = ProfileUpdateDto.builder()
                .firstname("Updated")
                .lastname("Name")
                .bio("Updated Bio")
                .education("Updated Education")
                .build();
    }

    @Test
    void createEmptyProfile_ShouldReturnNewProfile() {
        Profile result = profileService.createEmptyProfile(testUser);
        assertNotNull(result);
        assertEquals(testUser, result.getUser());
        assertNull(result.getFirstname());
    }

    @Test
    void createEmptyProfile_WithNullUser_ShouldThrowException() {
        assertThrows(NullPointerException.class, () -> profileService.createEmptyProfile(null));
    }

    @Test
    void saveProfile_ShouldPersistProfile() {
        when(profileRepository.save(any())).thenReturn(testProfile);
        Profile result = profileService.saveProfile(testProfile);
        assertNotNull(result);
        verify(profileRepository).save(testProfile);
    }

    @Test
    void saveProfile_WithNullProfile_ShouldThrowException() {
        assertThrows(NullPointerException.class, () -> profileService.saveProfile(null));
    }

    @Test
    void getCurrentUserProfile_ShouldReturnProfile() {
        when(userService.getCurrentUser()).thenReturn(testUser);
        when(profileRepository.findByUser(testUser)).thenReturn(Optional.of(testProfile));
        Profile result = profileService.getCurrentUserProfile();
        assertEquals(testProfile, result);
    }

    @Test
    void getCurrentUserProfile_WhenNotFound_ShouldThrowException() {
        when(userService.getCurrentUser()).thenReturn(testUser);
        when(profileRepository.findByUser(testUser)).thenReturn(Optional.empty());
        assertThrows(UserNotFoundException.class, () -> profileService.getCurrentUserProfile());
    }

    @Test
    void getCurrentUserProfileDto_ShouldReturnProfileDto() {
        when(userService.getCurrentUser()).thenReturn(testUser);
        when(profileRepository.findByUser(testUser)).thenReturn(Optional.of(testProfile));
        when(modelMapper.map(testProfile, ProfileDto.class)).thenReturn(testProfileDto);

        ProfileDto result = profileService.getCurrentUserProfileDto();
        assertEquals(testProfileDto, result);
    }

    @Test
    void updateProfile_ShouldUpdateFields() {
        when(userService.getCurrentUser()).thenReturn(testUser);
        when(profileRepository.findByUser(testUser)).thenReturn(Optional.of(testProfile));
        when(profileRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(modelMapper.map(testProfile,ProfileDto.class)).thenReturn(testProfileDto);

        ProfileDto result = profileService.updateProfile(testUpdateDto);

        assertEquals("Updated", testProfile.getFirstname());
        assertEquals("Name", testProfile.getLastname());
        assertEquals("Updated Bio", testProfile.getBio());
        assertEquals("Updated Education", testProfile.getEducation());
        assertEquals(testProfileDto, result);
        verify(profileRepository).save(testProfile);
    }

    @Test
    void updateProfile_WithNullDto_ShouldThrowException() {
        assertThrows(NullPointerException.class, () -> profileService.updateProfile(null));
    }


    @Test
    void exportToPdf_WithValidProfile_ShouldReturnNonEmptyByteArray() {
        // Act
        byte[] result = profileService.exportToPdf(testProfile);

        // Assert
        assertNotNull(result, "PDF byte array should not be null");
        assertTrue(result.length > 0, "PDF byte array should not be empty");
    }
}