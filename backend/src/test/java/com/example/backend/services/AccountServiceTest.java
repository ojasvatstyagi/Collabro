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
}
