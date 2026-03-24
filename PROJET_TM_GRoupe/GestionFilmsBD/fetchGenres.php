<?php
header('Content-Type: application/json; charset=utf-8');

// Désactiver l'affichage des erreurs
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/errors.log');

// Configuration de la base de données
$DB_HOST = 'mycinen620.mysql.db';
$DB_NAME = 'mycinen620';
$DB_USER = 'mycinen620';
$DB_PASSWORD = 'j6phlphi1UdROheq';

try {
    $pdo = new PDO("mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4", $DB_USER, $DB_PASSWORD);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    $stmt = $pdo->query("SELECT tmdb_id, nom FROM Genres ORDER BY nom");
    $genres = $stmt->fetchAll();

    echo json_encode(['genres' => $genres]);
} catch (PDOException $e) {
    error_log("Erreur dans fetchGenres.php: " . $e->getMessage());
    echo json_encode(['error' => 'Erreur lors de la récupération des genres']);
}
?>