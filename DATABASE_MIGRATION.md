# Unified Members Database

All people and login accounts use one primary key: `members.id`. Account fields
(`username`, `student_id`, `password_hash`, `account_role`) live on the same row
as the club profile. API tokens, saved chart entries, event creators, audit
records, and RSVPs reference `members.id`; there is no `users` table in the new
schema.

## Existing Environments

The migration is destructive to the old table layout. Run it once per database
environment during a maintenance window, and take a verified backup first.
Do not run it against production before confirming the backup is restorable.

1. Put the backend into maintenance mode or stop it, then back up the target database. `mysqldump --single-transaction -h "$DB_HOST" -P "${DB_PORT:-3306}" -u "$DB_USERNAME" -p "$DB_DATABASE" > cam-db-backup.sql` prompts for the password without placing it in the command.
2. Apply the migration: `mysql -h "$DB_HOST" -P "${DB_PORT:-3306}" -u "$DB_USERNAME" -p "$DB_DATABASE" < database/migrations/20261031_unify_users_and_members.sql`.
3. Import/reconcile the repository CSV with `php scripts/import-members.php`. The importer parses rows by header, tolerates the legacy shifted cells, inserts one row at a time, and uses `import_source_key` to make repeated runs idempotent. You can inspect the parsed rows first with `php scripts/import-members.php members.csv --dry-run`.
4. Verify the migration before reopening writes: `users` is absent, every member has a unique `id`, tokens and saved entries point to `member_id`, and CSV rows have `import_source_key` values.
5. Deploy/restart the backend version that uses the unified schema, then verify registration, login, member listing, and saved chart entries before reopening traffic.

The API and application code must be deployed in coordination with the schema
change; old backend instances that query `users` will not work after the
migration. If a check fails, keep writes paused and restore the verified backup
before retrying.

To merge the former `superadmin` role into `officer`, take a backup and apply
`database/migrations/20261031_merge_superadmin_into_officer.sql` in each
environment. This converts existing superadmins and club officers to the
`officer` account role and removes `superadmin` from the account-role enum. The
CSV importer also assigns the `officer` account role to known club officers.

## Fresh Environments

Initialize `database/schema.sql`, apply the non-member reference data in
`database/seeds/members_import.sql`, then run `php scripts/import-members.php`
with the target environment's `DB_HOST`, `DB_PORT`, `DB_DATABASE`,
`DB_USERNAME`, and `DB_PASSWORD` set locally or in the host's secret store.
The CSV importer uses generated database IDs; never put IDs in `members.csv`.

Never commit DB passwords or put them in frontend `VITE_*` variables.
