<?php
ob_start();
header('Content-Type: application/json; charset=utf-8');

ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/errors.log');

$DB_HOST = 'localhost';
$DB_NAME = 'mycinen620';
$DB_USER = 'root';
$DB_PASSWORD = '';




try {
    $pdo = new PDO("mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4", $DB_USER, $DB_PASSWORD);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    error_log("Erreur de connexion à la base de données: " . $e->getMessage());
    ob_end_clean();
    echo json_encode(['errors' => ['Erreur de connexion à la base de données']]);
    exit;
}

try {
    $stmt = $pdo->query("SELECT * FROM Films ORDER BY titre ASC");
    $films = $stmt->fetchAll();

    foreach ($films as &$film) {
        $stmt = $pdo->prepare("
            SELECT g.tmdb_id
            FROM Genres g
            JOIN Films_Genres fg ON g.id = fg.genre_id
            WHERE fg.film_id = ?
        ");
        $stmt->execute([$film['id']]);
        $film['genres'] = json_encode($stmt->fetchAll(PDO::FETCH_COLUMN));

        $stmt = $pdo->prepare("
            SELECT a.nom
            FROM Acteurs a
            JOIN Films_Acteurs fa ON a.id = fa.acteur_id
            WHERE fa.film_id = ?
        ");
        $stmt->execute([$film['id']]);
        $film['acteurs'] = json_encode($stmt->fetchAll(PDO::FETCH_COLUMN));

        // Conversion explicite de note_moyenne en float
        $film['note_moyenne'] = $film['note_moyenne'] !== null ? (float)$film['note_moyenne'] : null;
    }

    if (empty($films)) {
        ob_end_clean();
        echo json_encode(['films' => [], 'message' => 'Aucun film trouvé dans la base de données']);
    } else {
        ob_end_clean();
        echo json_encode(['films' => $films]);
    }
} catch (Exception $e) {
    error_log("Erreur dans projetBD.php: " . $e->getMessage());
    ob_end_clean();
    echo json_encode(['errors' => ['Erreur serveur interne']]);
}
?>