<?php
/**
 * Acteurs favoris utilisateur — API sécurisée
 * Fix: IDOR supprimé (user_id extrait du JWT), CORS restreint, getMessage() supprimé
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
    error_log('favorite-actors.php: Erreur BDD: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur serveur']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true) ?: [];

try {
    switch ($method) {
        case 'GET':
            if (isset($_GET['actor_id'])) {
                $actorTmdbId = filter_var($_GET['actor_id'], FILTER_VALIDATE_INT);
                if (!$actorTmdbId) {
                    echo json_encode(['success' => false, 'message' => 'actor_id invalide']);
                    exit;
                }
                $stmt = $pdo->prepare('
                    SELECT COUNT(*) FROM favorite_actors fa
                    JOIN Acteurs a ON fa.acteur_id = a.id
                    WHERE fa.user_id = ? AND a.tmdb_id = ?
                ');
                $stmt->execute([$userId, $actorTmdbId]);
                echo json_encode(['success' => true, 'is_favorite' => $stmt->fetchColumn() > 0]);
            } else {
                $stmt = $pdo->prepare('
                    SELECT a.id, a.tmdb_id, a.nom FROM favorite_actors fa
                    JOIN Acteurs a ON fa.acteur_id = a.id
                    WHERE fa.user_id = ? 
                    ORDER BY a.nom ASC
                ');
                $stmt->execute([$userId]);
                echo json_encode(['success' => true, 'favorite_actors' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            }
            break;

        case 'POST':
            $actorTmdbId = filter_var($input['actor_id'] ?? 0, FILTER_VALIDATE_INT);
            $actorName = isset($input['actor_name']) ? trim($input['actor_name']) : 'Acteur Inconnu';

            if (!$actorTmdbId) {
                echo json_encode(['success' => false, 'message' => 'actor_id requis']);
                exit;
            }

            // Vérifier si l'acteur existe, sinon le créer
            $stmt = $pdo->prepare('SELECT id FROM Acteurs WHERE tmdb_id = ?');
            $stmt->execute([$actorTmdbId]);
            $actorResult = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$actorResult) {
                $stmt = $pdo->prepare('INSERT INTO Acteurs (tmdb_id, nom) VALUES (?, ?)');
                $stmt->execute([$actorTmdbId, $actorName]);
                $actorId = $pdo->lastInsertId();
            } else {
                $actorId = $actorResult['id'];
            }

            $stmt = $pdo->prepare('INSERT IGNORE INTO favorite_actors (user_id, acteur_id) VALUES (?, ?)');
            $stmt->execute([$userId, $actorId]);
            echo json_encode(['success' => true, 'message' => 'Acteur ajouté aux favoris']);
            break;

        case 'DELETE':
            $actorTmdbId = filter_var($input['actor_id'] ?? $_GET['actor_id'] ?? 0, FILTER_VALIDATE_INT);
            if (!$actorTmdbId) {
                echo json_encode(['success' => false, 'message' => 'actor_id requis']);
                exit;
            }

            $stmt = $pdo->prepare('SELECT id FROM Acteurs WHERE tmdb_id = ?');
            $stmt->execute([$actorTmdbId]);
            $actorResult = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($actorResult) {
                $stmt = $pdo->prepare('DELETE FROM favorite_actors WHERE user_id = ? AND acteur_id = ?');
                $stmt->execute([$userId, $actorResult['id']]);
            }
            
            echo json_encode(['success' => true, 'message' => 'Acteur retiré des favoris']);
            break;

        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    }
} catch (PDOException $e) {
    error_log('favorite-actors.php: Erreur BDD: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur serveur']);
}
