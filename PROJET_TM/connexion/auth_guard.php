<?php

/**
 * Middleware de protection des endpoints PHP sensibles.
 * - Vérifie le JWT depuis le cookie 'jwt_token' ou header Authorization
 * - Valide le rôle de l'utilisateur (RBAC)
 * - Retourne les données utilisateur extraites du JWT (jamais depuis le client)
 *
 * @param string|null $requiredRole Ex: 'admin' ou 'user'
 * @return array Données de l'utilisateur authentifié (id, pseudo, role)
 */
function require_auth(?string $requiredRole = null): array
{
    $configFile = __DIR__ . '/config.php';
    $config = file_exists($configFile) ? require $configFile : [];
    // Clé secrète depuis la configuration centralisée uniquement
    $secret = $config['jwt']['secret'] ?? '';
    if (empty($secret)) {
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'Erreur de configuration serveur']);
        exit;
    }

    require_once __DIR__ . '/JWT.php';
    $jwt = new JWT();

    // 1. Extraction du token JWT depuis cookie puis header Authorization
    $jwtToken = $_COOKIE['jwt_token'] ?? '';
    if (empty($jwtToken)) {
        $headers = function_exists('getallheaders') ? getallheaders() : [];
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? ($_SERVER['HTTP_AUTHORIZATION'] ?? '');
        if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            $jwtToken = $matches[1];
        }
    }

    // 2. Validation de la signature et expiration du JWT
    if (empty($jwtToken) || !$jwt->check($jwtToken, $secret)) {
        http_response_code(401);
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'status'  => 'error',
            'message' => 'Accès non autorisé'
        ]);
        exit;
    }

    $payload  = $jwt->getPayload($jwtToken);
    $userData = $payload['data'] ?? $payload;
    $userRole = $userData['role'] ?? 'user';

    // 3. Contrôle d'accès par rôle
    if ($requiredRole !== null && strtolower($userRole) !== strtolower($requiredRole)) {
        http_response_code(403);
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'status'  => 'error',
            'message' => 'Accès interdit : privilèges insuffisants'
        ]);
        exit;
    }

    return $userData;
}

/**
 * Retourne l'origine CORS autorisée (toujours localhost pour ce projet).
 */
function cors_allowed_origin(): string
{
    $allowed = ['http://localhost', 'http://127.0.0.1'];
    $origin  = $_SERVER['HTTP_ORIGIN'] ?? '';
    return in_array($origin, $allowed, true) ? $origin : $allowed[0];
}
