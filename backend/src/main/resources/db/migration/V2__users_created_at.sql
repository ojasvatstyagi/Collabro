-- When an account was registered, so accounts that never verify their e-mail can be cleaned up (AccountCleanupJob).
-- Existing rows get "now": they start their grace period today instead of being treated as ancient.
ALTER TABLE `users` ADD COLUMN `created_at` datetime(6) NULL;
UPDATE `users` SET `created_at` = CURRENT_TIMESTAMP(6) WHERE `created_at` IS NULL;
