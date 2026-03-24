<?php
/**
 * Script de création d'utilisateurs de test
 * À exécuter une seule fois pour initialiser la base de données
 */

// Charger la configuration
$config = require __DIR__ . '/config.php';

try {
    // Connexion à la base de données
    $pdo = new PDO(
        "mysql:host={$config['db']['host']};dbname={$config['db']['dbname']};charset={$config['db']['charset']}",
        $config['db']['username'],
        $config['db']['password'],
        $config['db']['options']
    );

    // Données des utilisateurs de test
    $users = [
        [
            'pseudo' => 'admin',
            'email' => 'admin@mycine.com',
            'password' => 'admin123',
            'role' => 'admin'
        ],
        [
            'pseudo' => 'user123',
            'email' => 'user@mycine.com',
            'password' => 'user123',
            'role' => 'user'
        ],
        [
            'pseudo' => 'test',
            'email' => 'test@mycine.com',
            'password' => 'test123',
            'role' => 'user'
        ]
    ];

    // Insérer les utilisateurs
    foreach ($users as $user) {
        try {
            // Vérifier si l'utilisateur existe déjà
            $checkStmt = $pdo->prepare("SELECT id FROM Utilisateurs WHERE pseudo = ? OR email = ?");
            $checkStmt->execute([$user['pseudo'], $user['email']]);

            if ($checkStmt->rowCount() > 0) {
                echo "[SKIPPED] Utilisateur '{$user['pseudo']}' existe déjà<br>";
                continue;
            }

            // Hacher le mot de passe
            $hashedPassword = password_hash($user['password'], PASSWORD_BCRYPT, ['cost' => 10]);

            // Insérer l'utilisateur
            $stmt = $pdo->prepare("
                INSERT INTO Utilisateurs (pseudo, email, mot_de_passe, role)
                VALUES (?, ?, ?, ?)
            ");

            $stmt->execute([
                $user['pseudo'],
                $user['email'],
                $hashedPassword,
                $user['role']
            ]);

            echo "✅ [CREATED] Utilisateur '{$user['pseudo']}' créé avec succès<br>";
            echo "   - Email: {$user['email']}<br>";
            echo "   - Password: {$user['password']}<br>";
            echo "   - Role: {$user['role']}<br>";
            echo "   - Hash: {$hashedPassword}<br><br>";

        } catch (Exception $e) {
            echo "❌ [ERROR] Erreur lors de la création de '{$user['pseudo']}': " . $e->getMessage() . "<br>";
        }
    }

    // Afficher les utilisateurs créés
    echo "---<br>";
    echo "<strong>Utilisateurs en base de données:</strong><br>";
    $stmt = $pdo->query("SELECT id, pseudo, email, role FROM Utilisateurs");
    while ($row = $stmt->fetch()) {
        echo "- {$row['pseudo']} ({$row['role']}) - {$row['email']}<br>";
    }

} catch (PDOException $e) {
    echo "❌ Erreur de connexion: " . $e->getMessage();
}
?>

