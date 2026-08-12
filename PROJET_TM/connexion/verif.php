<?php
header('Content-Type: application/json');
$_allowedOrigins = ['http://localhost', 'http://127.0.0.1'];
$_origin = $_SERVER['HTTP_ORIGIN'] ?? '';
header('Access-Control-Allow-Origin: ' . (in_array($_origin, $_allowedOrigins) ? $_origin : $_allowedOrigins[0]));
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-CSRF-TOKEN, Authorization');
header('Access-Control-Allow-Credentials: true');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$configFile = __DIR__ . '/config.php';
$config = file_exists($configFile) ? require $configFile : [];
$secret = $config['jwt']['secret'] ?? (defined('SECRET') ? SECRET : '0hLa83lleBroue11e!');

require_once __DIR__ . '/JWT.php';

$jwt = new JWT();

// Récupération des tokens depuis les cookies et headers HTTP
$jwtToken   = $_COOKIE['jwt_token'] ?? '';
$csrfCookie = $_COOKIE['csrf_token'] ?? '';

// Support des headers X-CSRF-TOKEN (cas où Apache remappe en HTTP_X_CSRF_TOKEN)
$csrfHeader = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? ($_SERVER['X_CSRF_TOKEN'] ?? '');

// Repli éventuel vers le header Authorization si cookie absent
if (empty($jwtToken)) {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        $jwtToken = $matches[1];
    }
}

try {
    // 1. Vérification de la cohérence des tokens CSRF (Double Submit Cookie)
    if (empty($csrfCookie) || empty($csrfHeader) || !hash_equals($csrfCookie, $csrfHeader)) {
        throw new Exception('Token CSRF invalide ou manquant');
    }

    // 2. Vérification de la validité et signature du JWT
    if (empty($jwtToken) || !$jwt->check($jwtToken, $secret)) {
        throw new Exception('Token JWT invalide ou expiré');
    }

    // 3. Récupération du payload utilisateur
    $payload = $jwt->getPayload($jwtToken);

    // Validation réussie
    echo json_encode([
        'status'  => 'success',
        'isLoggedIn' => true,
        'user_id' => $payload['user_id'] ?? $payload['data']['id'] ?? null,
        'user'    => $payload['data'] ?? $payload
    ]);

} catch (Exception $e) {
    error_log('verif.php: Echec authentification: ' . $e->getMessage());
    http_response_code(401);
    echo json_encode([
        'status' => 'error',
        'error'  => 'Authentification échouée'
    ]);
}
