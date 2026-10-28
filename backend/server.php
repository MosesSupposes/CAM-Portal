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

// Route: API Endpoints
if (strpos($uri, '/api/v1') === 0) {
    header("Content-Type: application/json; charset=utf-8");

    // Health Check
    if ($uri === '/api/v1/health') {
        echo json_encode([
            "status" => "healthy",
            "system" => "Cosmic Astrological Minds (C.A.M.) API",
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
