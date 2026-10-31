-- One-time migration from separate users/members tables to members as the sole identity table.
-- Take a database backup first. Run once against each existing environment.
-- Run the CSV importer after this migration to reconcile profiles with members.csv.

ALTER TABLE members
    ADD COLUMN username VARCHAR(50) NULL,
    ADD COLUMN student_id VARCHAR(32) NULL,
    ADD COLUMN password_hash VARCHAR(255) NULL,
    ADD COLUMN account_role ENUM('officer', 'member', 'guest') NOT NULL DEFAULT 'member',
    ADD COLUMN import_source_key VARCHAR(100) NULL,
    ADD COLUMN email_verified_at TIMESTAMP NULL,
    ADD COLUMN remember_token VARCHAR(100) NULL,
    ADD COLUMN legacy_user_id BIGINT UNSIGNED NULL,
    ADD UNIQUE KEY uq_members_username (username),
    ADD UNIQUE KEY uq_members_student_id (student_id),
    ADD UNIQUE KEY uq_members_import_source (import_source_key),
    ADD INDEX idx_members_account_role (account_role);

-- Keep an explicit old-user-ID to new-member-ID map until all dependent rows move.
UPDATE members m
JOIN users u ON u.id = m.user_id
SET m.legacy_user_id = u.id,
    m.username = u.username,
    m.student_id = u.student_id,
    m.password_hash = u.password,
    m.account_role = CASE WHEN u.role IN ('superadmin', 'officer') THEN 'officer' ELSE u.role END,
    m.email = COALESCE(m.email, u.email),
    m.full_name = COALESCE(NULLIF(m.full_name, ''), u.name);

-- Preserve source-row identity for the members that were originally seeded from this CSV.
UPDATE members m
JOIN (
    SELECT full_name, MIN(id) AS id
    FROM members
    WHERE full_name IN ('Momo Samuel', 'Cam', 'Mimi', 'Charlie Huerrera')
    GROUP BY full_name
) seeded ON seeded.id = m.id
SET m.import_source_key = CASE m.full_name
    WHEN 'Momo Samuel' THEN 'members.csv:2'
    WHEN 'Cam' THEN 'members.csv:3'
    WHEN 'Mimi' THEN 'members.csv:4'
    WHEN 'Charlie Huerrera' THEN 'members.csv:5'
    ELSE m.import_source_key
END;

-- Accounts without a linked member become member rows before dependent records move.
INSERT INTO members (legacy_user_id, username, student_id, password_hash, account_role, full_name, email, zodiac_sign_name, club_status, email_verified_at, remember_token)
SELECT u.id, u.username, u.student_id, u.password, u.role, u.name, u.email, 'Virgo', 'pending', u.email_verified_at, u.remember_token
FROM users u
LEFT JOIN members m ON m.user_id = u.id
WHERE m.id IS NULL;

CREATE TEMPORARY TABLE legacy_member_id_map (
    legacy_user_id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
    member_id BIGINT UNSIGNED NOT NULL
) ENGINE=InnoDB;

INSERT INTO legacy_member_id_map (legacy_user_id, member_id)
SELECT legacy_user_id, id FROM members WHERE legacy_user_id IS NOT NULL;

ALTER TABLE api_tokens ADD COLUMN member_id BIGINT UNSIGNED NULL;
UPDATE api_tokens t JOIN legacy_member_id_map map ON map.legacy_user_id = t.user_id SET t.member_id = map.member_id;

ALTER TABLE user_entries ADD COLUMN member_id BIGINT UNSIGNED NULL;
UPDATE user_entries e JOIN legacy_member_id_map map ON map.legacy_user_id = e.user_id SET e.member_id = map.member_id;

ALTER TABLE audit_logs ADD COLUMN member_id BIGINT UNSIGNED NULL;
UPDATE audit_logs a JOIN legacy_member_id_map map ON map.legacy_user_id = a.user_id SET a.member_id = map.member_id;

ALTER TABLE events ADD COLUMN created_by_member_id BIGINT UNSIGNED NULL;
UPDATE events e JOIN legacy_member_id_map map ON map.legacy_user_id = e.created_by SET e.created_by_member_id = map.member_id;

ALTER TABLE api_tokens
    DROP FOREIGN KEY api_tokens_ibfk_1,
    DROP COLUMN user_id,
    MODIFY COLUMN member_id BIGINT UNSIGNED NOT NULL,
    ADD CONSTRAINT fk_api_tokens_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;

ALTER TABLE user_entries
    DROP FOREIGN KEY user_entries_ibfk_1,
    DROP INDEX unique_user_entry,
    DROP COLUMN user_id,
    MODIFY COLUMN member_id BIGINT UNSIGNED NOT NULL,
    ADD UNIQUE KEY unique_member_entry (member_id, entry_key),
    ADD CONSTRAINT fk_member_entries_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;

RENAME TABLE user_entries TO member_entries;

ALTER TABLE events
    DROP FOREIGN KEY events_ibfk_1,
    DROP COLUMN created_by,
    CHANGE COLUMN created_by_member_id created_by_member_id BIGINT UNSIGNED NULL,
    ADD CONSTRAINT fk_events_created_by_member FOREIGN KEY (created_by_member_id) REFERENCES members(id) ON DELETE SET NULL;

ALTER TABLE audit_logs
    DROP FOREIGN KEY audit_logs_ibfk_1,
    DROP COLUMN user_id,
    MODIFY COLUMN member_id BIGINT UNSIGNED NULL,
    ADD CONSTRAINT fk_audit_logs_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL;

ALTER TABLE members
    DROP FOREIGN KEY members_ibfk_1,
    DROP COLUMN user_id,
    DROP COLUMN legacy_user_id;

DROP TABLE users;
DROP TEMPORARY TABLE legacy_member_id_map;
