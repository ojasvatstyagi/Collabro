package com.example.backend.services;

import com.example.backend.exceptions.BadRequestException;
import com.example.backend.models.User;
import com.example.backend.repositories.ProfileRepository;
import com.example.backend.repositories.RefreshTokenRepository;
import com.example.backend.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Rejections are 400s on purpose: a 401 would make the frontend treat the session as expired.
     * Sessions are not touched here; the caller starts a fresh one for the current device.
     */
    @Transactional
    public void changePassword(User user, String currentPassword, String newPassword) {
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new BadRequestException("Current password is incorrect");
        }
        if (passwordEncoder.matches(newPassword, user.getPassword())) {
            throw new BadRequestException("The new password must be different from the current one");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    /**
     * Deactivates the account after re-checking the password. The user and their profile are marked deleted
     * rather than removed: deleting the user row would cascade through the profile into every project,
     * task and message it is referenced from. A deleted user can no longer log in or show up in searches.
     */
    @Transactional
    public void deleteAccount(User user, String password) {
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new BadRequestException("Password is incorrect");
        }
        LocalDateTime now = LocalDateTime.now();
        refreshTokenRepository.deleteByUser(user);
        profileRepository.findByUser(user).ifPresent(profile -> {
            profile.setDeletedAt(now);
            profileRepository.save(profile);
        });
        user.setDeletedAt(now);
        userRepository.save(user);
    }
}
