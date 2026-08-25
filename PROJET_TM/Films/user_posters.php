<?php
/**
 * API Affiches Personnalisées Utilisateur — MyCiné
 * Enregistre et récupère les affiches personnalisées des films et collections par utilisateur.
 */
require_once __DIR__ . '/../connexion/auth_guard.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: ' . cors_allowed_origin());
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Authentification résiliente (JWT, Session PHP ou paramètre user_id)
$userId = 0;

$jwtToken = $_COOKIE['jwt_token'] ?? '';
if (empty($jwtToken)) {
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? ($_SERVER['HTTP_AUTHORIZATION'] ?? '');
    if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        $jwtToken = $matches[1];
    }
}
if (!empty($jwtToken)) {
    $configFile = __DIR__ . '/../connexion/config.php';
    $configData = file_exists($configFile) ? require $configFile : [];
    $secret = $configData['jwt']['secret'] ?? '';
    if (!empty($secret)) {
        require_once __DIR__ . '/../connexion/JWT.php';
        $jwt = new JWT();
        if ($jwt->check($jwtToken, $secret)) {
            $payload = $jwt->getPayload($jwtToken);
            $userData = $payload['data'] ?? $payload;
            $userId = (int) ($userData['id'] ?? 0);
        }
    }
}

if (!$userId) {
    if (session_status() === PHP_SESSION_NONE) {
        @session_start();
    }
    $userId = (int) ($_SESSION['user_id'] ?? 0);
}

if (!$userId) {
    $rawInput = json_decode(file_get_contents('php://input'), true) ?: [];
    $userId = filter_var($_GET['user_id'] ?? $rawInput['user_id'] ?? $_POST['user_id'] ?? null, FILTER_VALIDATE_INT) ?: 0;
}

if (!$userId) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Utilisateur non identifié']);
    exit;
}

$config = require __DIR__ . '/../connexion/config.php';
try {
    $db = new PDO(
        "mysql:host={$config['db']['host']};dbname={$config['db']['dbname']};charset={$config['db']['charset']}",
        $config['db']['username'],
        $config['db']['password'],
        $config['db']['options']
    );
    
    // Auto-création de la table si absente
    $db->exec("CREATE TABLE IF NOT EXISTS user_posters (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        tmdb_id INT NOT NULL,
        media_type VARCHAR(20) NOT NULL DEFAULT 'movie',
        poster_path VARCHAR(500) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY user_media_unique (user_id, tmdb_id, media_type),
        FOREIGN KEY (user_id) REFERENCES Utilisateurs(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
} catch (PDOException $e) {
    error_log('user_posters.php: Erreur BDD: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur de connexion à la base de données']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$input  = json_decode(file_get_contents('php://input'), true) ?: [];

try {
    if ($method === 'GET') {
        $tmdbId    = filter_var($_GET['tmdb_id'] ?? null, FILTER_VALIDATE_INT);
        $mediaType = preg_replace('/[^a-z0-9_-]/i', '', $_GET['media_type'] ?? 'movie');

        if ($tmdbId) {
            $stmt = $db->prepare('SELECT poster_path FROM user_posters WHERE user_id = ? AND tmdb_id = ? AND media_type = ? LIMIT 1');
            $stmt->execute([$userId, $tmdbId, $mediaType]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            echo json_encode([
                'success' => true,
                'tmdb_id' => $tmdbId,
                'media_type' => $mediaType,
                'poster_path' => $result ? $result['poster_path'] : null
            ]);
            exit;
        }

        // Récupérer toutes les affiches personnalisées de l'utilisateur
        $stmt = $db->prepare('SELECT tmdb_id, media_type, poster_path FROM user_posters WHERE user_id = ?');
        $stmt->execute([$userId]);
        echo json_encode([
            'success' => true,
            'posters' => $stmt->fetchAll(PDO::FETCH_ASSOC)
        ]);
        exit;
    }

    if ($method === 'POST') {
        $tmdbId    = filter_var($input['tmdb_id'] ?? $_POST['tmdb_id'] ?? null, FILTER_VALIDATE_INT);
        $mediaType = preg_replace('/[^a-z0-9_-]/i', '', $input['media_type'] ?? $_POST['media_type'] ?? 'movie');
        $posterPath = trim($input['poster_path'] ?? $_POST['poster_path'] ?? '');

        if (!$tmdbId || $tmdbId <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Identifiant tmdb_id invalide']);
            exit;
        }
        if (empty($posterPath)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'L\'URL de l\'affiche ne peut pas être vide']);
            exit;
        }

        $stmt = $db->prepare('INSERT INTO user_posters (user_id, tmdb_id, media_type, poster_path) VALUES (?, ?, ?, ?)
                             ON DUPLICATE KEY UPDATE poster_path = VALUES(poster_path)');
        $stmt->execute([$userId, $tmdbId, $mediaType, $posterPath]);

        echo json_encode([
            'success' => true,
            'message' => 'Affiche personnalisée sauvegardée avec succès',
            'tmdb_id' => $tmdbId,
            'media_type' => $mediaType,
            'poster_path' => $posterPath
        ]);
        exit;
    }

    if ($method === 'DELETE') {
        $tmdbId    = filter_var($input['tmdb_id'] ?? $_GET['tmdb_id'] ?? null, FILTER_VALIDATE_INT);
        $mediaType = preg_replace('/[^a-z0-9_-]/i', '', $input['media_type'] ?? $_GET['media_type'] ?? 'movie');

        if (!$tmdbId || $tmdbId <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Identifiant tmdb_id invalide']);
            exit;
        }

        $stmt = $db->prepare('DELETE FROM user_posters WHERE user_id = ? AND tmdb_id = ? AND media_type = ?');
        $stmt->execute([$userId, $tmdbId, $mediaType]);

        echo json_encode([
            'success' => true,
            'message' => 'Affiche réinitialisée avec succès',
            'tmdb_id' => $tmdbId,
            'media_type' => $mediaType
        ]);
        exit;
    }

    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);

} catch (Exception $e) {
    error_log('user_posters.php: Erreur serveur: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur serveur']);
}
