-- Merge superadmin privileges into the officer account role.
-- Apply once per database environment after taking a backup.

UPDATE members
SET account_role = 'officer'
WHERE account_role = 'superadmin'
   OR club_status = 'officer';

ALTER TABLE members
    MODIFY COLUMN account_role ENUM('officer', 'member', 'guest') NOT NULL DEFAULT 'member';