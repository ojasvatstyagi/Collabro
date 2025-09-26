package com.example.backend.services;

import com.example.backend.enums.TokenType;
import com.example.backend.models.PasswordToken;
import com.example.backend.models.User;
import com.example.backend.repositories.PasswordTokenRepository;
import com.example.backend.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class PasswordService {
    private final PasswordTokenRepository tokenRepo;
    private final UserRepository userRepo;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    Random random = new Random();

    public void generateOtp(String email) {
        String otp = String.valueOf(random.nextInt(899999) + 100000);
        PasswordToken token = new PasswordToken(
                null,
                email,
                otp,
                LocalDateTime.now().plusMinutes(10),
                false,
                TokenType.PASSWORD_RESET
        );
        tokenRepo.save(token);
        // Send OTP via email
        emailService.sendOtpEmail(email, otp);
    }

    public void generateEmailVerificationOtp(String email) {
        String otp = String.valueOf(random.nextInt(899999) + 100000);
        PasswordToken token = new PasswordToken(
                null,
                email,
                otp,
                LocalDateTime.now().plusMinutes(10),
                false,
                TokenType.EMAIL_VERIFICATION
        );
        tokenRepo.save(token);
        emailService.sendOtpEmail(email, otp);
    }

    public boolean verifyRegistrationOtp(String email, String otp) {
        Optional<PasswordToken> tokenOpt = tokenRepo.findByEmailAndOtpAndUsedFalseAndTokenType(email, otp, TokenType.EMAIL_VERIFICATION);
        if (tokenOpt.isEmpty()) return false;

        PasswordToken token = tokenOpt.get();
        if (token.getExpiryTime().isBefore(LocalDateTime.now())) return false;

        Optional<User> userOpt = userRepo.findByEmail(email);
        if (userOpt.isEmpty()) return false;

        User user = userOpt.get();
        user.setVerified(true);
        userRepo.save(user);

        token.setUsed(true);
        tokenRepo.save(token);
        return true;
    }


    public boolean validateOtp(String email, String otp) {
        return tokenRepo.findByEmailAndOtpAndUsedFalse(email, otp)
                .filter(token -> token.getExpiryTime().isAfter(LocalDateTime.now()))
                .isPresent();
    }

    public boolean resetPassword(String email, String otp, String newPassword) {
        Optional<PasswordToken> tokenOpt = tokenRepo.findByEmailAndOtpAndUsedFalse(email, otp);
        if (tokenOpt.isEmpty()) return false;

        PasswordToken token = tokenOpt.get();
        if (token.getExpiryTime().isBefore(LocalDateTime.now())) return false;

        Optional<User> userOpt = userRepo.findByEmail(email);
        if (userOpt.isEmpty()) return false;

        User user = userOpt.get();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepo.save(user);

        token.setUsed(true);
        tokenRepo.save(token);
        return true;
    }
}
