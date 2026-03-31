<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

$host = 'localhost';
$dbname = 'mycinen620';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur de connexion: ' . $e->getMessage()]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true) ?: [];

switch ($method) {
    case 'GET':
        $userId = filter_var($_GET['user_id'] ?? 0, FILTER_VALIDATE_INT);
        $mediaType = $_GET['media_type'] ?? 'movie';
        
        if (!$userId) {
            echo json_encode(['success' => false, 'message' => 'user_id requis']);
            exit;
        }

        if (isset($_GET['film_id'])) {
            $filmId = filter_var($_GET['film_id'], FILTER_VALIDATE_INT);
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
        $userId = filter_var($input['user_id'] ?? 0, FILTER_VALIDATE_INT);
        $filmId = filter_var($input['film_id'] ?? 0, FILTER_VALIDATE_INT);
        $mediaType = $input['media_type'] ?? 'movie';

        if (!$userId || !$filmId) {
            echo json_encode(['success' => false, 'message' => 'user_id et film_id requis']);
            exit;
        }

        $stmt = $pdo->prepare('INSERT IGNORE INTO favorites (user_id, tmdb_id, media_type) VALUES (?, ?, ?)');
        $stmt->execute([$userId, $filmId, $mediaType]);
        echo json_encode(['success' => true, 'message' => 'Ajouté aux favoris']);
        break;

    case 'DELETE':
        $userId = filter_var($input['user_id'] ?? $_GET['user_id'] ?? 0, FILTER_VALIDATE_INT);
        $filmId = filter_var($input['film_id'] ?? $_GET['film_id'] ?? 0, FILTER_VALIDATE_INT);
        $mediaType = $input['media_type'] ?? $_GET['media_type'] ?? 'movie';
        $action = $_GET['action'] ?? '';

        if ($action === 'clear') {
            $stmt = $pdo->prepare('DELETE FROM favorites WHERE user_id = ?');
            $stmt->execute([$userId]);
            echo json_encode(['success' => true, 'message' => 'Liste vidée']);
            exit;
        }

        if (!$userId || !$filmId) {
            echo json_encode(['success' => false, 'message' => 'user_id et film_id requis']);
            exit;
        }

        $stmt = $pdo->prepare('DELETE FROM favorites WHERE user_id = ? AND tmdb_id = ? AND media_type = ?');
        $stmt->execute([$userId, $filmId, $mediaType]);
        echo json_encode(['success' => true, 'message' => 'Retiré des favoris']);
        break;
}
?>