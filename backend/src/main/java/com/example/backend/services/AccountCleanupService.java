package com.example.backend.services;

import com.example.backend.exceptions.StorageException;
import com.example.backend.models.Profile;
import com.example.backend.models.User;
import com.example.backend.repositories.PasswordTokenRepository;
import com.example.backend.repositories.ProfileRepository;
import com.example.backend.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Removes registrations that were never completed. An account that has not verified its e-mail address cannot log in,
 * so it owns nothing (no projects, messages, requests or files) and holds nothing but a username, an e-mail address and
 * an empty profile: those are deleted for real, which frees the name and the address (a soft delete would not, the
 * columns are unique). Verified accounts are never touched here.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AccountCleanupService {

    /** Accounts handled per run per batch; the job repeats until a batch comes back short. */
    static final int BATCH = 200;

    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final PasswordTokenRepository passwordTokenRepository;
    private final FileStorageService fileStorageService;
    private final LoginThrottle loginThrottle;

    /** The next batch of accounts that registered before {@code cutoff} and never verified. */
    @Transactional(readOnly = true)
    public List<User> findStale(LocalDateTime cutoff) {
        return userRepository.findUnverifiedCreatedBefore(cutoff, PageRequest.of(0, BATCH));
    }

    /**
     * Deletes one account in its own transaction, so a single failure rolls back that account only. Returns false if
     * it was verified or removed in the meantime.
     */
    @Transactional
    public boolean purge(User user) {
        // The user goes first, and only if it is still unverified: someone who verified a moment ago must keep
        // their profile, so nothing else is touched unless this removed the account.
        if (userRepository.hardDeleteUnverified(user.getId()) == 0) {
            return false;
        }
        profileRepository.hardDeleteByUserId(user.getId());
        passwordTokenRepository.deleteAllForEmail(user.getEmail());
        return true;
    }

    /**
     * Removes the picture files of deleted accounts: those deleted before pictures were removed on deletion, and any whose
     * removal failed. A file that cannot be removed keeps its path on the profile and is tried again next time.
     */
    @Transactional
    public int purgeDeletedProfilePictures() {
        int removed = 0;
        for (Profile profile : profileRepository.findDeletedWithPicture(PageRequest.of(0, BATCH))) {
            try {
                fileStorageService.deleteFile(profile.getProfilePictureUrl());
                profile.setProfilePictureUrl(null);
                removed++;
            } catch (StorageException e) {
                log.atWarn().setCause(e).log("Could not delete the picture of a deleted account");
            }
        }
        return removed;
    }

    /** Failed-login records that have left the throttle's window. */
    public int purgeLoginFailures() {
        return loginThrottle.purgeExpired();
    }

    /** One-time codes that expired long ago. */
    @Transactional
    public int purgeOldCodes(Duration olderThan) {
        return passwordTokenRepository.deleteExpiredBefore(LocalDateTime.now().minus(olderThan));
    }
}
