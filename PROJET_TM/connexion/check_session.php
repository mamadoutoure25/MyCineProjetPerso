<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

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

require $configFile;

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
    error_log('check_session.php: Erreur de connexion à la base de données: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur de connexion à la base de données: ' . $e->getMessage()]);
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

// Vérifier la session ou le token
if (isset($_SESSION['user_id'])) {
    error_log('check_session.php: Session utilisateur trouvée, user_id: ' . $_SESSION['user_id']);
    try {
        $stmt = $pdo->prepare("SELECT id, pseudo, role, token FROM Utilisateurs WHERE id = ? AND token = ?");
        $stmt->execute([$_SESSION['user_id'], $token]);
        $user = $stmt->fetch();

        if ($user) {
            error_log('check_session.php: Utilisateur trouvé, token valide pour user_id: ' . $user['id']);
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
        } else {
            error_log('check_session.php: Token invalide ou utilisateur non trouvé pour user_id: ' . $_SESSION['user_id']);
            http_response_code(401);
            echo json_encode(['success' => false, 'isLoggedIn' => false, 'message' => 'Token invalide']);
        }
    } catch (PDOException $e) {
        error_log('check_session.php: Erreur de base de données: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erreur de base de données']);
    }
} else {
    error_log('check_session.php: Aucune session active, tentative de récupération par token');
    try {
        $stmt = $pdo->prepare("SELECT id, pseudo, role, token FROM Utilisateurs WHERE token = ?");
        $stmt->execute([$token]);
        $user = $stmt->fetch();

        if ($user) {
            error_log('check_session.php: Utilisateur trouvé via token, user_id: ' . $user['id']);
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_pseudo'] = $user['pseudo'];
            $_SESSION['user_role'] = $user['role'];
            $_SESSION['ip'] = $_SERVER['REMOTE_ADDR'];
            $_SESSION['user_agent'] = $_SERVER['HTTP_USER_AGENT'];
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
        } else {
            error_log('check_session.php: Aucun utilisateur trouvé pour le token');
            http_response_code(401);
            echo json_encode(['success' => false, 'isLoggedIn' => false, 'message' => 'Session ou token invalide']);
        }
    } catch (PDOException $e) {
        error_log('check_session.php: Erreur de base de données: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erreur de base de données']);
    }
}
?>