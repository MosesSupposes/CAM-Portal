<?php
/**
 * C.A.M. (Cosmic Astrological Minds) - API & Web Server
 * Built for PHP / Composer / Laravel Artisan local runtime
 */

// Disable deprecation notices in output
error_reporting(E_ALL & ~E_DEPRECATED & ~E_USER_DEPRECATED);

// Enable CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Serve static files if they exist in workspace or public/
$workspaceDir = dirname(__DIR__);
$publicFile = $workspaceDir . '/public' . $uri;
if ($uri !== '/' && file_exists($publicFile) && !is_dir($publicFile)) {
    return false; // let PHP built-in server handle static asset
}

// Signs & Houses Data
$signs = [
    ["id" => 1, "name" => "Aries", "symbol" => "♈︎", "element" => "fire", "modality" => "Cardinal", "ruler" => "Mars", "dates" => "Mar 21 - Apr 19"],
    ["id" => 2, "name" => "Taurus", "symbol" => "♉︎", "element" => "earth", "modality" => "Fixed", "ruler" => "Venus", "dates" => "Apr 20 - May 20"],
    ["id" => 3, "name" => "Gemini", "symbol" => "♊︎", "element" => "air", "modality" => "Mutable", "ruler" => "Mercury", "dates" => "May 21 - Jun 20"],
    ["id" => 4, "name" => "Cancer", "symbol" => "♋︎", "element" => "water", "modality" => "Cardinal", "ruler" => "Moon", "dates" => "Jun 21 - Jul 22"],
    ["id" => 5, "name" => "Leo", "symbol" => "♌︎", "element" => "fire", "modality" => "Fixed", "ruler" => "Sun", "dates" => "Jul 23 - Aug 22"],
    ["id" => 6, "name" => "Virgo", "symbol" => "♍︎", "element" => "earth", "modality" => "Mutable", "ruler" => "Mercury", "dates" => "Aug 23 - Sep 22"],
    ["id" => 7, "name" => "Libra", "symbol" => "♎︎", "element" => "air", "modality" => "Cardinal", "ruler" => "Venus", "dates" => "Sep 23 - Oct 22"],
    ["id" => 8, "name" => "Scorpio", "symbol" => "♏︎", "element" => "water", "modality" => "Fixed", "ruler" => "Pluto / Mars", "dates" => "Oct 23 - Nov 21"],
    ["id" => 9, "name" => "Sagittarius", "symbol" => "♐︎", "element" => "fire", "modality" => "Mutable", "ruler" => "Jupiter", "dates" => "Nov 22 - Dec 21"],
    ["id" => 10, "name" => "Capricorn", "symbol" => "♑︎", "element" => "earth", "modality" => "Cardinal", "ruler" => "Saturn", "dates" => "Dec 22 - Jan 19"],
    ["id" => 11, "name" => "Aquarius", "symbol" => "♒︎", "element" => "air", "modality" => "Fixed", "ruler" => "Uranus", "dates" => "Jan 20 - Feb 18"],
    ["id" => 12, "name" => "Pisces", "symbol" => "♓︎", "element" => "water", "modality" => "Mutable", "ruler" => "Neptune", "dates" => "Feb 19 - Mar 20"]
];

// MySQL is the single source of truth for members and account data.
function db() {
    static $pdo = false;
    if ($pdo !== false) return $pdo;
    $host = getenv('DB_HOST');
    if (!$host) return $pdo = null;
    try {
        $pdo = new PDO(
            sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', $host, getenv('DB_PORT') ?: 3306, getenv('DB_DATABASE')),
            getenv('DB_USERNAME'),
            getenv('DB_PASSWORD'),
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
        );
    } catch (PDOException $e) {
        error_log('DB connect failed: ' . $e->getMessage());
        $pdo = null;
    }
    return $pdo;
}

function memberFromRow($r) {
    return [
        'id' => (int)$r['id'],
        'name' => $r['full_name'],
        'student_id' => $r['student_id'] ?: null,
        'email' => $r['email'] ?: '—',
        'phone' => $r['phone'] ?: '—',
        'gender' => $r['gender_identity'] ?: 'NB',
        'sign' => $r['zodiac_sign_name'],
        'role' => $r['club_status'] === 'officer' ? 'officer' : 'member',
        'account_role' => $r['account_role'] ?? 'member',
        'status' => $r['club_status'],
    ];
}

function eventFromRow($r) {
    return [
        'id' => (int)$r['id'],
        'title' => $r['title'],
        'date' => str_replace(' ', 'T', substr($r['event_date'], 0, 16)),
        'location' => $r['location'],
        'type' => $r['event_type'],
        'alignment' => $r['celestial_alignment'] ?? '',
        'description' => $r['description'],
    ];
}

function jsonResponse($body, $status = 200) {
    http_response_code($status);
    echo json_encode($body);
    exit;
}

function requestBody() {
    return json_decode(file_get_contents('php://input'), true) ?: [];
}

function issueToken(PDO $pdo, int $userId) {
    $token = bin2hex(random_bytes(32));
    $stmt = $pdo->prepare('INSERT INTO api_tokens (member_id, token_hash, expires_at) VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 30 DAY))');
    $stmt->execute([$userId, hash('sha256', $token)]);
    return $token;
}

function authenticatedUser(PDO $pdo) {
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!preg_match('/^Bearer\s+([a-f0-9]{64})$/i', $header, $match)) return null;
    $stmt = $pdo->prepare('SELECT m.id, m.username, m.student_id, m.full_name AS name, m.account_role AS role FROM api_tokens t JOIN members m ON m.id = t.member_id WHERE t.token_hash = ? AND t.expires_at > UTC_TIMESTAMP()');
    $stmt->execute([hash('sha256', $match[1])]);
    return $stmt->fetch() ?: null;
}

// Route: API Endpoints
if (strpos($uri, '/api/v1') === 0) {
    header("Content-Type: application/json; charset=utf-8");
    $pdo = db();

    if ($uri === '/api/v1/auth/register' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        if (!$pdo) jsonResponse(["status" => "error", "message" => "Database unavailable"], 503);
        $in = requestBody();
        $username = strtolower(trim($in['username'] ?? ''));
        $studentId = trim($in['student_id'] ?? '');
        $password = $in['password'] ?? '';
        $name = trim($in['name'] ?? '');
        $phone = trim($in['phone_number'] ?? '');
        $gender = $in['gender'] ?? '';
        if ($name === '' || strlen($name) > 255 || !preg_match('/^[a-z0-9_]{3,30}$/', $username) || !preg_match('/^[a-zA-Z0-9-]{3,32}$/', $studentId) || strlen($password) < 12 || strlen($password) > 200 || !in_array($gender, ['Male', 'Female', 'Non-binary'], true) || strlen($phone) > 50) {
            jsonResponse(["status" => "error", "message" => "Name, valid gender, a valid username, a 3-32 character Student ID, a password of at least 12 characters, and a phone number of at most 50 characters are required when provided"], 422);
        }
        $email = trim($in['email'] ?? '');
        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) jsonResponse(["status" => "error", "message" => "Enter a valid email address"], 422);
        $signName = $in['sign'] ?? '';
        if (!in_array($signName, array_column($signs, 'name'), true)) jsonResponse(["status" => "error", "message" => "Choose a valid sun sign"], 422);
        $interest = trim($in['interest'] ?? '');
        if (strlen($interest) > 10000) jsonResponse(["status" => "error", "message" => "Your astrology interest response must be at most 10000 characters"], 422);
        $pdo->beginTransaction();
        try {
            $existingMember = $pdo->prepare('SELECT id, password_hash, account_role FROM members WHERE student_id = ? FOR UPDATE');
            $existingMember->execute([$studentId]);
            $existingMember = $existingMember->fetch();
            if ($existingMember && $existingMember['password_hash']) {
                $pdo->rollBack();
                jsonResponse(["status" => "error", "message" => "An account already exists for this Student ID"], 409);
            }
            if ($existingMember) {
                $member = $pdo->prepare('UPDATE members SET username = ?, password_hash = ?, full_name = ?, email = ?, phone = COALESCE(?, phone), gender_identity = ?, zodiac_sign_id = (SELECT id FROM zodiac_signs WHERE name = ?), zodiac_sign_name = ?, bio = COALESCE(NULLIF(?, \'\'), bio) WHERE id = ?');
                $member->execute([$username, password_hash($password, PASSWORD_DEFAULT), $name, $email, $phone ?: null, $gender, $signName, $signName, $interest, $existingMember['id']]);
                $memberId = (int)$existingMember['id'];
            } else {
                $member = $pdo->prepare('INSERT INTO members (username, student_id, password_hash, account_role, full_name, email, phone, gender_identity, zodiac_sign_id, zodiac_sign_name, bio, club_status) VALUES (?, ?, ?, \'member\', ?, ?, ?, ?, (SELECT id FROM zodiac_signs WHERE name = ?), ?, ?, \'pending\')');
                $member->execute([$username, $studentId, password_hash($password, PASSWORD_DEFAULT), $name, $email ?: null, $phone ?: null, $gender, $signName, $signName, $interest ?: null]);
                $memberId = (int)$pdo->lastInsertId();
            }
            $pdo->commit();
        } catch (PDOException $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            if ($e->getCode() === '23000') jsonResponse(["status" => "error", "message" => "Username, Student ID, or email is already in use"], 409);
            error_log('Account registration failed: ' . $e->getMessage());
            jsonResponse(["status" => "error", "message" => "Account could not be created"], 500);
        }
        $role = $existingMember['account_role'] ?? 'member';
        jsonResponse(["status" => "success", "token" => issueToken($pdo, $memberId), "user" => ["id" => $memberId, "username" => $username, "student_id" => $studentId, "name" => $name, "role" => $role]], 201);
    }

    if ($uri === '/api/v1/auth/login' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        if (!$pdo) jsonResponse(["status" => "error", "message" => "Database unavailable"], 503);
        $in = requestBody();
        $identifier = trim($in['identifier'] ?? $in['username'] ?? '');
        $stmt = $pdo->prepare('SELECT id, username, student_id, full_name AS name, password_hash, account_role FROM members WHERE username = ? OR student_id = ? LIMIT 1');
        $stmt->execute([strtolower($identifier), $identifier]);
        $user = $stmt->fetch();
        if (!$user || !$user['password_hash'] || !password_verify($in['password'] ?? '', $user['password_hash'])) {
            jsonResponse(["status" => "error", "message" => "Invalid username or password"], 401);
        }
        jsonResponse(["status" => "success", "token" => issueToken($pdo, (int)$user['id']), "user" => ["id" => (int)$user['id'], "username" => $user['username'], "student_id" => $user['student_id'], "name" => $user['name'], "role" => $user['account_role']] ]);
    }

    if (in_array($uri, ['/api/v1/auth/me', '/api/v1/auth/logout', '/api/v1/entries'], true) || preg_match('#^/api/v1/entries/[a-z0-9_-]+$#', $uri)) {
        if (!$pdo) jsonResponse(["status" => "error", "message" => "Database unavailable"], 503);
        $user = authenticatedUser($pdo);
        if (!$user) jsonResponse(["status" => "error", "message" => "Authentication required"], 401);
        if ($uri === '/api/v1/auth/me') jsonResponse(["status" => "success", "user" => $user]);
        if ($uri === '/api/v1/auth/logout' && $_SERVER['REQUEST_METHOD'] === 'POST') {
            $pdo->prepare('DELETE FROM api_tokens WHERE token_hash = ?')->execute([hash('sha256', substr($_SERVER['HTTP_AUTHORIZATION'], 7))]);
            jsonResponse(["status" => "success"]);
        }
        if ($uri === '/api/v1/entries' && $_SERVER['REQUEST_METHOD'] === 'GET') {
            $stmt = $pdo->prepare('SELECT entry_key, entry_value FROM member_entries WHERE member_id = ? ORDER BY entry_key');
            $stmt->execute([$user['id']]);
            $entries = [];
            foreach ($stmt->fetchAll() as $row) $entries[$row['entry_key']] = json_decode($row['entry_value'], true);
            jsonResponse(["status" => "success", "data" => $entries]);
        }
        if (preg_match('#^/api/v1/entries/([a-z0-9_-]+)$#', $uri, $match) && $_SERVER['REQUEST_METHOD'] === 'PUT') {
            $key = $match[1];
            if (!preg_match('/^house_[0-9]{1,2}$/', $key)) jsonResponse(["status" => "error", "message" => "Invalid entry key"], 422);
            $value = requestBody();
            if (!isset($value['note']) || !is_string($value['note']) || strlen($value['note']) > 10000) jsonResponse(["status" => "error", "message" => "Note must be text up to 10000 characters"], 422);
            $stmt = $pdo->prepare('INSERT INTO member_entries (member_id, entry_key, entry_value) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE entry_value = VALUES(entry_value)');
            $stmt->execute([$user['id'], $key, json_encode(["note" => $value['note']])]);
            jsonResponse(["status" => "success", "data" => ["key" => $key, "note" => $value['note']]]);
        }
        jsonResponse(["status" => "error", "message" => "Method not allowed"], 405);
    }

    // Health Check
    if ($uri === '/api/v1/health') {
        echo json_encode([
            "status" => "healthy",
            "system" => "Cosmic Astrological Minds (C.A.M.) API",
            "environment" => getenv('APP_ENV') ?: 'dev',
            "php_version" => PHP_VERSION,
            "engine" => "Laravel / PHP Native Dispatcher",
            "timestamp" => date("c")
        ], JSON_PRETTY_PRINT);
        exit;
    }

    // Zodiac Signs
    if ($uri === '/api/v1/zodiac/signs') {
        echo json_encode(["status" => "success", "data" => $signs], JSON_PRETTY_PRINT);
        exit;
    }

    // Zodiac Transits
    if ($uri === '/api/v1/zodiac/transits') {
        echo json_encode([
            "status" => "success",
            "epoch" => date("c"),
            "moon_phase" => "Waxing Gibbous",
            "transits" => [
                ["aspect" => "Sun in Scorpio", "element" => "water", "theme" => "Psychic Depth & Renewal"],
                ["aspect" => "Jupiter in Gemini", "element" => "air", "theme" => "Intellectual Curiosity"],
                ["aspect" => "Saturn in Pisces", "element" => "water", "theme" => "Spiritual Boundaries"]
            ]
        ], JSON_PRETTY_PRINT);
        exit;
    }

    // Members Endpoint
    if ($uri === '/api/v1/members' || preg_match('#^/api/v1/members/([0-9]+)$#', $uri, $memberMatch)) {
        $pdo = db();
        if (!$pdo) jsonResponse(["status" => "error", "message" => "Database unavailable"], 503);
        $method = $_SERVER['REQUEST_METHOD'];
        $memberId = isset($memberMatch[1]) ? (int)$memberMatch[1] : null;
        if (in_array($method, ['POST', 'PUT', 'DELETE'], true)) {
            $actor = authenticatedUser($pdo);
            if (!$actor) jsonResponse(["status" => "error", "message" => "Authentication required"], 401);
            if ($actor['role'] !== 'officer') jsonResponse(["status" => "error", "message" => "Officer access required"], 403);
        }
        if ($method === 'DELETE' && $memberId !== null) {
            if ((int)$actor['id'] === $memberId) jsonResponse(["status" => "error", "message" => "You cannot delete your own account"], 409);
            $stmt = $pdo->prepare('SELECT account_role FROM members WHERE id = ?');
            $stmt->execute([$memberId]);
            $memberToDelete = $stmt->fetch();
            if (!$memberToDelete) jsonResponse(["status" => "error", "message" => "Member not found"], 404);
            if ($memberToDelete['account_role'] === 'officer') {
                $officerCount = (int)$pdo->query("SELECT COUNT(*) FROM members WHERE account_role = 'officer'")->fetchColumn();
                if ($officerCount <= 1) jsonResponse(["status" => "error", "message" => "You cannot delete the last officer account"], 409);
            }
            $stmt = $pdo->prepare('DELETE FROM members WHERE id = ?');
            $stmt->execute([$memberId]);
            jsonResponse(["status" => "success", "message" => "Member deleted", "data" => ["id" => $memberId]]);
        }
        if ($method === 'POST') {
                $in = requestBody();
                $name = trim($in['name'] ?? '');
                $signName = $in['sign'] ?? 'Virgo';
                $gender = $in['gender'] ?? '';
                $status = $in['status'] ?? (($in['role'] ?? '') === 'officer' ? 'officer' : 'active');
                if ($name === '' || strlen($name) > 255 || !in_array($signName, array_column($signs, 'name'), true) || !in_array($gender, ['Male', 'Female', 'Non-binary'], true) || !in_array($status, ['active', 'pending', 'alumni', 'officer'], true)) jsonResponse(["status" => "error", "message" => "Valid name, gender, sun sign, and member status are required"], 422);
                $email = trim($in['email'] ?? '');
                $phone = trim($in['phone'] ?? '');
                if (($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) || strlen($phone) > 50) jsonResponse(["status" => "error", "message" => "Enter a valid email and a phone number of at most 50 characters"], 422);
                $stmt = $pdo->prepare('INSERT INTO members (full_name, email, phone, gender_identity, zodiac_sign_id, zodiac_sign_name, club_status) VALUES (?, ?, ?, ?, (SELECT id FROM zodiac_signs WHERE name = ?), ?, ?)');
                $stmt->execute([
                    $name,
                    ($email === '' || $email === '—') ? null : $email,
                    ($phone === '' || $phone === '—') ? null : $phone,
                    $gender,
                    $signName,
                    $signName,
                    $status,
                ]);
                $row = $pdo->query('SELECT * FROM members WHERE id = ' . (int)$pdo->lastInsertId())->fetch();
                jsonResponse(["status" => "success", "message" => "Member added to C.A.M.", "data" => memberFromRow($row)], 201);
        }
        if ($method === 'PUT' && $memberId !== null) {
                $in = requestBody();
                $name = trim($in['name'] ?? '');
                $email = trim($in['email'] ?? '');
                $phone = trim($in['phone'] ?? '');
                $gender = $in['gender'] ?? '';
                $signName = $in['sign'] ?? '';
                $status = $in['status'] ?? '';
                $accountRole = $in['account_role'] ?? null;
                if ($accountRole !== null && $actor['role'] !== 'officer') jsonResponse(["status" => "error", "message" => "Officer access required to change account access"], 403);
                if ($accountRole !== null && !in_array($accountRole, ['officer', 'member', 'guest'], true)) jsonResponse(["status" => "error", "message" => "Invalid account access role"], 422);
                if ($name === '' || strlen($name) > 255 || ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) || strlen($phone) > 50 || !in_array($gender, ['Male', 'Female', 'Non-binary'], true) || !in_array($signName, array_column($signs, 'name'), true) || !in_array($status, ['active', 'pending', 'alumni', 'officer'], true)) jsonResponse(["status" => "error", "message" => "Valid name, email, phone, gender, sun sign, and member status are required"], 422);
                $sql = 'UPDATE members SET full_name = ?, email = ?, phone = ?, gender_identity = ?, zodiac_sign_id = (SELECT id FROM zodiac_signs WHERE name = ?), zodiac_sign_name = ?, club_status = ?';
                $params = [$name, $email ?: null, $phone ?: null, $gender, $signName, $signName, $status];
                if ($accountRole !== null) {
                    $sql .= ', account_role = ?';
                    $params[] = $accountRole;
                }
                $sql .= ' WHERE id = ?';
                $params[] = $memberId;
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                $stmt = $pdo->prepare('SELECT * FROM members WHERE id = ?');
                $stmt->execute([$memberId]);
                $row = $stmt->fetch();
                if (!$row) jsonResponse(["status" => "error", "message" => "Member not found"], 404);
                jsonResponse(["status" => "success", "message" => "Member updated", "data" => memberFromRow($row)]);
        }
        if ($method !== 'GET') jsonResponse(["status" => "error", "message" => "Method not allowed"], 405);
        $sql = 'SELECT m.* FROM members m LEFT JOIN zodiac_signs z ON z.id = m.zodiac_sign_id WHERE 1=1';
        $params = [];
        $element = $_GET['element'] ?? null;
        if ($element && $element !== 'all') {
            $sql .= ' AND z.element = ?';
            $params[] = $element;
        }
        $q = trim($_GET['search'] ?? '');
        if ($q !== '') {
            $sql .= ' AND (m.full_name LIKE ? OR m.zodiac_sign_name LIKE ?)';
            $params[] = $params[] = '%' . $q . '%';
        }
        $stmt = $pdo->prepare($sql . ' ORDER BY m.created_at DESC, m.id DESC');
        $stmt->execute($params);
        $rows = array_map('memberFromRow', $stmt->fetchAll());
        echo json_encode(["status" => "success", "total" => count($rows), "data" => $rows], JSON_PRETTY_PRINT);
        exit;
    }

    // Event reads are public for the portal; mutations require an officer account.
    if ($uri === '/api/v1/events' || preg_match('#^/api/v1/events/([0-9]+)$#', $uri, $eventMatch)) {
        $pdo = db();
        if (!$pdo) jsonResponse(["status" => "error", "message" => "Database unavailable"], 503);
        $method = $_SERVER['REQUEST_METHOD'];
        $eventId = isset($eventMatch[1]) ? (int)$eventMatch[1] : null;
        $actor = null;
        if (in_array($method, ['POST', 'PUT', 'DELETE'], true)) {
            $actor = authenticatedUser($pdo);
            if (!$actor) jsonResponse(["status" => "error", "message" => "Authentication required"], 401);
            if ($actor['role'] !== 'officer') jsonResponse(["status" => "error", "message" => "Officer access required"], 403);
        }

        if ($method === 'POST' || $method === 'PUT') {
            if ($method === 'PUT' && $eventId === null) jsonResponse(["status" => "error", "message" => "Event ID is required"], 404);
            $in = requestBody();
            $title = trim($in['title'] ?? '');
            $location = trim($in['location'] ?? '');
            $dateInput = trim($in['date'] ?? '');
            $type = $in['type'] ?? '';
            $alignment = trim($in['alignment'] ?? '');
            $description = trim($in['description'] ?? '');
            $validTypes = ['meeting', 'stargazing', 'workshop', 'social', 'transits'];
            $date = DateTimeImmutable::createFromFormat('!Y-m-d\\TH:i', $dateInput);
            $dateErrors = DateTimeImmutable::getLastErrors();
            if ($title === '' || strlen($title) > 255 || $location === '' || strlen($location) > 255 || !in_array($type, $validTypes, true) || !$date || ($dateErrors && ($dateErrors['warning_count'] || $dateErrors['error_count'])) || $date->format('Y-m-d\\TH:i') !== $dateInput || strlen($alignment) > 255 || strlen($description) > 10000) {
                jsonResponse(["status" => "error", "message" => "Enter a valid title, date, location, event type, alignment, and description"], 422);
            }
            $dbDate = $date->format('Y-m-d H:i:s');
            if ($method === 'POST') {
                $slug = trim(preg_replace('/[^a-z0-9]+/', '-', strtolower($title)), '-') . '-' . bin2hex(random_bytes(4));
                $stmt = $pdo->prepare('INSERT INTO events (title, slug, description, event_type, location, event_date, celestial_alignment, created_by_member_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
                $stmt->execute([$title, $slug, $description ?: $title, $type, $location, $dbDate, $alignment ?: null, $actor['id']]);
                $eventId = (int)$pdo->lastInsertId();
                $statusCode = 201;
            } else {
                $stmt = $pdo->prepare('UPDATE events SET title = ?, description = ?, event_type = ?, location = ?, event_date = ?, celestial_alignment = ? WHERE id = ?');
                $stmt->execute([$title, $description ?: $title, $type, $location, $dbDate, $alignment ?: null, $eventId]);
                $statusCode = 200;
            }
            $stmt = $pdo->prepare('SELECT * FROM events WHERE id = ?');
            $stmt->execute([$eventId]);
            $row = $stmt->fetch();
            if (!$row) jsonResponse(["status" => "error", "message" => "Event not found"], 404);
            jsonResponse(["status" => "success", "data" => eventFromRow($row)], $statusCode);
        }

        if ($method === 'DELETE' && $eventId !== null) {
            $stmt = $pdo->prepare('DELETE FROM events WHERE id = ?');
            $stmt->execute([$eventId]);
            if ($stmt->rowCount() === 0) jsonResponse(["status" => "error", "message" => "Event not found"], 404);
            jsonResponse(["status" => "success", "data" => ["id" => $eventId]]);
        }

        if ($method === 'GET' && $eventId !== null) {
            $stmt = $pdo->prepare('SELECT * FROM events WHERE id = ?');
            $stmt->execute([$eventId]);
            $row = $stmt->fetch();
            if (!$row) jsonResponse(["status" => "error", "message" => "Event not found"], 404);
            jsonResponse(["status" => "success", "data" => eventFromRow($row)]);
        }
        if ($method !== 'GET') jsonResponse(["status" => "error", "message" => "Method not allowed"], 405);
        $rows = array_map('eventFromRow', $pdo->query('SELECT * FROM events ORDER BY event_date')->fetchAll());
        jsonResponse(["status" => "success", "data" => $rows]);
    }

    http_response_code(404);
    echo json_encode(["status" => "error", "message" => "Endpoint not found"]);
    exit;
}

// Serve main HTML app on all other routes
$htmlApp = $workspaceDir . '/public/index.html';
if (file_exists($htmlApp)) {
    header("Content-Type: text/html; charset=utf-8");
    readfile($htmlApp);
    exit;
}

echo "C.A.M. Astrology Server running.";
