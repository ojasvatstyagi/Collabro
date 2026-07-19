package com.example.backend.services;

import com.example.backend.exceptions.BadRequestException;
import com.example.backend.models.User;
import com.example.backend.repositories.PasswordTokenRepository;
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
    private final PasswordTokenRepository passwordTokenRepository;
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
     * <p>
     * The username and e-mail columns are unique and soft-deleted rows keep them, so the row is renamed to values
     * derived from its id: otherwise nobody (including the person who just left) could ever register that username or
     * address again, and the sign-up would fail with a 409. A deleted account is shown as "deleted user" anyway.
     */
    @Transactional
    public void deleteAccount(User user, String password) {
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new BadRequestException("Password is incorrect");
        }
        LocalDateTime now = LocalDateTime.now();
        String originalEmail = user.getEmail();
        refreshTokenRepository.deleteByUser(user);
        // Codes for the old address would otherwise make a new registration with it wait out the resend cooldown
        passwordTokenRepository.deleteAllForEmail(originalEmail);
        profileRepository.findByUser(user).ifPresent(profile -> {
            profile.setDeletedAt(now);
            profileRepository.save(profile);
        });
        user.setDeletedAt(now);
        user.setUsername(deletedUsername(user));
        user.setEmail(deletedUsername(user) + "@" + DELETED_EMAIL_DOMAIN);
        userRepository.save(user);
    }

    /** What a deleted account is renamed to; the same value the V3 migration gives accounts deleted before it. */
    static String deletedUsername(User user) {
        return "deleted_" + user.getId().toString().replace("-", "");
    }

    // .invalid never resolves (RFC 2606), so nothing can ever be mailed there
    static final String DELETED_EMAIL_DOMAIN = "deleted.invalid";
}
