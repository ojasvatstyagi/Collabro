package com.example.backend.services;

import com.example.backend.exceptions.BadRequestException;
import com.example.backend.models.Profile;
import com.example.backend.models.User;
import com.example.backend.repositories.ProfileRepository;
import com.example.backend.repositories.RefreshTokenRepository;
import com.example.backend.repositories.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AccountServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private ProfileRepository profileRepository;
    @Mock
    private RefreshTokenRepository refreshTokenRepository;
    @Mock
    private com.example.backend.repositories.PasswordTokenRepository passwordTokenRepository;
    @Mock
    private com.example.backend.services.FileStorageService fileStorageService;
    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AccountService accountService;

    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(java.util.UUID.fromString("11111111-2222-3333-4444-555555555555"));
        user.setEmail("alice@example.com");
        user.setUsername("alice");
        user.setPassword("stored-hash");
    }

    // ---- change password ----

    @Test
    void changePassword_WithTheRightCurrentPassword_StoresTheNewHash() {
        when(passwordEncoder.matches("old-pass", "stored-hash")).thenReturn(true);
        when(passwordEncoder.matches("new-pass", "stored-hash")).thenReturn(false);
        when(passwordEncoder.encode("new-pass")).thenReturn("new-hash");

        accountService.changePassword(user, "old-pass", "new-pass");

        assertEquals("new-hash", user.getPassword());
        verify(userRepository).save(user);
    }

    @Test
    void changePassword_WithAWrongCurrentPassword_ChangesNothing() {
        when(passwordEncoder.matches("guess", "stored-hash")).thenReturn(false);

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> accountService.changePassword(user, "guess", "new-pass"));

        assertEquals("Current password is incorrect", ex.getMessage());
        assertEquals("stored-hash", user.getPassword());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void changePassword_ToTheSamePassword_IsRefused() {
        when(passwordEncoder.matches("same-pass", "stored-hash")).thenReturn(true);

        assertThrows(BadRequestException.class, () -> accountService.changePassword(user, "same-pass", "same-pass"));

        verify(userRepository, never()).save(any(User.class));
    }

    // ---- delete account ----

    @Test
    void deleteAccount_WithTheRightPassword_DeactivatesUserAndProfileAndEndsSessions() {
        Profile profile = Profile.builder().user(user).firstname("a").lastname("b").build();
        when(passwordEncoder.matches("pass", "stored-hash")).thenReturn(true);
        when(profileRepository.findByUser(user)).thenReturn(Optional.of(profile));

        accountService.deleteAccount(user, "pass");

        assertNotNull(user.getDeletedAt());
        assertNotNull(profile.getDeletedAt());
        verify(refreshTokenRepository).deleteByUser(user);
        verify(userRepository).save(user);
        // delete() would cascade through the profile into projects, tasks and messages
        verify(userRepository, never()).delete(any(User.class));
    }

    @Test
    void deleteAccount_WithAWrongPassword_ChangesNothing() {
        when(passwordEncoder.matches("nope", "stored-hash")).thenReturn(false);

        assertThrows(BadRequestException.class, () -> accountService.deleteAccount(user, "nope"));

        assertNull(user.getDeletedAt());
        verify(refreshTokenRepository, never()).deleteByUser(any(User.class));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void deleteAccount_ReleasesTheUsernameAndEmailByRenamingTheRowToValuesDerivedFromItsId() {
        when(passwordEncoder.matches("pass", "stored-hash")).thenReturn(true);

        accountService.deleteAccount(user, "pass");

        assertEquals("deleted_11111111222233334444555555555555", user.getUsername());
        assertEquals("deleted_11111111222233334444555555555555@deleted.invalid", user.getEmail());
        verify(passwordTokenRepository).deleteAllForEmail("alice@example.com");
    }

    @Test
    void deleteAccount_WithAWrongPassword_RenamesAndDeletesNothing() {
        when(passwordEncoder.matches("guess", "stored-hash")).thenReturn(false);

        assertThrows(BadRequestException.class, () -> accountService.deleteAccount(user, "guess"));

        assertEquals("alice", user.getUsername());
        assertEquals("alice@example.com", user.getEmail());
        assertNull(user.getDeletedAt());
        verify(passwordTokenRepository, never()).deleteAllForEmail(any());
    }

    private Profile fullProfile() {
        Profile profile = Profile.builder().user(user).firstname("Alice").lastname("Anderson").bio("I build things")
                .education("MIT").location("Pune").phone("+91 99999 99999").preferredTeamSize("3-5")
                .openForTeamInvites(true).profilePictureUrl("profile-pictures/alice.png").build();
        profile.getProjectInterests().add("AI");
        profile.getSocialLinks().add(new com.example.backend.models.SocialLink());
        profile.getSkills().add(new com.example.backend.models.Skill());
        return profile;
    }

    @Test
    void deleteAccount_ErasesEverythingTheProfileSaysAboutThePerson_ButKeepsTheRow() {
        Profile profile = fullProfile();
        when(passwordEncoder.matches("pass", "stored-hash")).thenReturn(true);
        when(profileRepository.findByUser(user)).thenReturn(Optional.of(profile));

        accountService.deleteAccount(user, "pass");

        assertEquals("Deleted", profile.getFirstname());
        assertEquals("User", profile.getLastname());
        assertNull(profile.getBio());
        assertNull(profile.getEducation());
        assertNull(profile.getLocation());
        assertNull(profile.getPhone());
        assertNull(profile.getPreferredTeamSize());
        assertFalse(profile.isOpenForTeamInvites());
        assertTrue(profile.getProjectInterests().isEmpty());
        assertTrue(profile.getSocialLinks().isEmpty());
        assertTrue(profile.getSkills().isEmpty());
        assertNotNull(profile.getDeletedAt());
        verify(profileRepository).save(profile);       // saved, not deleted: projects and messages point at it
        verify(profileRepository, never()).delete(any(Profile.class));
    }

    @Test
    void deleteAccount_DeletesThePictureFileAndForgetsItsPath() {
        Profile profile = fullProfile();
        when(passwordEncoder.matches("pass", "stored-hash")).thenReturn(true);
        when(profileRepository.findByUser(user)).thenReturn(Optional.of(profile));

        accountService.deleteAccount(user, "pass");

        verify(fileStorageService).deleteFile("profile-pictures/alice.png");
        assertNull(profile.getProfilePictureUrl());
    }

    @Test
    void deleteAccount_StillDeletesWhenThePictureFileCannotBeRemoved_AndKeepsThePathForTheCleanupToRetry() {
        Profile profile = fullProfile();
        when(passwordEncoder.matches("pass", "stored-hash")).thenReturn(true);
        when(profileRepository.findByUser(user)).thenReturn(Optional.of(profile));
        org.mockito.Mockito.doThrow(new com.example.backend.exceptions.StorageException("disk", new RuntimeException()))
                .when(fileStorageService).deleteFile("profile-pictures/alice.png");

        accountService.deleteAccount(user, "pass");

        assertNotNull(user.getDeletedAt());
        assertNotNull(profile.getDeletedAt());
        assertNull(profile.getBio());
        assertEquals("profile-pictures/alice.png", profile.getProfilePictureUrl());
    }

    @Test
    void deleteAccount_WithAWrongPassword_ErasesNothing() {
        Profile profile = fullProfile();
        when(passwordEncoder.matches("guess", "stored-hash")).thenReturn(false);

        assertThrows(BadRequestException.class, () -> accountService.deleteAccount(user, "guess"));

        assertEquals("I build things", profile.getBio());
        verify(fileStorageService, never()).deleteFile(any());
    }
}
