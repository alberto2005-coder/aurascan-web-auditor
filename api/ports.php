<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

$domain = isset($_GET['domain']) ? trim($_GET['domain']) : '';

if (preg_match('/^https?:\/\/([^\/]+)/i', $domain, $matches)) {
    $domain = $matches[1];
}
$domain = preg_replace('/:[0-9]+$/', '', $domain);

if (empty($domain)) {
    http_response_code(400);
    echo json_encode(["error" => "Dominio no especificado"]);
    exit;
}

$ip = gethostbyname($domain);
if ($ip === $domain || !filter_var($ip, FILTER_VALIDATE_IP)) {
    http_response_code(404);
    echo json_encode(["error" => "No se pudo resolver el dominio a una dirección IP"]);
    exit;
}

// Common ports with typical service names
$portsToScan = [
    21 => "FTP",
    22 => "SSH",
    25 => "SMTP",
    53 => "DNS",
    80 => "HTTP",
    110 => "POP3",
    143 => "IMAP",
    443 => "HTTPS",
    3306 => "MySQL",
    8080 => "HTTP-Alt"
];

$results = [];

foreach ($portsToScan as $port => $service) {
    // Fast socket timeout (0.4s) to keep scan time reasonable
    $connection = @fsockopen($ip, $port, $errno, $errstr, 0.4);
    if (is_resource($connection)) {
        $results[] = [
            "port" => $port,
            "service" => $service,
            "status" => "Open"
        ];
        fclose($connection);
    } else {
        $results[] = [
            "port" => $port,
            "service" => $service,
            "status" => "Closed"
        ];
    }
}

echo json_encode([
    "domain" => $domain,
    "ip" => $ip,
    "ports" => $results
]);
