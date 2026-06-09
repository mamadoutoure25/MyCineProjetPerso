<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Configurer la durée de vie de la session
ini_set('session.gc_maxlifetime', 3600); // 1 heure
session_set_cookie_params(3600);
session_start();

// Journalisation pour débogage
error_log('connexion.php: Début du processus de connexion');

// Charger la configuration
$configFile = __DIR__ . '/config.php';
if (!file_exists($configFile)) {
    error_log('connexion.php: Fichier de configuration manquant: ' . $configFile);
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Fichier de configuration manquant']);
    exit;
}

try {
    $config = require $configFile;
} catch (Exception $e) {
    error_log('connexion.php: Erreur lors du chargement de config.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur dans le fichier de configuration']);
    exit;
}

// Vérifier que $config est un tableau et contient 'db'
if (!is_array($config) || !isset($config['db']) || !is_array($config['db'])) {
    error_log('connexion.php: Configuration de la base de données invalide');
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Configuration de la base de données invalide']);
    exit;
}

// Vérifier les clés nécessaires
$requiredKeys = ['host', 'dbname', 'username', 'password', 'charset', 'options'];
foreach ($requiredKeys as $key) {
    if (!isset($config['db'][$key])) {
        error_log('connexion.php: Clé de configuration manquante: db.' . $key);
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Clé de configuration manquante: ' . $key]);
        exit;
    }
}

try {
    $pdo = new PDO(
        "mysql:host={$config['db']['host']};dbname={$config['db']['dbname']};charset={$config['db']['charset']}",
        $config['db']['username'],
        $config['db']['password'],
        $config['db']['options']
    );
    error_log('connexion.php: Connexion à la base de données réussie');
} catch (PDOException $e) {
    error_log('connexion.php: Erreur de connexion à la base de données: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur de connexion à la base de données: ' . $e->getMessage()]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    error_log('connexion.php: Méthode non autorisée: ' . $_SERVER['REQUEST_METHOD']);
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$pseudo = trim($data['pseudo'] ?? '');
$mot_de_passe = $data['mot_de_passe'] ?? '';

error_log('connexion.php: Données reçues: pseudo=' . $pseudo);

if (empty($pseudo) || empty($mot_de_passe)) {
    error_log('connexion.php: Champs manquants');
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Tous les champs sont obligatoires']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT id, pseudo, mot_de_passe, role FROM Utilisateurs WHERE pseudo = ? LIMIT 1");
    $stmt->execute([$pseudo]);
    $user = $stmt->fetch();

    if ($user && password_verify($mot_de_passe, $user['mot_de_passe'])) {
        $token = bin2hex(random_bytes(16));
        error_log('connexion.php: Nouveau token généré: ' . $token);

        $stmt = $pdo->prepare("UPDATE Utilisateurs SET token = ? WHERE id = ?");
        $stmt->execute([$token, $user['id']]);

        session_destroy();
        session_start();
        session_regenerate_id(true);

        $_SESSION = [
            'user_id' => $user['id'],
            'user_pseudo' => $user['pseudo'],
            'user_role' => $user['role'],
            'ip' => $_SERVER['REMOTE_ADDR'],
            'user_agent' => $_SERVER['HTTP_USER_AGENT'],
            'last_activity' => time()
        ];
        error_log('connexion.php: Session initialisée pour user_id: ' . $user['id']);

        $stmt = $pdo->prepare("INSERT INTO Historique_Activite (utilisateur_id, type_activite, details) VALUES (?, ?, ?)");
        $stmt->execute([$user['id'], 'login', 'Connexion réussie']);
        error_log('connexion.php: Activité de connexion enregistrée');

        echo json_encode([
            'success' => true,
            'user' => [
                'id' => $user['id'],
                'pseudo' => $user['pseudo'],
                'role' => $user['role']
            ],
            'token' => $token
        ]);
        error_log('connexion.php: Réponse envoyée avec succès');
    } else {
        error_log('connexion.php: Échec de l\'authentification pour pseudo: ' . $pseudo);
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Pseudo, mot de passe ou rôle incorrect']);
    }
} catch (PDOException $e) {
    error_log('connexion.php: Erreur de base de données: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur de base de données']);
}
?>