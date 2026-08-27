<?php
header('Content-Type: application/json; charset=utf-8');

// Désactiver l'affichage des erreurs
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

    $stmt = $pdo->query("SELECT tmdb_id, nom FROM Genres ORDER BY nom");
    $genres = $stmt->fetchAll();

    echo json_encode(['genres' => $genres]);
} catch (PDOException $e) {
    error_log("Erreur dans fetchGenres.php: " . $e->getMessage());
    echo json_encode(['error' => 'Erreur lors de la récupération des genres']);
}
?>