<?php
ob_start();
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../connexion/auth_guard.php';
$user = require_auth('admin');

ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/errors.log');

$config = require __DIR__ . '/../connexion/config.php';

try {
    $pdo = new PDO(
        "mysql:host={$config['db']['host']};dbname={$config['db']['dbname']};charset={$config['db']['charset']}",
        $config['db']['username'],
        $config['db']['password'],
        $config['db']['options']
    );
} catch (PDOException $e) {
    error_log("Erreur de connexion à la base de données: " . $e->getMessage());
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'Erreur de connexion à la base de données']);
    exit;
}

// Vérifier l'autorisation
if (!isset($_SESSION['user_id']) || $_SESSION['user_role'] !== 'admin') {
    ob_end_clean();
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Accès non autorisé. Réservé aux administrateurs.']);
    exit;
}

// Lire les données JSON envoyées
$input = json_decode(file_get_contents('php://input'), true);
$film_id = isset($input['film_id']) ? (int)$input['film_id'] : null;

if (!$film_id) {
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'ID du film manquant']);
    exit;
}

try {
    // Vérifier si le film existe
    $stmt = $pdo->prepare("SELECT id FROM Films WHERE id = ?");
    $stmt->execute([$film_id]);
    if (!$stmt->fetch()) {
        ob_end_clean();
        echo json_encode(['success' => false, 'message' => 'Film introuvable']);
        exit;
    }

    // Supprimer le film (les tables liées comme Films_Genres, Films_Acteurs, etc., sont gérées par ON DELETE CASCADE)
    $stmt = $pdo->prepare("DELETE FROM Films WHERE id = ?");
    $stmt->execute([$film_id]);

    ob_end_clean();
    echo json_encode(['success' => true, 'message' => 'Film supprimé avec succès']);
} catch (PDOException $e) {
    error_log("Erreur lors de la suppression du film: " . $e->getMessage());
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la suppression du film']);
}
?>