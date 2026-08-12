<?php
/**
 * Favoris utilisateur — API sécurisée
 * Fix: IDOR supprimé (user_id extrait du JWT), CORS restreint, getMessage() supprimé
 */
require_once __DIR__ . '/../connexion/auth_guard.php';

// CORS restreint à localhost
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: ' . cors_allowed_origin());
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Authentification JWT — user_id extrait du token (protection anti-IDOR)
$authUser = require_auth();
$userId   = (int) ($authUser['id'] ?? 0);

if (!$userId) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Utilisateur non identifié']);
    exit;
}

// Connexion BDD via config centralisée
$config = require __DIR__ . '/../connexion/config.php';
try {
    $pdo = new PDO(
        "mysql:host={$config['db']['host']};dbname={$config['db']['dbname']};charset={$config['db']['charset']}",
        $config['db']['username'],
        $config['db']['password'],
        $config['db']['options']
    );
} catch (PDOException $e) {
    error_log('favorites.php: Erreur BDD: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur serveur']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$input  = json_decode(file_get_contents('php://input'), true) ?: [];

try {
    switch ($method) {
        case 'GET':
            $mediaType = preg_replace('/[^a-z]/', '', $_GET['media_type'] ?? 'movie');

            if (isset($_GET['film_id'])) {
                $filmId = filter_var($_GET['film_id'], FILTER_VALIDATE_INT);
                if (!$filmId) {
                    echo json_encode(['success' => false, 'message' => 'film_id invalide']);
                    exit;
                }
                $stmt = $pdo->prepare('SELECT COUNT(*) FROM favorites WHERE user_id = ? AND tmdb_id = ? AND media_type = ?');
                $stmt->execute([$userId, $filmId, $mediaType]);
                echo json_encode(['success' => true, 'is_favorite' => $stmt->fetchColumn() > 0]);
            } else {
                $stmt = $pdo->prepare('SELECT tmdb_id, media_type FROM favorites WHERE user_id = ? ORDER BY id DESC');
                $stmt->execute([$userId]);
                echo json_encode(['success' => true, 'favorites' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            }
            break;

        case 'POST':
            $filmId    = filter_var($input['film_id'] ?? 0, FILTER_VALIDATE_INT);
            $mediaType = preg_replace('/[^a-z]/', '', $input['media_type'] ?? 'movie');

            if (!$filmId) {
                echo json_encode(['success' => false, 'message' => 'film_id requis']);
                exit;
            }
            $stmt = $pdo->prepare('INSERT IGNORE INTO favorites (user_id, tmdb_id, media_type) VALUES (?, ?, ?)');
            $stmt->execute([$userId, $filmId, $mediaType]);
            echo json_encode(['success' => true, 'message' => 'Ajouté aux favoris']);
            break;

        case 'DELETE':
            $filmId    = filter_var($input['film_id'] ?? $_GET['film_id'] ?? 0, FILTER_VALIDATE_INT);
            $mediaType = preg_replace('/[^a-z]/', '', $input['media_type'] ?? $_GET['media_type'] ?? 'movie');
            $action    = preg_replace('/[^a-z]/', '', $_GET['action'] ?? '');

            if ($action === 'clear') {
                $stmt = $pdo->prepare('DELETE FROM favorites WHERE user_id = ?');
                $stmt->execute([$userId]);
                echo json_encode(['success' => true, 'message' => 'Liste vidée']);
                exit;
            }
            if (!$filmId) {
                echo json_encode(['success' => false, 'message' => 'film_id requis']);
                exit;
            }
            $stmt = $pdo->prepare('DELETE FROM favorites WHERE user_id = ? AND tmdb_id = ? AND media_type = ?');
            $stmt->execute([$userId, $filmId, $mediaType]);
            echo json_encode(['success' => true, 'message' => 'Retiré des favoris']);
            break;

        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    }
} catch (PDOException $e) {
    error_log('favorites.php: Erreur BDD: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur serveur']);
}