<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

// Connexion à la base de données
$host = 'localhost';
$dbname = 'mycinen620';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur de connexion à la base de données: ' . $e->getMessage()]);
    exit;
}

// Validation des entrées
function validerEntrees($data, $clesRequises) {
    foreach ($clesRequises as $cle) {
        if (!isset($data[$cle]) || empty($data[$cle])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => "Champ '$cle' requis"]);
            exit;
        }
    }
}

// Gestion des requêtes
$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true) ?: [];

switch ($method) {
    case 'GET':
        if (!isset($_GET['user_id'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'user_id requis']);
            exit;
        }
        $userId = filter_var($_GET['user_id'], FILTER_VALIDATE_INT);
        if ($userId === false || $userId <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'user_id invalide']);
            exit;
        }

        if (isset($_GET['film_id'])) {
            // Vérifier si un film spécifique est dans les vus
            $filmId = filter_var($_GET['film_id'], FILTER_VALIDATE_INT);
            if ($filmId === false || $filmId <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'film_id invalide']);
                exit;
            }
            $stmt = $pdo->prepare('SELECT COUNT(*) FROM watched WHERE user_id = ? AND tmdb_id = ?');
            $stmt->execute([$userId, $filmId]);
            $count = $stmt->fetchColumn();
            echo json_encode(['success' => true, 'is_watched' => $count > 0]);
        } else {
            // Récupérer tous les films vus de l'utilisateur
            $stmt = $pdo->prepare('SELECT tmdb_id FROM watched WHERE user_id = ? ORDER BY id DESC');
            $stmt->execute([$userId]);
            $watched = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['success' => true, 'watched' => $watched]);
        }
        break;

    case 'POST':
        validerEntrees($input, ['user_id', 'film_id']);
        $userId = filter_var($input['user_id'], FILTER_VALIDATE_INT);
        $filmId = filter_var($input['film_id'], FILTER_VALIDATE_INT);
        if ($userId === false || $userId <= 0 || $filmId === false || $filmId <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'user_id ou film_id invalide']);
            exit;
        }

        // Vérifier si le film est déjà dans les vus
        $stmt = $pdo->prepare('SELECT COUNT(*) FROM watched WHERE user_id = ? AND tmdb_id = ?');
        $stmt->execute([$userId, $filmId]);
        if ($stmt->fetchColumn() > 0) {
            http_response_code(409);
            echo json_encode(['success' => false, 'message' => 'Ce film est déjà marqué comme vu']);
            exit;
        }

        // Ajouter le film aux vus
        $stmt = $pdo->prepare('INSERT INTO watched (user_id, tmdb_id) VALUES (?, ?)');
        $stmt->execute([$userId, $filmId]);
        echo json_encode(['success' => true, 'message' => 'Film marqué comme vu']);
        break;

    case 'DELETE':
        validerEntrees($input, ['user_id', 'film_id']);
        $userId = filter_var($input['user_id'], FILTER_VALIDATE_INT);
        $filmId = filter_var($input['film_id'], FILTER_VALIDATE_INT);
        if ($userId === false || $userId <= 0 || $filmId === false || $filmId <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'user_id ou film_id invalide']);
            exit;
        }

        // Supprimer le film des vus
        $stmt = $pdo->prepare('DELETE FROM watched WHERE user_id = ? AND tmdb_id = ?');
        $stmt->execute([$userId, $filmId]);
        if ($stmt->rowCount() > 0) {
            echo json_encode(['success' => true, 'message' => 'Film retiré des vus']);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Film non trouvé dans les vus']);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Méthode HTTP non autorisée']);
        break;
}
?>