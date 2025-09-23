package com.example.backend.services;

import com.example.backend.models.PasswordResetToken;
import com.example.backend.models.User;
import com.example.backend.repositories.PasswordResetTokenRepository;
import com.example.backend.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class PasswordResetService {
    private final PasswordResetTokenRepository tokenRepo;
    private final UserRepository userRepo;
    private final PasswordEncoder passwordEncoder;

    public void generateOtp(String email) {
        String otp = String.valueOf(new Random().nextInt(899999) + 100000);
        PasswordResetToken token = new PasswordResetToken(
                null,
                email,
                otp,
                LocalDateTime.now().plusMinutes(10),
                false
        );
        tokenRepo.save(token);
        // TODO: Send OTP via email
    }

    public boolean validateOtp(String email, String otp) {
        return tokenRepo.findByEmailAndOtpAndUsedFalse(email, otp)
                .filter(token -> token.getExpiryTime().isAfter(LocalDateTime.now()))
                .isPresent();
    }

    public boolean resetPassword(String email, String otp, String newPassword) {
        Optional<PasswordResetToken> tokenOpt = tokenRepo.findByEmailAndOtpAndUsedFalse(email, otp);
        if (tokenOpt.isEmpty()) return false;

        PasswordResetToken token = tokenOpt.get();
        if (token.getExpiryTime().isBefore(LocalDateTime.now())) return false;

        Optional<User> userOpt = userRepo.findByEmail(email);
        if (userOpt.isEmpty()) return false;

        User user = userOpt.get();
        user.setHashed_password(passwordEncoder.encode(newPassword));
        userRepo.save(user);

        token.setUsed(true);
        tokenRepo.save(token);
        return true;
    }
}
