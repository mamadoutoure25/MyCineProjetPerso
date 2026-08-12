<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: ' . (in_array($_SERVER['HTTP_ORIGIN'] ?? '', ['http://localhost', 'http://127.0.0.1']) ? ($_SERVER['HTTP_ORIGIN'] ?? 'http://localhost') : 'http://localhost'));
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    exit(json_encode(['success' => false, 'message' => 'Méthode non autorisée']));
}

// Chargement de la configuration
$config = require __DIR__ . '/config.php';

try {
    $pdo = new PDO(
        "mysql:host={$config['db']['host']};dbname={$config['db']['dbname']};charset={$config['db']['charset']}",
        $config['db']['username'],
        $config['db']['password'],
        $config['db']['options']
    );
} catch (PDOException $e) {
    error_log('inscription.php: Erreur BDD: ' . $e->getMessage());
    http_response_code(500);
    exit(json_encode(['success' => false, 'message' => 'Erreur de connexion à la base de données']));
}

// Lecture depuis JSON (cohérent avec connexion.php)
$data        = json_decode(file_get_contents('php://input'), true) ?: [];
$pseudo      = trim($data['pseudo'] ?? '');
$email       = trim($data['email'] ?? '');
$mot_de_passe = $data['mot_de_passe'] ?? '';

// Validation des champs obligatoires
if (empty($pseudo) || empty($email) || empty($mot_de_passe)) {
    http_response_code(400);
    exit(json_encode(['success' => false, 'message' => 'Tous les champs sont obligatoires']));
}

// Validation du format email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    exit(json_encode(['success' => false, 'message' => 'Adresse email invalide']));
}

// Validation de la longueur du pseudo (3-30 caractères, alphanumériques + _)
if (!preg_match('/^[a-zA-Z0-9_À-ÿ]{3,30}$/', $pseudo)) {
    http_response_code(400);
    exit(json_encode(['success' => false, 'message' => 'Pseudo invalide (3-30 caractères, lettres, chiffres et _ autorisés)']));
}

// Validation de la complexité du mot de passe
if (strlen($mot_de_passe) < 8) {
    http_response_code(400);
    exit(json_encode(['success' => false, 'message' => 'Le mot de passe doit contenir au moins 8 caractères']));
}
if (!preg_match('/[A-Z]/', $mot_de_passe)) {
    http_response_code(400);
    exit(json_encode(['success' => false, 'message' => 'Le mot de passe doit contenir au moins une lettre majuscule']));
}
if (!preg_match('/[0-9]/', $mot_de_passe)) {
    http_response_code(400);
    exit(json_encode(['success' => false, 'message' => 'Le mot de passe doit contenir au moins un chiffre']));
}

try {
    // Vérification si l'utilisateur existe déjà
    $stmt = $pdo->prepare("SELECT id FROM Utilisateurs WHERE pseudo = :pseudo OR email = :email");
    $stmt->execute(['pseudo' => $pseudo, 'email' => $email]);
    if ($stmt->fetch()) {
        http_response_code(409);
        exit(json_encode(['success' => false, 'message' => 'Pseudo ou email déjà utilisé']));
    }

    // Hachage sécurisé du mot de passe
    $hashed_password = password_hash($mot_de_passe, PASSWORD_BCRYPT, ['cost' => 12]);

    // Insertion dans la base de données
    $stmt = $pdo->prepare("INSERT INTO Utilisateurs (pseudo, email, mot_de_passe, role) VALUES (:pseudo, :email, :mot_de_passe, 'user')");
    if ($stmt->execute(['pseudo' => $pseudo, 'email' => $email, 'mot_de_passe' => $hashed_password])) {
        echo json_encode(['success' => true, 'message' => 'Inscription réussie']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erreur lors de l\'inscription']);
    }
} catch (PDOException $e) {
    error_log('inscription.php: Erreur BDD: ' . $e->getMessage());
    http_response_code(500);
    exit(json_encode(['success' => false, 'message' => 'Erreur de connexion à la base de données']));
} catch (Exception $e) {
    error_log('inscription.php: Erreur inattendue: ' . $e->getMessage());
    http_response_code(500);
    exit(json_encode(['success' => false, 'message' => 'Erreur inattendue']));
}