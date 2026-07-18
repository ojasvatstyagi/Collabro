package com.example.backend.services;

import com.example.backend.models.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Scheduled housekeeping: drops registrations nobody verified and one-time codes that expired long ago. Safe to run on
 * several instances at once (the deletes are idempotent).
 * <ul>
 *   <li>{@code app.cleanup.unverified-after} (default 7d): how long a registration may wait for its e-mail code</li>
 *   <li>{@code app.cleanup.codes-after} (default 1d): how long after expiry a one-time code is kept</li>
 *   <li>{@code app.cleanup.cron} (default 03:30 every day)</li>
 *   <li>{@code app.cleanup.enabled} (default true)</li>
 * </ul>
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AccountCleanupJob {

    private final AccountCleanupService cleanupService;

    @Value("${app.cleanup.enabled:true}")
    private boolean enabled;

    @Value("${app.cleanup.unverified-after:7d}")
    private Duration unverifiedAfter;

    @Value("${app.cleanup.codes-after:1d}")
    private Duration codesAfter;

    @Scheduled(cron = "${app.cleanup.cron:0 30 3 * * *}")
    public void run() {
        if (!enabled) {
            return;
        }
        int removed = removeUnverifiedAccounts();
        int codes = cleanupService.purgeOldCodes(codesAfter);
        if (removed > 0 || codes > 0) {
            log.info("Cleanup removed {} unverified account(s) and {} expired code(s)", removed, codes);
        }
    }

    int removeUnverifiedAccounts() {
        LocalDateTime cutoff = LocalDateTime.now().minus(unverifiedAfter);
        int removed = 0;
        while (true) {
            List<User> batch = cleanupService.findStale(cutoff);
            int removedInBatch = 0;
            for (User user : batch) {
                try {
                    if (cleanupService.purge(user)) {
                        removedInBatch++;
                    }
                } catch (RuntimeException e) {
                    // Leave this one for the next run rather than stop the whole cleanup
                    log.atError().setCause(e).log("Could not remove an unverified account");
                }
            }
            removed += removedInBatch;
            // A short batch was the last one. If nothing in a full batch could be removed, stop as well: the same
            // failing accounts would come back at the top of the next batch forever.
            if (batch.size() < AccountCleanupService.BATCH || removedInBatch == 0) {
                return removed;
            }
        }
    }
}
