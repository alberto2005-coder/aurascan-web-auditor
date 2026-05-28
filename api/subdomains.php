<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

$domain = isset($_GET['domain']) ? trim($_GET['domain']) : '';

// Clean up protocol/path if passed
if (preg_match('/^https?:\/\/([^\/]+)/i', $domain, $matches)) {
    $domain = $matches[1];
}
$domain = preg_replace('/:[0-9]+$/', '', $domain); // Remove port if any

if (empty($domain)) {
    http_response_code(400);
    echo json_encode(["error" => "Dominio no especificado"]);
    exit;
}

// Perform passive subdomain discovery via Certificate Transparency logs (crt.sh)
$url = "https://crt.sh/?q=" . urlencode('%.' . $domain) . "&output=json";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 20);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

$response = curl_exec($ch);
curl_close($ch);

$discoveredHosts = [];

if ($response !== false) {
    $data = json_decode($response, true);
    if (is_array($data)) {
        foreach ($data as $cert) {
            if (isset($cert['common_name'])) {
                $name = strtolower(trim($cert['common_name']));
                // Clean wildcard certs like *.domain.com
                $name = ltrim($name, '*.');
                if (filter_var($name, FILTER_VALIDATE_DOMAIN, FILTER_FLAG_HOSTNAME) && str_ends_with($name, $domain)) {
                    $discoveredHosts[] = $name;
                }
            }
            if (isset($cert['name_value'])) {
                // Split multi-name values (separated by newlines or commas)
                $names = preg_split('/[\s,\n\r]+/', $cert['name_value']);
                foreach ($names as $name) {
                    $name = strtolower(trim($name));
                    $name = ltrim($name, '*.');
                    if (filter_var($name, FILTER_VALIDATE_DOMAIN, FILTER_FLAG_HOSTNAME) && str_ends_with($name, $domain)) {
                        $discoveredHosts[] = $name;
                    }
                }
            }
        }
    }
}

// Keep only unique hosts and remove the root domain itself
$uniqueHosts = array_unique($discoveredHosts);
$uniqueHosts = array_filter($uniqueHosts, function($host) use ($domain) {
    return $host !== $domain;
});

$results = [];
foreach ($uniqueHosts as $targetHost) {
    // Perform fast DNS resolution
    $ip = gethostbyname($targetHost);
    if ($ip !== $targetHost && filter_var($ip, FILTER_VALIDATE_IP)) {
        // Fast online verification
        $online = false;
        $connection = @fsockopen($ip, 80, $errno, $errstr, 0.05);
        if ($connection) {
            $online = true;
            fclose($connection);
        } else {
            $connection = @fsockopen($ip, 443, $errno, $errstr, 0.05);
            if ($connection) {
                $online = true;
                fclose($connection);
            }
        }

        $results[] = [
            "subdomain" => $targetHost,
            "ip" => $ip,
            "status" => $online ? "Online" : "DNS Only"
        ];
    }
}

echo json_encode([
    "domain" => $domain,
    "total" => count($results),
    "subdomains" => $results
]);
