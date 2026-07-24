-- Accounts deleted before this version kept everything the person had entered. Strip the profiles that are already
-- soft-deleted exactly as AccountService.deleteAccount now does (Profile.erasePersonalData). The rows stay: projects,
-- messages and tasks point at them. The picture column is left alone on purpose: the files are on disk, and the
-- scheduled cleanup removes them and then clears the column.
-- Only rows with deleted_at set are touched, and running it twice changes nothing.
DELETE FROM `skills` WHERE `profile_id` IN (SELECT `id` FROM `profiles` WHERE `deleted_at` IS NOT NULL);
DELETE FROM `social_links` WHERE `profile_id` IN (SELECT `id` FROM `profiles` WHERE `deleted_at` IS NOT NULL);
DELETE FROM `profile_project_interests` WHERE `profile_id` IN (SELECT `id` FROM `profiles` WHERE `deleted_at` IS NOT NULL);
UPDATE `profiles`
SET `firstname` = 'Deleted',
    `lastname` = 'User',
    `bio` = NULL,
    `education` = NULL,
    `location` = NULL,
    `phone` = NULL,
    `preferred_team_size` = NULL,
    `open_for_team_invites` = 0,
    `is_profile_complete` = 0,
    `completion_percentage` = 0
WHERE `deleted_at` IS NOT NULL;
