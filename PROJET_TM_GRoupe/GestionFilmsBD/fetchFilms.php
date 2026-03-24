<?php
header('Content-Type: application/json; charset=utf-8');
session_start();

// Vérifier si l'utilisateur est admin
if (!isset($_SESSION['user_id']) || $_SESSION['user_role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Accès non autorisé']);
    exit;
}

// Configuration de la base de données
$DB_HOST = 'mycinen620.mysql.db';
$DB_NAME = 'mycinen620';
$DB_USER = 'mycinen620';
$DB_PASSWORD = 'j6phlphi1UdROheq';

try {
    $pdo = new PDO("mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4", $DB_USER, $DB_PASSWORD);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Récupérer tous les films avec leur année
    $stmt = $pdo->query("SELECT id, tmdb_id, titre, annee FROM Films ORDER BY titre");
    $films = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['films' => $films]);
} catch (PDOException $e) {
    error_log("Erreur dans fetchFilms.php: " . $e->getMessage());
    echo json_encode(['error' => 'Erreur de base de données']);
}
?>