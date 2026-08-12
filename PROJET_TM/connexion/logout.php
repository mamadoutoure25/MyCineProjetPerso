<?php
header('Content-Type: application/json');
session_start();

// Chargement de la configuration
$config = require __DIR__.'/config.php';

try {
    // Connexion à la base de données
    $pdo = new PDO(
        "mysql:host={$config['db']['host']};dbname={$config['db']['dbname']};charset={$config['db']['charset']}",
        $config['db']['username'],
        $config['db']['password'],
        $config['db']['options']
    );

    if (isset($_SESSION['user_id'])) {
        // Réinitialiser le token dans la base de données
        $stmt = $pdo->prepare('UPDATE Utilisateurs SET token = NULL WHERE id = ?');
        $stmt->execute([$_SESSION['user_id']]);

        // Enregistrer l'activité de déconnexion
        $stmt = $pdo->prepare('INSERT INTO Historique_Activite (utilisateur_id, type_activite, details) VALUES (?, ?, ?)');
        $stmt->execute([$_SESSION['user_id'], 'logout', 'Déconnexion réussie']);
    }

    // Suppression des cookies JWT et CSRF
    setcookie('jwt_token', '', ['expires' => time() - 3600, 'path' => '/']);
    setcookie('csrf_token', '', ['expires' => time() - 3600, 'path' => '/']);

    // Détruire la session
    session_destroy();

    echo json_encode(['success' => true, 'message' => 'Déconnexion réussie']);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la déconnexion']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur inattendue']);
}
?>