<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: ' . (in_array($_SERVER['HTTP_ORIGIN'] ?? '', ['http://localhost', 'http://127.0.0.1']) ? ($_SERVER['HTTP_ORIGIN'] ?? 'http://localhost') : 'http://localhost'));
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-CSRF-TOKEN');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Configurer la durée de vie de la session
ini_set('session.gc_maxlifetime', 3600);
session_set_cookie_params(3600);
session_start();

// Charger la configuration
$configFile = __DIR__ . '/config.php';
if (!file_exists($configFile)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur de configuration serveur']);
    exit;
}

try {
    $config = require $configFile;
} catch (Exception $e) {
    error_log('connexion.php: Erreur config: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur de configuration serveur']);
    exit;
}

if (!is_array($config) || !isset($config['db']) || !is_array($config['db'])) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur de configuration serveur']);
    exit;
}

// Validation des clés nécessaires
$requiredKeys = ['host', 'dbname', 'username', 'password', 'charset', 'options'];
foreach ($requiredKeys as $key) {
    if (!isset($config['db'][$key])) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erreur de configuration serveur']);
        exit;
    }
}

try {
    $pdo = new PDO(
        "mysql:host={$config['db']['host']};dbname={$config['db']['dbname']};charset={$config['db']['charset']}",
        $config['db']['username'],
        $config['db']['password'],
        $config['db']['options']
    );
} catch (PDOException $e) {
    error_log('connexion.php: Erreur BDD: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur de connexion à la base de données']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

$data        = json_decode(file_get_contents('php://input'), true);
$pseudo      = trim($data['pseudo'] ?? '');
$mot_de_passe = $data['mot_de_passe'] ?? '';

if (empty($pseudo) || empty($mot_de_passe)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Tous les champs sont obligatoires']);
    exit;
}

// Protection brute-force : rate limiting par IP (5 tentatives / 15 min)
$ip          = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
$rateLimitKey = 'login_attempts_' . md5($ip);
$attempts     = (int) ($_SESSION[$rateLimitKey . '_count'] ?? 0);
$lastAttempt  = (int) ($_SESSION[$rateLimitKey . '_time'] ?? 0);

// Réinitialiser le compteur après 15 minutes
if (time() - $lastAttempt > 900) {
    $attempts = 0;
}

if ($attempts >= 5) {
    $waitSeconds = 900 - (time() - $lastAttempt);
    http_response_code(429);
    echo json_encode([
        'success' => false,
        'message' => 'Trop de tentatives. Réessayez dans ' . ceil($waitSeconds / 60) . ' minute(s).'
    ]);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT id, pseudo, mot_de_passe, role FROM Utilisateurs WHERE pseudo = ? LIMIT 1");
    $stmt->execute([$pseudo]);
    $user = $stmt->fetch();

    if ($user && password_verify($mot_de_passe, $user['mot_de_passe'])) {
        // Réinitialiser le compteur d'échecs
        unset($_SESSION[$rateLimitKey . '_count'], $_SESSION[$rateLimitKey . '_time']);

        require_once __DIR__ . '/JWT.php';
        $jwt    = new JWT();
        $secret = $config['jwt']['secret'] ?? '';

        if (empty($secret)) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erreur de configuration serveur']);
            exit;
        }

        $header  = ['typ' => 'JWT', 'alg' => 'HS256'];
        $payload = [
            'user_id' => $user['id'],
            'data'    => [
                'id'     => $user['id'],
                'pseudo' => $user['pseudo'],
                'role'   => $user['role']
            ]
        ];

        $token     = $jwt->generate($header, $payload, $secret, 3600);
        $csrfToken = bin2hex(random_bytes(32));

        // Mise à jour du token en BDD (pour la révocation côté serveur)
        $stmt = $pdo->prepare("UPDATE Utilisateurs SET token = ? WHERE id = ?");
        $stmt->execute([$token, $user['id']]);

        // Cookies sécurisés
        $isHttps    = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || ($_SERVER['SERVER_PORT'] ?? 80) == 443;
        $expireTime = time() + 3600;

        setcookie('jwt_token', $token, [
            'expires'  => $expireTime,
            'path'     => '/',
            'secure'   => $isHttps,
            'httponly' => true,
            'samesite' => 'Strict'
        ]);
        setcookie('csrf_token', $csrfToken, [
            'expires'  => $expireTime,
            'path'     => '/',
            'secure'   => $isHttps,
            'httponly' => false,
            'samesite' => 'Strict'
        ]);

        session_destroy();
        session_start();
        session_regenerate_id(true);

        $_SESSION = [
            'user_id'     => $user['id'],
            'user_pseudo' => $user['pseudo'],
            'user_role'   => $user['role'],
            'csrf_token'  => $csrfToken,
            'ip'          => $ip,
            'user_agent'  => $_SERVER['HTTP_USER_AGENT'],
            'last_activity' => time()
        ];

        $stmt = $pdo->prepare("INSERT INTO Historique_Activite (utilisateur_id, type_activite, details) VALUES (?, ?, ?)");
        $stmt->execute([$user['id'], 'login', 'Connexion réussie']);

        echo json_encode([
            'success'    => true,
            'user'       => [
                'id'     => $user['id'],
                'pseudo' => $user['pseudo'],
                'role'   => $user['role']
            ],
            'token'      => $token,
            'csrfToken'  => $csrfToken
        ]);

    } else {
        // Incrémenter le compteur d'échecs
        $_SESSION[$rateLimitKey . '_count'] = $attempts + 1;
        $_SESSION[$rateLimitKey . '_time']  = time();

        http_response_code(401);
        // Message générique pour ne pas révéler si le pseudo existe ou non
        echo json_encode(['success' => false, 'message' => 'Identifiants incorrects']);
    }
} catch (PDOException $e) {
    error_log('connexion.php: Erreur BDD: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur de connexion à la base de données']);
}