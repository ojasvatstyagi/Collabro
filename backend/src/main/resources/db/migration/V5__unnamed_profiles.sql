-- New profiles used to be created with the placeholder name "New User", which then showed up everywhere until the person
-- filled in their profile. They are now created with empty names and shown under their username. Clear the placeholder
-- on existing profiles that never changed it. (Deleted profiles are left alone: they are "Deleted User" on purpose.)
UPDATE `profiles`
SET `firstname` = '', `lastname` = ''
WHERE `firstname` = 'New' AND `lastname` = 'User' AND `deleted_at` IS NULL;
