<?php

if (PHP_SAPI !== 'cli') {
    fwrite(STDERR, "This importer can only be run from the command line.\n");
    exit(1);
}

function normalizedHeader(string $value): string {
    return strtolower(preg_replace('/[^a-z0-9]/i', '', preg_replace('/^\xEF\xBB\xBF/', '', trim($value))));
}

function canonicalGender(string $value): ?string {
    $value = strtolower(trim($value));
    return match ($value) {
        'm', 'male' => 'Male',
        'f', 'female' => 'Female',
        'nb', 'nonbinary', 'non-binary', 'nb/f', 'nb/m' => 'Non-binary',
        default => null,
    };
}

function parseCsvRow(array $row, array $columns, array $signNames): ?array {
    $value = static fn(string $column): string => isset($columns[$column]) ? trim((string)($row[$columns[$column]] ?? '')) : '';

    $name = $value('name');
    $studentId = $value('studentid');
    $email = $value('email');
    $phone = $value('phone');
    $genderRaw = $value('gender');
    $sign = $value('sign');

    // Some historical rows have one extra blank cell before gender and sign.
    if (canonicalGender($genderRaw) === null && isset($columns['gender'], $columns['sign'])) {
        $shiftedGender = trim((string)($row[$columns['gender'] + 1] ?? ''));
        $shiftedSign = trim((string)($row[$columns['sign'] + 1] ?? ''));
        if (canonicalGender($shiftedGender) !== null && in_array($shiftedSign, $signNames, true)) {
            $genderRaw = $shiftedGender;
            $sign = $shiftedSign;
        }
    }

    $gender = canonicalGender($genderRaw);
    if ($name === '' || !in_array($sign, $signNames, true)) {
        return null;
    }

    return [
        'name' => $name,
        'student_id' => $studentId !== '' ? $studentId : null,
        'email' => $email !== '' ? $email : null,
        'phone' => $phone !== '' ? $phone : null,
        'gender' => $gender,
        'sign' => $sign,
    ];
}

$dryRun = in_array('--dry-run', $argv, true);
$arguments = array_values(array_filter(array_slice($argv, 1), static fn($argument) => $argument !== '--dry-run'));
$csvPath = $arguments[0] ?? dirname(__DIR__) . '/members.csv';
if (!is_file($csvPath) || !is_readable($csvPath)) {
    fwrite(STDERR, "CSV file is not readable: {$csvPath}\n");
    exit(1);
}

$pdo = null;
if (!$dryRun) {
    $host = getenv('DB_HOST');
    $database = getenv('DB_DATABASE');
    $username = getenv('DB_USERNAME');
    $password = getenv('DB_PASSWORD');
    if (!$host || !$database || !$username || $password === false) {
        fwrite(STDERR, "Set DB_HOST, DB_DATABASE, DB_USERNAME, and DB_PASSWORD for the target environment.\n");
        exit(1);
    }

    try {
        $pdo = new PDO(
            sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', $host, getenv('DB_PORT') ?: 3306, $database),
            $username,
            $password,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
        );
    } catch (PDOException $error) {
        fwrite(STDERR, "Database connection failed: {$error->getMessage()}\n");
        exit(1);
    }
}

$handle = fopen($csvPath, 'r');
$headers = fgetcsv($handle, 0, ',', '"', '\\');
if (!$headers) {
    fclose($handle);
    fwrite(STDERR, "CSV has no header row.\n");
    exit(1);
}
$columns = [];
foreach ($headers as $index => $header) {
    $columns[normalizedHeader((string)$header)] = $index;
}
$columns['phone'] ??= $columns['phonenumber'] ?? $columns['number'] ?? null;
$columns['sign'] ??= $columns['sunsign'] ?? $columns['zodiacsign'] ?? null;
$requiredColumns = ['name', 'studentid', 'email', 'phone', 'gender', 'sign'];
foreach ($requiredColumns as $column) {
    if (!isset($columns[$column])) {
        fclose($handle);
        fwrite(STDERR, "CSV is missing the required {$column} column.\n");
        exit(1);
    }
}

$signNames = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
$sourcePrefix = basename($csvPath);
$findExisting = $dryRun ? null : $pdo->prepare('SELECT id FROM members WHERE import_source_key = ? OR (? IS NOT NULL AND student_id = ?) OR (? IS NOT NULL AND email = ?) ORDER BY (import_source_key = ?) DESC LIMIT 1');
$update = $dryRun ? null : $pdo->prepare('UPDATE members SET import_source_key = ?, full_name = ?, student_id = ?, email = ?, phone = ?, gender_identity = ?, zodiac_sign_id = (SELECT id FROM zodiac_signs WHERE name = ?), zodiac_sign_name = ?, club_status = ? WHERE id = ?');
$setImportedRole = $dryRun ? null : $pdo->prepare('UPDATE members SET account_role = ? WHERE id = ? AND (? = \'officer\' OR account_role = \'superadmin\')');
$insert = $dryRun ? null : $pdo->prepare('INSERT INTO members (import_source_key, full_name, student_id, email, phone, gender_identity, zodiac_sign_id, zodiac_sign_name, club_status, account_role) VALUES (?, ?, ?, ?, ?, ?, (SELECT id FROM zodiac_signs WHERE name = ?), ?, ?, ?)');

$lineNumber = 1;
$imported = 0;
$updated = 0;
$skipped = 0;
while (($row = fgetcsv($handle, 0, ',', '"', '\\')) !== false) {
    $lineNumber++;
    if ($row === [null] || $row === []) {
        continue;
    }
    $member = parseCsvRow($row, $columns, $signNames);
    if ($member === null) {
        $skipped++;
        fwrite(STDERR, "Skipping invalid CSV row {$lineNumber}.\n");
        continue;
    }

    $sourceKey = $sourcePrefix . ':' . $lineNumber;
    if ($dryRun) {
        printf("Parsed CSV row %d: %s | Student ID: %s | Email: %s | Phone: %s | Gender: %s | Sign: %s\n", $lineNumber, $member['name'], $member['student_id'] ?? '—', $member['email'] ?? '—', $member['phone'] ?? '—', $member['gender'] ?? '—', $member['sign']);
        $imported++;
        continue;
    }
    $findExisting->execute([$sourceKey, $member['student_id'], $member['student_id'], $member['email'], $member['email'], $sourceKey]);
    $existing = $findExisting->fetch();
    $clubStatus = in_array($member['name'], ['Momo Samuel', 'Cam', 'Mimi'], true) ? 'officer' : 'active';
    $accountRole = $clubStatus === 'officer' ? 'officer' : 'member';

    $pdo->beginTransaction();
    try {
        if ($existing) {
            $update->execute([
                $sourceKey,
                $member['name'],
                $member['student_id'],
                $member['email'],
                $member['phone'],
                $member['gender'],
                $member['sign'],
                $member['sign'],
                $clubStatus,
                $existing['id'],
            ]);
            $setImportedRole->execute([$accountRole, $existing['id'], $accountRole]);
            $memberId = (int)$existing['id'];
            $updated++;
        } else {
            $insert->execute([
                $sourceKey,
                $member['name'],
                $member['student_id'],
                $member['email'],
                $member['phone'],
                $member['gender'],
                $member['sign'],
                $member['sign'],
                $clubStatus,
                $accountRole,
            ]);
            $memberId = (int)$pdo->lastInsertId();
            $imported++;
        }
        $pdo->commit();
        printf("%s member id %d from CSV row %d: %s\n", $existing ? 'Updated' : 'Imported', $memberId, $lineNumber, $member['name']);
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        fclose($handle);
        fwrite(STDERR, "Failed importing CSV row {$lineNumber}: {$error->getMessage()}\n");
        exit(1);
    }
}

fclose($handle);
if ($dryRun) {
    printf("Dry run complete: %d valid rows, %d skipped. No database changes made.\n", $imported, $skipped);
} else {
    printf("Import complete: %d inserted, %d updated, %d skipped.\n", $imported, $updated, $skipped);
}
