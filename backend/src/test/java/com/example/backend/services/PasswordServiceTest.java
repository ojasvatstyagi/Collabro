package com.example.backend.services;

import com.example.backend.enums.TokenType;
import com.example.backend.models.PasswordToken;
import com.example.backend.models.User;
import com.example.backend.repositories.PasswordTokenRepository;
import com.example.backend.repositories.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PasswordServiceTest {

    @Mock
    private PasswordTokenRepository tokenRepo;

    @Mock
    private UserRepository userRepo;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private PasswordService passwordService;

    private final Random mockRandom = mock(Random.class);

    @BeforeEach
    void setUp() {
        passwordService.random = mockRandom;
        when(mockRandom.nextInt(899999)).thenReturn(23456);
    }

    @Test
    void generateOtp_ShouldCreateTokenAndSendEmail_WithCaptor() {
        // Arrange
        ArgumentCaptor<PasswordToken> tokenCaptor = ArgumentCaptor.forClass(PasswordToken.class);
        when(tokenRepo.save(any(PasswordToken.class))).thenAnswer(inv -> inv.getArgument(0));

        // Act
        passwordService.generateOtp("test@example.com");

        // Assert
        verify(tokenRepo).save(tokenCaptor.capture());
        PasswordToken savedToken = tokenCaptor.getValue();

        assertEquals("test@example.com", savedToken.getEmail());
        assertEquals("123456", savedToken.getOtp());
        assertEquals(TokenType.PASSWORD_RESET, savedToken.getTokenType());
        assertFalse(savedToken.isUsed());
        assertTrue(savedToken.getExpiryTime().isAfter(LocalDateTime.now()));

        verify(emailService).sendOtpEmail("test@example.com", "123456");
    }

    @Test
    void validateOtp_WithValidOtp_ShouldReturnTrue() {
        // Arrange
        PasswordToken validToken = new PasswordToken();
        validToken.setExpiryTime(LocalDateTime.now().plusMinutes(10));
        when(tokenRepo.findByEmailAndOtpAndUsedFalse(anyString(), anyString()))
                .thenReturn(Optional.of(validToken));

        // Act & Assert
        assertTrue(passwordService.validateOtp("test@example.com", "123456"));
    }

    @Test
    void resetPassword_WithValidToken_ShouldUpdatePassword() {
        // Arrange
        PasswordToken token = new PasswordToken();
        token.setExpiryTime(LocalDateTime.now().plusMinutes(10));
        User user = new User();

        when(tokenRepo.findByEmailAndOtpAndUsedFalse(anyString(), anyString()))
                .thenReturn(Optional.of(token));
        when(userRepo.findByEmail(anyString())).thenReturn(Optional.of(user));
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");

        // Act
        boolean result = passwordService.resetPassword("test@example.com", "123456", "newPassword");

        // Assert
        assertTrue(result);
        assertEquals("encodedPassword", user.getPassword());
        assertTrue(token.isUsed());
        verify(tokenRepo).save(token);
        verify(userRepo).save(user);
    }
}
