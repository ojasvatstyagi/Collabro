package com.example.backend.services;

import com.example.backend.enums.TokenType;
import com.example.backend.models.PasswordToken;
import com.example.backend.models.User;
import com.example.backend.repositories.PasswordTokenRepository;
import com.example.backend.repositories.RefreshTokenRepository;
import com.example.backend.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class PasswordService {

    /** A 6-digit code is only safe because guesses are capped: after this many misses the code is burned. */
    static final int MAX_ATTEMPTS = 5;
    static final Duration OTP_LIFETIME = Duration.ofMinutes(10);
    /** Minimum gap between two codes for the same address, so the endpoints cannot be used to spam inboxes. */
    static final Duration RESEND_COOLDOWN = Duration.ofSeconds(60);

    private final PasswordTokenRepository tokenRepo;
    private final UserRepository userRepo;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final RefreshTokenRepository refreshTokenRepository;
    Random random = new SecureRandom();

    /**
     * Sends a reset code if the address belongs to a user. Does nothing otherwise, so callers can answer
     * identically either way and the endpoint neither reveals which emails are registered nor mails strangers.
     */
    @Transactional
    public void generateResetOtp(@NonNull String email) {
        if (userRepo.findByEmail(email).isEmpty()) {
            return;
        }
        issueOtp(email, TokenType.PASSWORD_RESET).ifPresent(otp -> emailService.sendOtpEmail(email, otp));
    }

    @Transactional
    public void generateEmailVerificationOtp(@NonNull String email) {
        issueOtp(email, TokenType.EMAIL_VERIFICATION)
                .ifPresent(otp -> emailService.sendRegistrationOtpEmail(email, otp));
    }

    @Transactional
    public boolean verifyRegistrationOtp(@NonNull String email, @NonNull String otp) {
        Optional<PasswordToken> token = checkOtp(email, otp, TokenType.EMAIL_VERIFICATION);
        if (token.isEmpty()) {
            return false;
        }
        Optional<User> userOpt = userRepo.findByEmail(email);
        if (userOpt.isEmpty()) {
            return false;
        }

        User user = userOpt.get();
        user.setVerified(true);
        userRepo.save(user);

        token.get().setUsed(true);
        tokenRepo.save(token.get());
        return true;
    }

    /** Checks a reset code without consuming it. Wrong guesses count against the attempt limit. */
    @Transactional
    public boolean validateOtp(@NonNull String email, @NonNull String otp) {
        return checkOtp(email, otp, TokenType.PASSWORD_RESET).isPresent();
    }

    @Transactional
    public boolean resetPassword(@NonNull String email, @NonNull String otp, @NonNull String newPassword) {
        Optional<PasswordToken> token = checkOtp(email, otp, TokenType.PASSWORD_RESET);
        if (token.isEmpty()) {
            return false;
        }
        Optional<User> userOpt = userRepo.findByEmail(email);
        if (userOpt.isEmpty()) {
            return false;
        }

        User user = userOpt.get();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepo.save(user);

        token.get().setUsed(true);
        tokenRepo.save(token.get());

        // Whoever held the old password must not stay logged in
        refreshTokenRepository.deleteByUser(user);
        emailService.sendPasswordResetSuccessEmail(email);
        return true;
    }

    /** Creates a fresh code and burns older ones. Empty if a code was issued too recently. */
    private Optional<String> issueOtp(String email, TokenType type) {
        LocalDateTime now = LocalDateTime.now();
        Optional<PasswordToken> latest = tokenRepo.findFirstByEmailAndTokenTypeAndUsedFalseOrderByIdDesc(email, type);
        if (latest.isPresent() && latest.get().getCreatedAt() != null
                && latest.get().getCreatedAt().plus(RESEND_COOLDOWN).isAfter(now)) {
            return Optional.empty();
        }
        tokenRepo.invalidateActive(email, type);

        String otp = String.valueOf(random.nextInt(900000) + 100000);
        PasswordToken token = new PasswordToken();
        token.setEmail(email);
        token.setOtp(otp);
        token.setTokenType(type);
        token.setCreatedAt(now);
        token.setExpiryTime(now.plus(OTP_LIFETIME));
        tokenRepo.save(token);
        return Optional.of(otp);
    }

    /**
     * Compares the guess with the newest unused code of this type. A miss is recorded, and the code is burned
     * once it has been missed {@value #MAX_ATTEMPTS} times, so a code cannot be brute forced.
     */
    private Optional<PasswordToken> checkOtp(String email, String otp, TokenType type) {
        Optional<PasswordToken> latest = tokenRepo.findFirstByEmailAndTokenTypeAndUsedFalseOrderByIdDesc(email, type);
        if (latest.isEmpty()) {
            return Optional.empty();
        }
        PasswordToken token = latest.get();
        if (token.getExpiryTime().isBefore(LocalDateTime.now()) || token.getAttempts() >= MAX_ATTEMPTS) {
            return Optional.empty();
        }

        boolean matches = MessageDigest.isEqual(
                token.getOtp().getBytes(StandardCharsets.UTF_8), otp.getBytes(StandardCharsets.UTF_8));
        if (!matches) {
            token.setAttempts(token.getAttempts() + 1);
            if (token.getAttempts() >= MAX_ATTEMPTS) {
                token.setUsed(true);
            }
            tokenRepo.save(token);
            return Optional.empty();
        }
        return Optional.of(token);
    }
}
