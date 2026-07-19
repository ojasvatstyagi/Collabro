-- Accounts deleted before this version kept their username and e-mail address, which are unique, so neither could ever be
-- registered again. Give them the same placeholder values AccountService.deleteAccount now assigns (derived from the id).
-- Safe to run on any database: it only touches rows that are already soft-deleted, and only once.
UPDATE `users`
SET `username` = CONCAT('deleted_', LOWER(HEX(`id`))),
    `email` = CONCAT('deleted_', LOWER(HEX(`id`)), '@deleted.invalid')
WHERE `deleted_at` IS NOT NULL
  AND `username` <> CONCAT('deleted_', LOWER(HEX(`id`)));
