<?php
header('Content-Type: application/json; charset=utf-8');

// Désactiver l'affichage des erreurs
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/errors.log');

// Clé API TMDB
$TMDB_API_KEY = '04c35731a5ee918f014970082a0088b1';

// Configuration de la base de données
$DB_HOST = 'mycinen620.mysql.db';
$DB_NAME = 'mycinen620';
$DB_USER = 'mycinen620';
$DB_PASSWORD = 'j6phlphi1UdROheq';

if (!isset($_GET['tmdb_id']) || !filter_var($_GET['tmdb_id'], FILTER_VALIDATE_INT)) {
    echo json_encode(['error' => 'ID TMDB invalide']);
    exit;
}

$tmdb_id = (int)$_GET['tmdb_id'];

try {
    // Connexion à la base de données
    $pdo = new PDO("mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4", $DB_USER, $DB_PASSWORD);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    // Requête TMDB
    $url = "https://api.themoviedb.org/3/movie/{$tmdb_id}?api_key={$TMDB_API_KEY}&language=fr-FR&append_to_response=credits,videos";
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Désactiver la vérification SSL (non sécurisé)
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);

    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);

    if (curl_errno($ch)) {
        throw new Exception('Erreur cURL: ' . curl_error($ch));
    }

    curl_close($ch);

    if ($http_code !== 200) {
        $error_data = json_decode($response, true);
        echo json_encode([
            'error' => $error_data['status_message'] ?? 'Erreur lors de la récupération des données TMDB',
            'status_code' => $error_data['status_code'] ?? $http_code
        ]);
        exit;
    }

    $data = json_decode($response, true);

    // Insérer les acteurs dans la table Acteurs s'ils n'existent pas
    if (!empty($data['credits']['cast'])) {
        $stmt = $pdo->prepare("INSERT IGNORE INTO Acteurs (tmdb_id, nom) VALUES (?, ?)");
        foreach ($data['credits']['cast'] as $acteur) {
            $stmt->execute([$acteur['id'], $acteur['name']]);
        }
    }

    echo json_encode($data);
} catch (Exception $e) {
    error_log("Erreur dans fetchTMDB.php: " . $e->getMessage());
    echo json_encode(['error' => 'Erreur serveur interne']);
}
?>