<?php
header('Content-Type: application/json; charset=utf-8');
session_start();

// Vérifier si l'utilisateur est admin
if (!isset($_SESSION['user_id']) || $_SESSION['user_role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Accès non autorisé']);
    exit;
}

$config = require __DIR__ . '/../connexion/config.php';

try {
    $pdo = new PDO(
        "mysql:host={$config['db']['host']};dbname={$config['db']['dbname']};charset={$config['db']['charset']}",
        $config['db']['username'],
        $config['db']['password'],
        $config['db']['options']
    );

    // Récupérer tous les films avec leur année
    $stmt = $pdo->query("SELECT id, tmdb_id, titre, annee FROM Films ORDER BY titre");
    $films = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['films' => $films]);
} catch (PDOException $e) {
    error_log("Erreur dans fetchFilms.php: " . $e->getMessage());
    echo json_encode(['error' => 'Erreur de base de données']);
}
?>