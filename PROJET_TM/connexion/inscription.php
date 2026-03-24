<?php
header('Content-Type: application/json');

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

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        exit(json_encode(['success' => false, 'message' => 'Méthode non autorisée']));
    }

    // Débogage des données reçues
    error_log('Données POST reçues: ' . print_r($_POST, true));

    // Vérification des données envoyées
    $pseudo = trim($_POST['pseudo'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $mot_de_passe = trim($_POST['mot_de_passe'] ?? '');

    if (empty($pseudo) || empty($email) || empty($mot_de_passe)) {
        http_response_code(400);
        exit(json_encode(['success' => false, 'message' => 'Tous les champs sont obligatoires']));
    }

    // Vérification si l'utilisateur existe déjà
    $stmt = $pdo->prepare("SELECT id FROM Utilisateurs WHERE pseudo = :pseudo OR email = :email");
    $stmt->execute(['pseudo' => $pseudo, 'email' => $email]);
    if ($stmt->fetch()) {
        http_response_code(409);
        exit(json_encode(['success' => false, 'message' => 'Pseudo ou email déjà utilisé']));
    }

    // Hachage du mot de passe
    $hashed_password = password_hash($mot_de_passe, PASSWORD_BCRYPT);

    // Insertion dans la base de données
    $stmt = $pdo->prepare("INSERT INTO Utilisateurs (pseudo, email, mot_de_passe, role) VALUES (:pseudo, :email, :mot_de_passe, 'user')");
    if ($stmt->execute(['pseudo' => $pseudo, 'email' => $email, 'mot_de_passe' => $hashed_password])) {
        echo json_encode(['success' => true, 'message' => 'Inscription réussie']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erreur lors de l\'inscription']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    exit(json_encode(['success' => false, 'message' => 'Erreur de connexion à la base de données']));
} catch (Exception $e) {
    http_response_code(500);
    exit(json_encode(['success' => false, 'message' => 'Erreur inattendue']));
}
?>