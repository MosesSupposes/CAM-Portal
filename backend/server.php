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

// Helper to load members from members.csv
function getMembersFromCsv($csvPath) {
    $members = [];
    if (file_exists($csvPath)) {
        $handle = fopen($csvPath, "r");
        $header = fgetcsv($handle, 0, ",", '"', "\\");
        $id = 1;
        while (($row = fgetcsv($handle, 0, ",", '"', "\\")) !== false) {
            if (count($row) < 5) continue;
            $name = trim($row[0]);
            $email = trim($row[1]) ?: "—";
            $phone = trim($row[2]) ?: "—";
            $gender = trim($row[3]) ?: "NB";
            $sign = trim($row[4]);
            $role = ($name === 'Momo Samuel' || $name === 'Cam' || $name === 'Mimi') ? 'officer' : 'member';

            $members[] = [
                'id' => $id++,
                'name' => $name,
                'email' => $email,
                'phone' => $phone,
                'gender' => $gender,
                'sign' => $sign,
                'role' => $role,
                'status' => 'active'
            ];
        }
        fclose($handle);
    }
    return $members;
}

$csvFile = $workspaceDir . '/members.csv';
$members = getMembersFromCsv($csvFile);

// Store runtime state in /tmp/cam_state.json if created
$stateFile = sys_get_temp_dir() . '/cam_runtime_members.json';
if (file_exists($stateFile)) {
    $savedMembers = json_decode(file_get_contents($stateFile), true);
    if (is_array($savedMembers)) $members = $savedMembers;
}

// MySQL connection; null when DB_HOST is unset so local dev falls back to CSV/file state
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
        'email' => $r['email'] ?: '—',
        'phone' => $r['phone'] ?: '—',
        'gender' => $r['gender_identity'] ?: 'NB',
        'sign' => $r['zodiac_sign_name'],
        'role' => $r['club_status'] === 'officer' ? 'officer' : 'member',
        'status' => $r['club_status'] === 'officer' ? 'active' : $r['club_status'],
    ];
}

function eventFromRow($r) {
    return [
        'id' => (int)$r['id'],
        'title' => $r['title'],
        'date' => substr($r['event_date'], 0, 16),
        'location' => $r['location'],
        'type' => $r['event_type'],
        'alignment' => $r['celestial_alignment'] ?? '',
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
    $stmt = $pdo->prepare('INSERT INTO api_tokens (user_id, token_hash, expires_at) VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 30 DAY))');
    $stmt->execute([$userId, hash('sha256', $token)]);
    return $token;
}

function authenticatedUser(PDO $pdo) {
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!preg_match('/^Bearer\s+([a-f0-9]{64})$/i', $header, $match)) return null;
    $stmt = $pdo->prepare('SELECT u.id, u.username, u.name FROM api_tokens t JOIN users u ON u.id = t.user_id WHERE t.token_hash = ? AND t.expires_at > UTC_TIMESTAMP()');
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
            $stmt = $pdo->prepare('INSERT INTO users (username, student_id, name, email, password, role) VALUES (?, ?, ?, ?, ?, \'member\')');
            $stmt->execute([$username, $studentId, $name, $email ?: null, password_hash($password, PASSWORD_DEFAULT)]);
            $userId = (int)$pdo->lastInsertId();
            $member = $pdo->prepare('INSERT INTO members (user_id, full_name, email, phone, gender_identity, zodiac_sign_id, zodiac_sign_name, bio, club_status) VALUES (?, ?, ?, ?, ?, (SELECT id FROM zodiac_signs WHERE name = ?), ?, ?, \'pending\')');
            $member->execute([$userId, $name, $email, $phone ?: null, $gender, $signName, $signName, $interest ?: null]);
            $pdo->commit();
        } catch (PDOException $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            if ($e->getCode() === '23000') jsonResponse(["status" => "error", "message" => "Username, Student ID, or email is already in use"], 409);
            error_log('Account registration failed: ' . $e->getMessage());
            jsonResponse(["status" => "error", "message" => "Account could not be created"], 500);
        }
        jsonResponse(["status" => "success", "token" => issueToken($pdo, $userId), "user" => ["id" => $userId, "username" => $username, "student_id" => $studentId, "name" => $name]], 201);
    }

    if ($uri === '/api/v1/auth/login' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        if (!$pdo) jsonResponse(["status" => "error", "message" => "Database unavailable"], 503);
        $in = requestBody();
        $identifier = trim($in['identifier'] ?? $in['username'] ?? '');
        $stmt = $pdo->prepare('SELECT id, username, student_id, name, password FROM users WHERE username = ? OR student_id = ? LIMIT 1');
        $stmt->execute([strtolower($identifier), $identifier]);
        $user = $stmt->fetch();
        if (!$user || !password_verify($in['password'] ?? '', $user['password'])) {
            jsonResponse(["status" => "error", "message" => "Invalid username or password"], 401);
        }
        jsonResponse(["status" => "success", "token" => issueToken($pdo, (int)$user['id']), "user" => ["id" => (int)$user['id'], "username" => $user['username'], "student_id" => $user['student_id'], "name" => $user['name']]]);
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
            $stmt = $pdo->prepare('SELECT entry_key, entry_value FROM user_entries WHERE user_id = ? ORDER BY entry_key');
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
            $stmt = $pdo->prepare('INSERT INTO user_entries (user_id, entry_key, entry_value) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE entry_value = VALUES(entry_value)');
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
    if ($uri === '/api/v1/members') {
        $pdo = db();
        if ($pdo) {
            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                $in = json_decode(file_get_contents('php://input'), true) ?: $_POST;
                $name = trim($in['name'] ?? '');
                $signName = $in['sign'] ?? 'Virgo';
                if ($name === '' || !in_array($signName, array_column($signs, 'name'), true)) {
                    http_response_code(422);
                    echo json_encode(["status" => "error", "message" => "Valid name and sign are required"]);
                    exit;
                }
                $email = trim($in['email'] ?? '');
                $phone = trim($in['phone'] ?? '');
                $stmt = $pdo->prepare('INSERT INTO members (full_name, email, phone, gender_identity, zodiac_sign_id, zodiac_sign_name, club_status) VALUES (?, ?, ?, ?, (SELECT id FROM zodiac_signs WHERE name = ?), ?, ?)');
                $stmt->execute([
                    $name,
                    ($email === '' || $email === '—') ? null : $email,
                    ($phone === '' || $phone === '—') ? null : $phone,
                    $in['gender'] ?? 'NB',
                    $signName,
                    $signName,
                    ($in['role'] ?? '') === 'officer' ? 'officer' : 'active',
                ]);
                $row = $pdo->query('SELECT * FROM members WHERE id = ' . (int)$pdo->lastInsertId())->fetch();
                http_response_code(201);
                echo json_encode(["status" => "success", "message" => "Member added to C.A.M.", "data" => memberFromRow($row)]);
                exit;
            }
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

        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
            $new = [
                'id' => time(),
                'name' => $input['name'] ?? 'New Member',
                'email' => $input['email'] ?? '—',
                'phone' => $input['phone'] ?? '—',
                'gender' => $input['gender'] ?? 'NB',
                'sign' => $input['sign'] ?? 'Virgo',
                'role' => $input['role'] ?? 'member',
                'status' => 'active'
            ];
            array_unshift($members, $new);
            file_put_contents($stateFile, json_encode($members));
            http_response_code(201);
            echo json_encode(["status" => "success", "message" => "Member added to C.A.M.", "data" => $new]);
            exit;
        }

        // Filter by element or query
        $element = $_GET['element'] ?? null;
        $q = strtolower($_GET['search'] ?? '');
        $filtered = array_values(array_filter($members, function($m) use ($signs, $element, $q) {
            $signMeta = null;
            foreach ($signs as $s) {
                if (strtolower($s['name']) === strtolower($m['sign'])) {
                    $signMeta = $s;
                    break;
                }
            }
            if ($element && $element !== 'all' && (!$signMeta || $signMeta['element'] !== $element)) {
                return false;
            }
            if ($q && strpos(strtolower($m['name']), $q) === false && strpos(strtolower($m['sign']), $q) === false) {
                return false;
            }
            return true;
        }));

        echo json_encode([
            "status" => "success",
            "total" => count($filtered),
            "data" => $filtered
        ], JSON_PRETTY_PRINT);
        exit;
    }

    // Events Endpoint
    if ($uri === '/api/v1/events') {
        $pdo = db();
        if ($pdo) {
            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                $in = json_decode(file_get_contents('php://input'), true) ?: $_POST;
                $title = trim($in['title'] ?? '');
                $date = strtotime($in['date'] ?? '');
                if ($title === '' || $date === false) {
                    http_response_code(422);
                    echo json_encode(["status" => "error", "message" => "Title and a valid date are required"]);
                    exit;
                }
                $type = in_array($in['type'] ?? '', ['meeting', 'stargazing', 'workshop', 'social', 'transits'], true) ? $in['type'] : 'meeting';
                $alignment = trim($in['alignment'] ?? '');
                $stmt = $pdo->prepare('INSERT INTO events (title, slug, description, event_type, location, event_date, celestial_alignment) VALUES (?, ?, ?, ?, ?, ?, ?)');
                $stmt->execute([
                    $title,
                    trim(preg_replace('/[^a-z0-9]+/', '-', strtolower($title)), '-') . '-' . bin2hex(random_bytes(3)),
                    $alignment ?: $title,
                    $type,
                    trim($in['location'] ?? '') ?: 'TBA',
                    date('Y-m-d H:i:s', $date),
                    $alignment ?: null,
                ]);
                $row = $pdo->query('SELECT * FROM events WHERE id = ' . (int)$pdo->lastInsertId())->fetch();
                http_response_code(201);
                echo json_encode(["status" => "success", "data" => eventFromRow($row)]);
                exit;
            }
            $rows = array_map('eventFromRow', $pdo->query('SELECT * FROM events ORDER BY event_date')->fetchAll());
            echo json_encode(["status" => "success", "data" => $rows], JSON_PRETTY_PRINT);
            exit;
        }

        $events = [
            ["id" => 1, "title" => "Full Moon in Scorpio Night Vigil", "date" => "2026-11-04 20:00", "location" => "Observatory Quad", "type" => "stargazing"],
            ["id" => 2, "title" => "Introduction to Natal Wheel Calculations", "date" => "2026-11-12 18:30", "location" => "Astrolab Hall 204", "type" => "workshop"],
            ["id" => 3, "title" => "Zodiac Synastry & Compatibility Circle", "date" => "2026-11-20 19:00", "location" => "Student Union Lounge", "type" => "social"]
        ];
        echo json_encode(["status" => "success", "data" => $events], JSON_PRETTY_PRINT);
        exit;
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
