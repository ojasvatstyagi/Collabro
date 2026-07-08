package com.example.backend.services;

import com.example.backend.enums.TokenType;
import com.example.backend.models.PasswordToken;
import com.example.backend.models.User;
import com.example.backend.repositories.PasswordTokenRepository;
import com.example.backend.repositories.RefreshTokenRepository;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PasswordServiceTest {

    private static final String EMAIL = "test@example.com";

    @Mock
    private PasswordTokenRepository tokenRepo;
    @Mock
    private UserRepository userRepo;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private EmailService emailService;
    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @InjectMocks
    private PasswordService passwordService;

    private final Random mockRandom = mock(Random.class);

    @BeforeEach
    void setUp() {
        passwordService.random = mockRandom;
    }

    private void randomOtpIs123456() {
        when(mockRandom.nextInt(900000)).thenReturn(23456);
    }

    private PasswordToken activeToken(String otp, TokenType type) {
        PasswordToken token = new PasswordToken();
        token.setEmail(EMAIL);
        token.setOtp(otp);
        token.setTokenType(type);
        token.setCreatedAt(LocalDateTime.now().minusMinutes(5));
        token.setExpiryTime(LocalDateTime.now().plusMinutes(5));
        return token;
    }

    private void newestResetToken(PasswordToken token) {
        when(tokenRepo.findFirstByEmailAndTokenTypeOrderByIdDesc(EMAIL, TokenType.PASSWORD_RESET))
                .thenReturn(Optional.of(token));
    }

    private void latestResetToken(PasswordToken token) {
        when(tokenRepo.findFirstByEmailAndTokenTypeAndUsedFalseOrderByIdDesc(EMAIL, TokenType.PASSWORD_RESET))
                .thenReturn(Optional.of(token));
    }

    // ---- issuing codes ----

    @Test
    void generateResetOtp_ForUnknownEmail_DoesNothing() {
        passwordService.generateResetOtp(EMAIL);

        verify(tokenRepo, never()).save(any(PasswordToken.class));
        verify(emailService, never()).sendOtpEmail(any(), any());
    }

    @Test
    void generateResetOtp_ForKnownEmail_BurnsOldCodesAndMailsNewOne() {
        randomOtpIs123456();
        when(userRepo.findByEmail(EMAIL)).thenReturn(Optional.of(new User()));

        passwordService.generateResetOtp(EMAIL);

        verify(tokenRepo).invalidateActive(EMAIL, TokenType.PASSWORD_RESET);
        ArgumentCaptor<PasswordToken> captor = ArgumentCaptor.forClass(PasswordToken.class);
        verify(tokenRepo).save(captor.capture());
        PasswordToken saved = captor.getValue();
        assertEquals(EMAIL, saved.getEmail());
        assertEquals("123456", saved.getOtp());
        assertEquals(TokenType.PASSWORD_RESET, saved.getTokenType());
        assertFalse(saved.isUsed());
        assertEquals(0, saved.getAttempts());
        assertTrue(saved.getExpiryTime().isAfter(LocalDateTime.now()));
        verify(emailService).sendOtpEmail(EMAIL, "123456");
    }

    @Test
    void generateResetOtp_WithinResendCooldown_SendsNothing() {
        PasswordToken recent = activeToken("111111", TokenType.PASSWORD_RESET);
        recent.setCreatedAt(LocalDateTime.now().minusSeconds(10));
        when(userRepo.findByEmail(EMAIL)).thenReturn(Optional.of(new User()));
        newestResetToken(recent);

        passwordService.generateResetOtp(EMAIL);

        verify(tokenRepo, never()).save(any(PasswordToken.class));
        verify(emailService, never()).sendOtpEmail(any(), any());
    }

    @Test
    void generateResetOtp_AfterResendCooldown_IssuesNewCode() {
        randomOtpIs123456();
        PasswordToken old = activeToken("111111", TokenType.PASSWORD_RESET);
        old.setCreatedAt(LocalDateTime.now().minusMinutes(2));
        when(userRepo.findByEmail(EMAIL)).thenReturn(Optional.of(new User()));
        newestResetToken(old);

        passwordService.generateResetOtp(EMAIL);

        verify(emailService).sendOtpEmail(EMAIL, "123456");
    }

    @Test
    void generateEmailVerificationOtp_UsesVerificationTypeAndMail() {
        randomOtpIs123456();

        passwordService.generateEmailVerificationOtp(EMAIL);

        verify(tokenRepo).invalidateActive(EMAIL, TokenType.EMAIL_VERIFICATION);
        ArgumentCaptor<PasswordToken> captor = ArgumentCaptor.forClass(PasswordToken.class);
        verify(tokenRepo).save(captor.capture());
        assertEquals(TokenType.EMAIL_VERIFICATION, captor.getValue().getTokenType());
        verify(emailService).sendRegistrationOtpEmail(EMAIL, "123456");
    }

    // ---- guessing limits ----

    @Test
    void validateOtp_WithCorrectCode_ReturnsTrueWithoutConsumingIt() {
        PasswordToken token = activeToken("123456", TokenType.PASSWORD_RESET);
        latestResetToken(token);

        assertTrue(passwordService.validateOtp(EMAIL, "123456"));

        assertFalse(token.isUsed());
    }

    @Test
    void validateOtp_WithWrongCode_ReturnsFalseAndCountsTheAttempt() {
        PasswordToken token = activeToken("123456", TokenType.PASSWORD_RESET);
        latestResetToken(token);

        assertFalse(passwordService.validateOtp(EMAIL, "654321"));

        assertEquals(1, token.getAttempts());
        assertFalse(token.isUsed());
        verify(tokenRepo).save(token);
    }

    @Test
    void validateOtp_FifthWrongGuess_BurnsTheCode() {
        PasswordToken token = activeToken("123456", TokenType.PASSWORD_RESET);
        token.setAttempts(PasswordService.MAX_ATTEMPTS - 1);
        latestResetToken(token);

        assertFalse(passwordService.validateOtp(EMAIL, "000000"));

        assertTrue(token.isUsed());
    }

    @Test
    void validateOtp_OnceLockedOut_RejectsEvenTheCorrectCode() {
        PasswordToken token = activeToken("123456", TokenType.PASSWORD_RESET);
        token.setAttempts(PasswordService.MAX_ATTEMPTS);
        latestResetToken(token);

        assertFalse(passwordService.validateOtp(EMAIL, "123456"));

        verify(tokenRepo, never()).save(any(PasswordToken.class));
    }

    @Test
    void validateOtp_WithExpiredCode_ReturnsFalse() {
        PasswordToken token = activeToken("123456", TokenType.PASSWORD_RESET);
        token.setExpiryTime(LocalDateTime.now().minusMinutes(1));
        latestResetToken(token);

        assertFalse(passwordService.validateOtp(EMAIL, "123456"));
    }

    @Test
    void validateOtp_NeverLooksAtRegistrationCodes() {
        assertFalse(passwordService.validateOtp(EMAIL, "123456"));

        verify(tokenRepo).findFirstByEmailAndTokenTypeAndUsedFalseOrderByIdDesc(EMAIL, TokenType.PASSWORD_RESET);
        verify(tokenRepo, never()).findFirstByEmailAndTokenTypeAndUsedFalseOrderByIdDesc(EMAIL,
                TokenType.EMAIL_VERIFICATION);
    }

    // ---- resetting the password ----

    @Test
    void resetPassword_WithValidCode_UpdatesPasswordConsumesCodeAndEndsSessions() {
        PasswordToken token = activeToken("123456", TokenType.PASSWORD_RESET);
        User user = new User();
        latestResetToken(token);
        when(userRepo.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(passwordEncoder.encode("newPassword")).thenReturn("encodedPassword");

        assertTrue(passwordService.resetPassword(EMAIL, "123456", "newPassword"));

        assertEquals("encodedPassword", user.getPassword());
        assertTrue(token.isUsed());
        verify(userRepo).save(user);
        verify(tokenRepo).save(token);
        verify(refreshTokenRepository).deleteByUser(user);
        verify(emailService).sendPasswordResetSuccessEmail(EMAIL);
    }

    @Test
    void resetPassword_WithWrongCode_ChangesNothing() {
        latestResetToken(activeToken("123456", TokenType.PASSWORD_RESET));

        assertFalse(passwordService.resetPassword(EMAIL, "000000", "newPassword"));

        verify(userRepo, never()).save(any(User.class));
        verify(refreshTokenRepository, never()).deleteByUser(any(User.class));
        verify(emailService, never()).sendPasswordResetSuccessEmail(any());
    }

    @Test
    void resetPassword_WhenUserIsGone_DoesNotConsumeTheCode() {
        PasswordToken token = activeToken("123456", TokenType.PASSWORD_RESET);
        latestResetToken(token);

        assertFalse(passwordService.resetPassword(EMAIL, "123456", "newPassword"));

        assertFalse(token.isUsed());
    }

    @Test
    void resetPassword_CannotBeDoneWithARegistrationCode() {
        assertFalse(passwordService.resetPassword(EMAIL, "123456", "newPassword"));

        verify(tokenRepo, never()).findFirstByEmailAndTokenTypeAndUsedFalseOrderByIdDesc(EMAIL,
                TokenType.EMAIL_VERIFICATION);
        verify(userRepo, never()).save(any(User.class));
    }

    // ---- registration ----

    @Test
    void verifyRegistrationOtp_WithValidCode_VerifiesUser() {
        PasswordToken token = activeToken("123456", TokenType.EMAIL_VERIFICATION);
        User user = new User();
        when(tokenRepo.findFirstByEmailAndTokenTypeAndUsedFalseOrderByIdDesc(EMAIL, TokenType.EMAIL_VERIFICATION))
                .thenReturn(Optional.of(token));
        when(userRepo.findByEmail(EMAIL)).thenReturn(Optional.of(user));

        assertTrue(passwordService.verifyRegistrationOtp(EMAIL, "123456"));

        assertTrue(user.isVerified());
        assertTrue(token.isUsed());
    }

    @Test
    void verifyRegistrationOtp_WithWrongCode_CountsAttemptAndDoesNotVerify() {
        PasswordToken token = activeToken("123456", TokenType.EMAIL_VERIFICATION);
        when(tokenRepo.findFirstByEmailAndTokenTypeAndUsedFalseOrderByIdDesc(EMAIL, TokenType.EMAIL_VERIFICATION))
                .thenReturn(Optional.of(token));

        assertFalse(passwordService.verifyRegistrationOtp(EMAIL, "000000"));

        assertEquals(1, token.getAttempts());
        verify(userRepo, never()).save(any(User.class));
        verify(tokenRepo, never()).findFirstByEmailAndTokenTypeAndUsedFalseOrderByIdDesc(eq(EMAIL),
                eq(TokenType.PASSWORD_RESET));
    }

    @Test
    void generateResetOtp_AfterACodeWasBurnedByWrongGuesses_StillWaitsOutTheCooldown() {
        PasswordToken burned = activeToken("111111", TokenType.PASSWORD_RESET);
        burned.setCreatedAt(LocalDateTime.now().minusSeconds(5));
        burned.setAttempts(PasswordService.MAX_ATTEMPTS);
        burned.setUsed(true);
        when(userRepo.findByEmail(EMAIL)).thenReturn(Optional.of(new User()));
        newestResetToken(burned);

        passwordService.generateResetOtp(EMAIL);

        // Otherwise guessing a code to death would hand out the next one, with five fresh guesses, at once
        verify(tokenRepo, never()).save(any(PasswordToken.class));
        verify(emailService, never()).sendOtpEmail(any(), any());
    }
}
