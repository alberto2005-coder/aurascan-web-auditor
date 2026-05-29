<?php
set_time_limit(60);
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

// Basic referrer validation to prevent public proxy abuse (allowing same-origin or local requests)
$allowedOrigins = ['localhost', '127.0.0.1'];
if (isset($_SERVER['HTTP_REFERER'])) {
    $refererHost = parse_url($_SERVER['HTTP_REFERER'], PHP_URL_HOST);
    $serverHost = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : '';
    // Strip port from serverHost if any
    $serverHostClean = preg_replace('/:[0-9]+$/', '', $serverHost);
    if ($refererHost && $refererHost !== $serverHostClean && !in_array($refererHost, $allowedOrigins)) {
        http_response_code(403);
        echo json_encode(["error" => "Acceso no autorizado: origen no permitido."]);
        exit;
    }
}

$url = isset($_GET['url']) ? trim($_GET['url']) : '';

if (empty($url) || !filter_var($url, FILTER_VALIDATE_URL)) {
    http_response_code(400);
    echo json_encode(["error" => "URL inválida o no proporcionada"]);
    exit;
}

// User agents rotation for better bypassing
$userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0'
];
$randomUserAgent = $userAgents[array_rand($userAgents)];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_MAXREDIRS, 5);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
curl_setopt($ch, CURLOPT_USERAGENT, $randomUserAgent);

// Simular una petición real
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language: es-ES,es;q=0.9,en;q=0.8",
    "Cache-Control: max-age=0",
    "Connection: keep-alive",
    "Upgrade-Insecure-Requests: 1"
]);

$html = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

if ($html === false) {
    http_response_code(500);
    echo json_encode(["error" => "Error de cURL: " . $error]);
    exit;
}

echo json_encode([
    "status" => $httpCode,
    "contents" => $html
]);
