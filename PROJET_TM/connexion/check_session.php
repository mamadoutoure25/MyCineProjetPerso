<?php
header('Content-Type: application/json');
$_allowedOrigins = ['http://localhost', 'http://127.0.0.1'];
$_origin = $_SERVER['HTTP_ORIGIN'] ?? '';
header('Access-Control-Allow-Origin: ' . (in_array($_origin, $_allowedOrigins) ? $_origin : $_allowedOrigins[0]));
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Configurer la durée de vie de la session
ini_set('session.gc_maxlifetime', 3600); // 1 heure
session_set_cookie_params(3600);
session_start();

// Journalisation pour débogage
error_log('check_session.php: Début de la vérification de session');

// Charger la configuration
$configFile = __DIR__ . '/config.php';
if (!file_exists($configFile)) {
    error_log('check_session.php: Fichier de configuration manquant: ' . $configFile);
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Fichier de configuration manquant']);
    exit;
}

$config = require $configFile;

// Vérifier que $config est défini et structuré correctement
if (!isset($config['db']) || !is_array($config['db'])) {
    error_log('check_session.php: Configuration de la base de données invalide');
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Configuration de la base de données invalide']);
    exit;
}

// Vérifier les clés nécessaires
$requiredKeys = ['host', 'dbname', 'username', 'password', 'charset', 'options'];
foreach ($requiredKeys as $key) {
    if (!isset($config['db'][$key])) {
        error_log('check_session.php: Clé de configuration manquante: db.' . $key);
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Clé de configuration manquante: ' . $key]);
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
    error_log('check_session.php: Connexion à la base de données réussie');
} catch (PDOException $e) {
    error_log('check_session.php: Erreur BDD: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur de connexion à la base de données']);
    exit;
}

// Vérifier le token dans l'en-tête Authorization
$headers = getallheaders();
$token = isset($headers['Authorization']) ? trim(str_replace('Bearer ', '', $headers['Authorization'])) : '';
error_log('check_session.php: Token extrait des en-têtes: ' . ($token ?: 'Aucun'));

if (empty($token)) {
    error_log('check_session.php: Token manquant dans l\'en-tête Authorization');
    http_response_code(401);
    echo json_encode(['success' => false, 'isLoggedIn' => false, 'message' => 'Token manquant']);
    exit;
}

require_once __DIR__ . '/JwtHandler.php';
$jwtHandler = new JwtHandler($config['jwt'] ?? []);
$decoded = $jwtHandler->decodeToken($token);

if ($decoded && isset($decoded->data->id)) {
    $userData = $decoded->data;
    error_log('check_session.php: Token JWT valide pour user_id: ' . $userData->id);
    
    $_SESSION['user_id'] = $userData->id;
    $_SESSION['user_pseudo'] = $userData->pseudo;
    $_SESSION['user_role'] = $userData->role;
    $_SESSION['last_activity'] = time();

    echo json_encode([
        'success' => true,
        'isLoggedIn' => true,
        'user' => [
            'id' => $userData->id,
            'pseudo' => $userData->pseudo,
            'role' => $userData->role
        ],
        'token' => $token
    ]);
    exit;
}

// Fallback pour anciens tokens opaques stockés en BDD
try {
    $stmt = $pdo->prepare("SELECT id, pseudo, role, token FROM Utilisateurs WHERE token = ?");
    $stmt->execute([$token]);
    $user = $stmt->fetch();

    if ($user) {
        error_log('check_session.php: Utilisateur trouvé via token BDD (fallback)');
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_pseudo'] = $user['pseudo'];
        $_SESSION['user_role'] = $user['role'];
        $_SESSION['last_activity'] = time();

        echo json_encode([
            'success' => true,
            'isLoggedIn' => true,
            'user' => [
                'id' => $user['id'],
                'pseudo' => $user['pseudo'],
                'role' => $user['role']
            ],
            'token' => $user['token']
        ]);
        exit;
    }
} catch (PDOException $e) {
    error_log('check_session.php: Erreur de base de données: ' . $e->getMessage());
}

error_log('check_session.php: Token invalide ou expiré');
http_response_code(401);
echo json_encode(['success' => false, 'isLoggedIn' => false, 'message' => 'Token JWT invalide ou expiré']);
?>