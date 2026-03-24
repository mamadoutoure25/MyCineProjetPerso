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
    echo json_encode([
        'success' => false,
        'message' => 'Erreur de connexion à la base de données: ' . $e->getMessage()
    ]);
    exit;
}

// Validation des entrées
function validerEntrees($data, $clesRequises) {
    foreach ($clesRequises as $cle) {
        if (!isset($data[$cle]) || (is_string($data[$cle]) && empty($data[$cle]))) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => "Champ '$cle' requis"
            ]);
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
            echo json_encode([
                'success' => false,
                'message' => 'user_id requis'
            ]);
            exit;
        }
        $userId = filter_var($_GET['user_id'], FILTER_VALIDATE_INT);
        if ($userId === false || $userId <= 0) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'user_id invalide'
            ]);
            exit;
        }

        if (isset($_GET['actor_id'])) {
            // Vérifier si un acteur spécifique est dans les favoris
            $actorTmdbId = filter_var($_GET['actor_id'], FILTER_VALIDATE_INT);
            if ($actorTmdbId === false || $actorTmdbId <= 0) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'actor_id invalide'
                ]);
                exit;
            }
            $stmt = $pdo->prepare('
                SELECT COUNT(*) FROM favorite_actors fa
                JOIN Acteurs a ON fa.acteur_id = a.id
                WHERE fa.user_id = ? AND a.tmdb_id = ?
            ');
            $stmt->execute([$userId, $actorTmdbId]);
            $count = $stmt->fetchColumn();
            echo json_encode([
                'success' => true,
                'is_favorite' => $count > 0
            ]);
        } else {
            // Récupérer tous les acteurs favoris de l'utilisateur avec leurs détails
            $stmt = $pdo->prepare('
                SELECT a.id, a.tmdb_id, a.nom FROM favorite_actors fa
                JOIN Acteurs a ON fa.acteur_id = a.id
                WHERE fa.user_id = ? 
                ORDER BY a.nom ASC
            ');
            $stmt->execute([$userId]);
            $favoris = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode([
                'success' => true,
                'favorite_actors' => $favoris
            ]);
        }
        break;

    case 'POST':
        validerEntrees($input, ['user_id', 'actor_id']);
        $userId = filter_var($input['user_id'], FILTER_VALIDATE_INT);
        $actorTmdbId = filter_var($input['actor_id'], FILTER_VALIDATE_INT);
        $actorName = isset($input['actor_name']) ? trim($input['actor_name']) : 'Acteur Inconnu';
        
        if ($userId === false || $userId <= 0 || $actorTmdbId === false || $actorTmdbId <= 0) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'user_id ou actor_id invalide'
            ]);
            exit;
        }

        // Vérifier si l'utilisateur existe
        $stmt = $pdo->prepare('SELECT COUNT(*) FROM Utilisateurs WHERE id = ?');
        $stmt->execute([$userId]);
        if ($stmt->fetchColumn() == 0) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Utilisateur non trouvé'
            ]);
            exit;
        }

        // Vérifier si l'acteur existe, sinon le créer
        $stmt = $pdo->prepare('SELECT id FROM Acteurs WHERE tmdb_id = ?');
        $stmt->execute([$actorTmdbId]);
        $actorResult = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$actorResult) {
            // Créer l'acteur s'il n'existe pas
            $stmt = $pdo->prepare('INSERT INTO Acteurs (tmdb_id, nom) VALUES (?, ?)');
            $stmt->execute([$actorTmdbId, $actorName]);
            $actorId = $pdo->lastInsertId();
        } else {
            $actorId = $actorResult['id'];
        }

        // Vérifier si l'acteur est déjà dans les favoris
        $stmt = $pdo->prepare('SELECT COUNT(*) FROM favorite_actors WHERE user_id = ? AND acteur_id = ?');
        $stmt->execute([$userId, $actorId]);
        if ($stmt->fetchColumn() > 0) {
            http_response_code(409);
            echo json_encode([
                'success' => false,
                'message' => 'Cet acteur est déjà dans les favoris'
            ]);
            exit;
        }

        // Ajouter l'acteur aux favoris
        $stmt = $pdo->prepare('INSERT INTO favorite_actors (user_id, acteur_id) VALUES (?, ?)');
        $stmt->execute([$userId, $actorId]);
        echo json_encode([
            'success' => true,
            'message' => 'Acteur ajouté aux favoris'
        ]);
        break;

    case 'DELETE':
        validerEntrees($input, ['user_id', 'actor_id']);
        $userId = filter_var($input['user_id'], FILTER_VALIDATE_INT);
        $actorTmdbId = filter_var($input['actor_id'], FILTER_VALIDATE_INT);
        if ($userId === false || $userId <= 0 || $actorTmdbId === false || $actorTmdbId <= 0) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'user_id ou actor_id invalide'
            ]);
            exit;
        }

        // Trouver l'ID interne de l'acteur via son tmdb_id
        $stmt = $pdo->prepare('SELECT id FROM Acteurs WHERE tmdb_id = ?');
        $stmt->execute([$actorTmdbId]);
        $actorResult = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$actorResult) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Acteur non trouvé'
            ]);
            exit;
        }

        $actorId = $actorResult['id'];

        // Supprimer l'acteur des favoris
        $stmt = $pdo->prepare('DELETE FROM favorite_actors WHERE user_id = ? AND acteur_id = ?');
        $stmt->execute([$userId, $actorId]);
        if ($stmt->rowCount() > 0) {
            echo json_encode([
                'success' => true,
                'message' => 'Acteur retiré des favoris'
            ]);
        } else {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Acteur non trouvé dans les favoris'
            ]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode([
            'success' => false,
            'message' => 'Méthode HTTP non autorisée'
        ]);
        break;
}
?>

